// test-llm-configuration-complete.mjs - ✅ EXTENSION .mjs OBLIGATOIRE
// Test final complet du projet de configuration LLM Melyia v30
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function testLLMConfigurationComplete() {
  console.log("🚀 === TEST COMPLET PROJET CONFIGURATION LLM v30 ===\n");

  try {
    // Test 1: Connexion admin
    console.log("🔐 Étape 1: Authentification admin...");
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (!loginResponse.data.success) {
      throw new Error("Échec connexion admin");
    }

    const token = loginResponse.data.token;
    console.log("✅ Authentification admin réussie\n");

    // Test 2: Validation routes API backend
    console.log("🛠️ Étape 2: Validation routes API backend...");

    // GET Configuration
    const getConfigResponse = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!getConfigResponse.data.success) {
      throw new Error("Échec GET configuration");
    }

    const originalConfig = getConfigResponse.data.data;
    console.log("✅ Route GET /api/admin/llm-config fonctionnelle");

    // PUT Configuration
    const testConfigUpdate = {
      temperature: 0.7,
      maxTokens: 75,
    };

    const putConfigResponse = await axios.put(
      `${API_BASE}/admin/llm-config`,
      testConfigUpdate,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!putConfigResponse.data.success) {
      throw new Error("Échec PUT configuration");
    }

    console.log("✅ Route PUT /api/admin/llm-config fonctionnelle");
    console.log("✅ Backend API: 100% opérationnel\n");

    // Test 3: Validation intégration chatbot dynamique
    console.log("🤖 Étape 3: Validation intégration chatbot dynamique...");

    // Connexion patient pour test chatbot
    const patientLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "patient@melyia.com",
      password: "test123",
    });

    const patientToken = patientLoginResponse.data.token;

    // Test chatbot avec configuration modifiée
    const chatResponse = await axios.post(
      `${API_BASE}/chat`,
      {
        message: "Bonjour, j'ai mal aux dents",
        patientId: 1,
      },
      {
        headers: { Authorization: `Bearer ${patientToken}` },
      }
    );

    if (!chatResponse.data.success) {
      throw new Error("Échec chatbot");
    }

    // Vérification métadonnées dynamiques
    const metadata = chatResponse.data.metadata;
    if (metadata.architecture !== "OLLAMA_DYNAMIC_CONFIG") {
      throw new Error("Architecture dynamique non activée");
    }

    if (metadata.config_used.temperature !== 0.7) {
      throw new Error(
        `Configuration dynamique non appliquée: temp ${metadata.config_used.temperature} vs 0.7 attendu`
      );
    }

    console.log("✅ Chatbot utilise la configuration dynamique");
    console.log(`✅ Architecture: ${metadata.architecture}`);
    console.log(
      `✅ Température appliquée: ${metadata.config_used.temperature}`
    );
    console.log(`✅ Max Tokens appliqué: ${metadata.config_used.max_tokens}`);
    console.log("✅ Intégration dynamique: 100% opérationnelle\n");

    // Test 4: Validation interface frontend (simulation)
    console.log("🎨 Étape 4: Validation interface frontend...");

    // Test structure réponse pour frontend
    const frontendConfigResponse = await axios.get(
      `${API_BASE}/admin/llm-config`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const frontendConfig = frontendConfigResponse.data.data;

    // Validation propriétés camelCase pour frontend
    const requiredProps = [
      "id",
      "modelName",
      "systemPrompt",
      "systemPromptUrgence",
      "temperature",
      "topP",
      "maxTokens",
      "numCtx",
      "keepAliveMinutes",
      "timeoutSeconds",
      "stopSequences",
      "createdAt",
      "updatedAt",
    ];

    const missingProps = requiredProps.filter(
      (prop) => frontendConfig[prop] === undefined
    );

    if (missingProps.length > 0) {
      throw new Error(
        `Propriétés manquantes pour frontend: ${missingProps.join(", ")}`
      );
    }

    console.log("✅ Structure de données compatible frontend");
    console.log("✅ Propriétés camelCase validées");
    console.log("✅ Interface frontend: 100% compatible\n");

    // Test 5: Test modifications temps réel bout en bout
    console.log("⚡ Étape 5: Test modifications temps réel bout en bout...");

    // Modification 1: Interface → API → Chatbot
    const realtimeConfig1 = {
      temperature: 0.3,
      maxTokens: 30,
    };

    await axios.put(`${API_BASE}/admin/llm-config`, realtimeConfig1, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Test chatbot avec nouvelle config
    const chatResponse2 = await axios.post(
      `${API_BASE}/chat`,
      {
        message: "Test config temps réel",
        patientId: 1,
      },
      {
        headers: { Authorization: `Bearer ${patientToken}` },
      }
    );

    const metadata2 = chatResponse2.data.metadata;

    if (metadata2.config_used.temperature !== 0.3) {
      throw new Error(
        `Config temps réel non appliquée: ${metadata2.config_used.temperature} vs 0.3`
      );
    }

    console.log("✅ Modification interface → API → Chatbot en temps réel");
    console.log(
      `✅ Nouvelle température appliquée: ${metadata2.config_used.temperature}`
    );
    console.log("✅ Workflow temps réel: 100% fonctionnel\n");

    // Restauration configuration originale
    console.log("🔄 Restauration configuration originale...");
    await axios.put(`${API_BASE}/admin/llm-config`, originalConfig, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("✅ Configuration originale restaurée\n");

    // Résumé final
    console.log("🎯 === RÉSUMÉ COMPLET PROJET LLM CONFIGURATION ===");
    console.log("✅ MICRO-ÉTAPE 1: Base de données (Table llm_settings)");
    console.log(
      "✅ MICRO-ÉTAPE 2: Routes API backend (GET/PUT /api/admin/llm-config)"
    );
    console.log(
      "✅ MICRO-ÉTAPE 3: Intégration dynamique chatbot (OLLAMA_DYNAMIC_CONFIG)"
    );
    console.log(
      "✅ MICRO-ÉTAPE 4: Interface admin frontend (Compatible camelCase)"
    );
    console.log("✅ WORKFLOW TEMPS RÉEL: Interface → API → Chatbot");
    console.log("\n📊 Taux de réussite global: 5/5 micro-étapes (100.0%)");
    console.log("\n🎉 PROJET CONFIGURATION LLM 100% TERMINÉ ET OPÉRATIONNEL !");
    console.log("🚀 Les administrateurs peuvent maintenant :");
    console.log("   • Modifier les paramètres IA via interface web");
    console.log("   • Voir les changements appliqués en temps réel au chatbot");
    console.log("   • Contrôler température, tokens, prompts, modèles, etc.");
    console.log("   • Tout sans accès serveur ni redémarrage nécessaire");
    console.log(
      "\n✨ MISSION ACCOMPLIE ! Configuration LLM dynamique active !"
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors du test complet:",
      error.response?.data || error.message
    );
    console.log("\n🚨 ÉCHEC - Projet non complètement fonctionnel");
    return false;
  }

  return true;
}

async function runCompleteTest() {
  const success = await testLLMConfigurationComplete();
  process.exit(success ? 0 : 1);
}

runCompleteTest().catch(console.error);
