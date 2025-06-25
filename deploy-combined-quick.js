// 🚀 SCRIPT DEPLOIEMENT RAPIDE - MELYIA v25.0
// Version optimisée sans permissions finales (évite timeouts)

import fs from "fs";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    key: process.env.USERPROFILE + "\\.ssh\\melyia_main",
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
    reset: "\x1b[0m",
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`🔄 ${description}...`);
    const result = execSync(command, { encoding: "utf8", timeout: 30000 }); // Timeout 30s
    log(`✅ ${description} - Terminé`);
    return result;
  } catch (error) {
    log(`❌ Erreur ${description}: ${error.message}`, "red");
    throw error;
  }
}

async function deployLanding() {
  const localPath = CONFIG.PATHS.landing.local;
  const remotePath = CONFIG.PATHS.landing.remote;

  if (!fs.existsSync(localPath)) {
    throw new Error(`Dossier build landing non trouvé: ${localPath}`);
  }

  const sshCmd = `ssh -i "${CONFIG.SSH.key}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;
  const scpCmd = `scp -i "${CONFIG.SSH.key}" -r ${localPath}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${remotePath}/`;

  // Préparation dossier avec permissions pour ubuntu
  executeCommand(
    `${sshCmd} "sudo mkdir -p ${remotePath} && sudo chown -R ubuntu:ubuntu ${remotePath} && sudo chmod -R 755 ${remotePath}"`,
    "Préparation dossier landing"
  );

  // Upload fichiers
  executeCommand(scpCmd, "Upload landing page");

  log(`✅ Landing déployée: https://dev.melyia.com`, "green");
}

async function deployApp() {
  const localPath = CONFIG.PATHS.app.local;
  const remotePath = CONFIG.PATHS.app.remote;

  if (!fs.existsSync(localPath)) {
    throw new Error(`Dossier build app non trouvé: ${localPath}`);
  }

  const sshCmd = `ssh -i "${CONFIG.SSH.key}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;
  const tempRemote = `/tmp/app-upload-quick`;

  // 🛡️ PROTECTION BACKEND : Sauvegarde avant déploiement
  executeCommand(
    `${sshCmd} "
      # Sauvegarde backend si existe
      [ -d ${remotePath} ] && {
        mkdir -p /tmp/backend-backup-quick &&
        cd ${remotePath} &&
        [ -f server.js ] && cp server.js /tmp/backend-backup-quick/ || true &&
        [ -f package.json ] && cp package.json /tmp/backend-backup-quick/ || true
      }
      # Préparation dossier temporaire
      mkdir -p ${tempRemote}
    "`,
    "Sauvegarde backend et préparation"
  );

  // Upload vers temporaire
  const scpCmd = `scp -i "${CONFIG.SSH.key}" -r ${localPath}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempRemote}/`;
  executeCommand(scpCmd, "Upload application");

  // Installation avec protection
  executeCommand(
    `${sshCmd} "
      # Préparation dossier final
      sudo mkdir -p ${remotePath} &&
      sudo chown -R ubuntu:ubuntu ${remotePath} &&
      sudo chmod -R 755 ${remotePath} &&
      
      # Nettoyage sélectif (frontend seulement)
      find ${remotePath} -maxdepth 1 -name 'index*.html' -delete 2>/dev/null || true &&
      rm -rf ${remotePath}/assets 2>/dev/null || true &&
      
      # Installation nouveau frontend
      cp -r ${tempRemote}/* ${remotePath}/ &&
      
      # Restauration backend
      [ -f /tmp/backend-backup-quick/server.js ] && cp /tmp/backend-backup-quick/server.js ${remotePath}/ || true &&
      [ -f /tmp/backend-backup-quick/package.json ] && cp /tmp/backend-backup-quick/package.json ${remotePath}/ || true &&
      
      # Lien symbolique
      cd ${remotePath} && ln -sf index-app.html index.html &&
      
      # Nettoyage
      rm -rf ${tempRemote} /tmp/backend-backup-quick
    "`,
    "Installation app sécurisée"
  );

  log(`✅ Application déployée: https://app-dev.melyia.com`, "green");
}

async function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT RAPIDE MELYIA - DÉMARRAGE", "green");
  log("=====================================");

  try {
    // Vérifier les builds
    if (!fs.existsSync("dist/landing") || !fs.existsSync("dist/app")) {
      throw new Error(
        'Builds manquants. Exécutez "npm run build:both" d\'abord.'
      );
    }

    // Déploiement parallèle
    await Promise.all([deployLanding(), deployApp()]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=====================================");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("📍 Landing: https://dev.melyia.com");
    log("📍 App: https://app-dev.melyia.com");
    log("ℹ️  Permissions basiques appliquées (ubuntu:ubuntu 755)");
  } catch (error) {
    log("=====================================");
    log(`💥 ERREUR DÉPLOIEMENT: ${error.message}`, "red");
    process.exit(1);
  }
}

main();
