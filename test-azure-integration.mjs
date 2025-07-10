// test-azure-integration.mjs
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

// Configuration Azure OpenAI
// IMPORTANT: Remplacer par vos propres clés Azure
const AZURE_CONFIG = {
  endpoint: "https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2025-01-01-preview",
  apiKey: "YOUR-AZURE-OPENAI-API-KEY",
  deployment: "your-deployment-name"
};

async function testAzureDirectly() {
  console.log("🔍 Test direct Azure OpenAI...");
  
  try {
    const response = await axios.post(
      AZURE_CONFIG.endpoint,
      {
        messages: [
          {
            role: "system",
            content: "Tu es un assistant médical pour le cabinet dentaire Melyia."
          },
          {
            role: "user",
            content: "Bonjour, j'ai mal aux dents. Que me conseillez-vous?"
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          "api-key": AZURE_CONFIG.apiKey,
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log("✅ Azure OpenAI répond correctement!");
    console.log("Réponse:", response.data.choices[0].message.content);
    return true;
  } catch (error) {
    console.error("❌ Erreur Azure OpenAI directe:");
    console.error("Status:", error.response?.status);
    console.error("Erreur:", error.response?.data || error.message);
    return false;
  }
}

async function loginAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (response.data.success) {
      console.log("✅ Login admin réussi");
      return response.data.token;
    }
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ Erreur login:", error.response?.data || error.message);
    return null;
  }
}

async function testAzureIntegration(token) {
  try {
    console.log("🔍 Test Azure OpenAI integration...");
    
    const response = await axios.post(`${API_BASE}/chat`, {
      message: "Bonjour, j'ai mal aux dents. Pouvez-vous m'aider ?",
      patientId: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      console.log("✅ Chat API réussi");
      console.log("📝 Réponse:", response.data.response);
      console.log("🔧 Métadonnées:", response.data.metadata);
      
      // Vérifier le provider utilisé
      const provider = response.data.metadata.provider;
      const architecture = response.data.metadata.architecture;
      
      console.log(`🎯 Provider: ${provider}`);
      console.log(`🏗️ Architecture: ${architecture}`);
      console.log(`🌍 Région: ${response.data.metadata.region}`);
      console.log(`🔒 HDS Compliant: ${response.data.metadata.hdsCompliant}`);
      
      return {
        success: true,
        provider: provider,
        architecture: architecture,
        hdsCompliant: response.data.metadata.hdsCompliant
      };
    }
    throw new Error("Chat API failed");
  } catch (error) {
    console.error("❌ Erreur test Azure:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

async function runIntegrationTests() {
  console.log("🎯 TEST INTÉGRATION AZURE OPENAI HYBRIDE");
  console.log("═".repeat(60));
  
  // Test direct Azure en premier
  console.log("\n🔍 Test 0: Azure OpenAI Direct");
  const azureDirect = await testAzureDirectly();
  
  if (!azureDirect) {
    console.log("\n⚠️ Azure OpenAI n'est pas accessible directement");
    console.log("Vérifiez:");
    console.log("1. Le deployment 'gpt-4o-mini' existe bien");
    console.log("2. La clé API est valide");
    console.log("3. L'endpoint est correct");
  }
  
  console.log("\n" + "─".repeat(60));
  
  const token = await loginAdmin();
  if (!token) {
    console.log("❌ Impossible de continuer sans token");
    return;
  }

  // Test 1: Vérifier l'intégration hybride
  console.log("\n🔍 Test 1: Intégration hybride Azure OpenAI");
  const result1 = await testAzureIntegration(token);
  
  if (result1.success) {
    console.log("✅ Test 1 réussi");
    if (result1.provider === "azure-openai") {
      console.log("🎉 AZURE OPENAI FONCTIONNE!");
    } else {
      console.log("⚠️ Fallback Ollama utilisé");
    }
  } else {
    console.log("❌ Test 1 échoué:", result1.error);
  }

  // Test 2: Test avec différents types de messages
  console.log("\n🔍 Test 2: Test urgence");
  const result2 = await axios.post(`${API_BASE}/chat`, {
    message: "URGENT: Je saigne beaucoup de la gencive !",
    patientId: 1
  }, {
    headers: { Authorization: `Bearer ${token}` }
  }).catch(e => ({data: {success: false, error: e.message}}));
  
  if (result2.data.success) {
    console.log("✅ Test urgence OK");
    console.log("📝 Type prompt:", result2.data.metadata.promptType);
    console.log("🚨 Intent:", result2.data.metadata.intent);
  } else {
    console.log("❌ Test urgence échoué:", result2.data.error);
  }

  console.log("\n" + "═".repeat(60));
  console.log("🎯 RÉSUMÉ:");
  console.log(`- Architecture: ${result1.architecture || "N/A"}`);
  console.log(`- Provider principal: ${result1.provider || "N/A"}`);
  console.log(`- HDS Compliant: ${result1.hdsCompliant || "N/A"}`);
  console.log(`- Statut général: ${result1.success ? "✅ FONCTIONNEL" : "❌ PROBLÈME"}`);
}

runIntegrationTests().catch(console.error);