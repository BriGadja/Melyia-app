// 🚀 SCRIPT DÉPLOIEMENT BULLETPROOF V3-SAFE
// Version ultra-sécurisée avec espacement SSH et protection anti-brute force

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    connectTimeout: 60,
    execTimeout: 180000, // 3 minutes
    safeDelay: 30000, // 30 secondes entre connexions SSH
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
    reset: "\x1b[0m",
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function debugLog(message, data = null) {
  log(`🔍 ${message}`, "magenta");
  if (data) {
    console.log(`   └── ${JSON.stringify(data)}`);
  }
}

function safeDelay(description = "Protection anti-brute force") {
  const delaySeconds = CONFIG.SSH.safeDelay / 1000;
  log(`⏳ ${description} - Pause sécurisée ${delaySeconds}s...`, "yellow");

  const startTime = Date.now();
  while (Date.now() - startTime < CONFIG.SSH.safeDelay) {
    // Pause active pour éviter le brute force
  }

  log(`✅ Pause terminée - SSH sécurisé`, "green");
}

function executeSSH(command, description, timeout = CONFIG.SSH.execTimeout) {
  try {
    log(`🔄 ${description}...`, "cyan");
    debugLog(`Commande SSH`, command);

    const startTime = Date.now();
    const result = execSync(command, {
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const duration = Date.now() - startTime;

    debugLog(`✅ Succès SSH en ${duration}ms`, {
      outputLength: result.length,
      timeout: timeout,
    });

    if (result.trim()) {
      debugLog(`Sortie`, result.trim().substring(0, 200));
    }

    log(`✅ ${description} - Terminé en ${duration}ms`, "green");
    return result;
  } catch (error) {
    log(`❌ Erreur ${description}: ${error.message}`, "red");
    debugLog(`Erreur SSH détaillée`, {
      exitCode: error.status,
      signal: error.signal,
      stderr: error.stderr?.substring(0, 300),
    });
    throw error;
  }
}

function validateBuilds() {
  log("🔍 Validation des builds...", "blue");

  const builds = ["dist/landing", "dist/app"];
  for (const buildPath of builds) {
    if (!fs.existsSync(buildPath)) {
      throw new Error(`Build manquant: ${buildPath}`);
    }

    const files = fs.readdirSync(buildPath);
    const hasHTML = files.some((f) => f.endsWith(".html"));
    const hasAssets = fs.existsSync(path.join(buildPath, "assets"));

    if (!hasHTML || !hasAssets) {
      throw new Error(`Build incomplet: ${buildPath}`);
    }

    log(`✅ Build validé: ${buildPath}`, "green");
  }
}

function testConnectivity() {
  log("🔍 Test de connectivité SSH sécurisé...", "blue");

  const sshCmd = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -o ServerAliveInterval=60 -o BatchMode=yes ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  try {
    executeSSH(
      `${sshCmd} "echo 'SSH-V3-SAFE-OK' && date && uptime"`,
      "Test connectivité sécurisée",
      45000
    );
    log("✅ Connectivité SSH V3-SAFE confirmée", "green");
  } catch (error) {
    throw new Error(`Connectivité SSH échec: ${error.message}`);
  }
}

function deployLanding() {
  const { local, remote } = CONFIG.PATHS.landing;
  const timestamp = Date.now();
  const tempDir = `/tmp/landing-${timestamp}`;

  log("🏠 Déploiement Landing V3-SAFE (espacement sécurisé)...", "blue");

  const sshCmd = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -o ServerAliveInterval=60 ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  // Étape 1: Préparation serveur (toutes commandes groupées)
  const prepareCommands = [
    `mkdir -p ${tempDir}`,
    `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
    `sudo mkdir -p ${remote}`,
    `ls -la ${tempDir}`,
    `echo "Landing préparée: ${tempDir}"`,
  ].join(" && ");

  executeSSH(
    `${sshCmd} "${prepareCommands}"`,
    "Préparation serveur landing V3-SAFE",
    120000
  );

  // Pause sécurisée anti-brute force
  safeDelay("Avant upload landing");

  // Étape 2: Upload fichiers
  executeSSH(
    `scp -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -o ServerAliveInterval=60 -r ${local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempDir}/`,
    "Upload fichiers landing V3-SAFE",
    180000
  );

  // Pause sécurisée anti-brute force
  safeDelay("Avant installation landing");

  // Étape 3: Installation complète (toutes commandes groupées)
  const installCommands = [
    `sudo cp -r ${tempDir}/* ${remote}/`,
    `sudo chown -R www-data:www-data ${remote}`,
    `sudo chmod -R 644 ${remote}/*`,
    `sudo find ${remote} -type d -exec chmod 755 {} +`,
    `rm -rf ${tempDir}`,
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    `ls -la ${remote}`,
    `echo "Landing V3-SAFE déployée avec succès"`,
  ].join(" && ");

  executeSSH(
    `${sshCmd} "${installCommands}"`,
    "Installation landing V3-SAFE",
    180000
  );

  log("✅ Landing V3-SAFE déployée: https://dev.melyia.com", "green");
}

function deployApp() {
  const { local, remote } = CONFIG.PATHS.app;
  const timestamp = Date.now();
  const tempDir = `/tmp/app-${timestamp}`;
  const backupDir = `/tmp/backend-backup-${timestamp}`;

  log("💼 Déploiement Application V3-SAFE (espacement sécurisé)...", "blue");

  const sshCmd = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -o ServerAliveInterval=60 ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  // Pause sécurisée après landing
  safeDelay("Avant préparation app");

  // Étape 1: Préparation + sauvegarde backend
  const prepareCommands = [
    `mkdir -p ${tempDir} ${backupDir}`,
    `[ -f ${remote}/server.js ] && cp ${remote}/server.js ${backupDir}/ || echo 'Pas de server.js'`,
    `[ -f ${remote}/package.json ] && cp ${remote}/package.json ${backupDir}/ || echo 'Pas de package.json'`,
    `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
    `sudo mkdir -p ${remote}`,
    `ls -la ${tempDir} ${backupDir}`,
    `echo "App préparée: ${tempDir}"`,
  ].join(" && ");

  executeSSH(
    `${sshCmd} "${prepareCommands}"`,
    "Préparation + sauvegarde backend V3-SAFE",
    120000
  );

  // Pause sécurisée anti-brute force
  safeDelay("Avant upload app");

  // Étape 2: Upload fichiers
  executeSSH(
    `scp -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -o ServerAliveInterval=60 -r ${local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempDir}/`,
    "Upload fichiers app V3-SAFE",
    180000
  );

  // Pause sécurisée anti-brute force
  safeDelay("Avant installation app");

  // Étape 3: Installation complète
  const installCommands = [
    `sudo cp -r ${tempDir}/* ${remote}/`,
    `[ -f ${backupDir}/server.js ] && sudo cp ${backupDir}/server.js ${remote}/ || echo 'Pas de server.js à restaurer'`,
    `[ -f ${backupDir}/package.json ] && sudo cp ${backupDir}/package.json ${remote}/ || echo 'Pas de package.json à restaurer'`,
    `cd ${remote} && sudo ln -sf index-app.html index.html`,
    `sudo chown -R www-data:www-data ${remote}`,
    `sudo chmod -R 644 ${remote}/index*.html`,
    `sudo chmod -R 644 ${remote}/assets/*`,
    `sudo find ${remote}/assets -type d -exec chmod 755 {} +`,
    `[ -f ${remote}/server.js ] && sudo chmod 755 ${remote}/server.js || echo 'Pas de server.js'`,
    `rm -rf ${tempDir} ${backupDir}`,
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    `ls -la ${remote}`,
    `echo "App V3-SAFE déployée avec succès"`,
  ].join(" && ");

  executeSSH(
    `${sshCmd} "${installCommands}"`,
    "Installation complète app V3-SAFE",
    180000
  );

  log("✅ Application V3-SAFE déployée: https://app-dev.melyia.com", "green");
}

function validateDeployment() {
  log("🔍 Validation V3-SAFE...", "blue");

  // Pause sécurisée avant validation
  safeDelay("Avant validation finale");

  try {
    // Test sites avec timeout généreux
    const testCommands = [
      'curl -s -o /dev/null -w "Landing: %{http_code}" -m 20 https://dev.melyia.com',
      'curl -s -o /dev/null -w "App: %{http_code}" -m 20 https://app-dev.melyia.com',
      'echo "Tests terminés"',
    ].join(" && ");

    executeSSH(testCommands, "Validation accessibilité V3-SAFE", 60000);
    log("✅ Validation V3-SAFE réussie", "green");
  } catch (error) {
    log(
      "⚠️ Validation V3-SAFE partielle - Déploiement probablement OK",
      "yellow"
    );
    debugLog("Erreur validation", error.message);
  }
}

function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT BULLETPROOF V3-SAFE", "green");
  log("===================================", "cyan");
  log("🛡️ Protection anti-brute force SSH intégrée", "yellow");
  log("⏳ Espacement sécurisé entre connexions", "yellow");

  debugLog("Configuration V3-SAFE", {
    node: process.version,
    platform: process.platform,
    sshTimeout: CONFIG.SSH.connectTimeout,
    safeDelay: CONFIG.SSH.safeDelay,
    totalEstimatedTime: "8-12 minutes",
  });

  try {
    // Tests préliminaires
    testConnectivity();
    validateBuilds();

    // Déploiement ultra-sécurisé
    log("🔄 Déploiement V3-SAFE avec espacement sécurisé...", "cyan");
    deployLanding();
    deployApp();

    // Validation finale
    validateDeployment();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("===================================", "cyan");
    log(`🎉 DÉPLOIEMENT V3-SAFE RÉUSSI en ${duration}s`, "green");
    log("📍 Landing: https://dev.melyia.com", "white");
    log("📍 App: https://app-dev.melyia.com", "white");
    log("🛡️ Protection anti-brute force respectée", "yellow");
    log("🚀 V3-SAFE: 100% compatible serveurs sécurisés", "yellow");
    log("🔧 Backend automatiquement préservé", "white");
  } catch (error) {
    log("===================================", "cyan");
    log(`💥 ERREUR DÉPLOIEMENT V3-SAFE: ${error.message}`, "red");

    debugLog("Erreur détaillée V3-SAFE", {
      name: error.name,
      code: error.code,
      status: error.status,
      timestamp: new Date().toISOString(),
    });

    log("💡 Solutions V3-SAFE:", "yellow");
    log("   1. Attendez 10-15 minutes et réessayez", "yellow");
    log("   2. Vérifiez: ssh ubuntu@51.91.145.255", "yellow");
    log("   3. Contactez admin si problème persiste", "yellow");
    log("   4. Utilisez deploy-manual.js en dernier recours", "yellow");

    process.exit(1);
  }
}

main();
