import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginAsRole(email, password, role) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      console.log(`✅ Login ${role} réussi`);
      return response.data.token;
    }
    throw new Error("Login failed");
  } catch (error) {
    console.error(`❌ Erreur login ${role}:`, error.response?.data || error.message);
    return null;
  }
}

async function testChatScenario(token, scenario) {
  console.log(`\n📝 Scénario: ${scenario.name}`);
  console.log(`Message: "${scenario.message}"`);
  
  try {
    const startTime = Date.now();
    const response = await axios.post(
      `${API_BASE}/chat`,
      {
        message: scenario.message,
        patientId: scenario.patientId || 1,
        sessionId: `test-${Date.now()}`
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );
    
    const duration = Date.now() - startTime;
    
    if (response.data.success) {
      console.log(`✅ Réponse reçue en ${duration}ms`);
      console.log(`Provider: ${response.data.metadata?.provider || "Non spécifié"}`);
      console.log(`Intent détecté: ${response.data.metadata?.intent || "Non spécifié"}`);
      console.log(`HDS Compliant: ${response.data.metadata?.hdsCompliant || "Non spécifié"}`);
      console.log(`Extrait réponse: ${response.data.response.substring(0, 150)}...`);
      
      return {
        success: true,
        provider: response.data.metadata?.provider,
        duration,
        intent: response.data.metadata?.intent
      };
    }
  } catch (error) {
    console.error("❌ Erreur:", error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runAllScenarios() {
  console.log("🎯 TEST COMPLET CHATBOT - TOUS LES SCÉNARIOS");
  console.log("═".repeat(60));
  
  // Scénarios de test
  const scenarios = [
    // Questions médicales simples
    {
      name: "Question simple - Douleur",
      message: "J'ai mal aux dents depuis 3 jours"
    },
    {
      name: "Question simple - Hygiène",
      message: "Quelle brosse à dents recommandez-vous?"
    },
    
    // Urgences
    {
      name: "Urgence - Saignement",
      message: "URGENT: Ma gencive saigne beaucoup, que faire?"
    },
    {
      name: "Urgence - Douleur intense",
      message: "J'ai une douleur insupportable à la molaire, je n'arrive pas à dormir"
    },
    
    // Questions pratiques
    {
      name: "Rendez-vous",
      message: "Je voudrais prendre rendez-vous pour un contrôle"
    },
    {
      name: "Horaires",
      message: "Quels sont vos horaires d'ouverture?"
    },
    {
      name: "Tarifs",
      message: "Combien coûte un détartrage?"
    },
    
    // Cas complexes
    {
      name: "Cas complexe - Symptômes multiples",
      message: "J'ai mal à la mâchoire, mes gencives sont enflées et j'ai un goût bizarre dans la bouche"
    },
    {
      name: "Cas complexe - Historique",
      message: "J'ai eu une extraction il y a 2 semaines et j'ai toujours mal, est-ce normal?"
    },
    
    // Questions non médicales
    {
      name: "Hors sujet",
      message: "Quelle est la météo aujourd'hui?"
    }
  ];
  
  // Test avec différents comptes
  const accounts = [
    { email: "patient@melyia.com", password: "test123", role: "patient" },
    { email: "brice@melyia.com", password: "password", role: "admin" }
  ];
  
  const results = {};
  
  for (const account of accounts) {
    console.log(`\n\n🔐 Test avec compte ${account.role.toUpperCase()}`);
    console.log("─".repeat(60));
    
    const token = await loginAsRole(account.email, account.password, account.role);
    if (!token) continue;
    
    results[account.role] = [];
    
    for (const scenario of scenarios) {
      const result = await testChatScenario(token, scenario);
      results[account.role].push({
        scenario: scenario.name,
        ...result
      });
      
      // Petite pause entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Résumé des résultats
  console.log("\n\n" + "═".repeat(60));
  console.log("🎯 RÉSUMÉ DES RÉSULTATS");
  console.log("═".repeat(60));
  
  for (const [role, tests] of Object.entries(results)) {
    console.log(`\n📊 ${role.toUpperCase()}`);
    const successful = tests.filter(t => t.success).length;
    const azureCount = tests.filter(t => t.provider === "azure-openai").length;
    const avgDuration = tests.reduce((sum, t) => sum + (t.duration || 0), 0) / tests.length;
    
    console.log(`Tests réussis: ${successful}/${tests.length}`);
    console.log(`Azure OpenAI utilisé: ${azureCount}/${tests.length}`);
    console.log(`Temps moyen de réponse: ${Math.round(avgDuration)}ms`);
    
    // Détail des intents détectés
    const intents = tests.map(t => t.intent).filter(Boolean);
    const intentCounts = intents.reduce((acc, intent) => {
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {});
    
    console.log("Intents détectés:", intentCounts);
  }
  
  // Statut global
  const allTests = Object.values(results).flat();
  const totalSuccess = allTests.filter(t => t.success).length;
  const totalAzure = allTests.filter(t => t.provider === "azure-openai").length;
  
  console.log("\n" + "═".repeat(60));
  console.log("🎯 STATUT GLOBAL");
  console.log(`Taux de succès: ${(totalSuccess / allTests.length * 100).toFixed(1)}%`);
  console.log(`Azure OpenAI: ${(totalAzure / allTests.length * 100).toFixed(1)}%`);
  console.log(`État: ${totalSuccess === allTests.length ? "✅ TOUS LES TESTS PASSENT" : "⚠️ CERTAINS TESTS ÉCHOUENT"}`);
}

runAllScenarios().catch(console.error);