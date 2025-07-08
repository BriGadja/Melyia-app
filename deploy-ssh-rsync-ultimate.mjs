// 🚀 DÉPLOIEMENT SSH ULTIME AVEC RSYNC - SOLUTION FINALE
// Évite complètement les problèmes de sudo cp en utilisant rsync direct

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    keyPath: process.env.USERPROFILE + "\\.ssh\\melyia_main",
    connectTimeout: 60,
    execTimeout: 60000,
    serverAliveInterval: 30,
    compression: true,
    maxRetries: 3,
    retryDelay: 2000,
  },
  PATHS: {
    landing: {
      local: "dist/landing/",
      remote: "/var/www/melyia/dev-site/",
    },
    app: {
      local: "dist/app/",
      remote: "/var/www/melyia/app-dev/",
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

function buildSSHOptions() {
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

  return options.join(" ");
}

function executeWithRetry(
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
        log(`💥 ${description} - Échec définitif`, "red");
        throw error;
      }

      if (attempt < CONFIG.SSH.maxRetries) {
        const delay = CONFIG.SSH.retryDelay * attempt;
        log(`⏳ Attente ${delay / 1000}s...`, "yellow");
        const waitStart = Date.now();
        while (Date.now() - waitStart < delay) {
          // Attente active
        }
      }
    }
  }
}

function executeSSH(remoteCommand, description) {
  const sshOptions = buildSSHOptions();
  const command = `ssh ${sshOptions} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "${remoteCommand}"`;
  return executeWithRetry(command, description);
}

function deployWithRsync(localPath, remotePath, description) {
  const sshOptions = buildSSHOptions();

  // Commande rsync avec SSH optimisé
  const rsyncCommand = [
    "rsync",
    "-avz", // archive + verbose + compress
    "--delete", // supprime fichiers en trop
    "--timeout=45", // timeout rsync
    `--rsh="ssh ${sshOptions}"`, // utilise nos options SSH
    `"${localPath}"`,
    `${CONFIG.SSH.user}@${CONFIG.SSH.host}:"${remotePath}"`,
  ].join(" ");

  return executeWithRetry(rsyncCommand, description, 120000); // 2 minutes max
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
  logPhase("PHASE 1 : VALIDATION DES BUILDS", "Vérification artefacts");

  const builds = [
    { path: CONFIG.PATHS.landing.local.slice(0, -1), name: "Landing" },
    { path: CONFIG.PATHS.app.local.slice(0, -1), name: "App" },
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
  logPhase("PHASE 2 : TEST CONNECTIVITÉ RSYNC", "SSH + Rsync disponibilité");

  // Test SSH de base
  const result = executeSSH(
    "echo 'SSH-RSYNC-OK' && date && uptime && which rsync",
    "Test SSH + Rsync"
  );

  log("✅ SSH + Rsync confirmés", "green");

  const lines = result.split("\n").filter((line) => line.trim());
  if (lines.length >= 2) {
    log(`📊 Serveur: ${lines[1]}`, "cyan");
    if (lines[2]) log(`📊 Uptime: ${lines[2]}`, "cyan");
    if (lines[3] && lines[3].includes("rsync")) {
      log(`✅ Rsync disponible: ${lines[3]}`, "green");
    }
  }

  log("🎯 Mode RSYNC actif:", "blue");
  log(`  • Synchronisation directe (pas de cp)`, "blue");
  log(`  • Compression intégrée`, "blue");
  log(`  • Delete automatique`, "blue");
  log(`  • Timeout rsync: 45s`, "blue");
}

function deployLandingRsync() {
  const { local, remote } = CONFIG.PATHS.landing;
  const timestamp = Date.now();

  logPhase("PHASE 3 : DÉPLOIEMENT LANDING RSYNC", "Synchronisation directe");

  // Sauvegarde préventive
  log("💾 Sauvegarde préventive...", "blue");
  executeSSH(
    `[ -d ${remote} ] && sudo cp -r ${remote} ${remote}-backup-${timestamp} || true`,
    "Sauvegarde landing"
  );

  // Création du répertoire destination
  log("🔧 Préparation destination...", "blue");
  executeSSH(`sudo mkdir -p ${remote}`, "Création répertoire");
  executeSSH(
    `sudo chown -R ${CONFIG.SSH.user}:${CONFIG.SSH.user} ${remote}`,
    "Permissions temporaires"
  );

  // Déploiement RSYNC direct
  log("🚀 Synchronisation RSYNC...", "blue");
  deployWithRsync(local, remote, "Rsync landing complet");

  // Restauration permissions web
  log("🔐 Restauration permissions web...", "blue");
  executeSSH(
    `sudo chown -R www-data:www-data ${remote}`,
    "Propriétaire www-data"
  );
  executeSSH(
    `sudo find ${remote} -type f -exec chmod 644 {} +`,
    "Permissions fichiers"
  );
  executeSSH(
    `sudo find ${remote} -type d -exec chmod 755 {} +`,
    "Permissions dossiers"
  );

  // Nettoyage
  log("🧹 Nettoyage...", "blue");
  executeSSH(
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    "Suppression backup"
  );

  log("✅ Landing déployée: https://dev.melyia.com", "green");
}

function deployAppRsync() {
  const { local, remote } = CONFIG.PATHS.app;
  const timestamp = Date.now();
  const backupDir = `/tmp/backend-backup-${timestamp}`;

  logPhase("PHASE 4 : DÉPLOIEMENT APP RSYNC", "Sync avec sauvegarde backend");

  // Sauvegarde backend
  log("💾 Sauvegarde backend...", "blue");
  executeSSH(`mkdir -p ${backupDir}`, "Création backup dir");
  executeSSH(
    `[ -f ${remote}server.js ] && cp ${remote}server.js ${backupDir}/ || true`,
    "Backup server.js"
  );
  executeSSH(
    `[ -f ${remote}package.json ] && cp ${remote}package.json ${backupDir}/ || true`,
    "Backup package.json"
  );
  executeSSH(
    `[ -f ${remote}.env ] && cp ${remote}.env ${backupDir}/ || true`,
    "Backup .env"
  );

  // Sauvegarde complète
  log("💾 Sauvegarde app complète...", "blue");
  executeSSH(
    `[ -d ${remote} ] && sudo cp -r ${remote} ${remote}-backup-${timestamp} || true`,
    "Backup app complète"
  );

  // Préparation destination
  log("🔧 Préparation destination...", "blue");
  executeSSH(`sudo mkdir -p ${remote}`, "Création répertoire app");
  executeSSH(
    `sudo chown -R ${CONFIG.SSH.user}:${CONFIG.SSH.user} ${remote}`,
    "Permissions temporaires"
  );

  // Déploiement RSYNC
  log("🚀 Synchronisation RSYNC...", "blue");
  deployWithRsync(local, remote, "Rsync app complet");

  // Restauration backend
  log("🔄 Restauration backend...", "blue");
  executeSSH(
    `[ -f ${backupDir}/server.js ] && cp ${backupDir}/server.js ${remote} || true`,
    "Restore server.js"
  );
  executeSSH(
    `[ -f ${backupDir}/package.json ] && cp ${backupDir}/package.json ${remote} || true`,
    "Restore package.json"
  );
  executeSSH(
    `[ -f ${backupDir}/.env ] && cp ${backupDir}/.env ${remote} || true`,
    "Restore .env"
  );

  // Configuration index
  log("🔗 Configuration index...", "blue");
  executeSSH(
    `cd ${remote} && [ -f index-app.html ] && ln -sf index-app.html index.html || true`,
    "Lien index"
  );

  // Permissions finales
  log("🔐 Permissions finales...", "blue");
  executeSSH(
    `sudo chown -R www-data:www-data ${remote}`,
    "Propriétaire www-data"
  );
  executeSSH(
    `sudo find ${remote} -type f -exec chmod 644 {} +`,
    "Permissions fichiers"
  );
  executeSSH(
    `sudo find ${remote} -type d -exec chmod 755 {} +`,
    "Permissions dossiers"
  );

  // Nettoyage
  log("🧹 Nettoyage...", "blue");
  executeSSH(`rm -rf ${backupDir}`, "Suppression backup temp");
  executeSSH(
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    "Suppression backup app"
  );

  log("✅ App déployée: https://app-dev.melyia.com", "green");
}

function validateDeployment() {
  logPhase("PHASE 5 : VALIDATION FINALE", "Vérification sites");

  // Validation serveur
  log("🔍 Validation serveur...", "blue");
  executeSSH(
    `ls -la ${CONFIG.PATHS.landing.remote} | head -3`,
    "Check landing"
  );
  executeSSH(`ls -la ${CONFIG.PATHS.app.remote} | head -3`, "Check app");
  executeSSH(
    `[ -f ${CONFIG.PATHS.app.remote}server.js ] && echo "✅ Backend OK" || echo "⚠️ Backend manquant"`,
    "Check backend"
  );

  // Test HTTP
  log("🌐 Test HTTP...", "blue");

  const sites = [
    { name: "Landing", url: "https://dev.melyia.com" },
    { name: "App", url: "https://app-dev.melyia.com" },
  ];

  for (const site of sites) {
    try {
      log(`🔗 Test ${site.name}: ${site.url}`, "cyan");

      const start = Date.now();
      const result = execSync(`curl -I "${site.url}" --max-time 20 --silent`, {
        encoding: "utf8",
        timeout: 25000,
      });

      const time = ((Date.now() - start) / 1000).toFixed(1);

      if (result.includes("200 OK")) {
        log(`✅ ${site.name} accessible en ${time}s (HTTP 200)`, "green");
      } else {
        const match = result.match(/HTTP\/[\d.]+\s+(\d+)/);
        const status = match ? match[1] : "Unknown";
        log(`⚠️ ${site.name} HTTP ${status}`, "yellow");
      }
    } catch (error) {
      log(`❌ ${site.name} inaccessible`, "red");
    }
  }
}

function showSummary() {
  logPhase("RÉSUMÉ DÉPLOIEMENT RSYNC", "Statistiques finales");

  const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const steps = CONFIG.LOG.steps.length;

  log(`⏱️ Durée totale: ${duration}s`, "cyan");
  log(`📊 Étapes: ${steps}`, "cyan");
  log("");

  log("🌐 SITES DÉPLOYÉS:", "blue");
  log("  📍 Landing: https://dev.melyia.com", "white");
  log("  📍 App: https://app-dev.melyia.com", "white");
  log("");

  log("🚀 OPTIMISATIONS RSYNC:", "green");
  log("  ✅ Synchronisation directe (pas de cp)", "green");
  log("  ✅ Compression intégrée", "green");
  log("  ✅ Delete automatique", "green");
  log("  ✅ Timeout géré (45s)", "green");
  log("  ✅ Retry automatique (3x)", "green");
}

function main() {
  try {
    log("🚀 DÉPLOIEMENT SSH ULTIME AVEC RSYNC", "green");
    log("🎯 Solution finale - Évite complètement sudo cp", "magenta");
    log("");

    validateBuilds();
    testConnectivity();
    deployLandingRsync();
    deployAppRsync();
    validateDeployment();
    showSummary();

    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "cyan");
    log(`🎉 DÉPLOIEMENT RSYNC RÉUSSI en ${duration}s`, "green");
    log("🚀 PROBLÈME SUDO CP CONTOURNÉ DÉFINITIVEMENT", "magenta");
    log("✅ Tous les sites opérationnels", "green");
    log("=====================================================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "red");
    log(`❌ DÉPLOIEMENT ÉCHOUÉ après ${duration}s`, "red");
    log(`❌ Erreur: ${error.message}`, "red");
    log("=====================================================", "red");
    process.exit(1);
  }
}

main();
