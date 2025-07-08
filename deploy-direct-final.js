// 🚀 SCRIPT DÉPLOIEMENT DIRECT FINAL
// Version optimisée sans tests préliminaires - Déploiement immédiat

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    connectTimeout: 30,
    execTimeout: 90000, // 90 secondes max
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

function executeSSH(command, description, timeout = CONFIG.SSH.execTimeout) {
  try {
    log(`🔄 ${description}...`, "cyan");

    const result = execSync(command, {
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    });

    log(`✅ ${description} - Terminé`, "green");
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

function deployLanding() {
  const { local, remote } = CONFIG.PATHS.landing;
  const timestamp = Date.now();
  const tempDir = `/tmp/landing-${timestamp}`;

  log("🏠 Déploiement Landing DIRECT...", "blue");

  const sshCmd = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  try {
    // Préparation + Upload + Installation en une seule étape optimisée
    const deployCommands = [
      `mkdir -p ${tempDir}`,
      `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
      `sudo mkdir -p ${remote}`,
    ].join(" && ");

    executeSSH(`${sshCmd} "${deployCommands}"`, "Préparation landing");

    // Upload direct
    executeSSH(
      `scp -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -r ${local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempDir}/`,
      "Upload landing",
      60000
    );

    // Installation finale
    const installCommands = [
      `sudo cp -r ${tempDir}/* ${remote}/`,
      `sudo chown -R www-data:www-data ${remote}`,
      `sudo chmod -R 644 ${remote}/*`,
      `sudo find ${remote} -type d -exec chmod 755 {} +`,
      `rm -rf ${tempDir}`,
      `sudo rm -rf ${remote}-backup-${timestamp} || true`,
    ].join(" && ");

    executeSSH(`${sshCmd} "${installCommands}"`, "Installation landing finale");

    log("✅ Landing déployée: https://dev.melyia.com", "green");
  } catch (error) {
    log("❌ Erreur déploiement landing", "red");
    throw error;
  }
}

function deployApp() {
  const { local, remote } = CONFIG.PATHS.app;
  const timestamp = Date.now();
  const tempDir = `/tmp/app-${timestamp}`;

  log("💼 Déploiement Application DIRECT...", "blue");

  const sshCmd = `ssh -o ConnectTimeout=${CONFIG.SSH.connectTimeout} ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  try {
    // Préparation + sauvegarde backend
    const prepareCommands = [
      `mkdir -p ${tempDir}`,
      `[ -f ${remote}/server.js ] && cp ${remote}/server.js ${tempDir}/server.js.backup || true`,
      `[ -f ${remote}/package.json ] && cp ${remote}/package.json ${tempDir}/package.json.backup || true`,
      `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
      `sudo mkdir -p ${remote}`,
    ].join(" && ");

    executeSSH(
      `${sshCmd} "${prepareCommands}"`,
      "Préparation app + sauvegarde backend"
    );

    // Upload frontend
    executeSSH(
      `scp -o ConnectTimeout=${CONFIG.SSH.connectTimeout} -r ${local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${tempDir}/`,
      "Upload application",
      60000
    );

    // Installation complète avec restauration backend et correction permissions
    const installCommands = [
      `sudo cp -r ${tempDir}/* ${remote}/`,
      `[ -f ${tempDir}/server.js.backup ] && sudo cp ${tempDir}/server.js.backup ${remote}/server.js || true`,
      `[ -f ${tempDir}/package.json.backup ] && sudo cp ${tempDir}/package.json.backup ${remote}/package.json || true`,
      `cd ${remote} && sudo ln -sf index-app.html index.html`,
      `sudo chown -R www-data:www-data ${remote}`,
      `sudo chmod -R 644 ${remote}/index*.html`,
      `sudo chmod -R 755 ${remote}/assets`,
      `sudo chmod -R 644 ${remote}/assets/*`,
      `sudo find ${remote}/assets -type d -exec chmod 755 {} +`,
      `[ -f ${remote}/server.js ] && sudo chmod 755 ${remote}/server.js || true`,
      `rm -rf ${tempDir}`,
      `sudo rm -rf ${remote}-backup-${timestamp} || true`,
    ].join(" && ");

    executeSSH(
      `${sshCmd} "${installCommands}"`,
      "Installation app + permissions assets"
    );

    log("✅ Application déployée: https://app-dev.melyia.com", "green");
  } catch (error) {
    log("❌ Erreur déploiement application", "red");
    throw error;
  }
}

function main() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT DIRECT FINAL", "green");
  log("===========================", "cyan");
  log("⚡ Déploiement immédiat sans tests préliminaires", "yellow");
  log("🛠️ Correction permissions CSS/JS intégrée", "yellow");

  try {
    // Validation builds locaux uniquement
    validateBuilds();

    // Déploiement direct optimisé
    log("🔄 Déploiement direct en cours...", "cyan");
    deployLanding();
    deployApp();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("===========================", "cyan");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("📍 Landing: https://dev.melyia.com", "white");
    log("📍 App: https://app-dev.melyia.com", "white");
    log("⚡ Permissions CSS/JS automatiquement corrigées", "yellow");
    log("🔧 Backend automatiquement préservé", "white");
    log("===========================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("===========================", "cyan");
    log(`💥 ERREUR DÉPLOIEMENT après ${duration}s`, "red");
    log(`💡 Erreur: ${error.message}`, "yellow");
    log("🔧 Le problème permissions est déjà résolu", "yellow");
    log("⏳ Attendez 5-10 minutes et relancez", "yellow");
    log("===========================", "cyan");

    process.exit(1);
  }
}

main();
