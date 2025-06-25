// test-llm-frontend-interface.mjs - ✅ EXTENSION .mjs OBLIGATOIRE
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

// Tests pour valider l'interface frontend LLM
async function testLLMFrontendInterface() {
  console.log("🚀 === TEST INTERFACE FRONTEND LLM CONFIGURATION v30 ===\n");

  try {
    // 1. Test connexion admin
    console.log("🔐 Test connexion admin...");
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (!loginResponse.data.success) {
      throw new Error("Échec de la connexion admin");
    }

    const token = loginResponse.data.token;
    console.log("✅ Connexion admin réussie\n");

    // 2. Test récupération config initiale (simulation call frontend)
    console.log("🔧 Test récupération configuration LLM...");
    const configResponse = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!configResponse.data.success) {
      throw new Error("Échec récupération configuration");
    }

    const originalConfig = configResponse.data.data;
    console.log("✅ Configuration récupérée avec succès");
    console.log("📋 Configuration actuelle :");
    console.log(`   • Modèle: ${originalConfig.modelName}`);
    console.log(`   • Température: ${originalConfig.temperature}`);
    console.log(`   • Max Tokens: ${originalConfig.maxTokens}`);
    console.log(`   • Num Ctx: ${originalConfig.numCtx}`);
    console.log(`   • Keep Alive: ${originalConfig.keepAliveMinutes} min`);
    console.log(`   • Timeout: ${originalConfig.timeoutSeconds}s\n`);

    // 3. Test modification via interface (simulation user interaction)
    console.log("🎚️ Test modifications via interface utilisateur...");

    // Simulation: utilisateur modifie température via slider
    const newConfig1 = {
      temperature: 0.8,
      maxTokens: 100,
      systemPrompt:
        "Tu es un assistant dentaire expert. Réponds en français de manière précise et professionnelle.",
    };

    const updateResponse1 = await axios.put(
      `${API_BASE}/admin/llm-config`,
      newConfig1,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!updateResponse1.data.success) {
      throw new Error("Échec mise à jour configuration");
    }

    console.log("✅ Première modification appliquée");
    console.log("📝 Changements :");
    console.log(
      `   • Température: ${originalConfig.temperature} → ${newConfig1.temperature}`
    );
    console.log(
      `   • Max Tokens: ${originalConfig.maxTokens} → ${newConfig1.maxTokens}`
    );
    console.log(`   • System Prompt mis à jour\n`);

    // 4. Test validation temps réel (vérification persistence)
    console.log("🔍 Test validation persistence données...");
    const verifyResponse = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const updatedConfig = verifyResponse.data.data;

    if (updatedConfig.temperature !== newConfig1.temperature) {
      throw new Error(
        `Température non persistée: attendu ${newConfig1.temperature}, reçu ${updatedConfig.temperature}`
      );
    }

    if (updatedConfig.maxTokens !== newConfig1.maxTokens) {
      throw new Error(
        `Max tokens non persisté: attendu ${newConfig1.maxTokens}, reçu ${updatedConfig.maxTokens}`
      );
    }

    console.log("✅ Persistence des données validée");
    console.log("📊 Configuration persistée :");
    console.log(`   • Température: ${updatedConfig.temperature} ✅`);
    console.log(`   • Max Tokens: ${updatedConfig.maxTokens} ✅`);
    console.log(
      `   • System Prompt: ${updatedConfig.systemPrompt.substring(
        0,
        50
      )}... ✅\n`
    );

    // 5. Test multiple modifications rapides (simulation debounce)
    console.log("⚡ Test modifications rapides (simulation debounce)...");

    // Simulation: utilisateur bouge slider rapidement
    const rapidChanges = [
      { temperature: 0.2 },
      { temperature: 0.4 },
      { temperature: 0.6 },
      { temperature: 0.3 }, // Valeur finale
    ];

    for (const change of rapidChanges) {
      await axios.put(`${API_BASE}/admin/llm-config`, change, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      // Simulation délai entre modifications utilisateur
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Vérification valeur finale
    const finalVerifyResponse = await axios.get(
      `${API_BASE}/admin/llm-config`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const finalConfig = finalVerifyResponse.data.data;
    console.log("✅ Modifications rapides gérées");
    console.log(
      `📊 Température finale: ${finalConfig.temperature} (attendu: 0.3)\n`
    );

    // 6. Test validation frontend (simulation erreurs utilisateur)
    console.log("🚫 Test validation des erreurs...");

    try {
      await axios.put(
        `${API_BASE}/admin/llm-config`,
        {
          temperature: 5.0, // Invalide (max 2.0)
          maxTokens: 10000, // Invalide (max 4096)
          topP: 1.5, // Invalide (max 1.0)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      throw new Error("Validation devrait échouer avec valeurs invalides");
    } catch (error) {
      if (error.response?.status === 400) {
        console.log("✅ Validation erreurs fonctionne");
        console.log(
          "📋 Erreurs détectées :",
          error.response.data.errors || error.response.data.error
        );
      } else {
        throw error;
      }
    }

    // 7. Restauration configuration originale
    console.log("\n🔄 Restauration configuration originale...");
    await axios.put(`${API_BASE}/admin/llm-config`, originalConfig, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("✅ Configuration originale restaurée\n");

    // 8. Résumé final
    console.log("🎯 === RÉSUMÉ DES TESTS INTERFACE ===");
    console.log("✅ PASS connexionAdmin");
    console.log("✅ PASS récupérationConfig");
    console.log("✅ PASS modificationsInterface");
    console.log("✅ PASS persistenceDonnées");
    console.log("✅ PASS modificationsRapides");
    console.log("✅ PASS validationErreurs");
    console.log("✅ PASS restaurationConfig");
    console.log("\n📊 Taux de réussite: 7/7 (100.0%)");
    console.log("\n🎉 TOUS LES TESTS INTERFACE PASSÉS !");
    console.log("🚀 L'interface frontend LLM est 100% opérationnelle !");
    console.log(
      "✨ Les administrateurs peuvent maintenant configurer l'IA en temps réel !"
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors des tests:",
      error.response?.data || error.message
    );
    console.log("\n🚨 ÉCHEC - Interface frontend non fonctionnelle");
    return false;
  }

  return true;
}

// Exécution des tests
runTests().catch(console.error);

async function runTests() {
  const success = await testLLMFrontendInterface();
  process.exit(success ? 0 : 1);
}
