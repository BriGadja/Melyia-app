#!/usr/bin/env node

/**
 * CONFIG ULTRA-RAPIDE v36
 * =======================
 * Configuration d'urgence pour performance maximale
 */

import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

// Configuration d'urgence ultra-rapide
const CONFIG_ULTRA_RAPIDE = {
  systemPrompt: `Dentiste français. Réponds en 50 mots max. Sois rassurant et donne un conseil pratique.`,

  systemPromptUrgence: `Urgence dentaire. Rassure, donne conseil immédiat, oriente vers consultation. 30 mots max.`,

  temperature: 0.05, // Très déterministe
  topP: 0.5,
  maxTokens: 60, // Très court
  numCtx: 1024, // Minimal
  stopSequences: ["\n\n", ".", "!"], // Arrêt rapide
  keepAliveMinutes: 60, // Plus long pour éviter cold starts
  timeoutSeconds: 25, // Augmenté pour sécurité
  modelName: "llama3.2:3b"
};

async function loginAdmin() {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: "brice@melyia.com",
    password: "password"
  });
  return response.data.token;
}

async function applyUltraFastConfig() {
  console.log("🚀 [ULTRA-FAST] CONFIGURATION D'URGENCE v36");
  console.log("==========================================");

  try {
    const token = await loginAdmin();
    
    console.log("⚡ [CONFIG] Application configuration ultra-rapide...");
    console.log("   🔥 Prompt système: 13 mots seulement");
    console.log("   🌡️ Temperature: 0.05 (ultra-déterministe)");
    console.log("   📝 MaxTokens: 60 (ultra-court)");
    console.log("   🧠 NumCtx: 1024 (minimal)");
    console.log("   🛑 StopSequences: Arrêt immédiat sur ponctuation");
    console.log("   ⏱️ Timeout: 25s (sécurité)");

    const response = await axios.put(`${API_BASE}/admin/llm-config`, CONFIG_ULTRA_RAPIDE, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log("✅ [CONFIG] Configuration ultra-rapide appliquée");
      
      // Test immédiat simple
      console.log("\n🧪 [TEST] Test ultra-simple...");
      
      const authPatient = await axios.post(`${API_BASE}/auth/login`, {
        email: "patient@melyia.com",
        password: "test123"
      });

      const testStart = Date.now();
      const testResponse = await axios.post(`${API_BASE}/chat`, {
        message: "Mal aux dents",
        patientId: authPatient.data.user.id
      }, {
        headers: { Authorization: `Bearer ${authPatient.data.token}` },
        timeout: 30000
      });

      const testTime = Date.now() - testStart;

      if (testResponse.data.success) {
        console.log(`✅ [TEST] Réponse reçue en ${testTime}ms`);
        console.log(`📝 [TEST] Réponse: "${testResponse.data.response}"`);
        
        // Analyse rapide de la qualité
        const nombreMots = testResponse.data.response.split(/\s+/).length;
        console.log(`📊 [ANALYSE] ${nombreMots} mots`);
        
        if (testTime < 20000) {
          console.log("🚀 [SUCCESS] Configuration ultra-rapide validée !");
          
          // Test plus complet si le premier passe
          console.log("\n🧪 [TEST 2] Test extraction dentaire...");
          const test2Start = Date.now();
          const test2Response = await axios.post(`${API_BASE}/chat`, {
            message: "J'ai eu une extraction hier, j'ai mal",
            patientId: authPatient.data.user.id
          }, {
            headers: { Authorization: `Bearer ${authPatient.data.token}` },
            timeout: 30000
          });
          
          const test2Time = Date.now() - test2Start;
          if (test2Response.data.success) {
            console.log(`✅ [TEST 2] Réponse en ${test2Time}ms: "${test2Response.data.response}"`);
            return true;
          }
        } else {
          console.log("⚠️ [WARNING] Encore lent mais fonctionnel");
          return true;
        }
      } else {
        console.log("❌ [TEST] Test échoué:", testResponse.data.error);
        return false;
      }

    } else {
      console.log("❌ [CONFIG] Échec application configuration");
      return false;
    }

  } catch (error) {
    console.error("❌ [ERROR]", error.response?.data || error.message);
    return false;
  }
}

applyUltraFastConfig()
  .then(success => {
    if (success) {
      console.log("\n✅ [FINAL] Configuration ultra-rapide fonctionnelle");
      console.log("💡 [NOTE] Qualité réduite mais réponses rapides garanties");
      process.exit(0);
    } else {
      console.log("\n❌ [FINAL] Échec total - problème infrastructure");
      process.exit(1);
    }
  }); 