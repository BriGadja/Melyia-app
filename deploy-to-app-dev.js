import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEBHOOK_URL = "https://app-dev.melyia.com/hooks/deploy";
const WEBHOOK_TOKEN =
  "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410";

async function deployToAppDev() {
  try {
    console.log(
      "🚀 Déploiement Application Authentification vers app-dev.melyia.com..."
    );

    const buildDir = path.join(__dirname, "dist/app");

    if (!fs.existsSync(buildDir)) {
      throw new Error(
        "Le répertoire de build n'existe pas. Lancez d'abord npm run build:app"
      );
    }

    const formData = new FormData();

    // Fonction pour ajouter tous les fichiers du répertoire de build
    function addFilesToFormData(dir, relativePath = "") {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          addFilesToFormData(fullPath, path.join(relativePath, file));
        } else {
          const fileStream = fs.createReadStream(fullPath);
          const fileName = relativePath ? path.join(relativePath, file) : file;
          formData.append("files", fileStream, fileName);
        }
      });
    }

    addFilesToFormData(buildDir);

    // Compter les fichiers
    const fileCount = formData.getHeaders()["content-length"]
      ? "multiple"
      : "unknown";
    console.log("📁 Fichiers à déployer depuis dist/app/");

    // Lister les fichiers pour debug
    const files = fs.readdirSync(buildDir);
    files.forEach((file) => {
      const fullPath = path.join(buildDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFiles = fs.readdirSync(fullPath);
        subFiles.forEach((subFile) => {
          console.log("   - " + file + "\\" + subFile);
        });
      } else {
        console.log("   - " + file);
      }
    });

    console.log("📤 Upload vers app-dev.melyia.com...");

    const response = await axios.post(WEBHOOK_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Webhook-Token": WEBHOOK_TOKEN,
      },
      timeout: 30000,
    });

    if (response.status === 200) {
      console.log("✅ Déploiement réussi !");
      console.log("📋 Réponse:", response.data);
      console.log("🌐 Application disponible sur: https://app-dev.melyia.com");
    } else {
      console.log("❌ Erreur déploiement:", response.status);
      console.log("📋 Détails:", response.data);
    }
  } catch (error) {
    console.error(
      "❌ Erreur déploiement:",
      error.response?.status || error.message
    );
    console.error("📋 Détails:", error.response?.data || error.message);
    process.exit(1);
  }
}

deployToAppDev();
