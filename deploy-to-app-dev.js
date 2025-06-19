/**
 * 🚀 SCRIPT DÉPLOIEMENT ROBUSTE VERS APP-DEV.MELYIA.COM
 * Version corrigée avec auto-exécution garantie
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  WEBHOOK_URL: "https://app-dev.melyia.com/hooks/deploy",
  WEBHOOK_TOKEN:
    "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410",
  BUILD_DIR: "dist/app",
  TIMEOUT: 60000, // 60 secondes
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
 * Collecte récursive des fichiers
 */
function collectFiles(dir, files = [], basePath = "") {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = basePath ? path.join(basePath, item) : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        collectFiles(fullPath, files, relativePath);
      } else {
        files.push({
          fullPath,
          relativePath: relativePath.replace(/\\/g, "/"), // Unix paths
          size: stat.size,
        });
      }
    }

    return files;
  } catch (error) {
    throw new Error(`Erreur lecture fichiers: ${error.message}`);
  }
}

/**
 * Fonction principale de déploiement
 */
async function deployToAppDev() {
  log("\n🚀 === DÉPLOIEMENT APP-DEV.MELYIA.COM ===", "blue");

  const startTime = Date.now();

  try {
    // 1. Vérifications initiales
    log("📋 Vérifications initiales...", "blue");

    const buildDir = path.join(__dirname, CONFIG.BUILD_DIR);

    if (!fs.existsSync(buildDir)) {
      throw new Error(`Répertoire build introuvable: ${buildDir}`);
    }

    // Recherche du fichier index (app.html ou index.html)
    const indexFiles = ["index-app.html", "index.html"];
    let indexPath = null;

    for (const indexFile of indexFiles) {
      const testPath = path.join(buildDir, indexFile);
      if (fs.existsSync(testPath)) {
        indexPath = testPath;
        break;
      }
    }

    if (!indexPath) {
      throw new Error(
        "Aucun fichier index trouvé (index-app.html ou index.html)"
      );
    }

    log(`✅ Build trouvé: ${buildDir}`, "green");
    log(`✅ Index trouvé: ${path.basename(indexPath)}`, "green");

    // 2. Collecte des fichiers
    log("📁 Collecte des fichiers...", "blue");

    const files = collectFiles(buildDir);

    if (files.length === 0) {
      throw new Error("Aucun fichier trouvé dans le build");
    }

    log(`📦 ${files.length} fichiers collectés:`, "green");
    files.forEach((file) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      log(`   - ${file.relativePath} (${sizeKB} KB)`, "cyan");
    });

    // 3. Conversion index-app.html → index.html si nécessaire
    log("🔄 Traitement fichier index...", "blue");

    const indexFile = files.find((f) => f.relativePath === "index-app.html");
    if (indexFile) {
      // Créer une copie en tant qu'index.html
      const indexContent = fs.readFileSync(indexFile.fullPath, "utf8");
      const tempIndexPath = path.join(buildDir, "index.html");
      fs.writeFileSync(tempIndexPath, indexContent);

      files.push({
        fullPath: tempIndexPath,
        relativePath: "index.html",
        size: fs.statSync(tempIndexPath).size,
      });

      log("✅ index-app.html → index.html créé", "green");
    }

    // 4. Préparation FormData
    log("📤 Préparation de l'upload...", "blue");

    const formData = new FormData();

    for (const file of files) {
      const stream = fs.createReadStream(file.fullPath);
      formData.append("files", stream, {
        filename: file.relativePath,
        contentType: getMimeType(file.relativePath),
      });
    }

    log(
      `📡 Upload de ${files.length} fichiers vers ${CONFIG.WEBHOOK_URL}...`,
      "blue"
    );

    // 5. Envoi au webhook avec gestion d'erreurs robuste
    const response = await axios.post(CONFIG.WEBHOOK_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Webhook-Token": CONFIG.WEBHOOK_TOKEN,
      },
      timeout: CONFIG.TIMEOUT,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // 6. Traitement de la réponse
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (response.status === 200) {
      log("✅ Déploiement réussi !", "green");
      log(`📊 Temps: ${duration}s`, "yellow");
      log("📋 Réponse serveur:", "blue");
      console.log(JSON.stringify(response.data, null, 2));
      log("\n🌐 Application disponible sur:", "green");
      log("   https://app-dev.melyia.com", "cyan");
      log("\n💡 Testez la connexion admin:", "yellow");
      log("   Email: brice@melyia.com", "cyan");
      log("   Mot de passe: password", "cyan");
    } else {
      throw new Error(`Status HTTP: ${response.status}`);
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log(`❌ Erreur déploiement (${duration}s):`, "red");

    if (error.response) {
      // Erreur HTTP
      log(`   Status: ${error.response.status}`, "red");
      log(`   Message: ${error.response.statusText}`, "red");

      if (error.response.data) {
        log("   Détails serveur:", "red");
        console.error(error.response.data);
      }
    } else if (error.request) {
      // Erreur réseau
      log("   Erreur réseau - Webhook inaccessible", "red");
      log("   Vérifiez la connectivité vers app-dev.melyia.com", "yellow");
    } else if (error.code === "ECONNABORTED") {
      // Timeout
      log("   Timeout - Upload trop lent", "red");
      log("   Essayez de réduire la taille des fichiers", "yellow");
    } else {
      // Autre erreur
      log(`   ${error.message}`, "red");
    }

    log("\n🔧 Actions de dépannage:", "yellow");
    log("   1. Vérifiez que le serveur est en ligne", "cyan");
    log("   2. Testez: curl https://app-dev.melyia.com/api/health", "cyan");
    log("   3. Vérifiez les logs serveur: pm2 logs melyia-auth-dev", "cyan");

    process.exit(1);
  }
}

/**
 * Détermine le type MIME d'un fichier
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
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

// ✅ AUTO-EXÉCUTION GARANTIE - Version corrigée
console.log("🔄 Démarrage script de déploiement...");
deployToAppDev().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
