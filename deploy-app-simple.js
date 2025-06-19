const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Configuration
const WEBHOOK_URL = "https://app-dev.melyia.com/hooks/deploy";
const WEBHOOK_TOKEN =
  "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410";
const BUILD_DIR = path.join(__dirname, "dist", "app");

console.log("🚀 DÉPLOIEMENT APP-DEV.MELYIA.COM");
console.log("=====================================");

async function deploy() {
  try {
    console.log("📋 1. Vérifications...");

    // Vérifier que le répertoire existe
    if (!fs.existsSync(BUILD_DIR)) {
      throw new Error(`Répertoire build introuvable: ${BUILD_DIR}`);
    }
    console.log(`✅ Build trouvé: ${BUILD_DIR}`);

    // Vérifier index.html
    const indexPath = path.join(BUILD_DIR, "index.html");
    if (!fs.existsSync(indexPath)) {
      throw new Error("index.html introuvable");
    }
    console.log("✅ index.html trouvé");

    console.log("\n📁 2. Collecte des fichiers...");

    // Collecter tous les fichiers récursivement
    const files = [];

    function collectFiles(dir, basePath = "") {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = basePath ? path.join(basePath, item) : item;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          collectFiles(fullPath, relativePath);
        } else {
          files.push({
            fullPath,
            relativePath: relativePath.replace(/\\/g, "/"),
            size: stat.size,
          });
        }
      }
    }

    collectFiles(BUILD_DIR);

    console.log(`📦 ${files.length} fichiers collectés:`);
    files.forEach((file) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      console.log(`   - ${file.relativePath} (${sizeKB} KB)`);
    });

    console.log("\n📤 3. Préparation upload...");

    // Créer FormData
    const formData = new FormData();

    for (const file of files) {
      console.log(`   Ajout: ${file.relativePath}`);
      const stream = fs.createReadStream(file.fullPath);
      formData.append("files", stream, file.relativePath);
    }

    console.log("\n🌐 4. Envoi au serveur...");
    console.log(`   URL: ${WEBHOOK_URL}`);
    console.log(`   Token: ${WEBHOOK_TOKEN.substring(0, 8)}...`);

    // Envoi avec axios
    const response = await axios.post(WEBHOOK_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Webhook-Token": WEBHOOK_TOKEN,
      },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log("\n✅ 5. Succès !");
    console.log(`   Status: ${response.status}`);
    console.log("   Réponse:", response.data);
    console.log("\n🌐 Application disponible:");
    console.log("   https://app-dev.melyia.com");
    console.log("\n🔐 Test connexion admin:");
    console.log("   Email: brice@melyia.com");
    console.log("   Mot de passe: password");
  } catch (error) {
    console.error("\n❌ ERREUR DÉPLOIEMENT:");

    if (error.response) {
      console.error(`   Status HTTP: ${error.response.status}`);
      console.error(`   Message: ${error.response.statusText}`);
      if (error.response.data) {
        console.error("   Détails:", error.response.data);
      }
    } else if (error.request) {
      console.error("   Erreur réseau - serveur inaccessible");
      console.error("   Vérifiez: curl https://app-dev.melyia.com/api/health");
    } else {
      console.error(`   ${error.message}`);
    }

    console.error("\n🔧 DÉPANNAGE:");
    console.error("   1. Vérifiez PM2: pm2 status");
    console.error("   2. Vérifiez logs: pm2 logs melyia-auth-dev");
    console.error("   3. Test API: curl https://app-dev.melyia.com/api/health");

    process.exit(1);
  }
}

// Vérification des dépendances
try {
  require.resolve("axios");
  require.resolve("form-data");
} catch (err) {
  console.error("❌ Dépendances manquantes:");
  console.error("   npm install axios form-data");
  process.exit(1);
}

// Lancement
deploy();
