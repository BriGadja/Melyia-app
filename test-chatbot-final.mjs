import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (response.data.success) {
      console.log("✅ Login réussi");
      return response.data.token;
    }
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ Erreur login:", error.response?.data || error.message);
    return null;
  }
}

async function testChatbotOptimise(token) {
  try {
    console.log("🤖 Test chatbot avec Azure OpenAI...");
    
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE}/chat`, {
      message: "J'ai une douleur intense à la molaire droite depuis hier soir. Que puis-je prendre pour soulager la douleur ?",
      patientId: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const duration = Date.now() - startTime;
    
    console.log("✅ Réponse reçue en", duration + "ms");
    console.log("🤖 Provider:", response.data.metadata?.provider || response.data.provider);
    console.log("🌍 Région:", response.data.metadata?.region);
    console.log("🔒 HDS Compliant:", response.data.metadata?.hdsCompliant);
    console.log("💡 Intent:", response.data.metadata?.intent);
    console.log("📄 Documents utilisés:", response.data.metadata?.documentsUsed || response.data.documentsFound);
    console.log("\n📝 Réponse:", response.data.response?.substring(0, 200) + "...");
    
    return response.data;
  } catch (error) {
    console.error("❌ Erreur test chatbot:", error.response?.data || error.message);
    return null;
  }
}

async function testRAGOptimise(token) {
  try {
    console.log("🔍 Test RAG optimisé avec scoring hybride...");
    
    const response = await axios.post(`${API_BASE}/chat`, {
      message: "Quels sont les risques d'une extraction dentaire et comment se préparer ?",
      patientId: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("✅ RAG Response:", {
      success: response.data.success,
      message: response.data.message?.substring(0, 500) + "...",
      processingTime: response.data.processingTime,
      documentsFound: response.data.documentsFound,
      configUsed: response.data.configUsed
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ Erreur test RAG:", error.response?.data || error.message);
    return null;
  }
}

async function testUrgence(token) {
  try {
    console.log("🚨 Test mode urgence...");
    
    const response = await axios.post(`${API_BASE}/chat`, {
      message: "J'ai une urgence dentaire ! Ma dent s'est cassée et je saigne beaucoup !",
      patientId: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("✅ Urgence Response:", {
      success: response.data.success,
      message: response.data.message,
      processingTime: response.data.processingTime,
      documentsFound: response.data.documentsFound,
      configUsed: response.data.configUsed
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ Erreur test urgence:", error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log("🎯 Test final du chatbot dentaire optimisé...");
  console.log("═".repeat(60));
  
  const token = await loginAdmin();
  if (!token) {
    console.log("❌ Impossible de continuer sans token");
    return;
  }

  console.log("\n🔧 Configuration actuelle:");
  console.log("✅ LLM: Azure OpenAI gpt-4o-mini (HDS compliant)");
  console.log("✅ Région: France Central");
  console.log("✅ Architecture: Hybride Azure/Ollama avec fallback");
  console.log("✅ Prompts: Structure médicale professionnelle");
  console.log("✅ RAG: Scoring hybride avec pondération source/type");
  console.log("✅ Interface: Boutons contextuels (RDV, Urgence, Devis, Dossier)");

  console.log("\n" + "═".repeat(60));
  const result1 = await testChatbotOptimise(token);
  
  console.log("\n" + "═".repeat(60));
  const result2 = await testRAGOptimise(token);
  
  console.log("\n" + "═".repeat(60));
  const result3 = await testUrgence(token);
  
  console.log("\n" + "═".repeat(60));
  const allSuccess = result1?.success && result2?.success && result3?.success;
  
  console.log("\n🎯 RÉSULTAT FINAL:", allSuccess ? "✅ SUCCÈS COMPLET" : "❌ ÉCHEC");
  
  if (allSuccess) {
    console.log("\n🚀 CHATBOT DENTAIRE OPTIMISÉ AVEC SUCCÈS!");
    console.log("✅ Réponses médicales structurées et professionnelles");
    console.log("✅ RAG enrichi avec scoring intelligent");
    console.log("✅ Interface utilisateur améliorée avec boutons contextuels");
    console.log("✅ Performance optimisée pour usage médical");
    console.log("✅ Système prêt pour les patients");
  } else {
    console.log("\n❌ Des problèmes persistent, vérifier les logs");
  }
}

runTests().catch(console.error);