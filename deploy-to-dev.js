import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

/**
 * 🚀 DÉPLOIEMENT CURSOR → DEV.MELYIA.COM (VERSION CORRIGÉE)
 *
 * CORRECTIONS v20.1 :
 * - Configuration selon infrastructure réelle
 * - Port et endpoints corrigés pour landing page
 */

// Configuration corrigée pour landing
const CONFIG = {
  SERVER_URL: "https://dev.melyia.com",
  WEBHOOK_ENDPOINT: "/hooks/deploy", // Endpoint corrigé selon infrastructure
  WEBHOOK_TOKEN:
    "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410",
  BUILD_COMMAND: "npm run build:landing",
  BUILD_DIR: "./dist/landing",
  TARGET_PATH: "/var/www/melyia/dev/frontend", // Chemin pour landing page
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
 * Build du projet avant déploiement
 */
async function buildProject() {
  try {
    log("🔨 Build Vite Landing...", "blue");

    const { spawn } = await import("child_process");

    return new Promise((resolve, reject) => {
      const buildProcess = spawn("npm", ["run", "build:landing"], {
        stdio: "pipe",
        shell: true,
      });

      let output = "";
      buildProcess.stdout.on("data", (data) => {
        output += data.toString();
        process.stdout.write(data);
      });

      buildProcess.stderr.on("data", (data) => {
        output += data.toString();
        process.stderr.write(data);
      });

      buildProcess.on("close", (code) => {
        if (code === 0) {
          log("✅ Build réussi !", "green");
          resolve(true);
        } else {
          log(`❌ Build échoué avec le code ${code}`, "red");
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  } catch (error) {
    log(`❌ Erreur build: ${error.message}`, "red");
    return false;
  }
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
        type: "landing",
      })
    );

    // Ajout de tous les fichiers
    for (const file of files) {
      form.append("files", fs.createReadStream(file.path), {
        filename: file.relativePath,
        contentType: getMimeType(file.name),
      });
    }

    // Requête de déploiement
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
  log("\n🚀 === DÉPLOIEMENT CURSOR → DEV.MELYIA.COM v20.1 ===\n", "blue");
  log("🔧 Configuration corrigée pour landing page", "cyan");

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

    log(`📁 Fichiers à déployer depuis ${CONFIG.BUILD_DIR}/`, "blue");
    files.forEach((f) => log(`   - ${f.relativePath}`, "white"));

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

// ✅ AUTO-EXÉCUTION GARANTIE (style v23.0.0-PERENNE)
console.log("🔄 Démarrage script de déploiement landing...");
main().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
