// 🚀 DEPLOY LANDING PAGE - Déploie vers dev.melyia.com

import fs from "fs";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    key: process.env.USERPROFILE + "\\.ssh\\melyia_main",
  },
  PATHS: {
    local: "dist/landing",
    remote: "/var/www/melyia/dev-site",
  },
};

const log = (message, color = "cyan") => {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
};

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
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT LANDING PAGE - DÉMARRAGE", "green");
  log("=====================================");

  try {
    // Vérifier que le build existe
    if (!fs.existsSync(CONFIG.PATHS.local)) {
      throw new Error(
        `Build landing non trouvé: ${CONFIG.PATHS.local}. Exécutez "npm run build:landing" d'abord.`
      );
    }

    const sshCmd = `ssh -i "${CONFIG.SSH.key}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;
    const scpCmd = `scp -i "${CONFIG.SSH.key}" -r ${CONFIG.PATHS.local}/* ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${CONFIG.PATHS.remote}/`;

    // Créer le dossier distant si nécessaire
    executeCommand(
      `${sshCmd} "mkdir -p ${CONFIG.PATHS.remote}"`,
      "Création dossier distant"
    );

    // Copier les fichiers
    executeCommand(scpCmd, "Upload fichiers landing page");

    // Corriger les permissions
    executeCommand(
      `${sshCmd} "sudo chown -R www-data:www-data ${CONFIG.PATHS.remote} && sudo chmod -R 644 ${CONFIG.PATHS.remote}/* && sudo find ${CONFIG.PATHS.remote} -type d -exec chmod 755 {} +"`,
      "Correction permissions"
    );

    // Validation
    try {
      executeCommand(
        'curl -s -o /dev/null -w "%{http_code}" https://dev.melyia.com',
        "Validation déploiement"
      );
    } catch (error) {
      log("⚠️ Warning: Validation partielle", "yellow");
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=====================================");
    log(`🎉 LANDING PAGE DÉPLOYÉE en ${duration}s`, "green");
    log("📍 URL: https://dev.melyia.com");
  } catch (error) {
    log("=====================================");
    log(`💥 ERREUR DÉPLOIEMENT: ${error.message}`, "red");
    process.exit(1);
  }
}

deployLanding();
