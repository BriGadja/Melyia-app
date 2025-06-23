import axios from "axios";

const BASE_URL = "https://app-dev.melyia.com";

// Couleurs pour les logs
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test chatbot complet
async function testChatbot() {
  log("🤖 TEST CHATBOT OLLAMA", "blue");
  log("====================", "blue");

  try {
    // 1. Créer un compte pour le test
    const testUser = {
      email: `chatbot-test-${Date.now()}@melyia.com`,
      password: "TestChatbot2025!",
      confirmPassword: "TestChatbot2025!",
      firstName: "Test",
      lastName: "Chatbot",
      role: "patient",
    };

    log("\n📝 Création compte test...", "blue");
    const registerResponse = await axios.post(
      `${BASE_URL}/api/auth/register`,
      testUser
    );
    log(`✅ Compte créé: ${testUser.email}`, "green");

    // 2. Connexion
    log("\n🔑 Connexion...", "blue");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    const token = loginResponse.data.token;
    log(`✅ Token JWT obtenu`, "green");

    // 3. Tests du chatbot avec différentes questions
    const questions = [
      "Bonjour, j'ai mal aux dents, que dois-je faire ?",
      "Combien de fois par jour dois-je me brosser les dents ?",
      "Qu'est-ce qu'une carie dentaire ?",
      "Comment prévenir les problèmes dentaires ?",
    ];

    log("\n💬 Tests chatbot avec Ollama...", "blue");

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      log(`\n❓ Question ${i + 1}: ${question}`, "cyan");

      try {
        const startTime = Date.now();

        const chatResponse = await axios.post(
          `${BASE_URL}/api/chat`,
          {
            message: question,
            patientId: loginResponse.data.user?.id || 1,
          },
          {
            timeout: 60000, // 60 secondes pour Ollama
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        log(`✅ Réponse reçue (${responseTime}ms)`, "green");
        log(
          `📝 Réponse: ${chatResponse.data.response.substring(0, 200)}...`,
          "cyan"
        );

        if (chatResponse.data.sources) {
          log(
            `📚 Sources: ${chatResponse.data.sources.length} documents`,
            "blue"
          );
        }

        if (chatResponse.data.conversationId) {
          log(
            `💾 Sauvegardé: Conversation ${chatResponse.data.conversationId}`,
            "blue"
          );
        }

        // Petite pause entre les questions
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (chatError) {
        log(`❌ Erreur chatbot: ${chatError.message}`, "red");
        if (chatError.response) {
          log(`   Status: ${chatError.response.status}`, "yellow");
          log(
            `   Réponse: ${JSON.stringify(chatError.response.data, null, 2)}`,
            "yellow"
          );
        }
      }
    }

    // 4. Test de performance Ollama
    log("\n⚡ Test performance Ollama...", "blue");
    const perfResults = [];

    for (let i = 0; i < 3; i++) {
      try {
        const start = Date.now();
        await axios.post(
          `${BASE_URL}/api/chat`,
          {
            message: `Test performance ${i + 1}`,
            patientId: loginResponse.data.user?.id || 1,
          },
          {
            timeout: 30000,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const duration = Date.now() - start;
        perfResults.push(duration);
        log(`⏱️  Test ${i + 1}: ${duration}ms`, "cyan");
      } catch (error) {
        log(`❌ Test performance ${i + 1} échoué`, "red");
      }
    }

    if (perfResults.length > 0) {
      const avgTime = perfResults.reduce((a, b) => a + b) / perfResults.length;
      const minTime = Math.min(...perfResults);
      const maxTime = Math.max(...perfResults);

      log(`\n📊 Statistiques Performance:`, "blue");
      log(`   Moyenne: ${avgTime.toFixed(0)}ms`, "cyan");
      log(`   Min: ${minTime}ms`, "green");
      log(`   Max: ${maxTime}ms`, "yellow");

      if (avgTime < 3000) {
        log(`🚀 Performance EXCELLENTE !`, "green");
      } else if (avgTime < 10000) {
        log(`✅ Performance correcte`, "yellow");
      } else {
        log(`⚠️  Performance à optimiser`, "red");
      }
    }
  } catch (error) {
    log(`💥 Erreur critique: ${error.message}`, "red");
    if (error.response) {
      log(`Status: ${error.response.status}`, "yellow");
      log(`Réponse: ${JSON.stringify(error.response.data, null, 2)}`, "yellow");
    }
  }

  log("\n🏁 Test chatbot terminé !", "blue");
}

testChatbot().catch(console.error);
