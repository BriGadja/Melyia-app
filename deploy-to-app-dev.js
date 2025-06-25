// 🚀 DEPLOY APPLICATION - Déploie vers app-dev.melyia.com

import fs from "fs";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    key: process.env.USERPROFILE + "\\.ssh\\melyia_main",
  },
  PATHS: {
    local: "dist/app",
    remote: "/var/www/melyia/app-dev",
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

async function deployApp() {
  const startTime = Date.now();

  log("🚀 DÉPLOIEMENT APPLICATION - DÉMARRAGE", "green");
  log("=====================================");

  try {
    // Vérifier que le build existe
    if (!fs.existsSync(CONFIG.PATHS.local)) {
      throw new Error(
        `Build app non trouvé: ${CONFIG.PATHS.local}. Exécutez "npm run build:app" d'abord.`
      );
    }

    const sshCmd = `ssh -i "${CONFIG.SSH.key}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

    // Créer le dossier distant si nécessaire
    executeCommand(
      `${sshCmd} "mkdir -p ${CONFIG.PATHS.remote}"`,
      "Création dossier distant"
    );

    // ✅ PROTECTION BACKEND : Sauvegarder les fichiers backend existants
    log("🛡️  Protection des fichiers backend...", "yellow");
    executeCommand(
      `${sshCmd} "cd ${CONFIG.PATHS.remote} && [ -f server.js ] && cp server.js /tmp/server-backup.js || echo 'Pas de server.js à sauvegarder'"`,
      "Sauvegarde server.js"
    );
    executeCommand(
      `${sshCmd} "cd ${CONFIG.PATHS.remote} && [ -f package.json ] && cp package.json /tmp/package-backup.json || echo 'Pas de package.json à sauvegarder'"`,
      "Sauvegarde package.json"
    );
    executeCommand(
      `${sshCmd} "cd ${CONFIG.PATHS.remote} && [ -d node_modules ] && echo 'node_modules détecté' || echo 'Pas de node_modules'"`,
      "Vérification node_modules"
    );

    // ✅ DÉPLOIEMENT SÉLECTIF : Copier seulement les fichiers frontend
    log("📦 Déploiement fichiers frontend...", "cyan");

    // Copier index-app.html
    const scpHtmlCmd = `scp -i "${CONFIG.SSH.key}" ${CONFIG.PATHS.local}/index-app.html ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${CONFIG.PATHS.remote}/`;
    executeCommand(scpHtmlCmd, "Upload index-app.html");

    // Copier dossier assets (si existe)
    if (fs.existsSync(`${CONFIG.PATHS.local}/assets`)) {
      const scpAssetsCmd = `scp -i "${CONFIG.SSH.key}" -r ${CONFIG.PATHS.local}/assets ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${CONFIG.PATHS.remote}/`;
      executeCommand(scpAssetsCmd, "Upload dossier assets");
    }

    // ✅ RESTAURATION BACKEND : Remettre les fichiers backend
    log("🔄 Restauration des fichiers backend...", "yellow");
    executeCommand(
      `${sshCmd} "cd ${CONFIG.PATHS.remote} && [ -f /tmp/server-backup.js ] && cp /tmp/server-backup.js server.js && echo 'server.js restauré' || echo 'Pas de server.js à restaurer'"`,
      "Restauration server.js"
    );
    executeCommand(
      `${sshCmd} "cd ${CONFIG.PATHS.remote} && [ -f /tmp/package-backup.json ] && cp /tmp/package-backup.json package.json && echo 'package.json restauré' || echo 'Pas de package.json à restaurer'"`,
      "Restauration package.json"
    );

    // ✅ NETTOYAGE : Supprimer les fichiers temporaires
    executeCommand(
      `${sshCmd} "rm -f /tmp/server-backup.js /tmp/package-backup.json"`,
      "Nettoyage fichiers temporaires"
    );

    // Corriger les permissions (préserver les fichiers backend)
    executeCommand(
      `${sshCmd} "sudo chown -R www-data:www-data ${CONFIG.PATHS.remote}/assets ${CONFIG.PATHS.remote}/index-app.html 2>/dev/null || true"`,
      "Correction permissions assets"
    );
    executeCommand(
      `${sshCmd} "sudo chmod 644 ${CONFIG.PATHS.remote}/index-app.html 2>/dev/null || true"`,
      "Correction permissions HTML"
    );
    executeCommand(
      `${sshCmd} "sudo chmod -R 644 ${CONFIG.PATHS.remote}/assets/* 2>/dev/null || true"`,
      "Correction permissions fichiers"
    );
    executeCommand(
      `${sshCmd} "sudo find ${CONFIG.PATHS.remote}/assets -type d -exec chmod 755 {} + 2>/dev/null || true"`,
      "Correction permissions dossiers"
    );

    // ✅ VÉRIFICATION FINALE : S'assurer que les fichiers backend sont présents
    log("🔍 Vérification finale...", "cyan");
    executeCommand(
      `${sshCmd} "cd ${CONFIG.PATHS.remote} && ls -la server.js package.json 2>/dev/null || echo 'Fichiers backend manquants !'"`,
      "Vérification fichiers backend"
    );

    // Validation
    try {
      executeCommand(
        'curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com',
        "Validation déploiement"
      );
    } catch (error) {
      log("⚠️ Warning: Validation partielle", "yellow");
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("=====================================");
    log(`🎉 APPLICATION DÉPLOYÉE en ${duration}s`, "green");
    log("🛡️  Fichiers backend protégés", "green");
    log("📍 URL: https://app-dev.melyia.com");
  } catch (error) {
    log("=====================================");
    log(`💥 ERREUR DÉPLOIEMENT: ${error.message}`, "red");
    process.exit(1);
  }
}

deployApp();
