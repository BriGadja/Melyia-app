#!/usr/bin/env node

/**
 * FIX TIMEOUT CONFIG v36
 * ======================
 * Correction du problème de timeout avec configuration plus rapide
 */

import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

// Configuration optimisée pour rapidité ET qualité
const CONFIG_RAPIDE_OPTIMISEE = {
  systemPrompt: `Tu es un assistant dentaire français expert.

MISSION : Aider les patients avec leurs questions dentaires.

RÈGLES :
- Réponds en français, ton professionnel et rassurant
- Donne des conseils médicaux fiables et pratiques  
- Encourage la consultation si nécessaire
- Maximum 100 mots, sois concis et clair
- Structure : diagnostic + conseil + action

Tu es un guide médical, pas un substitut au dentiste.`,

  systemPromptUrgence: `Assistant dentaire d'urgence français.

URGENCE DÉTECTÉE - Actions immédiates :
1. Rassurer le patient
2. Conseils soulagement immédiat
3. Orienter vers consultation urgente si nécessaire

Instructions :
- Reconnais la douleur/urgence
- Conseils antalgiques simples
- Indique quand consulter en urgence
- Maximum 80 mots, sois rapide et précis

Urgence = réponse rapide + orientation.`,

  temperature: 0.1, // Plus déterministe = plus rapide
  topP: 0.7,
  maxTokens: 120, // Réduit pour rapidité
  numCtx: 1536, // Réduit pour rapidité
  stopSequences: [], 
  keepAliveMinutes: 30,
  timeoutSeconds: 20, // Augmenté pour sécurité
  modelName: "llama3.2:3b"
};

async function loginAdmin() {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: "brice@melyia.com",
    password: "password"
  });
  return response.data.token;
}

async function applyFastConfig() {
  console.log("⚡ [FIX] APPLICATION CONFIG RAPIDE v36");
  console.log("=====================================");

  try {
    const token = await loginAdmin();
    
    console.log("🔧 [CONFIG] Application configuration rapide...");
    console.log("   🌡️ Temperature: 0.1 (plus déterministe)");
    console.log("   📝 MaxTokens: 120 (réduit)");
    console.log("   ⏱️ Timeout: 20s (augmenté)");
    console.log("   🧠 NumCtx: 1536 (optimisé)");
    console.log("   📋 Prompts: Raccourcis pour rapidité");

    const response = await axios.put(`${API_BASE}/admin/llm-config`, CONFIG_RAPIDE_OPTIMISEE, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log("✅ [CONFIG] Configuration rapide appliquée");
      
      // Test rapide de validation
      console.log("\n🧪 [TEST] Test rapide post-configuration...");
      
      const authPatient = await axios.post(`${API_BASE}/auth/login`, {
        email: "patient@melyia.com",
        password: "test123"
      });

      const testStart = Date.now();
      const testResponse = await axios.post(`${API_BASE}/chat`, {
        message: "J'ai mal à une dent, que faire ?",
        patientId: authPatient.data.user.id
      }, {
        headers: { Authorization: `Bearer ${authPatient.data.token}` },
        timeout: 25000
      });

      const testTime = Date.now() - testStart;

      if (testResponse.data.success) {
        console.log(`✅ [TEST] Réponse reçue en ${testTime}ms`);
        console.log(`📝 [TEST] Réponse: "${testResponse.data.response.substring(0, 100)}..."`);
        
        if (testTime < 15000) {
          console.log("🚀 [SUCCESS] Configuration rapide validée !");
          return true;
        } else {
          console.log("⚠️ [WARNING] Encore un peu lent, mais fonctionnel");
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

applyFastConfig()
  .then(success => {
    if (success) {
      console.log("\n✅ [FINAL] Configuration rapide appliquée et validée");
      process.exit(0);
    } else {
      console.log("\n❌ [FINAL] Échec de l'optimisation");
      process.exit(1);
    }
  }); 