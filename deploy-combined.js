// 🚀 SCRIPT DEPLOIEMENT COMBINE - MELYIA v25.0
// Déploie Landing Page + Application en une seule commande

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    key: null, // Utiliser la clé SSH par défaut
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
    const result = execSync(command, { encoding: "utf8" });
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

  const sshCmd = `ssh ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;
  const scpCmd = `scp -r ${localPath}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${remotePath}/`;

  // Créer le dossier distant et corriger les permissions AVANT la copie
  executeCommand(
    `${sshCmd} "sudo mkdir -p ${remotePath} && sudo chown -R ubuntu:ubuntu ${remotePath} && sudo chmod -R 755 ${remotePath}"`,
    "Préparation dossier distant landing"
  );

  // Copier les fichiers
  executeCommand(scpCmd, "Upload fichiers landing page");

  // Corriger les permissions finales pour www-data
  executeCommand(
    `${sshCmd} "sudo chown -R www-data:www-data ${remotePath} && sudo chmod -R 644 ${remotePath}/* && sudo find ${remotePath} -type d -exec chmod 755 {} +"`,
    "Correction permissions landing"
  );
}

async function deployApp() {
  const localPath = CONFIG.PATHS.app.local;
  const remotePath = CONFIG.PATHS.app.remote;

  if (!fs.existsSync(localPath)) {
    throw new Error(`Dossier build app non trouvé: ${localPath}`);
  }

  const sshCmd = `ssh ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  // 🛡️ PROTECTION BACKEND : Sauvegarde avant déploiement
  executeCommand(
    `${sshCmd} "
      # Sauvegarde backend si existe
      if [ -d ${remotePath} ]; then
        mkdir -p /tmp/backend-backup-combined &&
        cd ${remotePath} &&
        [ -f server.js ] && cp server.js /tmp/backend-backup-combined/ || true &&
        [ -f package.json ] && cp package.json /tmp/backend-backup-combined/ || true &&
        [ -d node_modules ] && cp -r node_modules /tmp/backend-backup-combined/ || true
      fi"`,
    "Sauvegarde backend"
  );

  // Créer dossier temporaire pour upload
  const tempRemote = `/tmp/app-upload-combined`;
  executeCommand(
    `${sshCmd} "mkdir -p ${tempRemote}"`,
    "Création dossier temporaire"
  );

  // Upload vers dossier temporaire
  const scpCmd = `scp -r ${localPath}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempRemote}/`;
  executeCommand(scpCmd, "Upload fichiers application");

  // Installation avec protection backend
  executeCommand(
    `${sshCmd} "
      # Préparation dossier final
      sudo mkdir -p ${remotePath} &&
      
      # Nettoyage sélectif (garde les fichiers backend)
      sudo find ${remotePath} -maxdepth 1 -name 'index*.html' -delete 2>/dev/null || true &&
      sudo rm -rf ${remotePath}/assets 2>/dev/null || true &&
      
      # Installation nouveau frontend
      sudo cp -r ${tempRemote}/* ${remotePath}/ &&
      
      # Restauration backend
      [ -f /tmp/backend-backup-combined/server.js ] && sudo cp /tmp/backend-backup-combined/server.js ${remotePath}/ || true &&
      [ -f /tmp/backend-backup-combined/package.json ] && sudo cp /tmp/backend-backup-combined/package.json ${remotePath}/ || true &&
      [ -d /tmp/backend-backup-combined/node_modules ] && sudo cp -r /tmp/backend-backup-combined/node_modules ${remotePath}/ || true &&
      
      # Permissions frontend uniquement
      sudo chown -R www-data:www-data ${remotePath}/assets ${remotePath}/index*.html 2>/dev/null || true &&
      sudo chmod -R 644 ${remotePath}/index*.html 2>/dev/null || true &&
      sudo chmod -R 644 ${remotePath}/assets/* 2>/dev/null || true &&
      sudo find ${remotePath}/assets -type d -exec chmod 755 {} + 2>/dev/null || true &&
      
      # Lien symbolique
      cd ${remotePath} &&
      sudo ln -sf index-app.html index.html &&
      sudo chown -h www-data:www-data index.html &&
      
      # Nettoyage
      rm -rf ${tempRemote} /tmp/backend-backup-combined
    "`,
    "Installation app avec protection backend"
  );
}

async function validateDeployment() {
  try {
    log("🔍 Validation du déploiement...");

    // Test landing page
    executeCommand(
      'curl -s -o /dev/null -w "%{http_code}" https://dev.melyia.com',
      "Test landing page"
    );

    // Test application
    executeCommand(
      'curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com',
      "Test application"
    );

    log("✅ Validation réussie", "green");
  } catch (error) {
    log(`⚠️ Warning: Validation partielle - ${error.message}`, "yellow");
  }
}

async function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT COMBINÉ MELYIA - DÉMARRAGE", "green");
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

    // Validation
    await validateDeployment();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=====================================");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("📍 Landing: https://dev.melyia.com");
    log("📍 App: https://app-dev.melyia.com");
  } catch (error) {
    log("=====================================");
    log(`💥 ERREUR DÉPLOIEMENT: ${error.message}`, "red");
    process.exit(1);
  }
}

main();
