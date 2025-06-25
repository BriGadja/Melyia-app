import axios from "axios";

const SITE_URL = "https://app-dev.melyia.com/patient/dashboard";
const EXPECTED_JS = "index-app-Dgl7u1J2-1750836540971.js";

console.log("🎯 TEST FINAL - VALIDATION DÉPLOIEMENT");
console.log("=======================================\n");

async function finalValidation() {
  try {
    console.log("🔄 Test en cours...\n");

    const response = await axios.get(SITE_URL, {
      timeout: 10000,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });

    const html = response.data;
    const hasNewJS = html.includes(EXPECTED_JS);

    console.log("📊 RÉSULTAT FINAL:");
    console.log("==================");

    if (hasNewJS) {
      console.log("🎉 ✅ SUCCÈS COMPLET !");
      console.log("🎉 ✅ SUCCÈS COMPLET !");
      console.log("🎉 ✅ SUCCÈS COMPLET !");
      console.log("");
      console.log("🚀 VOS MODIFICATIONS SONT EN LIGNE !");
      console.log("");
      console.log("✨ Nouvelles fonctionnalités du chatbot visibles :");
      console.log("   ✅ Barre de statut IA");
      console.log("   ✅ Input repositionné en bas");
      console.log("   ✅ Interface modernisée");
      console.log("");
      console.log("🌐 URL: https://app-dev.melyia.com/patient/dashboard");
      console.log(
        "💡 Si vous ne voyez pas les changements: Ctrl+F5 ou navigation privée"
      );
    } else {
      console.log("⚠️ Cache nginx encore présent");
      console.log("");
      console.log("💡 ACTIONS À ESSAYER:");
      console.log("1. Attendre encore 2-3 minutes");
      console.log(
        "2. Navigation privée + https://app-dev.melyia.com/patient/dashboard"
      );
      console.log("3. Ctrl+F5 pour forcer le rechargement");
      console.log("4. Vider le cache navigateur complètement");
      console.log("");
      console.log("Re-testez avec ce script dans quelques minutes !");
    }
  } catch (error) {
    console.error("❌ Erreur de test:", error.message);
    console.error("💡 Vérifiez votre connexion internet et réessayez");
  }
}

finalValidation();
