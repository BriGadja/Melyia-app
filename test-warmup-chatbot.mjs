// ✅ SCRIPT DE TEST : WARM-UP CHATBOT INTELLIGENT v24
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";
const ADMIN_EMAIL = "brice@melyia.com";
const ADMIN_PASSWORD = "password";

// Fonctions utilitaires
const log = (message, type = "info") => {
  const colors = {
    info: "\x1b[36m", // Cyan
    success: "\x1b[32m", // Vert
    error: "\x1b[31m", // Rouge
    warning: "\x1b[33m", // Jaune
    blue: "\x1b[34m", // Bleu
  };
  console.log(`${colors[type]}${message}\x1b[0m`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Test login admin
async function loginAdmin() {
  try {
    log("🔐 Login admin...", "blue");
    const response = await axios.post(
      `${API_BASE}/auth/login`,
      {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
      { timeout: 10000 }
    );

    if (response.data.success) {
      log(`✅ Login réussi: ${response.data.user.email}`, "success");
      return response.data.token;
    }
    throw new Error("Login failed");
  } catch (error) {
    log(
      `❌ Login error: ${error.response?.data?.message || error.message}`,
      "error"
    );
    return null;
  }
}

// Test status chatbot
async function testChatbotStatus(token) {
  try {
    log("\n📊 Test status chatbot...", "blue");
    const startTime = Date.now();

    const response = await axios.get(`${API_BASE}/chat/status`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });

    const duration = Date.now() - startTime;

    if (response.data.success) {
      log(`✅ Status obtenu en ${duration}ms:`, "success");
      log(`   📊 État: ${response.data.status}`, "info");
      log(
        `   🚦 Prêt: ${response.data.isReady ? "OUI" : "NON"}`,
        response.data.isReady ? "success" : "warning"
      );
      log(`   💬 Message: ${response.data.message}`, "info");
      return response.data;
    }
    throw new Error("Status failed");
  } catch (error) {
    log(
      `❌ Status error: ${error.response?.data?.message || error.message}`,
      "error"
    );
    return null;
  }
}

// Test warm-up chatbot
async function testChatbotWarmup(token) {
  try {
    log("\n🔥 Test warm-up chatbot...", "blue");
    const startTime = Date.now();

    const response = await axios.post(
      `${API_BASE}/chat/warmup`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000, // 20s timeout pour warm-up
      }
    );

    const requestDuration = Date.now() - startTime;

    if (response.data.success) {
      log(`✅ Warm-up terminé en ${requestDuration}ms:`, "success");
      log(`   🚦 Status: ${response.data.status}`, "info");
      log(
        `   ⚡ Instant: ${response.data.isInstant ? "OUI" : "NON"}`,
        response.data.isInstant ? "success" : "info"
      );
      log(`   ⏱️  Temps warm-up: ${response.data.warmupTime || 0}ms`, "info");
      log(`   💬 Message: ${response.data.message}`, "info");
      log(`   👤 User ID: ${response.data.userId}`, "info");
      return response.data;
    }
    throw new Error("Warm-up failed");
  } catch (error) {
    log(
      `❌ Warm-up error: ${error.response?.data?.message || error.message}`,
      "error"
    );
    return null;
  }
}

// Test message rapide après warm-up
async function testFastMessage(token) {
  try {
    log("\n💬 Test message après warm-up...", "blue");
    const startTime = Date.now();

    const response = await axios.post(
      `${API_BASE}/chat`,
      {
        message: "Bonjour, comment allez-vous ?",
        patientId: "1", // Admin ID simulé
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      }
    );

    const duration = Date.now() - startTime;

    if (response.data.success) {
      log(`✅ Réponse rapide en ${duration}ms:`, "success");
      log(
        `   🤖 Réponse: "${response.data.response.substring(0, 100)}..."`,
        "info"
      );
      log(
        `   ⚡ Temps traitement: ${
          response.data.metadata?.processingTime || "N/A"
        }`,
        "info"
      );
      log(
        `   🏗️  Architecture: ${response.data.metadata?.architecture || "N/A"}`,
        "info"
      );
      return { success: true, duration, response: response.data };
    }
    throw new Error("Message failed");
  } catch (error) {
    log(
      `❌ Message error: ${error.response?.data?.message || error.message}`,
      "error"
    );
    return { success: false, error: error.message };
  }
}

// Test performance comparative
async function testPerformanceComparison(token) {
  log("\n🏃 Test performance comparative...", "blue");

  const results = [];

  // Test 3 messages consécutifs
  for (let i = 1; i <= 3; i++) {
    log(`\n   📝 Message ${i}/3...`, "info");
    const result = await testFastMessage(token);
    results.push(result);

    if (i < 3) await sleep(1000); // Pause 1s entre les messages
  }

  // Analyse des résultats
  log("\n📈 ANALYSE PERFORMANCE:", "blue");
  const successCount = results.filter((r) => r.success).length;
  const durations = results.filter((r) => r.success).map((r) => r.duration);

  if (durations.length > 0) {
    const avgDuration = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length
    );
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    log(
      `   ✅ Succès: ${successCount}/3 messages`,
      successCount === 3 ? "success" : "warning"
    );
    log(
      `   ⚡ Temps moyen: ${avgDuration}ms`,
      avgDuration < 5000 ? "success" : "warning"
    );
    log(`   🚀 Plus rapide: ${minDuration}ms`, "info");
    log(`   🐌 Plus lent: ${maxDuration}ms`, "info");

    // Évaluation
    if (avgDuration < 3000) {
      log(`   🎯 EXCELLENT: Chatbot très rapide (≤3s)`, "success");
    } else if (avgDuration < 5000) {
      log(`   👍 BON: Chatbot rapide (≤5s)`, "success");
    } else if (avgDuration < 10000) {
      log(`   ⚠️  ACCEPTABLE: Chatbot correct (≤10s)`, "warning");
    } else {
      log(`   ❌ PROBLÈME: Chatbot trop lent (>10s)`, "error");
    }
  } else {
    log(`   ❌ ÉCHEC COMPLET: Aucun message réussi`, "error");
  }
}

// Test workflow complet
async function testCompleteWorkflow() {
  try {
    log("🚀 TEST WORKFLOW WARM-UP CHATBOT v24", "blue");
    log("=" * 50, "blue");

    // 1. Login
    const token = await loginAdmin();
    if (!token) {
      log("❌ Impossible de continuer sans token", "error");
      return;
    }

    // 2. Status initial
    const initialStatus = await testChatbotStatus(token);

    // 3. Warm-up
    const warmupResult = await testChatbotWarmup(token);

    // 4. Status après warm-up
    await sleep(1000);
    const finalStatus = await testChatbotStatus(token);

    // 5. Test performance
    await testPerformanceComparison(token);

    // 6. Résumé final
    log("\n🎯 RÉSUMÉ FINAL:", "blue");
    log("=" * 30, "blue");

    if (initialStatus) {
      log(
        `Status initial: ${initialStatus.status} (${
          initialStatus.isReady ? "prêt" : "non prêt"
        })`,
        "info"
      );
    }

    if (warmupResult) {
      log(
        `Warm-up: ${warmupResult.success ? "✅ SUCCÈS" : "❌ ÉCHEC"}`,
        warmupResult.success ? "success" : "error"
      );
      if (warmupResult.success) {
        log(
          `   - Type: ${warmupResult.isInstant ? "Instantané" : "Initialisé"}`,
          "info"
        );
        log(`   - Temps: ${warmupResult.warmupTime || 0}ms`, "info");
      }
    }

    if (finalStatus) {
      log(
        `Status final: ${finalStatus.status} (${
          finalStatus.isReady ? "prêt" : "non prêt"
        })`,
        finalStatus.isReady ? "success" : "warning"
      );
    }

    log("\n🔍 POINTS D'AMÉLIORATION:", "blue");
    if (!warmupResult?.success) {
      log("- Vérifier la connectivité Ollama", "warning");
    }
    if (warmupResult?.warmupTime > 10000) {
      log("- Optimiser le temps de warm-up (>10s)", "warning");
    }
    if (!finalStatus?.isReady) {
      log("- Vérifier la persistance du warm-up", "warning");
    }

    log("\n✨ Test terminé !", "success");
  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, "error");
  }
}

// Lancement du test
testCompleteWorkflow().catch(console.error);
