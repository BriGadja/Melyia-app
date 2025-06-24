const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

async function deployFixedBackend() {
  try {
    console.log("🚀 [DEPLOY_FIX] Déploiement correction admin backend...");

    // 1. Vérifier que server.js existe
    const serverPath = path.join(__dirname, "server", "backend", "server.js");
    if (!fs.existsSync(serverPath)) {
      throw new Error(`Fichier server.js non trouvé: ${serverPath}`);
    }

    console.log("📁 [DEPLOY_FIX] Fichier server.js trouvé");

    // 2. Créer FormData pour l'upload
    const form = new FormData();

    // Ajouter server.js
    form.append("files", fs.createReadStream(serverPath), {
      filename: "server.js",
      contentType: "application/javascript",
    });

    // Ajouter package.json du backend
    const packagePath = path.join(
      __dirname,
      "server",
      "backend",
      "package.json"
    );
    if (fs.existsSync(packagePath)) {
      form.append("files", fs.createReadStream(packagePath), {
        filename: "package.json",
        contentType: "application/json",
      });
      console.log("📦 [DEPLOY_FIX] package.json inclus");
    }

    console.log("📤 [DEPLOY_FIX] Upload vers le serveur...");

    // 3. Envoyer au webhook de déploiement
    const response = await axios.post(
      "https://app-dev.melyia.com/hooks/deploy",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: "Bearer webhook-secret-key-melyia-2024",
        },
        timeout: 30000,
      }
    );

    console.log("✅ [DEPLOY_FIX] Déploiement réussi:", response.data.message);
    console.log(
      "📊 [DEPLOY_FIX] Fichiers déployés:",
      response.data.files?.length || 0
    );

    // 4. Attendre un peu que le serveur redémarre
    console.log("⏳ [DEPLOY_FIX] Attente redémarrage serveur (10s)...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // 5. Tester la connexion backend
    console.log("🔍 [DEPLOY_FIX] Test connexion backend...");
    try {
      const healthResponse = await axios.get(
        "https://app-dev.melyia.com/api/health",
        {
          timeout: 5000,
        }
      );
      console.log(
        "✅ [DEPLOY_FIX] Backend opérationnel:",
        healthResponse.data.status
      );
    } catch (healthError) {
      console.warn(
        "⚠️ [DEPLOY_FIX] Backend pas encore prêt:",
        healthError.message
      );
    }

    return {
      success: true,
      deployedFiles: response.data.files,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ [DEPLOY_FIX] Erreur déploiement:", error.message);

    if (error.response) {
      console.error("📋 [DEPLOY_FIX] Réponse serveur:", error.response.data);
    }

    throw error;
  }
}

// Exécution
if (require.main === module) {
  deployFixedBackend()
    .then((result) => {
      console.log("🎉 [DEPLOY_FIX] Déploiement terminé avec succès !");
      console.log("📁 [DEPLOY_FIX] Résultat:", JSON.stringify(result, null, 2));

      console.log("\n🔧 [DEPLOY_FIX] PROCHAINES ÉTAPES:");
      console.log("   1. Exécuter: node fix-tables-admin-final.js");
      console.log("   2. Redémarrer PM2: pm2 restart melyia-auth-dev");
      console.log("   3. Tester: http://localhost:5173/admin/dashboard");

      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 [DEPLOY_FIX] Échec déploiement");
      process.exit(1);
    });
}

module.exports = { deployFixedBackend };
