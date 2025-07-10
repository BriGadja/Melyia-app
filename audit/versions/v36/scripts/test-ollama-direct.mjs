#!/usr/bin/env node

/**
 * TEST OLLAMA DIRECT v36
 * ======================
 * Test de performance directe d'Ollama
 */

import axios from "axios";

async function testOllamaDirect() {
  console.log("🔍 [OLLAMA] TEST DIRECT PERFORMANCE");
  console.log("===================================");

  try {
    // 1. Test simple basique
    console.log("\n⚡ [TEST 1] Prompt minimal...");
    const start1 = Date.now();
    const response1 = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "llama3.2:3b",
      prompt: "Bonjour",
      stream: false,
      keep_alive: "60m",
      options: {
        num_predict: 10,
        temperature: 0.1,
        num_ctx: 512
      }
    }, { timeout: 30000 });
    const time1 = Date.now() - start1;
    console.log(`✅ [TEST 1] Réponse en ${time1}ms: "${response1.data.response}"`);

    // 2. Test avec prompt médical simple
    console.log("\n🏥 [TEST 2] Prompt médical simple...");
    const start2 = Date.now();
    const response2 = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "llama3.2:3b",
      prompt: "Tu es un dentiste. Un patient a mal aux dents. Que faire ? Réponds en 20 mots.",
      stream: false,
      keep_alive: "60m",
      options: {
        num_predict: 25,
        temperature: 0.1,
        num_ctx: 1024
      }
    }, { timeout: 30000 });
    const time2 = Date.now() - start2;
    console.log(`✅ [TEST 2] Réponse en ${time2}ms: "${response2.data.response}"`);

    // 3. Test avec prompt optimisé final
    console.log("\n🎯 [TEST 3] Prompt optimisé v36...");
    const start3 = Date.now();
    const promptOptimise = `Tu es un assistant dentaire français expert.

MISSION : Aider les patients avec leurs questions dentaires.

RÈGLES :
- Réponds en français, ton professionnel et rassurant
- Donne des conseils médicaux fiables et pratiques  
- Encourage la consultation si nécessaire
- Maximum 100 mots, sois concis et clair
- Structure : diagnostic + conseil + action

Tu es un guide médical, pas un substitut au dentiste.

DOSSIER: Aucun document pertinent trouvé dans le dossier patient.

QUESTION: J'ai mal à une dent, que faire ?

Réponds en français, max 150 mots, précis et rassurant.

RÉPONSE:`;

    const response3 = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "llama3.2:3b",
      prompt: promptOptimise,
      stream: false,
      keep_alive: "60m",
      options: {
        num_predict: 120,
        temperature: 0.1,
        num_ctx: 1536,
        stop: []
      }
    }, { timeout: 30000 });
    const time3 = Date.now() - start3;
    console.log(`✅ [TEST 3] Réponse en ${time3}ms: "${response3.data.response.substring(0, 200)}..."`);

    // Résultats
    console.log("\n📊 [RÉSULTATS]");
    console.log(`   Test 1 (minimal): ${time1}ms`);
    console.log(`   Test 2 (médical simple): ${time2}ms`);
    console.log(`   Test 3 (optimisé v36): ${time3}ms`);
    
    if (time3 < 15000) {
      console.log("🟢 Performance acceptable pour v36");
    } else {
      console.log("🔴 Performance insuffisante - optimisation requise");
    }

  } catch (error) {
    console.error("❌ [ERROR]", error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log("💡 Ollama non démarré ou inaccessible");
    } else if (error.code === 'ECONNABORTED') {
      console.log("💡 Timeout - modèle trop lent");
    }
  }
}

testOllamaDirect(); 