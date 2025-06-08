import fs from "fs";
import path from "path";
import FormData from "form-data";

// Configuration
const WEBHOOK_URL = "https://app-dev.melyia.com/hooks/deploy";
const WEBHOOK_TOKEN =
  "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410";
const DIST_DIR = path.join(process.cwd(), "dist", "app");

async function deployToAppDev() {
  console.log(
    "🚀 Déploiement Application Authentification vers app-dev.melyia.com...",
  );

  try {
    // Vérifier que le build existe
    if (!fs.existsSync(DIST_DIR)) {
      console.error("❌ Erreur: Le dossier dist/app/ n'existe pas.");
      console.log("💡 Exécutez d'abord: npm run build:app");
      process.exit(1);
    }

    // Lister les fichiers à déployer
    const files = fs
      .readdirSync(DIST_DIR, { recursive: true })
      .filter((file) => {
        const filePath = path.join(DIST_DIR, file);
        return fs.statSync(filePath).isFile();
      });

    console.log(`📁 Fichiers à déployer: ${files.length}`);
    files.forEach((file) => console.log(`   - ${file}`));

    // Préparer FormData pour l'upload
    const form = new FormData();

    // Ajouter les fichiers au formulaire
    files.forEach((file) => {
      const filePath = path.join(DIST_DIR, file);
      const fileContent = fs.readFileSync(filePath);

      // Normaliser le chemin
      const normalizedPath = file.replace(/\\/g, "/");

      form.append("files", fileContent, {
        filename: normalizedPath,
        contentType: getContentType(file),
      });
    });

    // Import dynamique de node-fetch
    const { default: fetch } = await import("node-fetch");

    console.log("📤 Upload vers app-dev.melyia.com...");

    // Envoyer la requête
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WEBHOOK_TOKEN}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const result = await response.text();

    if (response.ok) {
      console.log("✅ Déploiement réussi !");
      console.log(`🌐 Application disponible sur: https://app-dev.melyia.com`);
      console.log("📋 Comptes de test:");
      console.log("   👨‍⚕️ Dentiste: dentiste@melyia.com / test123");
      console.log("   👤 Patient: patient@melyia.com / test123");
    } else {
      console.error("❌ Erreur déploiement:", response.status);
      console.error("📋 Détails:", result);
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

// Fonction pour déterminer le Content-Type
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Exécuter le déploiement
deployToAppDev();
