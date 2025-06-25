// 🚀 SCRIPT DEPLOIEMENT ULTRA-RAPIDE - MELYIA v30.0
// Version optimisée extrême pour éviter tous les timeouts

import fs from "fs";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    key: process.env.USERPROFILE + "\\.ssh\\melyia_main",
  },
  PATHS: {
    app: {
      local: "dist/app",
      remote: "/var/www/melyia/app-dev",
    },
  },
  TIMEOUT: 20000, // 20 secondes max par commande
};

function log(message, color = "cyan") {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`🔄 ${description}...`);
    const result = execSync(command, {
      encoding: "utf8",
      timeout: CONFIG.TIMEOUT,
      stdio: "pipe", // Évite les problèmes d'output
    });
    log(`✅ ${description} - Terminé`);
    return result;
  } catch (error) {
    if (error.code === "ETIMEDOUT") {
      log(
        `⏰ Timeout ${description} après ${CONFIG.TIMEOUT / 1000}s`,
        "yellow"
      );
    } else {
      log(`❌ Erreur ${description}: ${error.message}`, "red");
    }
    throw error;
  }
}

async function deployAppOnly() {
  const localPath = CONFIG.PATHS.app.local;
  const remotePath = CONFIG.PATHS.app.remote;

  if (!fs.existsSync(localPath)) {
    throw new Error(`Dossier build app non trouvé: ${localPath}`);
  }

  // 🛡️ PROTECTION BACKEND : Upload vers dossier temporaire puis installation sécurisée
  const tempRemote = `/tmp/app-upload-ultra`;

  // 1. Créer dossier temporaire
  const prepareCmdQuick = `ssh -i "${CONFIG.SSH.key}" -o ConnectTimeout=8 ${CONFIG.SSH.user}@${CONFIG.SSH.host} "mkdir -p ${tempRemote}"`;
  executeCommand(prepareCmdQuick, "Préparation upload");

  // 2. Upload vers temporaire
  const scpCmd = `scp -i "${CONFIG.SSH.key}" -o ConnectTimeout=10 -o ServerAliveInterval=5 -r ${localPath}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempRemote}/`;
  executeCommand(scpCmd, "Upload application");

  // 3. Installation rapide avec protection
  const installCmd = `ssh -i "${CONFIG.SSH.key}" -o ConnectTimeout=8 ${CONFIG.SSH.user}@${CONFIG.SSH.host} "
    # Sauvegarde backend express
    [ -f ${remotePath}/server.js ] && cp ${remotePath}/server.js /tmp/server-backup.js || true &&
    [ -f ${remotePath}/package.json ] && cp ${remotePath}/package.json /tmp/package-backup.json || true &&
    
    # Nettoyage frontend seulement
    sudo find ${remotePath} -name 'index*.html' -delete 2>/dev/null || true &&
    sudo rm -rf ${remotePath}/assets 2>/dev/null || true &&
    
    # Installation nouveau frontend
    sudo cp -r ${tempRemote}/* ${remotePath}/ &&
    
    # Restauration backend
    [ -f /tmp/server-backup.js ] && sudo cp /tmp/server-backup.js ${remotePath}/server.js || true &&
    [ -f /tmp/package-backup.json ] && sudo cp /tmp/package-backup.json ${remotePath}/package.json || true &&
    
    # Permissions + lien symbolique
    sudo chown -R www-data:www-data ${remotePath}/assets ${remotePath}/index*.html 2>/dev/null || true &&
    cd ${remotePath} && sudo ln -sf index-app.html index.html &&
    
    # Nettoyage rapide
    rm -rf ${tempRemote} /tmp/server-backup.js /tmp/package-backup.json
  "`;

  executeCommand(installCmd, "Installation sécurisée");

  log(`✅ Application déployée: https://app-dev.melyia.com`, "green");
}

async function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT ULTRA-RAPIDE - DÉMARRAGE", "green");
  log("=====================================");

  try {
    // Vérifier le build app uniquement
    if (!fs.existsSync("dist/app")) {
      throw new Error(
        'Build app manquant. Exécutez "npm run build:app" d\'abord.'
      );
    }

    // Déploiement app uniquement (plus rapide)
    await deployAppOnly();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=====================================");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("📍 App: https://app-dev.melyia.com/patient/dashboard");
    log("ℹ️  Déploiement minimal pour éviter timeouts");
  } catch (error) {
    log("=====================================");
    log(`💥 ERREUR DÉPLOIEMENT: ${error.message}`, "red");

    // Suggestions de récupération
    log("\n🔧 SOLUTIONS POSSIBLES:", "yellow");
    log("1. Vérifier connexion internet", "yellow");
    log("2. Vérifier clé SSH: ~/.ssh/melyia_main", "yellow");
    log("3. Tenter: npm run deploy:fast", "yellow");
    log("4. Ou build + upload manuel", "yellow");

    process.exit(1);
  }
}

main();
