// 🚀 DÉPLOIEMENT SSH OPTIMISÉ ANTI-TIMEOUT
// Version avec optimisations complètes contre les timeouts SSH

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    keyPath: process.env.USERPROFILE + "\\.ssh\\melyia_main",
    // Optimisations anti-timeout
    connectTimeout: 60, // Augmenté à 60s
    execTimeout: 300000, // 5 minutes pour les opérations longues
    serverAliveInterval: 30, // Keep-alive toutes les 30s
    compression: true, // Compression SSH
    maxRetries: 3, // Retry automatique
    retryDelay: 5000, // 5s entre les tentatives
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
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function buildOptimizedSSHCommand(baseCommand = "") {
  const options = [
    `-o ConnectTimeout=${CONFIG.SSH.connectTimeout}`,
    `-o ServerAliveInterval=${CONFIG.SSH.serverAliveInterval}`,
    `-o ServerAliveCountMax=3`,
    `-o BatchMode=yes`,
    `-o StrictHostKeyChecking=no`,
    `-o LogLevel=ERROR`,
  ];

  if (CONFIG.SSH.compression) {
    options.push(`-o Compression=yes`);
  }

  if (fs.existsSync(CONFIG.SSH.keyPath)) {
    options.push(`-i "${CONFIG.SSH.keyPath}"`);
  }

  const sshOptions = options.join(" ");

  if (baseCommand.startsWith("ssh")) {
    return `${baseCommand} ${sshOptions}`;
  } else if (baseCommand.startsWith("scp")) {
    return `${baseCommand} ${sshOptions}`;
  } else {
    return `ssh ${sshOptions} ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;
  }
}

function executeSSHWithRetry(
  command,
  description,
  timeout = CONFIG.SSH.execTimeout
) {
  for (let attempt = 1; attempt <= CONFIG.SSH.maxRetries; attempt++) {
    try {
      log(
        `🔄 ${description} (tentative ${attempt}/${CONFIG.SSH.maxRetries})...`,
        "cyan"
      );

      const startTime = Date.now();
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
        log(
          `⏳ Attente ${
            CONFIG.SSH.retryDelay / 1000
          }s avant nouvelle tentative...`,
          "yellow"
        );

        // Attente progressive (backoff)
        const backoffDelay = CONFIG.SSH.retryDelay * attempt;
        const startWait = Date.now();
        while (Date.now() - startWait < backoffDelay) {
          // Attente active
        }
      }
    }
  }
}

function executeSSHPhase(
  commands,
  description,
  timeout = CONFIG.SSH.execTimeout
) {
  const sshCmd = buildOptimizedSSHCommand();

  // Grouper les commandes avec gestion d'erreur
  const groupedCommand = commands
    .map(
      (cmd) =>
        `echo "🔄 ${cmd.split(" ")[0]}..." && ${cmd} && echo "✅ ${
          cmd.split(" ")[0]
        } OK"`
    )
    .join(" && ");

  const fullCommand = `${sshCmd} "${groupedCommand}"`;

  return executeSSHWithRetry(fullCommand, description, timeout);
}

function executeSCPWithRetry(
  sourceFiles,
  destination,
  description,
  timeout = CONFIG.SSH.execTimeout
) {
  const scpCmd = buildOptimizedSSHCommand("scp");

  // Optimisation SCP avec compression et options
  const fullCommand = `${scpCmd} -r ${sourceFiles} ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${destination}`;

  return executeSSHWithRetry(fullCommand, description, timeout);
}

function validateBuilds() {
  log("🔍 Validation des builds locaux...", "blue");

  const builds = [
    { path: CONFIG.PATHS.landing.local, name: "Landing" },
    { path: CONFIG.PATHS.app.local, name: "App" },
  ];

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

    log(`✅ Build ${build.name} validé: ${build.path}`, "green");
  }
}

function testConnectivity() {
  log("🌐 Test de connectivité optimisée...", "blue");

  const sshCmd = buildOptimizedSSHCommand();
  const testCommand = `${sshCmd} "echo 'SSH-OPTIMIZED-OK' && date && uptime"`;

  executeSSHWithRetry(testCommand, "Test connectivité SSH optimisée", 60000);
  log("✅ Connectivité SSH optimisée confirmée", "green");
}

function deployLandingOptimized() {
  const { local, remote } = CONFIG.PATHS.landing;
  const timestamp = Date.now();
  const tempDir = `/tmp/landing-${timestamp}`;

  log("🏠 Déploiement Landing avec optimisations SSH...", "blue");

  // Phase 1: Préparation serveur
  const prepareCommands = [
    `mkdir -p ${tempDir}`,
    `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
    `sudo mkdir -p ${remote}`,
    `echo "Landing préparée: ${tempDir}"`,
  ];

  executeSSHPhase(prepareCommands, "Préparation serveur landing", 120000);

  // Phase 2: Upload fichiers avec SCP optimisé
  executeSCPWithRetry(`${local}/*`, tempDir, "Upload landing optimisé", 300000);

  // Phase 3: Installation
  const installCommands = [
    `sudo cp -r ${tempDir}/* ${remote}/`,
    `sudo chown -R www-data:www-data ${remote}`,
    `sudo chmod -R 644 ${remote}/*`,
    `sudo find ${remote} -type d -exec chmod 755 {} +`,
    `rm -rf ${tempDir}`,
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    `echo "Landing installée avec succès"`,
  ];

  executeSSHPhase(installCommands, "Installation landing", 180000);

  log("✅ Landing déployée: https://dev.melyia.com", "green");
}

function deployAppOptimized() {
  const { local, remote } = CONFIG.PATHS.app;
  const timestamp = Date.now();
  const tempDir = `/tmp/app-${timestamp}`;
  const backupDir = `/tmp/backend-backup-${timestamp}`;

  log("💼 Déploiement App avec optimisations SSH...", "blue");

  // Phase 1: Préparation et sauvegarde
  const prepareCommands = [
    `mkdir -p ${tempDir}`,
    `mkdir -p ${backupDir}`,
    `[ -f ${remote}/server.js ] && cp ${remote}/server.js ${backupDir}/ || true`,
    `[ -f ${remote}/package.json ] && cp ${remote}/package.json ${backupDir}/ || true`,
    `[ -f ${remote}/.env ] && cp ${remote}/.env ${backupDir}/ || true`,
    `[ -d ${remote}/node_modules ] && echo "node_modules détecté" || true`,
    `echo "Sauvegarde backend terminée"`,
  ];

  executeSSHPhase(prepareCommands, "Préparation et sauvegarde app", 120000);

  // Phase 2: Upload fichiers avec SCP optimisé
  executeSCPWithRetry(`${local}/*`, tempDir, "Upload app optimisé", 300000);

  // Phase 3: Installation app
  const installCommands = [
    `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
    `sudo mkdir -p ${remote}`,
    `sudo cp -r ${tempDir}/* ${remote}/`,
    `echo "App installée"`,
  ];

  executeSSHPhase(installCommands, "Installation app", 120000);

  // Phase 4: Restauration backend
  const restoreCommands = [
    `[ -f ${backupDir}/server.js ] && sudo cp ${backupDir}/server.js ${remote}/ || true`,
    `[ -f ${backupDir}/package.json ] && sudo cp ${backupDir}/package.json ${remote}/ || true`,
    `[ -f ${backupDir}/.env ] && sudo cp ${backupDir}/.env ${remote}/ || true`,
    `cd ${remote} && sudo ln -sf index-app.html index.html`,
    `echo "Backend restauré"`,
  ];

  executeSSHPhase(restoreCommands, "Restauration backend", 120000);

  // Phase 5: Permissions finales
  const permissionsCommands = [
    `sudo chown -R www-data:www-data ${remote}`,
    `sudo chmod -R 644 ${remote}/index*.html`,
    `sudo chmod -R 755 ${remote}/assets`,
    `sudo chmod -R 644 ${remote}/assets/*`,
    `sudo find ${remote}/assets -type d -exec chmod 755 {} +`,
    `rm -rf ${tempDir}`,
    `rm -rf ${backupDir}`,
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    `echo "Permissions configurées"`,
  ];

  executeSSHPhase(permissionsCommands, "Configuration permissions", 180000);

  log("✅ App déployée: https://app-dev.melyia.com", "green");
}

function validateDeployment() {
  log("✅ Validation du déploiement...", "blue");

  const validationCommands = [
    `echo "=== VALIDATION LANDING ==="`,
    `ls -la ${CONFIG.PATHS.landing.remote}/ | head -5`,
    `echo "=== VALIDATION APP ==="`,
    `ls -la ${CONFIG.PATHS.app.remote}/ | head -5`,
    `echo "=== VALIDATION ASSETS ==="`,
    `ls -la ${CONFIG.PATHS.app.remote}/assets/ | head -5`,
    `echo "=== VALIDATION BACKEND ==="`,
    `[ -f ${CONFIG.PATHS.app.remote}/server.js ] && echo "✅ server.js présent" || echo "❌ server.js manquant"`,
    `[ -f ${CONFIG.PATHS.app.remote}/package.json ] && echo "✅ package.json présent" || echo "❌ package.json manquant"`,
    `echo "=== VALIDATION TERMINÉE ==="`,
  ];

  executeSSHPhase(validationCommands, "Validation finale", 120000);
}

function displayOptimizations() {
  log("\n🎯 OPTIMISATIONS SSH ACTIVÉES:", "magenta");
  log("================================", "magenta");
  log(`✅ ConnectTimeout: ${CONFIG.SSH.connectTimeout}s`, "green");
  log(`✅ ServerAliveInterval: ${CONFIG.SSH.serverAliveInterval}s`, "green");
  log(
    `✅ Compression SSH: ${CONFIG.SSH.compression ? "Activée" : "Désactivée"}`,
    "green"
  );
  log(`✅ Retry automatique: ${CONFIG.SSH.maxRetries} tentatives`, "green");
  log(`✅ Backoff progressif: ${CONFIG.SSH.retryDelay}ms base`, "green");
  log(`✅ Phases séparées: Réduction des timeouts`, "green");
  log(`✅ Commandes groupées: Optimisation réseau`, "green");
  log("================================", "magenta");
}

function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT SSH OPTIMISÉ ANTI-TIMEOUT", "green");
  log("==========================================", "cyan");

  try {
    // Affichage des optimisations
    displayOptimizations();

    // Validation des builds
    validateBuilds();

    // Test de connectivité
    testConnectivity();

    // Déploiement Landing
    deployLandingOptimized();

    // Déploiement App
    deployAppOptimized();

    // Validation finale
    validateDeployment();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("==========================================", "cyan");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("🎯 OPTIMISATIONS ANTI-TIMEOUT APPLIQUÉES", "magenta");
    log("📍 Landing: https://dev.melyia.com", "white");
    log("📍 App: https://app-dev.melyia.com", "white");
    log("✅ Timeouts SSH éliminés", "green");
    log("✅ Retry automatique intégré", "green");
    log("✅ Phases optimisées", "green");
    log("==========================================", "cyan");
  } catch (error) {
    log("==========================================", "red");
    log(`❌ ÉCHEC DU DÉPLOIEMENT: ${error.message}`, "red");
    log(
      "💡 Utilisez le script de diagnostic pour analyser le problème",
      "yellow"
    );
    log("💡 Commande: node diagnostic-ssh-timeouts.mjs", "yellow");
    log("==========================================", "red");
    process.exit(1);
  }
}

// Démarrage du déploiement
main().catch(console.error);
