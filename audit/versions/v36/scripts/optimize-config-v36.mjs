#!/usr/bin/env node

/**
 * OPTIMISATION CONFIGURATION LLM v36
 * ===================================
 * Script d'optimisation ciblée pour améliorer
 * la qualité des réponses du chatbot dentaire
 */

import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

/**
 * Configurations optimisées pour différents objectifs
 */
const CONFIGURATIONS = {
  // Configuration actuelle (problématique)
  current: {
    name: "Configuration actuelle (v36.2)",
    description: "Configuration ultra-rapide mais qualité insuffisante",
    config: {
      temperature: 0.05,
      maxTokens: 60,
      timeoutSeconds: 25,
      systemPrompt: "Dentiste français. Réponds en 50 mots max. Sois rassurant et donne un conseil pratique.",
      systemPromptUrgence: "Urgence dentaire. Rassure, donne conseil immédiat, oriente vers consultation. 30 mots max."
    }
  },
  
  // Configuration conservative (recommandée v36.3)
  conservative: {
    name: "Configuration conservative (v36.3 - recommandée)",
    description: "Amélioration graduelle sans risque de timeout",
    config: {
      temperature: 0.15,  // Augmentation prudente depuis 0.05
      topP: 0.8,          // Diversité contrôlée
      maxTokens: 90,      // Augmentation modérée depuis 60
      numCtx: 1024,       // Contexte standard
      timeoutSeconds: 30,  // Timeout sécurisé
      keepAliveMinutes: 30, // Keep-alive standard
      stopSequences: ["\\n\\n", ".", "!", "?", "---"], // Stop sequences équilibrés
      systemPrompt: `Assistant dentaire français expert. 
Réponds de manière professionnelle et rassurante:
- Analyse le dossier patient
- Conseils pratiques précis
- Orientation consultation si nécessaire
- Maximum 80 mots, clair et empathique`,
      
      systemPromptUrgence: `URGENCE DENTAIRE - Assistant expert français.
Évalue rapidement:
- Rassure le patient
- Conseil immédiat de soulagement  
- Indique quand consulter EN URGENCE
- Maximum 60 mots, précis et rassurant

Douleur intense = consultation immédiate.`
    }
  },

  // Configuration équilibrée (recommandée)
  balanced: {
    name: "Configuration équilibrée (v36.3 - risque timeout)",
    description: "Équilibre qualité/performance pour usage médical",
    config: {
      temperature: 0.3,  // Plus de créativité pour réponses naturelles
      topP: 0.9,         // Diversité lexicale appropriée
      maxTokens: 150,    // Réponses plus complètes mais raisonnables
      numCtx: 2048,      // Contexte élargi pour meilleure compréhension
      timeoutSeconds: 35, // Timeout légèrement augmenté
      keepAliveMinutes: 45, // Keep-alive optimisé
      stopSequences: ["\\n\\n\\n", "---", "QUESTION:"], // Stop sequences moins agressifs
      systemPrompt: `Tu es un assistant dentaire français expert et bienveillant. 
Analyse le dossier patient et réponds de manière:
- Professionnelle et rassurante
- Précise médicalement  
- Avec conseils pratiques concrets
- En 80-120 mots maximum

Toujours orienter vers consultation si nécessaire.`,
      
      systemPromptUrgence: `URGENCE DENTAIRE - Assistant expert français.
Évalue rapidement la situation et:
- Rassure le patient
- Donne conseil immédiat de soulagement
- Indique quand consulter EN URGENCE
- Sois précis et rassurant
- 60-90 mots maximum

Si douleur intense ou trauma: consultation immédiate obligatoire.`
    }
  },

  // Configuration qualité maximale (pour comparaison)
  quality: {
    name: "Configuration qualité maximale",
    description: "Priorité qualité/précision (temps de réponse plus lent)",
    config: {
      temperature: 0.4,
      topP: 0.85,
      maxTokens: 200,
      numCtx: 3072,
      timeoutSeconds: 45,
      systemPrompt: `Tu es un assistant dentaire français expert, diplômé et expérimenté.

MISSION: Fournir des conseils dentaires précis, professionnels et rassurants.

INSTRUCTIONS:
- Analyse le dossier patient avec attention
- Réponds avec empathie et professionnalisme  
- Donne des conseils pratiques et applicables
- Indique clairement quand consulter
- Utilise un vocabulaire accessible mais précis
- Maximum 150 mots, bien structurés

TOUJOURS: Privilégier sécurité patient et orientation vers professionnel.`,

      systemPromptUrgence: `URGENCE DENTAIRE - Expert consultant français

PROTOCOLE URGENCE:
1. Évaluer gravité rapidement
2. Rassurer avec empathie
3. Conseil soulagement immédiat
4. Orientation consultation appropriée
5. Préciser délai (immédiat/24h/48h)

SIGNES D'ALARME: Douleur intense, trauma, infection, saignement important
→ Consultation IMMÉDIATE obligatoire

Réponse: 80-120 mots, claire et structurée.`
    }
  }
};

/**
 * Connexion admin
 */
async function loginAdmin() {
  try {
    console.log("🔐 [AUTH] Connexion admin...");
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (response.data.success) {
      console.log("✅ [AUTH] Connecté en tant qu'admin");
      return response.data.token;
    }
    
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ [AUTH] Erreur connexion:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Appliquer une configuration
 */
async function applyConfiguration(token, configName) {
  try {
    const configData = CONFIGURATIONS[configName];
    if (!configData) {
      throw new Error(`Configuration '${configName}' non trouvée`);
    }
    
    console.log(`🔧 [APPLY] Application configuration: ${configData.name}`);
    console.log(`📝 [APPLY] Description: ${configData.description}`);
    
    const response = await axios.put(`${API_BASE}/admin/llm-config`, configData.config, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      console.log("✅ [APPLY] Configuration appliquée avec succès");
      console.log(`   🌡️ Température: ${configData.config.temperature}`);
      console.log(`   🔧 Max tokens: ${configData.config.maxTokens}`);
      console.log(`   ⏱️ Timeout: ${configData.config.timeoutSeconds}s`);
      return response.data.data;
    }
    
    throw new Error("Failed to apply config");
  } catch (error) {
    console.error("❌ [APPLY] Erreur application config:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Récupérer la configuration actuelle
 */
async function getCurrentConfig(token) {
  try {
    console.log("📥 [GET] Récupération configuration actuelle...");
    
    const response = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error("Failed to get config");
  } catch (error) {
    console.error("❌ [GET] Erreur récupération:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Afficher les configurations disponibles
 */
function listConfigurations() {
  console.log("📋 [LIST] CONFIGURATIONS DISPONIBLES");
  console.log("=".repeat(60));
  
  Object.entries(CONFIGURATIONS).forEach(([key, config]) => {
    console.log(`🔧 ${key.toUpperCase()}: ${config.name}`);
    console.log(`   📝 ${config.description}`);
    console.log(`   🌡️ Température: ${config.config.temperature}`);
    console.log(`   🔧 Max tokens: ${config.config.maxTokens}`);
    console.log(`   ⏱️ Timeout: ${config.config.timeoutSeconds}s`);
    console.log("");
  });
}

/**
 * Afficher la configuration actuelle
 */
async function showCurrentConfig() {
  const token = await loginAdmin();
  if (!token) return;
  
  const config = await getCurrentConfig(token);
  if (!config) return;
  
  console.log("📊 [CURRENT] CONFIGURATION ACTUELLE");
  console.log("=".repeat(50));
  console.log(`🤖 Modèle: ${config.modelName}`);
  console.log(`🌡️ Température: ${config.temperature}`);
  console.log(`🔧 Max tokens: ${config.maxTokens}`);
  console.log(`⏱️ Timeout: ${config.timeoutSeconds}s`);
  console.log(`🧠 Contexte: ${config.numCtx || 'N/A'}`);
  console.log(`📝 Prompt système: ${config.systemPrompt?.substring(0, 80)}...`);
}

// Interface en ligne de commande
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'apply':
    const configName = args[1];
    if (!configName || !CONFIGURATIONS[configName]) {
      console.error("❌ Usage: node optimize-config-v36.mjs apply [current|conservative|balanced|quality]");
      console.error("💡 Utilisez 'list' pour voir les configurations disponibles");
      process.exit(1);
    }
    
    (async () => {
      const token = await loginAdmin();
      if (token) {
        await applyConfiguration(token, configName);
      }
    })();
    break;
    
  case 'list':
    listConfigurations();
    break;
    
  case 'current':
    showCurrentConfig();
    break;
    
  default:
    console.log("🔧 OPTIMISATION CONFIGURATION LLM v36");
    console.log("=====================================");
    console.log("");
    console.log("Commandes disponibles :");
    console.log("  apply [config]            - Appliquer une configuration");
    console.log("  list                      - Lister les configurations disponibles");  
    console.log("  current                   - Afficher la configuration actuelle");
    console.log("");
    console.log("Configurations disponibles : current, conservative, balanced, quality");
    console.log("");
    console.log("Exemples :");
    console.log("  node optimize-config-v36.mjs list");
    console.log("  node optimize-config-v36.mjs current");
    console.log("  node optimize-config-v36.mjs apply conservative  # Recommandé");
    console.log("  node optimize-config-v36.mjs apply balanced     # Risque timeout");
    console.log("");
    console.log("⚠️  IMPORTANT: Toujours créer un backup avant optimisation!");
} 