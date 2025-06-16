#!/usr/bin/env node

/**
 * 🚀 SCRIPT DÉPLOIEMENT CURSOR → DEV.MELYIA.COM
 * Adapté pour la configuration Vite multi-app de Melyia
 */

import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

// Configuration corrigée pour votre projet Cursor
const CONFIG = {
  WEBHOOK_URL: "https://dev.melyia.com/hooks/deploy",
  WEBHOOK_TOKEN:
    "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410",
  BUILD_COMMAND: "npm run build:landing", // ✅ Correction 1: commande spécifique
  BUILD_DIR: "dist/landing", // ✅ Correction 2: répertoire correct
  TIMEOUT: 300000,
};

// Couleurs console
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 1. Build du projet Vite en mode landing
 */
async function buildProject() {
  log("🏗️  Démarrage du build Vite Landing...", "blue");

  try {
    // Nettoyer l'ancien build
    if (await fs.pathExists(CONFIG.BUILD_DIR)) {
      await fs.remove(CONFIG.BUILD_DIR);
      log(`🧹 Ancien build supprimé: ${CONFIG.BUILD_DIR}`, "yellow");
    }

    // Lancer le build spécifique landing
    log(`⚙️  Commande: ${CONFIG.BUILD_COMMAND}`, "blue");
    execSync(CONFIG.BUILD_COMMAND, {
      stdio: "inherit",
      timeout: CONFIG.TIMEOUT,
    });

    // Vérifier le résultat
    if (!(await fs.pathExists(CONFIG.BUILD_DIR))) {
      throw new Error(`Dossier build non trouvé: ${CONFIG.BUILD_DIR}`);
    }

    // Vérifier index.html
    const indexPath = path.join(CONFIG.BUILD_DIR, "index.html");
    if (!(await fs.pathExists(indexPath))) {
      throw new Error("index.html non trouvé dans le build");
    }

    // ✅ Correction 3: Vérifier que le bouton "Se connecter" est présent
    const indexContent = await fs.readFile(indexPath, "utf8");
    if (
      indexContent.includes("Se connecter") ||
      indexContent.includes("connecter")
    ) {
      log("✅ Bouton 'Se connecter' détecté dans le build", "green");
    } else {
      log(
        "⚠️  ATTENTION: Bouton 'Se connecter' non trouvé dans le build",
        "yellow"
      );
    }

    log("✅ Build Vite Landing terminé avec succès !", "green");
    return true;
  } catch (error) {
    log(`❌ Erreur build: ${error.message}`, "red");
    return false;
  }
}

/**
 * 2. Collecte récursive des fichiers
 */
async function collectFiles() {
  log("📁 Collecte des fichiers buildés...", "blue");

  try {
    const files = [];

    // Fonction récursive pour parcourir le dossier
    async function scanDirectory(dir, relativePath = "") {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const itemRelativePath = path.join(relativePath, item);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          // Dossier : récursion
          await scanDirectory(fullPath, itemRelativePath);
        } else {
          // Fichier : ajouter à la liste
          const content = await fs.readFile(fullPath);
          const normalizedPath = itemRelativePath.replace(/\\/g, "/"); // Unix path

          files.push({
            name: normalizedPath,
            content: content,
            size: stats.size,
          });
        }
      }
    }

    await scanDirectory(CONFIG.BUILD_DIR);

    log(`📦 ${files.length} fichiers collectés`, "green");

    // Afficher la liste des fichiers
    files.forEach((file) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      log(`   - ${file.name} (${sizeKB} KB)`, "cyan");
    });

    return files;
  } catch (error) {
    log(`❌ Erreur collecte: ${error.message}`, "red");
    return null;
  }
}

/**
 * 3. Envoi au webhook dev.melyia.com
 */
async function deployToServer(files) {
  log("🚀 Déploiement vers dev.melyia.com...", "blue");

  try {
    // Créer FormData
    const form = new FormData();

    // Ajouter tous les fichiers
    files.forEach((file) => {
      form.append("files", file.content, {
        filename: file.name,
        contentType: getMimeType(file.name),
      });
    });

    // ✅ Correction 4: Header webhook corrigé
    log(`📡 Envoi de ${files.length} fichiers...`, "blue");
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: {
        "X-Webhook-Token": CONFIG.WEBHOOK_TOKEN, // Correction header
        ...form.getHeaders(),
      },
      body: form,
      timeout: CONFIG.TIMEOUT,
    });

    // ✅ Correction 5: Gérer réponse texte et JSON
    let result;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const textResult = await response.text();
      result = { message: textResult };
    }

    if (response.ok) {
      log("✅ Déploiement réussi !", "green");
      log(`📊 Détails:`, "blue");
      log(`   - Status: ${response.status}`, "yellow");
      log(`   - Fichiers déployés: ${files.length}`, "yellow");
      if (result.deployPath) {
        log(`   - Path serveur: ${result.deployPath}`, "yellow");
      }
      if (result.backupPath) {
        log(`   - Backup créé: ${path.basename(result.backupPath)}`, "yellow");
      }

      log("\n🌐 Votre landing page est maintenant disponible sur:", "green");
      log("   https://dev.melyia.com", "cyan");
      log(
        "\n💡 Conseil: Videz le cache navigateur (Ctrl+F5) si pas de changement",
        "yellow"
      );

      return true;
    } else {
      log(
        `❌ Erreur serveur (${response.status}): ${
          result.error || result.message
        }`,
        "red"
      );
      if (result.details) {
        log(`   Détails: ${result.details}`, "red");
      }
      return false;
    }
  } catch (error) {
    log(`❌ Erreur déploiement: ${error.message}`, "red");
    return false;
  }
}

/**
 * Utilitaire : déterminer le MIME type
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * 🚀 FONCTION PRINCIPALE
 */
async function main() {
  log("\n🚀 === DÉPLOIEMENT CURSOR → DEV.MELYIA.COM ===\n", "blue");

  const startTime = Date.now();

  try {
    // 1. Build Vite Landing
    const buildSuccess = await buildProject();
    if (!buildSuccess) {
      process.exit(1);
    }

    // 2. Collecte fichiers
    const files = await collectFiles();
    if (!files || files.length === 0) {
      log("❌ Aucun fichier à déployer", "red");
      process.exit(1);
    }

    // 3. Déploiement
    const deploySuccess = await deployToServer(files);
    if (!deploySuccess) {
      process.exit(1);
    }

    // 4. Succès !
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\n🎉 Déploiement terminé en ${duration}s !`, "green");
    log(
      "🔧 Prochaine étape : Tester votre landing page sur dev.melyia.com",
      "yellow"
    );
  } catch (error) {
    log(`\n💥 Erreur fatale: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Lancement du script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
