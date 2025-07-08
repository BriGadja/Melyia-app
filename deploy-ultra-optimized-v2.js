// 🚀 SCRIPT DÉPLOIEMENT ULTRA-OPTIMISÉ V2
// Version corrigée avec timeouts optimisés et commandes SSH simplifiées

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    connectTimeout: 45,
    execTimeout: 300000, // 5 minutes pour chaque phase
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

function executeSSH(command, description, timeout = CONFIG.SSH.execTimeout) {
  try {
    log(`🔧 ${description}...`, "cyan");

    const result = execSync(command, {
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    });

    log(`✅ ${description} - SUCCÈS`, "green");
    return result;
  } catch (error) {
    log(`❌ ${description} - Erreur: ${error.message}`, "red");
    throw error;
  }
}

function validateBuilds() {
  log("🔍 Validation builds locaux...", "blue");

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

function deployOptimizedV2() {
  const timestamp = Date.now();
  const { landing, app } = CONFIG.PATHS;

  log("🎯 DÉPLOIEMENT ULTRA-OPTIMISÉ V2", "magenta");
  log("================================", "magenta");

  // PHASE 1 : Upload des fichiers
  log("📤 PHASE 1: Upload des builds...", "blue");

  const scpLanding = `scp -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -r ${landing.local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:/tmp/landing-${timestamp}/`;
  const scpApp = `scp -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -r ${app.local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:/tmp/app-${timestamp}/`;

  executeSSH(scpLanding, "Upload landing", 120000);
  executeSSH(scpApp, "Upload application", 120000);

  // PHASE 2 : Installation Landing (plus simple)
  log("🏠 PHASE 2: Installation landing...", "blue");

  const landingCommand = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "
    echo '🏠 Installation landing...' &&
    sudo rm -rf ${landing.remote}-backup-${timestamp} || true &&
    [ -d ${landing.remote} ] && sudo mv ${landing.remote} ${landing.remote}-backup-${timestamp} || true &&
    sudo mkdir -p ${landing.remote} &&
    sudo cp -r /tmp/landing-${timestamp}/* ${landing.remote}/ &&
    sudo chown -R www-data:www-data ${landing.remote} &&
    sudo chmod -R 644 ${landing.remote}/* &&
    sudo find ${landing.remote} -type d -exec chmod 755 {} + &&
    rm -rf /tmp/landing-${timestamp} &&
    echo '✅ Landing installé'
  "`;

  executeSSH(landingCommand, "Installation landing", 120000);

  // PHASE 3 : Préparation App avec sauvegarde backend
  log("💼 PHASE 3: Sauvegarde backend...", "blue");

  const backupCommand = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "
    echo '💼 Sauvegarde backend...' &&
    mkdir -p /tmp/backend-backup-${timestamp} &&
    [ -f ${app.remote}/server.js ] && cp ${app.remote}/server.js /tmp/backend-backup-${timestamp}/ || true &&
    [ -f ${app.remote}/package.json ] && cp ${app.remote}/package.json /tmp/backend-backup-${timestamp}/ || true &&
    [ -f ${app.remote}/.env ] && cp ${app.remote}/.env /tmp/backend-backup-${timestamp}/ || true &&
    echo '✅ Backend sauvegardé'
  "`;

  executeSSH(backupCommand, "Sauvegarde backend", 60000);

  // PHASE 4 : Installation App
  log("📱 PHASE 4: Installation application...", "blue");

  const appCommand = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "
    echo '📱 Installation app...' &&
    sudo rm -rf ${app.remote}-backup-${timestamp} || true &&
    [ -d ${app.remote} ] && sudo mv ${app.remote} ${app.remote}-backup-${timestamp} || true &&
    sudo mkdir -p ${app.remote} &&
    sudo cp -r /tmp/app-${timestamp}/* ${app.remote}/ &&
    echo '✅ App installée'
  "`;

  executeSSH(appCommand, "Installation app", 120000);

  // PHASE 5 : Restauration backend + permissions
  log("🔧 PHASE 5: Configuration finale...", "blue");

  const finalCommand = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "
    echo '🔧 Restauration backend...' &&
    [ -f /tmp/backend-backup-${timestamp}/server.js ] && sudo cp /tmp/backend-backup-${timestamp}/server.js ${app.remote}/ || true &&
    [ -f /tmp/backend-backup-${timestamp}/package.json ] && sudo cp /tmp/backend-backup-${timestamp}/package.json ${app.remote}/ || true &&
    [ -f /tmp/backend-backup-${timestamp}/.env ] && sudo cp /tmp/backend-backup-${timestamp}/.env ${app.remote}/ || true &&
    cd ${app.remote} && sudo ln -sf index-app.html index.html &&
    sudo chown -R www-data:www-data ${app.remote} &&
    sudo chmod -R 644 ${app.remote}/index*.html &&
    sudo chmod -R 755 ${app.remote}/assets &&
    sudo chmod -R 644 ${app.remote}/assets/* &&
    sudo find ${app.remote}/assets -type d -exec chmod 755 {} + &&
    rm -rf /tmp/app-${timestamp} &&
    rm -rf /tmp/backend-backup-${timestamp} &&
    echo '🎉 Configuration terminée'
  "`;

  executeSSH(finalCommand, "Configuration finale", 120000);

  // PHASE 6 : Validation
  log("✅ PHASE 6: Validation finale...", "blue");

  const validationCommand = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "
    echo '✅ Validation...' &&
    ls -la ${landing.remote}/ | head -3 &&
    ls -la ${app.remote}/ | head -3 &&
    ls -la ${app.remote}/assets/ | head -3
  "`;

  executeSSH(validationCommand, "Validation finale", 30000);
}

function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT ULTRA-OPTIMISÉ V2", "green");
  log("=================================", "cyan");
  log("🔧 Timeouts optimisés + commandes simplifiées", "yellow");
  log("🛠️ Correction permissions CSS/JS intégrée", "yellow");

  try {
    // Validation builds locaux
    validateBuilds();

    // Déploiement en phases séparées
    deployOptimizedV2();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=================================", "cyan");
    log(`🎉 DÉPLOIEMENT V2 RÉUSSI en ${duration}s`, "green");
    log("📍 Landing: https://dev.melyia.com", "white");
    log("📍 App: https://app-dev.melyia.com", "white");
    log("🛠️ Permissions CSS/JS automatiquement corrigées", "yellow");
    log("🔧 Backend automatiquement préservé", "white");
    log("=================================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=================================", "cyan");
    log(`💥 ERREUR V2 après ${duration}s`, "red");
    log(`💡 Erreur: ${error.message}`, "yellow");
    log("🔧 Essayer npm run security:deploy comme alternative", "yellow");
    log("=================================", "cyan");

    process.exit(1);
  }
}

main();
