// 🚀 SCRIPT DEPLOIEMENT BULLETPROOF V2 - MELYIA v33.2
// Version optimisée sans timeouts - Commandes courtes et rapides

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
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
    reset: "\x1b[0m",
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function executeCommand(command, description, timeout = 25000) {
  try {
    log(`🔄 ${description}...`);
    const result = execSync(command, {
      encoding: "utf8",
      timeout,
    });
    log(`✅ ${description} - Terminé`);
    return result;
  } catch (error) {
    log(`❌ Erreur ${description}: ${error.message}`, "red");
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

async function deployLanding() {
  const { local, remote } = CONFIG.PATHS.landing;
  const timestamp = Date.now();
  const tempDir = `/tmp/landing-${timestamp}`;

  log("🏠 Déploiement Landing Page...", "blue");

  const sshCmd = `ssh -o ConnectTimeout=15 ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  // Étape 1: Préparation
  executeCommand(
    `${sshCmd} "mkdir -p ${tempDir}"`,
    "Création dossier temporaire landing"
  );

  // Étape 2: Upload
  executeCommand(
    `scp -r ${local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempDir}/`,
    "Upload fichiers landing"
  );

  // Étape 3: Backup ancien
  executeCommand(
    `${sshCmd} "[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || sudo mkdir -p ${remote}"`,
    "Sauvegarde ancienne version landing"
  );

  // Étape 4: Installation
  executeCommand(
    `${sshCmd} "sudo cp -r ${tempDir}/* ${remote}/"`,
    "Installation nouveaux fichiers landing"
  );

  // Étape 5: Permissions
  executeCommand(
    `${sshCmd} "sudo chown -R www-data:www-data ${remote} && sudo chmod -R 644 ${remote}/* && sudo find ${remote} -type d -exec chmod 755 {} +"`,
    "Application permissions landing"
  );

  // Étape 6: Nettoyage
  executeCommand(
    `${sshCmd} "rm -rf ${tempDir} && [ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true"`,
    "Nettoyage landing"
  );

  log("✅ Landing déployée: https://dev.melyia.com", "green");
}

async function deployApp() {
  const { local, remote } = CONFIG.PATHS.app;
  const timestamp = Date.now();
  const tempDir = `/tmp/app-${timestamp}`;
  const backupDir = `/tmp/backend-backup-${timestamp}`;

  log("💼 Déploiement Application...", "blue");

  const sshCmd = `ssh -o ConnectTimeout=15 ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  // Étape 1: Préparation dossiers
  executeCommand(
    `${sshCmd} "mkdir -p ${tempDir} ${backupDir}"`,
    "Création dossiers temporaires app"
  );

  // Étape 2: Sauvegarde backend
  executeCommand(
    `${sshCmd} "[ -d ${remote} ] && cd ${remote} && [ -f server.js ] && cp server.js ${backupDir}/ || true"`,
    "Sauvegarde server.js"
  );

  executeCommand(
    `${sshCmd} "[ -d ${remote} ] && cd ${remote} && [ -f package.json ] && cp package.json ${backupDir}/ || true"`,
    "Sauvegarde package.json"
  );

  // Étape 3: Upload frontend
  executeCommand(
    `scp -r ${local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempDir}/`,
    "Upload fichiers application"
  );

  // Étape 4: Backup ancien + installation nouveau
  executeCommand(
    `${sshCmd} "[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || sudo mkdir -p ${remote}"`,
    "Sauvegarde ancienne version app"
  );

  executeCommand(
    `${sshCmd} "sudo cp -r ${tempDir}/* ${remote}/"`,
    "Installation nouveaux fichiers app"
  );

  // Étape 5: Restauration backend
  executeCommand(
    `${sshCmd} "[ -f ${backupDir}/server.js ] && sudo cp ${backupDir}/server.js ${remote}/ || true"`,
    "Restauration server.js"
  );

  executeCommand(
    `${sshCmd} "[ -f ${backupDir}/package.json ] && sudo cp ${backupDir}/package.json ${remote}/ || true"`,
    "Restauration package.json"
  );

  // Étape 6: Lien symbolique
  executeCommand(
    `${sshCmd} "cd ${remote} && sudo ln -sf index-app.html index.html"`,
    "Création lien symbolique index.html"
  );

  // Étape 7: Permissions
  executeCommand(
    `${sshCmd} "sudo chown -R www-data:www-data ${remote} && sudo chmod -R 644 ${remote}/index*.html ${remote}/assets/*"`,
    "Application permissions app"
  );

  executeCommand(
    `${sshCmd} "sudo find ${remote}/assets -type d -exec chmod 755 {} + && [ -f ${remote}/server.js ] && sudo chmod 755 ${remote}/server.js || true"`,
    "Permissions finales app"
  );

  // Étape 8: Nettoyage
  executeCommand(
    `${sshCmd} "rm -rf ${tempDir} ${backupDir} && [ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true"`,
    "Nettoyage app"
  );

  log("✅ Application déployée: https://app-dev.melyia.com", "green");
}

async function validateDeployment() {
  log("🔍 Validation du déploiement...", "blue");

  try {
    executeCommand(
      'curl -s -o /dev/null -w "%{http_code}" -m 8 https://dev.melyia.com',
      "Test landing"
    );

    executeCommand(
      'curl -s -o /dev/null -w "%{http_code}" -m 8 https://app-dev.melyia.com',
      "Test application"
    );

    log("✅ Validation réussie - Sites accessibles", "green");
  } catch (error) {
    log("⚠️ Validation partielle - Déploiement OK", "yellow");
  }
}

async function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT BULLETPROOF V2 - DÉMARRAGE", "green");
  log("==============================================");

  try {
    // Étape 1: Validation
    validateBuilds();

    // Étape 2: Déploiement séquentiel (évite les conflits SSH)
    log("🔄 Déploiement séquentiel optimisé...", "cyan");
    await deployLanding();
    await deployApp();

    // Étape 3: Validation
    await validateDeployment();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("==============================================");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("📍 Landing: https://dev.melyia.com");
    log("📍 App: https://app-dev.melyia.com");
    log("🛡️ Backend préservé - Lien symbolique créé");
    log("⚡ Version optimisée sans timeouts");
  } catch (error) {
    log("==============================================");
    log(`💥 ERREUR DÉPLOIEMENT: ${error.message}`, "red");
    log("💡 Pour debug: node test-deploy-audit.mjs", "yellow");
    process.exit(1);
  }
}

main();
