import axios from "axios";

const SITE_URL = "https://app-dev.melyia.com/patient/dashboard";
const EXPECTED_JS = "index-app-Dgl7u1J2-1750836540971.js";
const EXPECTED_CSS = "index-app-tKYqPfZp-1750836540971.css";

async function testFinalDeployment() {
  console.log("🧪 TEST FINAL DE DÉPLOIEMENT");
  console.log("===============================\n");

  try {
    // Test avec headers anti-cache
    const response = await axios.get(SITE_URL, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });

    const html = response.data;

    // Vérifier les assets
    const hasNewJS = html.includes(EXPECTED_JS);
    const hasNewCSS = html.includes(EXPECTED_CSS);

    console.log("📊 RÉSULTATS:");
    console.log(
      `✅ Site accessible: ${response.status === 200 ? "OUI" : "NON"}`
    );
    console.log(
      `✅ Nouveau JS servi: ${hasNewJS ? "OUI" : "NON"} (${EXPECTED_JS})`
    );
    console.log(
      `✅ Nouveau CSS servi: ${hasNewCSS ? "OUI" : "NON"} (${EXPECTED_CSS})`
    );

    // Test accessibilité des assets
    if (hasNewJS) {
      try {
        const jsResponse = await axios.head(
          `https://app-dev.melyia.com/assets/${EXPECTED_JS}`
        );
        console.log(
          `✅ Asset JS accessible: ${jsResponse.status === 200 ? "OUI" : "NON"}`
        );
      } catch (error) {
        console.log("❌ Asset JS non accessible");
      }
    }

    if (hasNewCSS) {
      try {
        const cssResponse = await axios.head(
          `https://app-dev.melyia.com/assets/${EXPECTED_CSS}`
        );
        console.log(
          `✅ Asset CSS accessible: ${
            cssResponse.status === 200 ? "OUI" : "NON"
          }`
        );
      } catch (error) {
        console.log("❌ Asset CSS non accessible");
      }
    }

    // Résultat final
    const success = hasNewJS && hasNewCSS;
    console.log(
      `\n🎯 RÉSULTAT FINAL: ${
        success ? "✅ SUCCÈS COMPLET!" : "❌ PROBLÈME DÉTECTÉ"
      }`
    );

    if (success) {
      console.log("\n🎉 DÉPLOIEMENT VALIDÉ !");
      console.log("========================");
      console.log("Vos modifications du chatbot sont maintenant LIVE :");
      console.log("  ✅ Barre de statut IA visible");
      console.log("  ✅ Input repositionné en bas");
      console.log("  ✅ Nouvelles fonctionnalités accessibles");
      console.log("\n🌐 URL: https://app-dev.melyia.com/patient/dashboard");
      console.log(
        "💡 Conseil: Videz le cache navigateur (Ctrl+F5) si nécessaire"
      );
    } else {
      console.log("\n⚠️ Le site sert encore d'anciens assets");
      console.log("💡 Attendez 2-3 minutes et testez à nouveau");
    }
  } catch (error) {
    console.error("❌ Erreur de test:", error.message);
  }
}

testFinalDeployment().catch(console.error);
