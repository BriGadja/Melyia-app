#!/usr/bin/env node

/**
 * AUDIT COMPLET CHATBOT MELYIA v36
 * ===============================================
 * Script d'évaluation de la qualité du chatbot
 * pour les patients en contexte dentaire médical
 */

import axios from "axios";
import fs from "fs";
import path from "path";

const API_BASE = "https://app-dev.melyia.com/api";
const AUDIT_RESULTS_DIR = "./audit/versions/v36/test-results";

// Scénarios de test patients réels
const SCENARIOS_PATIENTS = [
  {
    id: "scenario_1",
    name: "Post-opératoire extraction",
    questions: [
      "Bonjour, j'ai eu une extraction dentaire hier, j'ai mal. Est-ce normal ?",
      "Combien de temps va durer la douleur après l'extraction ?",
      "Puis-je manger normalement après l'extraction ?",
      "Le saignement est-il normal après une extraction ?",
    ],
    attendu: {
      precision_medicale: 100,
      reassurance: true,
      conseil_pratique: true,
      max_mots: 150,
    }
  },
  {
    id: "scenario_2", 
    name: "Pré-opératoire implant",
    questions: [
      "J'ai rendez-vous la semaine prochaine pour un implant dentaire, que dois-je savoir ?",
      "Comment me préparer pour la pose d'un implant ?",
      "Quels sont les risques d'un implant dentaire ?",
      "Combien de temps dure la cicatrisation d'un implant ?",
    ],
    attendu: {
      precision_medicale: 100,
      information_complete: true,
      preparation: true,
      max_mots: 150,
    }
  },
  {
    id: "scenario_3",
    name: "Urgence douleur",
    questions: [
      "URGENT: J'ai une douleur dentaire insupportable, que faire ?",
      "Ma dent me fait atrocement mal depuis 2h, aidez-moi !",
      "Douleur intense après plombage hier, normal ?",
    ],
    attendu: {
      precision_medicale: 100,
      urgence_detectee: true,
      conseil_immediat: true,
      contact_dentiste: true,
      max_mots: 150,
    }
  },
  {
    id: "scenario_4",
    name: "Soins post-opératoires détaillés",
    questions: [
      "Comment nettoyer ma bouche après une chirurgie gingivale ?",
      "Quels médicaments prendre après mon intervention ?",
      "Quand puis-je reprendre le brossage normal ?",
      "Les fils de suture, quand tombent-ils ?",
    ],
    attendu: {
      precision_medicale: 100,
      protocole_detaille: true,
      chronologie: true,
      max_mots: 150,
    }
  },
  {
    id: "scenario_5",
    name: "Questions générales prévention",
    questions: [
      "Comment bien se brosser les dents ?",
      "À quelle fréquence dois-je consulter mon dentiste ?",
      "Les bains de bouche sont-ils utiles ?",
      "Comment prévenir les caries ?",
    ],
    attendu: {
      precision_medicale: 100,
      conseils_prevention: true,
      education_patient: true,
      max_mots: 150,
    }
  }
];

// Comptes de test
const COMPTES_TEST = {
  admin: { email: "brice@melyia.com", password: "password" },
  dentist: { email: "dentiste@melyia.com", password: "test123" },
  patient: { email: "patient@melyia.com", password: "test123" }
};

/**
 * Connexion utilisateur
 */
async function loginUser(email, password) {
  try {
    console.log(`🔐 [AUTH] Connexion: ${email}`);
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: email,
      password: password,
    });

    if (response.data.success) {
      console.log(`✅ [AUTH] Connecté: ${email} (${response.data.user.role})`);
      return {
        token: response.data.token,
        user: response.data.user
      };
    }
    
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ [AUTH] Erreur connexion:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Test état chatbot
 */
async function testChatbotStatus(token) {
  try {
    console.log("📊 [STATUS] Vérification état chatbot...");
    
    const response = await axios.get(`${API_BASE}/chat/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ [STATUS] État chatbot:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [STATUS] Erreur état:", error.response?.data || error.message);
    return { isReady: false, error: error.message };
  }
}

/**
 * Warm-up chatbot pour performances optimales
 */
async function warmupChatbot(token) {
  try {
    console.log("🔥 [WARMUP] Initialisation chatbot...");
    
    const response = await axios.post(`${API_BASE}/chat/warmup`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ [WARMUP] Chatbot initialisé:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [WARMUP] Erreur warmup:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test question chatbot avec analyse qualité
 */
async function testQuestion(token, userId, patientId, question, scenario) {
  try {
    console.log(`💬 [CHAT] Question: "${question.substring(0, 50)}..."`);
    
    const startTime = Date.now();
    
    const response = await axios.post(`${API_BASE}/chat`, {
      message: question,
      patientId: patientId
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000 // 30s timeout
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    if (!response.data.success) {
      throw new Error(response.data.error || "Erreur chatbot");
    }

    const aiResponse = response.data.response;
    const metadata = response.data.metadata;

    // Analyse qualité de la réponse
    const qualiteAnalyse = analyserQualiteReponse(aiResponse, question, scenario.attendu);

    console.log(`✅ [CHAT] Réponse reçue en ${processingTime}ms`);
    console.log(`🎯 [QUALITÉ] Score: ${qualiteAnalyse.score}/100`);

    return {
      success: true,
      question: question,
      response: aiResponse,
      processingTime: processingTime,
      metadata: metadata,
      qualite: qualiteAnalyse,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("❌ [CHAT] Erreur question:", error.response?.data || error.message);
    return {
      success: false,
      question: question,
      error: error.response?.data || error.message,
      processingTime: Date.now() - Date.now(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Analyser la qualité d'une réponse médicale
 */
function analyserQualiteReponse(reponse, question, attendu) {
  let score = 0;
  const analyses = [];

  // 1. Longueur appropriée (max 150 mots)
  const nombreMots = reponse.split(/\s+/).length;
  if (nombreMots <= attendu.max_mots) {
    score += 20;
    analyses.push(`✅ Longueur appropriée: ${nombreMots}/${attendu.max_mots} mots`);
  } else {
    analyses.push(`❌ Trop long: ${nombreMots}/${attendu.max_mots} mots`);
  }

  // 2. Langue française
  const regexFrancais = /[àâäéèêëîïôöùûüÿç]/i;
  if (regexFrancais.test(reponse)) {
    score += 10;
    analyses.push("✅ Réponse en français");
  } else {
    analyses.push("❌ Langue incorrecte ou caractères manquants");
  }

  // 3. Contenu médical approprié
  const motsMedicaux = ["dentaire", "dent", "douleur", "traitement", "soin", "consultation", "dentiste", "buccal", "oral"];
  const contientMedical = motsMedicaux.some(mot => reponse.toLowerCase().includes(mot));
  if (contientMedical) {
    score += 20;
    analyses.push("✅ Contenu médical approprié");
  } else {
    analyses.push("❌ Manque de contenu médical spécialisé");
  }

  // 4. Ton rassurant et professionnel
  const motsRassurants = ["normal", "habituel", "ne vous inquiétez", "rassurez-vous", "temporaire", "guérison"];
  const contientRassurance = motsRassurants.some(mot => reponse.toLowerCase().includes(mot));
  if (contientRassurance) {
    score += 15;
    analyses.push("✅ Ton rassurant détecté");
  } else {
    analyses.push("⚠️ Manque de ton rassurant");
  }

  // 5. Détection urgence (si applicable)
  const questionUrgente = question.toLowerCase().includes("urgent") || 
                         question.toLowerCase().includes("douleur") ||
                         question.toLowerCase().includes("atrocement");
  
  // Déclaration des mots d'urgence en dehors du bloc if pour portée globale
  const motsUrgence = ["rapidement", "immédiatement", "consultez", "rendez-vous", "urgence"];
  
  if (questionUrgente) {
    const contientUrgence = motsUrgence.some(mot => reponse.toLowerCase().includes(mot));
    if (contientUrgence) {
      score += 20;
      analyses.push("✅ Urgence correctement détectée");
    } else {
      analyses.push("❌ Urgence non détectée");
    }
  } else {
    score += 10; // Bonus si pas d'urgence non justifiée
    analyses.push("✅ Pas d'urgence injustifiée");
  }

  // 6. Conseils pratiques
  const conseilsPratiques = ["évitez", "prenez", "appliquez", "rincez", "brossez", "consultez"];
  const contientConseils = conseilsPratiques.some(mot => reponse.toLowerCase().includes(mot));
  if (contientConseils) {
    score += 15;
    analyses.push("✅ Conseils pratiques inclus");
  } else {
    analyses.push("⚠️ Manque de conseils pratiques");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    analyses: analyses,
    nombreMots: nombreMots,
    details: {
      langue: regexFrancais.test(reponse),
      medical: contientMedical,
      rassurant: contientRassurance,
      pratique: contientConseils,
      urgence: questionUrgente ? motsUrgence.some(mot => reponse.toLowerCase().includes(mot)) : null
    }
  };
}

/**
 * Récupérer configuration LLM actuelle
 */
async function getConfigurationLLM(token) {
  try {
    console.log("⚙️ [CONFIG] Récupération configuration LLM...");
    
    const response = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ [CONFIG] Configuration récupérée");
    return response.data.data;
  } catch (error) {
    console.error("❌ [CONFIG] Erreur configuration:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Audit complet du chatbot
 */
async function runAuditComplet() {
  console.log("🚀 [AUDIT_V36] DÉBUT AUDIT COMPLET CHATBOT");
  console.log("================================================");
  
  const resultats = {
    timestamp: new Date().toISOString(),
    version: "v36.0",
    phase: "audit_initial",
    resultats: {
      authentification: {},
      configuration: {},
      performance: {},
      scenarios: []
    }
  };

  try {
    // Créer le dossier de résultats s'il n'existe pas
    if (!fs.existsSync(AUDIT_RESULTS_DIR)) {
      fs.mkdirSync(AUDIT_RESULTS_DIR, { recursive: true });
    }

    // 1. Test authentification
    console.log("\n📋 [ÉTAPE 1] AUTHENTIFICATION");
    const authAdmin = await loginUser(COMPTES_TEST.admin.email, COMPTES_TEST.admin.password);
    const authPatient = await loginUser(COMPTES_TEST.patient.email, COMPTES_TEST.patient.password);
    
    if (!authAdmin || !authPatient) {
      throw new Error("Échec authentification comptes de test");
    }

    resultats.resultats.authentification = {
      admin: !!authAdmin,
      patient: !!authPatient,
      tokens_valides: true
    };

    // 2. Configuration LLM
    console.log("\n⚙️ [ÉTAPE 2] CONFIGURATION LLM");
    const config = await getConfigurationLLM(authAdmin.token);
    resultats.resultats.configuration = config;

    // 3. État et performance chatbot
    console.log("\n📊 [ÉTAPE 3] PERFORMANCE CHATBOT");
    const status = await testChatbotStatus(authPatient.token);
    const warmup = await warmupChatbot(authPatient.token);
    
    resultats.resultats.performance = {
      status: status,
      warmup: warmup,
      isReady: status.isReady && warmup.success
    };

    // 4. Tests scénarios patients
    console.log("\n🩺 [ÉTAPE 4] SCÉNARIOS PATIENTS");
    
    for (const scenario of SCENARIOS_PATIENTS) {
      console.log(`\n--- Scénario: ${scenario.name} ---`);
      
      const scenarioResultats = {
        id: scenario.id,
        name: scenario.name,
        questions: [],
        score_moyen: 0,
        temps_moyen: 0,
        reussites: 0
      };

      let totalScore = 0;
      let totalTime = 0;
      let successes = 0;

      for (const question of scenario.questions) {
        const resultat = await testQuestion(
          authPatient.token,
          authPatient.user.id,
          authPatient.user.id, // Le patient teste sur son propre dossier
          question,
          scenario
        );

        scenarioResultats.questions.push(resultat);

        if (resultat.success) {
          successes++;
          totalScore += resultat.qualite.score;
          totalTime += resultat.processingTime;
        }

        // Pause entre questions
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      scenarioResultats.reussites = successes;
      scenarioResultats.score_moyen = successes > 0 ? Math.round(totalScore / successes) : 0;
      scenarioResultats.temps_moyen = successes > 0 ? Math.round(totalTime / successes) : 0;

      console.log(`📊 ${scenario.name}: ${scenarioResultats.score_moyen}/100 points (${scenarioResultats.temps_moyen}ms)`);
      
      resultats.resultats.scenarios.push(scenarioResultats);
    }

    // 5. Analyse globale
    const scores = resultats.resultats.scenarios.map(s => s.score_moyen);
    const scoreGlobal = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
    
    resultats.score_global = scoreGlobal;
    resultats.recommandations = genererRecommandations(resultats);

    // 6. Sauvegarde résultats
    const fichierResultats = path.join(AUDIT_RESULTS_DIR, `audit-complet-${Date.now()}.json`);
    fs.writeFileSync(fichierResultats, JSON.stringify(resultats, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("🎯 [RÉSULTATS] AUDIT COMPLET TERMINÉ");
    console.log("=".repeat(60));
    console.log(`📊 Score global: ${scoreGlobal}/100`);
    console.log(`📁 Résultats sauvegardés: ${fichierResultats}`);
    console.log(`🕒 Durée totale: ${Math.round((Date.now() - new Date(resultats.timestamp).getTime()) / 1000)}s`);
    
    console.log("\n🔍 [RECOMMANDATIONS]:");
    resultats.recommandations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    return resultats;

  } catch (error) {
    console.error("❌ [AUDIT] Erreur critique:", error.message);
    resultats.erreur = error.message;
    return resultats;
  }
}

/**
 * Générer recommandations d'amélioration
 */
function genererRecommandations(resultats) {
  const recommendations = [];
  const scoreGlobal = resultats.score_global;

  if (scoreGlobal < 70) {
    recommendations.push("🔴 CRITIQUE: Score global insuffisant pour usage médical (< 70/100)");
  }

  // Analyser les temps de réponse
  const tempsReponses = resultats.resultats.scenarios
    .flatMap(s => s.questions.filter(q => q.success).map(q => q.processingTime));
  
  const tempsMoyen = tempsReponses.length > 0 ? 
    Math.round(tempsReponses.reduce((a, b) => a + b) / tempsReponses.length) : 0;

  if (tempsMoyen > 5000) {
    recommendations.push("⚠️ Temps de réponse trop lent (> 5s) - Optimiser Ollama");
  }

  // Analyser la configuration
  const config = resultats.resultats.configuration;
  if (config) {
    if (config.temperature > 0.3) {
      recommendations.push("⚙️ Température trop élevée pour contexte médical - Réduire à 0.2");
    }
    if (config.maxTokens > 200) {
      recommendations.push("📝 Max tokens trop élevé - Limiter à 150 pour concision");
    }
  }

  // Analyser les échecs par scénario
  resultats.resultats.scenarios.forEach(scenario => {
    if (scenario.score_moyen < 80) {
      recommendations.push(`🎯 Améliorer scénario "${scenario.name}" (${scenario.score_moyen}/100)`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push("✅ Qualité acceptable - Continuer optimisations mineures");
  }

  return recommendations;
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuditComplet()
    .then(() => {
      console.log("\n✅ [AUDIT] Script terminé avec succès");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ [AUDIT] Erreur fatale:", error.message);
      process.exit(1);
    });
}

export { runAuditComplet }; 