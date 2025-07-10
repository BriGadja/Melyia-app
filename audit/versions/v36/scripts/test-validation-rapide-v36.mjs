#!/usr/bin/env node

/**
 * TEST VALIDATION RAPIDE v36
 * ==========================
 * Validation immédiate de la nouvelle configuration LLM
 * optimisée pour le contexte médical dentaire
 */

import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

// Tests rapides de validation
const TESTS_RAPIDES = [
  {
    question: "J'ai eu une extraction dentaire hier, j'ai mal. Est-ce normal ?",
    scenario: "post-operatoire",
    attendu: {
      reponse_complete: true,
      contenu_medical: true,
      ton_rassurant: true,
      conseils_pratiques: true
    }
  },
  {
    question: "URGENT: J'ai une douleur dentaire insupportable depuis 2h !",
    scenario: "urgence",
    attendu: {
      detection_urgence: true,
      conseils_immediats: true,
      orientation_consultation: true,
      reponse_rapide: true
    }
  },
  {
    question: "Comment me préparer pour la pose d'un implant dentaire ?",
    scenario: "pre-operatoire",
    attendu: {
      information_complete: true,
      preparation_detaillee: true,
      conseils_pre_op: true
    }
  }
];

/**
 * Connexion patient de test
 */
async function loginPatient() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "patient@melyia.com",
      password: "test123"
    });

    if (response.data.success) {
      return {
        token: response.data.token,
        userId: response.data.user.id
      };
    }
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ [AUTH] Erreur connexion patient:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Test rapide d'une question
 */
async function testQuestionRapide(token, userId, question, scenario) {
  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${API_BASE}/chat`, {
      message: question,
      patientId: userId
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000 // 20s timeout
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    if (!response.data.success) {
      throw new Error(response.data.error || "Erreur chatbot");
    }

    const aiResponse = response.data.response;
    const metadata = response.data.metadata;

    // Analyse rapide de la qualité
    const qualite = analyserQualiteRapide(aiResponse, question, scenario);

    return {
      success: true,
      question: question.substring(0, 50) + "...",
      response: aiResponse,
      processingTime: processingTime,
      qualite: qualite,
      metadata: metadata
    };
    
  } catch (error) {
    return {
      success: false,
      question: question.substring(0, 50) + "...",
      error: error.response?.data || error.message,
      processingTime: 0
    };
  }
}

/**
 * Analyse rapide de qualité
 */
function analyserQualiteRapide(reponse, question, scenario) {
  const analyses = [];
  let score = 0;

  // 1. Longueur appropriée
  const nombreMots = reponse.split(/\s+/).length;
  if (nombreMots >= 30 && nombreMots <= 180) {
    score += 25;
    analyses.push(`✅ Longueur: ${nombreMots} mots (appropriée)`);
  } else {
    analyses.push(`❌ Longueur: ${nombreMots} mots (inappropriate)`);
  }

  // 2. Contenu médical
  const motsMedicaux = ["dentaire", "dent", "douleur", "traitement", "soin", "consultation", "dentiste", "buccal"];
  if (motsMedicaux.some(mot => reponse.toLowerCase().includes(mot))) {
    score += 25;
    analyses.push("✅ Contenu médical présent");
  } else {
    analyses.push("❌ Contenu médical manquant");
  }

  // 3. Ton professionnel et rassurant
  const motsRassurants = ["comprends", "normal", "rassur", "aide", "accompagne", "soutien"];
  if (motsRassurants.some(mot => reponse.toLowerCase().includes(mot))) {
    score += 25;
    analyses.push("✅ Ton rassurant");
  } else {
    analyses.push("❌ Manque de ton rassurant");
  }

  // 4. Conseils pratiques
  const conseilsPratiques = ["recommande", "conseil", "prenez", "évitez", "appliquez", "consultez"];
  if (conseilsPratiques.some(mot => reponse.toLowerCase().includes(mot))) {
    score += 25;
    analyses.push("✅ Conseils pratiques");
  } else {
    analyses.push("❌ Conseils pratiques manquants");
  }

  // Bonus pour urgence si détectée
  if (question.toLowerCase().includes("urgent") || question.toLowerCase().includes("douleur")) {
    const urgenceDetectee = ["rapidement", "immédiat", "urgent", "consultez"].some(mot => 
      reponse.toLowerCase().includes(mot)
    );
    if (urgenceDetectee) {
      score += 10;
      analyses.push("🚨 Urgence correctement détectée");
    }
  }

  return {
    score: Math.min(100, score),
    analyses: analyses,
    nombreMots: nombreMots
  };
}

/**
 * Validation rapide complète
 */
async function validationRapide() {
  console.log("🧪 [VALIDATION] TEST RAPIDE CONFIG OPTIMISÉE v36");
  console.log("================================================");

  // Connexion
  const auth = await loginPatient();
  if (!auth) {
    console.error("❌ Impossible de se connecter");
    return false;
  }

  console.log("✅ [AUTH] Patient connecté");

  const resultats = [];
  let scoreTotal = 0;
  let tempsTotal = 0;
  let successes = 0;

  // Tests des questions
  for (let i = 0; i < TESTS_RAPIDES.length; i++) {
    const test = TESTS_RAPIDES[i];
    console.log(`\n--- Test ${i + 1}: ${test.scenario} ---`);
    
    const resultat = await testQuestionRapide(
      auth.token,
      auth.userId,
      test.question,
      test.scenario
    );

    if (resultat.success) {
      successes++;
      scoreTotal += resultat.qualite.score;
      tempsTotal += resultat.processingTime;

      console.log(`✅ Question: ${resultat.question}`);
      console.log(`📝 Réponse: "${resultat.response.substring(0, 100)}..."`);
      console.log(`🎯 Score: ${resultat.qualite.score}/100`);
      console.log(`⏱️ Temps: ${resultat.processingTime}ms`);
      console.log(`📊 Analyses:`);
      resultat.qualite.analyses.forEach(analyse => console.log(`   ${analyse}`));
    } else {
      console.log(`❌ Question: ${resultat.question}`);
      console.log(`🚫 Erreur: ${resultat.error}`);
    }

    resultats.push(resultat);

    // Pause entre tests
    if (i < TESTS_RAPIDES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Résultats globaux
  const scoreMoyen = successes > 0 ? Math.round(scoreTotal / successes) : 0;
  const tempsMoyen = successes > 0 ? Math.round(tempsTotal / successes) : 0;

  console.log("\n" + "=".repeat(50));
  console.log("🎯 [RÉSULTATS] VALIDATION RAPIDE");
  console.log("=".repeat(50));
  console.log(`📊 Score moyen: ${scoreMoyen}/100`);
  console.log(`⏱️ Temps moyen: ${tempsMoyen}ms`);
  console.log(`✅ Succès: ${successes}/${TESTS_RAPIDES.length}`);

  // Évaluation
  if (scoreMoyen >= 80) {
    console.log("🟢 EXCELLENT: Configuration optimisée validée !");
  } else if (scoreMoyen >= 70) {
    console.log("🟡 ACCEPTABLE: Amélioration significative détectée");
  } else {
    console.log("🔴 INSUFFISANT: Optimisations supplémentaires requises");
  }

  if (tempsMoyen <= 5000) {
    console.log("⚡ Performance: Temps de réponse acceptable");
  } else {
    console.log("⚠️ Performance: Temps de réponse à optimiser");
  }

  return {
    scoreMoyen: scoreMoyen,
    tempsMoyen: tempsMoyen,
    successes: successes,
    total: TESTS_RAPIDES.length,
    resultats: resultats
  };
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  validationRapide()
    .then((resultats) => {
      if (resultats && resultats.scoreMoyen >= 70) {
        console.log("\n✅ [SUCCESS] Validation réussie - Configuration acceptable");
        process.exit(0);
      } else {
        console.log("\n❌ [FAILED] Validation échouée - Optimisations requises");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("\n❌ [ERROR] Erreur validation:", error.message);
      process.exit(1);
    });
}

export { validationRapide }; 