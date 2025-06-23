import axios from "axios";

const BASE_URL = "https://app-dev.melyia.com";

// Test de performance du chatbot optimisé
async function testPerformanceChatbot() {
  console.log("🚀 TEST DE PERFORMANCE CHATBOT OPTIMISÉ\n");
  console.log("🎯 Objectif: < 10 secondes (vs 83s précédemment)\n");

  try {
    // 1. Test connexion serveur
    console.log("1️⃣ Test connexion serveur...");
    const startServer = Date.now();

    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`, {
        timeout: 10000,
      });
      const serverTime = Date.now() - startServer;
      console.log(`   ✅ Serveur accessible - ${serverTime}ms`);

      // Afficher des infos sur l'architecture
      if (healthResponse.data.architecture) {
        console.log(`   🏗️ Architecture: ${healthResponse.data.architecture}`);
      }
    } catch (error) {
      console.log("   ❌ Serveur inaccessible:", error.message);
      return;
    }

    // 2. Authentification de test
    console.log("\n2️⃣ Test authentification...");
    let authToken = null;
    let userId = null;

    try {
      // Tentative avec compte de test
      const authResponse = await axios.post(
        `${BASE_URL}/api/auth/login`,
        {
          email: "test@example.com",
          password: "password123",
        },
        { timeout: 5000 }
      );

      authToken = authResponse.data.token;
      userId = authResponse.data.user.id;
      console.log("   ✅ Authentification réussie");
    } catch (authError) {
      console.log(
        "   ⚠️ Compte de test non disponible, simulation des données"
      );
      // Simulation pour les tests
      authToken = "simulation-token";
      userId = 1;
    }

    // 3. Test chatbot avec différents types de messages
    const testMessages = [
      {
        name: "Question simple",
        message: "Bonjour, comment allez-vous ?",
        expectedTime: 5000,
      },
      {
        name: "Question médicale",
        message: "J'ai mal aux dents, que dois-je faire ?",
        expectedTime: 8000,
      },
      {
        name: "Question urgence",
        message: "J'ai une douleur urgente à la mâchoire",
        expectedTime: 6000,
      },
    ];

    console.log("\n3️⃣ Tests de performance chatbot...\n");

    const results = [];

    for (let i = 0; i < testMessages.length; i++) {
      const test = testMessages[i];
      console.log(`📝 Test ${i + 1}/3: ${test.name}`);
      console.log(`   Message: "${test.message.substring(0, 50)}..."`);

      const startTime = Date.now();

      try {
        const chatResponse = await axios.post(
          `${BASE_URL}/api/chat`,
          {
            message: test.message,
            patientId: userId,
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            timeout: 20000, // 20s timeout de sécurité
          }
        );

        const responseTime = Date.now() - startTime;

        // Évaluation du résultat
        let status = "🔴 LENT";
        if (responseTime <= 3000) {
          status = "🟢 EXCELLENT";
        } else if (responseTime <= 10000) {
          status = "🟡 ACCEPTABLE";
        }

        console.log(`   ⏱️ Temps: ${responseTime}ms ${status}`);

        // Afficher infos sur la réponse
        if (chatResponse.data.metadata) {
          console.log(`   🧠 IA: ${chatResponse.data.metadata.model || "N/A"}`);
          console.log(
            `   📄 Docs: ${chatResponse.data.metadata.documentsUsed || 0}`
          );
          console.log(
            `   🏗️ Mode: ${chatResponse.data.metadata.architecture || "N/A"}`
          );
        }

        console.log(
          `   💬 Réponse: "${chatResponse.data.response.substring(0, 80)}..."`
        );

        results.push({
          test: test.name,
          time: responseTime,
          status: status,
          success: true,
          response: chatResponse.data.response,
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;
        console.log(`   ❌ Échec après ${responseTime}ms`);
        console.log(`   Erreur: ${error.message}`);

        if (error.response) {
          console.log(`   HTTP: ${error.response.status}`);
        }

        results.push({
          test: test.name,
          time: responseTime,
          status: "❌ ÉCHEC",
          success: false,
          error: error.message,
        });
      }

      console.log(""); // Ligne vide entre les tests

      // Pause entre les tests pour éviter la surcharge
      if (i < testMessages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // 4. Analyse des résultats
    console.log("📊 ANALYSE DES RÉSULTATS:\n");

    const successfulTests = results.filter((r) => r.success);
    const totalTests = results.length;
    const successRate = (successfulTests.length / totalTests) * 100;

    console.log(
      `✅ Taux de succès: ${
        successfulTests.length
      }/${totalTests} (${successRate.toFixed(1)}%)`
    );

    if (successfulTests.length > 0) {
      const times = successfulTests.map((r) => r.time);
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`⏱️ Temps moyen: ${avgTime.toFixed(0)}ms`);
      console.log(`⚡ Plus rapide: ${minTime}ms`);
      console.log(`🐌 Plus lent: ${maxTime}ms`);

      // Évaluation globale
      console.log("\n🎯 ÉVALUATION GLOBALE:");

      if (avgTime <= 3000) {
        console.log("🟢 EXCELLENT - Performance optimale atteinte !");
        console.log("   Le chatbot répond très rapidement (≤3s)");
      } else if (avgTime <= 10000) {
        console.log("🟡 OBJECTIF ATTEINT - Performance acceptable");
        console.log("   Le chatbot répond sous les 10 secondes");
        if (avgTime > 7000) {
          console.log("   💡 Suggestions d'amélioration possibles");
        }
      } else {
        console.log(
          "🔴 OBJECTIF NON ATTEINT - Optimisations supplémentaires nécessaires"
        );
        console.log("   Temps moyen > 10 secondes");
      }

      // Comparaison avec l'ancien système
      const oldTime = 83000; // 83 secondes avant optimisation
      const improvement = ((oldTime - avgTime) / oldTime) * 100;
      console.log(`\n📈 AMÉLIORATION: ${improvement.toFixed(1)}% plus rapide`);
      console.log(
        `   Ancien: ${oldTime / 1000}s → Nouveau: ${(avgTime / 1000).toFixed(
          1
        )}s`
      );
    } else {
      console.log("❌ Aucun test réussi - Problème technique détecté");
    }

    // 5. Recommandations
    console.log("\n💡 RECOMMANDATIONS:");

    if (successRate < 100) {
      console.log("⚠️ Fiabilité:");
      console.log("   - Vérifier les logs serveur pour les erreurs");
      console.log("   - Surveiller la stabilité d'Ollama");
    }

    if (successfulTests.length > 0) {
      const avgTime =
        successfulTests.map((r) => r.time).reduce((a, b) => a + b, 0) /
        successfulTests.length;

      if (avgTime > 5000) {
        console.log("⚡ Performance:");
        console.log("   - Surveiller l'usage mémoire serveur");
        console.log("   - Vérifier si Ollama est bien pré-chargé");
        console.log("   - Considérer un modèle plus léger si nécessaire");
      }
    }

    console.log("\n🔍 Monitoring continu:");
    console.log(
      '   - ssh ubuntu@51.91.145.255 "pm2 logs melyia-auth-dev --lines 20"'
    );
    console.log(
      "   - Tester depuis l'interface web: https://app-dev.melyia.com"
    );
  } catch (error) {
    console.log("\n💥 ERREUR GÉNÉRALE:", error.message);
  }

  console.log("\n🏁 Test terminé");
}

// Exécution du test
testPerformanceChatbot().catch(console.error);
