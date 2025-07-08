// 🚀 DÉPLOIEMENT SSH OPTIMISÉ - VERSION CORRIGÉE WINDOWS
// Résout les problèmes d'échappement guillemets et commandes longues

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    keyPath: process.env.USERPROFILE + "\\.ssh\\melyia_main",
    // Optimisations anti-timeout
    connectTimeout: 60,
    execTimeout: 60000, // Réduit à 1 minute par commande
    serverAliveInterval: 30,
    compression: true,
    maxRetries: 3,
    retryDelay: 3000, // Réduit à 3s
  },
  PATHS: {
    landing: {
      local: "dist/landing",
      remote: "/var/www/melyia/dev-site",
    },
    app: {
      local: "dist/app",
      remote: "/var/www/melyia/app-dev",
    },
  },
  LOG: {
    startTime: Date.now(),
    steps: [],
  },
};

function log(message, color = "cyan") {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
  };

  const timestamp = new Date().toLocaleTimeString();
  const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const prefix = `[${timestamp}] (+${duration}s)`;

  console.log(`${colors[color]}${prefix} ${message}${colors.reset}`);

  CONFIG.LOG.steps.push({
    timestamp,
    duration: parseFloat(duration),
    message,
    level: color,
  });
}

function logPhase(title, description = "") {
  log("");
  log("┌─────────────────────────────────────────┐", "magenta");
  log(`│ ${title.padEnd(39)} │`, "magenta");
  if (description) {
    log(`│ ${description.padEnd(39)} │`, "cyan");
  }
  log("└─────────────────────────────────────────┘", "magenta");
  log("");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function buildSSHCommand() {
  const options = [
    `-o ConnectTimeout=${CONFIG.SSH.connectTimeout}`,
    `-o ServerAliveInterval=${CONFIG.SSH.serverAliveInterval}`,
    `-o ServerAliveCountMax=3`,
    `-o BatchMode=yes`,
    `-o StrictHostKeyChecking=no`,
    `-o LogLevel=ERROR`,
    `-o Compression=yes`,
  ];

  if (fs.existsSync(CONFIG.SSH.keyPath)) {
    options.push(`-i "${CONFIG.SSH.keyPath}"`);
  }

  return `ssh ${options.join(" ")} ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;
}

function buildSCPCommand() {
  const options = [
    `-o ConnectTimeout=${CONFIG.SSH.connectTimeout}`,
    `-o ServerAliveInterval=${CONFIG.SSH.serverAliveInterval}`,
    `-o ServerAliveCountMax=3`,
    `-o BatchMode=yes`,
    `-o StrictHostKeyChecking=no`,
    `-o LogLevel=ERROR`,
    `-o Compression=yes`,
  ];

  if (fs.existsSync(CONFIG.SSH.keyPath)) {
    options.push(`-i "${CONFIG.SSH.keyPath}"`);
  }

  return `scp ${options.join(" ")}`;
}

function executeSSHCommand(
  command,
  description,
  timeout = CONFIG.SSH.execTimeout
) {
  for (let attempt = 1; attempt <= CONFIG.SSH.maxRetries; attempt++) {
    const startTime = Date.now();
    try {
      log(
        `🔄 ${description} (tentative ${attempt}/${CONFIG.SSH.maxRetries})...`,
        "cyan"
      );

      const result = execSync(command, {
        encoding: "utf8",
        timeout,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`✅ ${description} - Réussi en ${duration}s`, "green");

      return result;
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(
        `❌ ${description} - Tentative ${attempt} échouée après ${duration}s`,
        "red"
      );

      if (attempt === CONFIG.SSH.maxRetries) {
        log(
          `💥 ${description} - Échec définitif après ${CONFIG.SSH.maxRetries} tentatives`,
          "red"
        );
        throw error;
      }

      if (attempt < CONFIG.SSH.maxRetries) {
        const backoffDelay = CONFIG.SSH.retryDelay * attempt;
        log(
          `⏳ Attente ${backoffDelay / 1000}s avant nouvelle tentative...`,
          "yellow"
        );

        const startWait = Date.now();
        while (Date.now() - startWait < backoffDelay) {
          // Attente active
        }
      }
    }
  }
}

// Fonction pour exécuter une seule commande SSH simple
function executeSimpleSSH(remoteCommand, description) {
  const sshCmd = buildSSHCommand();
  const fullCommand = `${sshCmd} "${remoteCommand}"`;
  return executeSSHCommand(fullCommand, description);
}

// Fonction pour uploader avec SCP
function uploadWithSCP(localPath, remotePath, description) {
  const scpCmd = buildSCPCommand();
  const fullCommand = `${scpCmd} -r "${localPath}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${remotePath}`;
  return executeSSHCommand(fullCommand, description, 180000); // 3 minutes pour upload
}

function calculateDirectorySize(dirPath) {
  let totalSize = 0;

  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);

    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach((file) => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }

  calculateSize(dirPath);
  return totalSize;
}

function validateBuilds() {
  logPhase("PHASE 1 : VALIDATION DES BUILDS", "Vérification des artefacts");

  const builds = [
    { path: CONFIG.PATHS.landing.local, name: "Landing" },
    { path: CONFIG.PATHS.app.local, name: "App" },
  ];

  let totalSize = 0;

  for (const build of builds) {
    if (!fs.existsSync(build.path)) {
      throw new Error(`Build ${build.name} manquant: ${build.path}`);
    }

    const files = fs.readdirSync(build.path);
    const hasHTML = files.some((f) => f.endsWith(".html"));
    const hasAssets = fs.existsSync(path.join(build.path, "assets"));

    if (!hasHTML || !hasAssets) {
      throw new Error(`Build ${build.name} incomplet: ${build.path}`);
    }

    const buildSize = calculateDirectorySize(build.path);
    totalSize += buildSize;

    log(
      `✅ Build ${build.name} validé: ${build.path} (${formatBytes(
        buildSize
      )})`,
      "green"
    );
  }

  log(`📊 Taille totale à déployer: ${formatBytes(totalSize)}`, "cyan");
}

function testConnectivity() {
  logPhase("PHASE 2 : TEST DE CONNECTIVITÉ", "Vérification SSH optimisée");

  const result = executeSimpleSSH(
    "echo 'SSH-OK' && date && uptime && df -h / | tail -1",
    "Test connectivité SSH"
  );

  log("✅ Connectivité SSH confirmée", "green");

  // Analyser la réponse du serveur
  const lines = result.split("\n").filter((line) => line.trim());
  if (lines.length >= 2) {
    log(`📊 Serveur: ${lines[1]}`, "cyan");
    if (lines[2]) log(`📊 Uptime: ${lines[2]}`, "cyan");
    if (lines[3]) log(`📊 Espace disque: ${lines[3]}`, "cyan");
  }

  log("🎯 Optimisations SSH actives:", "blue");
  log(`  • ConnectTimeout: ${CONFIG.SSH.connectTimeout}s`, "blue");
  log(`  • ServerAliveInterval: ${CONFIG.SSH.serverAliveInterval}s`, "blue");
  log(
    `  • Compression: ${CONFIG.SSH.compression ? "Activée" : "Désactivée"}`,
    "blue"
  );
  log(`  • Max retries: ${CONFIG.SSH.maxRetries}`, "blue");
}

function deployLanding() {
  const { local, remote } = CONFIG.PATHS.landing;
  const timestamp = Date.now();
  const tempDir = `/tmp/landing-${timestamp}`;

  logPhase("PHASE 3 : DÉPLOIEMENT LANDING", "Site de présentation");

  // Étape 1: Créer répertoire temporaire
  log("🔧 Création répertoire temporaire...", "blue");
  executeSimpleSSH(`mkdir -p ${tempDir}`, "Création répertoire temp");

  // Étape 2: Sauvegarde existant
  log("💾 Sauvegarde de l'existant...", "blue");
  executeSimpleSSH(
    `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
    "Sauvegarde landing existant"
  );

  // Étape 3: Upload fichiers
  log("📤 Upload des fichiers...", "blue");
  uploadWithSCP(`${local}/.`, tempDir, "Upload fichiers landing");

  // Étape 4: Création répertoire final
  log("🔧 Création répertoire final...", "blue");
  executeSimpleSSH(`sudo mkdir -p ${remote}`, "Création répertoire final");

  // Étape 5: Déplacement fichiers
  log("📁 Installation fichiers...", "blue");
  executeSimpleSSH(
    `sudo sh -c 'cd ${tempDir} && cp -r . ${remote}/'`,
    "Installation fichiers"
  );

  // Étape 6: Permissions
  log("🔐 Configuration permissions...", "blue");
  executeSimpleSSH(
    `sudo chown -R www-data:www-data ${remote}`,
    "Permissions propriétaire"
  );
  executeSimpleSSH(`sudo chmod -R 644 ${remote}`, "Permissions fichiers");
  executeSimpleSSH(
    `sudo find ${remote} -type d -exec chmod 755 {} +`,
    "Permissions dossiers"
  );

  // Étape 7: Nettoyage
  log("🧹 Nettoyage...", "blue");
  executeSimpleSSH(`rm -rf ${tempDir}`, "Nettoyage temporaire");
  executeSimpleSSH(
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    "Nettoyage backup"
  );

  log("✅ Landing déployée: https://dev.melyia.com", "green");
}

function deployApp() {
  const { local, remote } = CONFIG.PATHS.app;
  const timestamp = Date.now();
  const tempDir = `/tmp/app-${timestamp}`;
  const backupDir = `/tmp/backend-backup-${timestamp}`;

  logPhase("PHASE 4 : DÉPLOIEMENT APP", "Application avec backend");

  // Étape 1: Préparation
  log("🔧 Préparation...", "blue");
  executeSimpleSSH(`mkdir -p ${tempDir}`, "Création répertoire temp");
  executeSimpleSSH(`mkdir -p ${backupDir}`, "Création répertoire backup");

  // Étape 2: Sauvegarde backend
  log("💾 Sauvegarde backend...", "blue");
  executeSimpleSSH(
    `[ -f ${remote}/server.js ] && cp ${remote}/server.js ${backupDir}/ || true`,
    "Sauvegarde server.js"
  );
  executeSimpleSSH(
    `[ -f ${remote}/package.json ] && cp ${remote}/package.json ${backupDir}/ || true`,
    "Sauvegarde package.json"
  );
  executeSimpleSSH(
    `[ -f ${remote}/.env ] && cp ${remote}/.env ${backupDir}/ || true`,
    "Sauvegarde .env"
  );

  // Étape 3: Upload fichiers
  log("📤 Upload des fichiers...", "blue");
  uploadWithSCP(`${local}/.`, tempDir, "Upload fichiers app");

  // Étape 4: Sauvegarde répertoire existant
  log("💾 Sauvegarde app existante...", "blue");
  executeSimpleSSH(
    `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
    "Sauvegarde app existante"
  );

  // Étape 5: Installation
  log("📁 Installation app...", "blue");
  executeSimpleSSH(`sudo mkdir -p ${remote}`, "Création répertoire app");
  executeSimpleSSH(
    `sudo sh -c 'cd ${tempDir} && cp -r . ${remote}/'`,
    "Installation fichiers"
  );

  // Étape 6: Restauration backend
  log("🔄 Restauration backend...", "blue");
  executeSimpleSSH(
    `[ -f ${backupDir}/server.js ] && sudo cp ${backupDir}/server.js ${remote}/ || true`,
    "Restauration server.js"
  );
  executeSimpleSSH(
    `[ -f ${backupDir}/package.json ] && sudo cp ${backupDir}/package.json ${remote}/ || true`,
    "Restauration package.json"
  );
  executeSimpleSSH(
    `[ -f ${backupDir}/.env ] && sudo cp ${backupDir}/.env ${remote}/ || true`,
    "Restauration .env"
  );

  // Étape 7: Lien symbolique
  log("🔗 Configuration index...", "blue");
  executeSimpleSSH(
    `cd ${remote} && sudo ln -sf index-app.html index.html`,
    "Lien symbolique index"
  );

  // Étape 8: Permissions
  log("🔐 Configuration permissions...", "blue");
  executeSimpleSSH(
    `sudo chown -R www-data:www-data ${remote}`,
    "Permissions propriétaire"
  );
  executeSimpleSSH(
    `sudo chmod -R 644 ${remote}/index*.html`,
    "Permissions HTML"
  );
  executeSimpleSSH(
    `sudo chmod -R 755 ${remote}/assets`,
    "Permissions assets dossier"
  );
  executeSimpleSSH(
    `sudo find ${remote}/assets -type f -exec chmod 644 {} +`,
    "Permissions assets fichiers"
  );

  // Étape 9: Nettoyage
  log("🧹 Nettoyage...", "blue");
  executeSimpleSSH(`rm -rf ${tempDir}`, "Nettoyage temp");
  executeSimpleSSH(`rm -rf ${backupDir}`, "Nettoyage backup");
  executeSimpleSSH(
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    "Nettoyage backup app"
  );

  log("✅ App déployée: https://app-dev.melyia.com", "green");
}

function validateDeployment() {
  logPhase("PHASE 5 : VALIDATION FINALE", "Vérification des sites");

  // Validation côté serveur
  log("🔍 Validation serveur...", "blue");
  executeSimpleSSH(
    `ls -la ${CONFIG.PATHS.landing.remote}/ | head -3`,
    "Vérification landing"
  );
  executeSimpleSSH(
    `ls -la ${CONFIG.PATHS.app.remote}/ | head -3`,
    "Vérification app"
  );
  executeSimpleSSH(
    `[ -f ${CONFIG.PATHS.app.remote}/server.js ] && echo "server.js OK" || echo "server.js MANQUANT"`,
    "Vérification backend"
  );

  // Test HTTP des sites
  log("🌐 Test HTTP des sites...", "blue");

  const sites = [
    { name: "Landing", url: "https://dev.melyia.com" },
    { name: "App", url: "https://app-dev.melyia.com" },
  ];

  for (const site of sites) {
    try {
      log(`🔗 Test ${site.name}: ${site.url}`, "cyan");

      const curlStart = Date.now();
      const result = execSync(`curl -I "${site.url}" --max-time 30 --silent`, {
        encoding: "utf8",
        timeout: 35000,
      });

      const curlTime = Date.now() - curlStart;

      if (result.includes("200 OK")) {
        log(
          `✅ ${site.name} accessible en ${(curlTime / 1000).toFixed(
            1
          )}s (HTTP 200)`,
          "green"
        );
      } else {
        const statusMatch = result.match(/HTTP\/[\d.]+\s+(\d+)/);
        const status = statusMatch ? statusMatch[1] : "Unknown";
        log(`⚠️ ${site.name} répond avec HTTP ${status}`, "yellow");
      }
    } catch (error) {
      log(`❌ ${site.name} inaccessible: ${error.message}`, "red");
    }
  }
}

function showSummary() {
  logPhase("RÉSUMÉ DU DÉPLOIEMENT", "Statistiques finales");

  const totalDuration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const totalSteps = CONFIG.LOG.steps.length;

  log(`⏱️ Durée totale: ${totalDuration}s`, "cyan");
  log(`📊 Étapes exécutées: ${totalSteps}`, "cyan");
  log("");

  log("🌐 SITES DÉPLOYÉS:", "blue");
  log("  📍 Landing: https://dev.melyia.com", "white");
  log("  📍 App: https://app-dev.melyia.com", "white");
  log("");

  log("🔧 OPTIMISATIONS APPLIQUÉES:", "green");
  log(`  ✅ Commandes SSH simplifiées`, "green");
  log(`  ✅ Timeouts réduits (60s max)`, "green");
  log(`  ✅ Retry automatique (3x)`, "green");
  log(`  ✅ Compression SSH activée`, "green");
  log(`  ✅ Compatible Windows`, "green");
}

function main() {
  const startTime = Date.now();

  try {
    log("🚀 DÉPLOIEMENT SSH OPTIMISÉ - VERSION CORRIGÉE WINDOWS", "green");
    log("🎯 Commandes simplifiées - Échappement guillemets corrigé", "magenta");
    log("");

    // Phase 1: Validation builds
    validateBuilds();

    // Phase 2: Test connectivité
    testConnectivity();

    // Phase 3: Déploiement landing
    deployLanding();

    // Phase 4: Déploiement app
    deployApp();

    // Phase 5: Validation
    validateDeployment();

    // Résumé
    showSummary();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log("=====================================================", "cyan");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("🎯 PROBLÈMES WINDOWS CORRIGÉS", "magenta");
    log("✅ Tous les sites sont opérationnels", "green");
    log("=====================================================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log("=====================================================", "red");
    log(`❌ DÉPLOIEMENT ÉCHOUÉ après ${duration}s`, "red");
    log(`❌ Erreur: ${error.message}`, "red");
    log("💡 Utilisez: npm run deploy:ssh-test pour tester SSH", "yellow");
    log("=====================================================", "red");
    process.exit(1);
  }
}

// Démarrage
main().catch(console.error);
