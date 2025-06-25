import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

// Couleurs pour les logs
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function loginAdmin() {
  try {
    log("blue", "🔐 Connexion admin...");

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

async function testGetLLMConfig(token) {
  try {
    log("blue", "\n🤖 Test GET /api/admin/llm-config...");

    const response = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      log("green", "✅ GET Configuration LLM réussie");

      const config = response.data.data;
      console.log("📋 Configuration actuelle:");
      console.log(`   • Model: ${config.modelName}`);
      console.log(`   • Température: ${config.temperature}`);
      console.log(`   • Top P: ${config.topP}`);
      console.log(`   • Max Tokens: ${config.maxTokens}`);
      console.log(`   • Num Ctx: ${config.numCtx}`);
      console.log(`   • Keep Alive: ${config.keepAliveMinutes} min`);
      console.log(`   • Timeout: ${config.timeoutSeconds}s`);
      console.log(
        `   • Dernière MAJ: ${new Date(config.updatedAt).toLocaleString()}`
      );

      return config;
    }

    throw new Error("GET failed: " + JSON.stringify(response.data));
  } catch (error) {
    log("red", "❌ Erreur GET LLM Config:");
    console.error(error.response?.data || error.message);
    return null;
  }
}

async function testPutLLMConfig(token, originalConfig) {
  try {
    log("blue", "\n🔧 Test PUT /api/admin/llm-config...");

    // Modifications de test
    const testUpdates = {
      temperature: 0.15, // Légère modification
      maxTokens: 75, // Augmentation
      keepAliveMinutes: 35, // Changement
    };

    const response = await axios.put(
      `${API_BASE}/admin/llm-config`,
      testUpdates,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      log(
        "green",
        `✅ PUT Configuration LLM réussie - ${response.data.updatedFields} champs modifiés`
      );

      const updatedConfig = response.data.data;
      console.log("📝 Modifications appliquées:");
      console.log(
        `   • Température: ${originalConfig.temperature} → ${updatedConfig.temperature}`
      );
      console.log(
        `   • Max Tokens: ${originalConfig.maxTokens} → ${updatedConfig.maxTokens}`
      );
      console.log(
        `   • Keep Alive: ${originalConfig.keepAliveMinutes} → ${updatedConfig.keepAliveMinutes} min`
      );

      return updatedConfig;
    }

    throw new Error("PUT failed: " + JSON.stringify(response.data));
  } catch (error) {
    log("red", "❌ Erreur PUT LLM Config:");
    console.error(error.response?.data || error.message);
    return null;
  }
}

async function testPutLLMConfigRestore(token, originalConfig) {
  try {
    log("blue", "\n🔄 Test restauration configuration originale...");

    // Restaurer les valeurs originales
    const restoreData = {
      temperature: originalConfig.temperature,
      maxTokens: originalConfig.maxTokens,
      keepAliveMinutes: originalConfig.keepAliveMinutes,
    };

    const response = await axios.put(
      `${API_BASE}/admin/llm-config`,
      restoreData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      log("green", "✅ Restauration configuration réussie");
      console.log("🔄 Configuration restaurée aux valeurs originales");
      return true;
    }

    throw new Error("Restore failed: " + JSON.stringify(response.data));
  } catch (error) {
    log("red", "❌ Erreur restauration config:");
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testPutLLMConfigValidation(token) {
  try {
    log("blue", "\n⚠️  Test validation données invalides...");

    // Test avec température invalide
    const invalidData = {
      temperature: 5.0, // > 2 = invalide
      topP: 1.5, // > 1 = invalide
      maxTokens: -10, // < 1 = invalide
    };

    const response = await axios.put(
      `${API_BASE}/admin/llm-config`,
      invalidData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Si on arrive ici, c'est un problème
    log("red", "❌ ERREUR: Validation échouée - données invalides acceptées");
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      log("green", "✅ Validation correcte - données invalides rejetées");
      console.log("📋 Erreurs de validation:", error.response.data.details);
      return true;
    } else {
      log("red", "❌ Erreur inattendue validation:");
      console.error(error.response?.data || error.message);
      return false;
    }
  }
}

async function testUnauthorizedAccess() {
  try {
    log("blue", "\n🚫 Test accès non autorisé...");

    const response = await axios.get(`${API_BASE}/admin/llm-config`);

    // Si on arrive ici, c'est un problème
    log("red", "❌ ERREUR: Accès non autorisé accepté");
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log("green", "✅ Sécurité correcte - accès non autorisé rejeté");
      return true;
    } else {
      log("red", "❌ Erreur inattendue sécurité:");
      console.error(error.response?.data || error.message);
      return false;
    }
  }
}

async function runAllTests() {
  console.log("🚀 === TEST COMPLET ROUTES LLM CONFIGURATION v30 ===\n");

  const results = {
    login: false,
    getLLMConfig: false,
    putLLMConfig: false,
    restoreConfig: false,
    validation: false,
    security: false,
  };

  // Test 1: Connexion admin
  const token = await loginAdmin();
  results.login = !!token;

  if (!token) {
    log("red", "❌ Arrêt des tests - connexion échouée");
    return results;
  }

  // Test 2: Récupération config
  const originalConfig = await testGetLLMConfig(token);
  results.getLLMConfig = !!originalConfig;

  if (!originalConfig) {
    log("red", "❌ Arrêt des tests - récupération config échouée");
    return results;
  }

  // Test 3: Modification config
  const updatedConfig = await testPutLLMConfig(token, originalConfig);
  results.putLLMConfig = !!updatedConfig;

  // Test 4: Restauration config
  results.restoreConfig = await testPutLLMConfigRestore(token, originalConfig);

  // Test 5: Validation données
  results.validation = await testPutLLMConfigValidation(token);

  // Test 6: Sécurité (accès non autorisé)
  results.security = await testUnauthorizedAccess();

  // Résumé final
  console.log("\n🎯 === RÉSUMÉ DES TESTS ===");
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
    log(
      "green",
      "\n🎉 TOUS LES TESTS PASSÉS - Routes LLM Configuration opérationnelles !"
    );
  } else {
    log(
      "red",
      `\n⚠️  ${
        totalTests - passedTests
      } test(s) échoué(s) - Vérification nécessaire`
    );
  }

  return results;
}

// Exécution des tests
runAllTests().catch(console.error);
