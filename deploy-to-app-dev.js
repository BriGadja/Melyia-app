import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

/**
 * 🚀 DÉPLOIEMENT CURSOR → APP-DEV.MELYIA.COM (VERSION CORRIGÉE)
 *
 * CORRECTIONS v20.1 :
 * - Port correct : 8083 (au lieu de 8082)
 * - Endpoint correct : /hooks/deploy (au lieu de /webhook/deploy)
 * - Configuration selon infrastructure réelle
 */

// Configuration corrigée
const CONFIG = {
  SERVER_URL: "https://app-dev.melyia.com",
  WEBHOOK_ENDPOINT: "/hooks/deploy", // Correction : /hooks/ au lieu de /webhook/
  WEBHOOK_TOKEN:
    "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410",
  BUILD_DIR: "./dist/app",
  TARGET_PATH: "/var/www/melyia/app-dev", // Chemin réel selon Nginx
};

/**
 * Utilitaire de logging coloré
 */
function log(message, color = "white") {
  const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[color] || colors.white}${message}${colors.reset}`);
}

/**
 * Collecte récursive des fichiers à déployer
 */
async function collectFiles() {
  const files = [];

  function scanDirectory(dirPath, relativePath = "") {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const itemRelativePath = path
        .join(relativePath, item)
        .replace(/\\/g, "/");

      if (fs.statSync(fullPath).isDirectory()) {
        scanDirectory(fullPath, itemRelativePath);
      } else {
        files.push({
          path: fullPath,
          relativePath: itemRelativePath,
          name: item,
          size: fs.statSync(fullPath).size,
        });
      }
    }
  }

  if (!fs.existsSync(CONFIG.BUILD_DIR)) {
    throw new Error(`Répertoire build introuvable: ${CONFIG.BUILD_DIR}`);
  }

  scanDirectory(CONFIG.BUILD_DIR);
  return files;
}

/**
 * Déploiement vers le serveur
 */
async function deployToServer(files) {
  try {
    log(`📤 Upload vers ${CONFIG.SERVER_URL}...`, "blue");

    const form = new FormData();

    // Métadonnées du déploiement
    form.append(
      "metadata",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        files_count: files.length,
        total_size: files.reduce((sum, f) => sum + f.size, 0),
        source: "cursor-local",
        target: CONFIG.TARGET_PATH,
        version: "20.1.0",
      })
    );

    // Ajout de tous les fichiers
    for (const file of files) {
      form.append("files", fs.createReadStream(file.path), {
        filename: file.relativePath,
        contentType: getMimeType(file.name),
      });
    }

    // Requête de déploiement avec configuration corrigée
    const response = await fetch(
      `${CONFIG.SERVER_URL}${CONFIG.WEBHOOK_ENDPOINT}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CONFIG.WEBHOOK_TOKEN}`,
          ...form.getHeaders(),
        },
        body: form,
      }
    );

    const result = await response.json();

    if (response.ok) {
      log(`✅ Déploiement réussi !`, "green");
      log(`📊 Détails:`, "blue");
      log(`   - Status: ${response.status}`, "yellow");
      log(`   - Fichiers déployés: ${files.length}`, "yellow");
      if (result.deployPath) {
        log(`   - Path serveur: ${result.deployPath}`, "yellow");
      }
      if (result.backupPath) {
        log(`   - Backup créé: ${path.basename(result.backupPath)}`, "yellow");
      }

      log("\n🌐 Votre application est maintenant disponible sur:", "green");
      log("   https://app-dev.melyia.com", "cyan");
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
  log("\n🚀 === DÉPLOIEMENT CURSOR → APP-DEV.MELYIA.COM v20.1 ===\n", "blue");
  log("🔧 Configuration corrigée : Port 8083 + Endpoint /hooks/", "cyan");

  const startTime = Date.now();

  try {
    // 1. Collecte fichiers
    const files = await collectFiles();
    if (!files || files.length === 0) {
      log("❌ Aucun fichier à déployer", "red");
      process.exit(1);
    }

    log(`📁 Fichiers à déployer depuis ${CONFIG.BUILD_DIR}/`, "blue");
    files.forEach((f) => log(`   - ${f.relativePath}`, "white"));

    // 2. Déploiement
    const deploySuccess = await deployToServer(files);
    if (!deploySuccess) {
      process.exit(1);
    }

    // 3. Succès !
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\n🎉 Déploiement terminé en ${duration}s !`, "green");
    log("🔧 Configuration corrigée : Port 8083 + /hooks/ endpoint", "cyan");
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
