// 🚀 SCRIPT DÉPLOIEMENT ULTRA-OPTIMISÉ
// Une seule connexion SSH pour éviter la protection anti-brute force

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    connectTimeout: 45,
    execTimeout: 180000, // 3 minutes pour toute l'opération
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

function executeSSHMegaCommand(
  command,
  description,
  timeout = CONFIG.SSH.execTimeout
) {
  try {
    log(`🚀 ${description}...`, "cyan");
    console.log(`📝 Commande groupée : ${command.length} caractères`);

    const result = execSync(command, {
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    });

    log(`✅ ${description} - SUCCÈS TOTAL`, "green");
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

function deployEverythingInOneShot() {
  const timestamp = Date.now();
  const { landing, app } = CONFIG.PATHS;

  log("🎯 DÉPLOIEMENT MONO-CONNEXION SSH", "magenta");
  log("=================================", "magenta");

  // PHASE 1 : Upload des fichiers (2 connexions séparées car SCP)
  log("📤 PHASE 1: Upload des builds...", "blue");

  const scpLanding = `scp -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -r ${landing.local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:/tmp/landing-${timestamp}/`;
  const scpApp = `scp -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -r ${app.local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:/tmp/app-${timestamp}/`;

  executeSSHMegaCommand(scpLanding, "Upload landing", 90000);
  executeSSHMegaCommand(scpApp, "Upload application", 90000);

  // PHASE 2 : Toutes les opérations serveur en UNE SEULE connexion SSH
  log("🔧 PHASE 2: Installation complète en une connexion...", "blue");

  const megaCommand = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "
    echo '🚀 DÉBUT DÉPLOIEMENT ULTRA-OPTIMISÉ' &&
    
    # === PRÉPARATION LANDING ===
    echo '🏠 Préparation landing...' &&
    [ -d ${landing.remote} ] && sudo mv ${landing.remote} ${landing.remote}-backup-${timestamp} || true &&
    sudo mkdir -p ${landing.remote} &&
    
    # === INSTALLATION LANDING ===
    echo '🏠 Installation landing...' &&
    sudo cp -r /tmp/landing-${timestamp}/* ${landing.remote}/ &&
    sudo chown -R www-data:www-data ${landing.remote} &&
    sudo chmod -R 644 ${landing.remote}/* &&
    sudo find ${landing.remote} -type d -exec chmod 755 {} + &&
    rm -rf /tmp/landing-${timestamp} &&
    
    # === PRÉPARATION APP (avec sauvegarde backend) ===
    echo '💼 Préparation app + sauvegarde backend...' &&
    mkdir -p /tmp/backend-backup-${timestamp} &&
    [ -f ${app.remote}/server.js ] && cp ${app.remote}/server.js /tmp/backend-backup-${timestamp}/ || true &&
    [ -f ${app.remote}/package.json ] && cp ${app.remote}/package.json /tmp/backend-backup-${timestamp}/ || true &&
    [ -d ${app.remote} ] && sudo mv ${app.remote} ${app.remote}-backup-${timestamp} || true &&
    sudo mkdir -p ${app.remote} &&
    
    # === INSTALLATION APP ===
    echo '💼 Installation app...' &&
    sudo cp -r /tmp/app-${timestamp}/* ${app.remote}/ &&
    
    # === RESTAURATION BACKEND ===
    echo '🔧 Restauration backend...' &&
    [ -f /tmp/backend-backup-${timestamp}/server.js ] && sudo cp /tmp/backend-backup-${timestamp}/server.js ${app.remote}/ || true &&
    [ -f /tmp/backend-backup-${timestamp}/package.json ] && sudo cp /tmp/backend-backup-${timestamp}/package.json ${app.remote}/ || true &&
    
    # === CONFIGURATION LIENS ET PERMISSIONS ===
    echo '🔗 Configuration liens et permissions...' &&
    cd ${app.remote} && sudo ln -sf index-app.html index.html &&
    sudo chown -R www-data:www-data ${app.remote} &&
    sudo chmod -R 644 ${app.remote}/index*.html &&
    
    # === CORRECTION PERMISSIONS ASSETS (CRITIQUE) ===
    echo '🛠️ Correction permissions assets CSS/JS...' &&
    sudo chmod -R 755 ${app.remote}/assets &&
    sudo chmod -R 644 ${app.remote}/assets/* &&
    sudo find ${app.remote}/assets -type d -exec chmod 755 {} + &&
    sudo chown -R www-data:www-data ${app.remote}/assets &&
    
    # === NETTOYAGE ===
    echo '🧹 Nettoyage...' &&
    rm -rf /tmp/app-${timestamp} &&
    rm -rf /tmp/backend-backup-${timestamp} &&
    sudo rm -rf ${landing.remote}-backup-${timestamp} || true &&
    sudo rm -rf ${app.remote}-backup-${timestamp} || true &&
    
    # === VALIDATION FINALE ===
    echo '✅ Validation finale...' &&
    ls -la ${landing.remote}/ | head -3 &&
    ls -la ${app.remote}/ | head -3 &&
    ls -la ${app.remote}/assets/ | head -3 &&
    
    echo '🎉 DÉPLOIEMENT ULTRA-OPTIMISÉ TERMINÉ'
  "`;

  executeSSHMegaCommand(
    megaCommand,
    "Installation complète mono-connexion",
    180000
  );
}

function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT ULTRA-OPTIMISÉ", "green");
  log("=============================", "cyan");
  log("🎯 UNE connexion SSH pour éviter anti-brute force", "yellow");
  log("🛠️ Correction permissions CSS/JS intégrée", "yellow");

  try {
    // Validation builds locaux
    validateBuilds();

    // Déploiement mono-connexion
    deployEverythingInOneShot();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=============================", "cyan");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("📍 Landing: https://dev.melyia.com", "white");
    log("📍 App: https://app-dev.melyia.com", "white");
    log("⚡ AUCUNE protection brute force déclenchée", "yellow");
    log("🛠️ Permissions CSS/JS automatiquement corrigées", "yellow");
    log("🔧 Backend automatiquement préservé", "white");
    log("=============================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=============================", "cyan");
    log(`💥 ERREUR après ${duration}s`, "red");
    log(`💡 Erreur: ${error.message}`, "yellow");
    log("🔧 Si timeout, attendre 10 minutes et relancer", "yellow");
    log("=============================", "cyan");

    process.exit(1);
  }
}

main();
