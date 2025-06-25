// test-chatbot-dynamic-config.mjs - Test intégration dynamique LLM v30
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

// Couleurs pour les logs
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function loginPatient() {
  try {
    log("blue", "🔐 Connexion patient pour test chatbot...");

    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "patient@melyia.com",
      password: "test123",
    });

    if (response.data.success) {
      log("green", "✅ Connexion patient réussie");
      return {
        token: response.data.token,
        userId: response.data.user.id,
      };
    }

    throw new Error("Login failed: " + JSON.stringify(response.data));
  } catch (error) {
    log("red", "❌ Erreur connexion patient:");
    console.error(error.response?.data || error.message);
    return null;
  }
}

async function loginAdmin() {
  try {
    log("blue", "🔐 Connexion admin pour modifier config...");

    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (response.data.success) {
      log("green", "✅ Connexion admin réussie");
      return response.data.token;
    }

    throw new Error("Login failed: " + JSON.stringify(response.data));
  } catch (error) {
    log("red", "❌ Erreur connexion admin:");
    console.error(error.response?.data || error.message);
    return null;
  }
}

async function getCurrentLLMConfig(adminToken) {
  try {
    const response = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error(
      "Erreur récupération config:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function updateLLMConfig(adminToken, newConfig) {
  try {
    const response = await axios.put(
      `${API_BASE}/admin/llm-config`,
      newConfig,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error(
      "Erreur mise à jour config:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testChatWithConfig(
  patientToken,
  patientId,
  configName,
  expectedConfig
) {
  try {
    log("cyan", `\n🤖 Test chatbot avec configuration "${configName}"...`);

    const message = "Bonjour, j'ai une petite question sur l'hygiène dentaire.";

    const startTime = Date.now();
    const response = await axios.post(
      `${API_BASE}/chat`,
      {
        message: message,
        patientId: patientId,
      },
      {
        headers: { Authorization: `Bearer ${patientToken}` },
        timeout: 60000, // 60 secondes
      }
    );

    const responseTime = Date.now() - startTime;

    if (response.data.success) {
      log("green", `✅ Chatbot répondu en ${responseTime}ms`);

      const metadata = response.data.metadata;
      console.log("📋 Métadonnées de réponse:");
      console.log(`   • Architecture: ${metadata.architecture}`);
      console.log(`   • Modèle: ${metadata.model}`);
      console.log(`   • Config utilisée:`);
      console.log(`     - Température: ${metadata.configUsed.temperature}`);
      console.log(`     - Max Tokens: ${metadata.configUsed.maxTokens}`);
      console.log(`     - Keep Alive: ${metadata.configUsed.keepAlive}`);
      console.log(`     - Timeout: ${metadata.configUsed.timeout}`);
      console.log(`   • Temps traitement: ${metadata.processingTime}`);
      console.log(`   • Intent détecté: ${metadata.intent}`);

      // Vérification que la config dynamique est bien utilisée
      const configValid =
        metadata.architecture === "OLLAMA_DYNAMIC_CONFIG" &&
        metadata.configUsed.temperature === expectedConfig.temperature &&
        metadata.configUsed.maxTokens === expectedConfig.maxTokens;

      if (configValid) {
        log("green", "✅ Configuration dynamique correctement appliquée");
        return true;
      } else {
        log("red", "❌ Configuration dynamique non appliquée correctement");
        console.log("   Attendu:", expectedConfig);
        console.log("   Reçu:", metadata.configUsed);
        return false;
      }
    } else {
      log("red", "❌ Erreur chatbot:", response.data.error);
      return false;
    }
  } catch (error) {
    log("red", `❌ Erreur test chatbot (${configName}):`);
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function runDynamicConfigTests() {
  console.log("🚀 === TEST INTÉGRATION DYNAMIQUE LLM CHATBOT v30 ===\n");

  // Connexions
  const adminToken = await loginAdmin();
  const patientAuth = await loginPatient();

  if (!adminToken || !patientAuth) {
    log("red", "❌ Impossible de continuer sans authentification");
    return;
  }

  const { token: patientToken, userId: patientId } = patientAuth;

  // Récupérer config actuelle
  log("blue", "\n📋 Récupération de la configuration actuelle...");
  const originalConfig = await getCurrentLLMConfig(adminToken);

  if (!originalConfig) {
    log("red", "❌ Impossible de récupérer la configuration actuelle");
    return;
  }

  console.log("🔧 Configuration originale:");
  console.log(`   • Température: ${originalConfig.temperature}`);
  console.log(`   • Max Tokens: ${originalConfig.maxTokens}`);
  console.log(`   • Model: ${originalConfig.modelName}`);

  const results = {
    configOriginal: false,
    configModified1: false,
    configModified2: false,
    configRestored: false,
  };

  // Test 1: Chatbot avec config originale
  results.configOriginal = await testChatWithConfig(
    patientToken,
    patientId,
    "Configuration Originale",
    {
      temperature: originalConfig.temperature,
      maxTokens: originalConfig.maxTokens,
    }
  );

  // Test 2: Modifier config et tester
  log(
    "blue",
    "\n🔧 Modification de la configuration (température + tokens)..."
  );
  const config1 = {
    temperature: 0.8, // Plus créatif
    maxTokens: 150, // Plus long
  };

  const updated1 = await updateLLMConfig(adminToken, config1);
  if (updated1) {
    log(
      "green",
      `✅ Config modifiée - Temp: ${config1.temperature}, Tokens: ${config1.maxTokens}`
    );
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Attendre 2s

    results.configModified1 = await testChatWithConfig(
      patientToken,
      patientId,
      "Configuration Créative",
      config1
    );
  }

  // Test 3: Autre modification
  log(
    "blue",
    "\n🔧 Deuxième modification (température basse + tokens courts)..."
  );
  const config2 = {
    temperature: 0.1, // Plus déterministe
    maxTokens: 50, // Plus court
  };

  const updated2 = await updateLLMConfig(adminToken, config2);
  if (updated2) {
    log(
      "green",
      `✅ Config modifiée - Temp: ${config2.temperature}, Tokens: ${config2.maxTokens}`
    );
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Attendre 2s

    results.configModified2 = await testChatWithConfig(
      patientToken,
      patientId,
      "Configuration Déterministe",
      config2
    );
  }

  // Test 4: Restaurer config originale
  log("blue", "\n🔄 Restauration de la configuration originale...");
  const restored = await updateLLMConfig(adminToken, {
    temperature: originalConfig.temperature,
    maxTokens: originalConfig.maxTokens,
  });

  if (restored) {
    log("green", "✅ Configuration restaurée");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Attendre 2s

    results.configRestored = await testChatWithConfig(
      patientToken,
      patientId,
      "Configuration Restaurée",
      {
        temperature: originalConfig.temperature,
        maxTokens: originalConfig.maxTokens,
      }
    );
  }

  // Résumé final
  console.log("\n🎯 === RÉSUMÉ DES TESTS DYNAMIQUES ===");
  Object.entries(results).forEach(([test, success]) => {
    const status = success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${test}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(
    `\n📊 Taux de réussite: ${passedTests}/${totalTests} (${successRate}%)`
  );

  if (passedTests === totalTests) {
    log("green", "\n🎉 TOUS LES TESTS DYNAMIQUES PASSÉS !");
    log("green", "🚀 L'intégration dynamique LLM est 100% opérationnelle !");
    log(
      "cyan",
      "✨ Le chatbot utilise maintenant les paramètres configurables en temps réel !"
    );
  } else {
    log("red", `\n⚠️  ${totalTests - passedTests} test(s) échoué(s)`);
    log("yellow", "🔧 Vérification de l'intégration nécessaire");
  }

  return results;
}

// Exécution des tests
runDynamicConfigTests().catch(console.error);
