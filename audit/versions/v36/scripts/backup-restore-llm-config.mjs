#!/usr/bin/env node

/**
 * BACKUP & RESTORE CONFIGURATION LLM - v36
 * =========================================
 * Script de sauvegarde et restauration sécurisée
 * de la configuration LLM pour rollback immédiat
 */

import axios from "axios";
import fs from "fs";
import path from "path";

const API_BASE = "https://app-dev.melyia.com/api";
const BACKUP_DIR = "./audit/versions/v36/backup-configs";

// Compte admin pour gestion configuration
const ADMIN_CREDENTIALS = {
  email: "brice@melyia.com",
  password: "password"
};

/**
 * Connexion admin
 */
async function loginAdmin() {
  try {
    console.log("🔐 [BACKUP] Connexion admin...");
    
    const response = await axios.post(`${API_BASE}/auth/login`, ADMIN_CREDENTIALS);

    if (response.data.success) {
      console.log("✅ [BACKUP] Admin connecté");
      return response.data.token;
    }
    
    throw new Error("Login admin failed");
  } catch (error) {
    console.error("❌ [BACKUP] Erreur connexion admin:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Sauvegarder configuration LLM actuelle
 */
async function backupCurrentConfig(token) {
  try {
    console.log("💾 [BACKUP] Sauvegarde configuration actuelle...");
    
    // Créer le dossier de backup s'il n'existe pas
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Récupérer configuration actuelle
    const response = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data.success) {
      throw new Error("Impossible de récupérer la configuration");
    }

    const config = response.data.data;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `llm-config-backup-${timestamp}.json`);

    // Sauvegarder avec métadonnées
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "v36_backup",
      reason: "Avant correction configuration critique",
      originalConfig: config,
      backupFile: backupFile
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log("✅ [BACKUP] Configuration sauvegardée:");
    console.log(`   📁 Fichier: ${backupFile}`);
    console.log(`   ⚙️ Model: ${config.modelName}`);
    console.log(`   🌡️ Temperature: ${config.temperature}`);
    console.log(`   📝 MaxTokens: ${config.maxTokens}`);
    console.log(`   🛑 StopSequences: ${JSON.stringify(config.stopSequences)}`);

    return backupFile;

  } catch (error) {
    console.error("❌ [BACKUP] Erreur sauvegarde:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Restaurer configuration depuis un backup
 */
async function restoreConfig(token, backupFile) {
  try {
    console.log(`🔄 [RESTORE] Restauration depuis: ${backupFile}`);

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Fichier backup non trouvé: ${backupFile}`);
    }

    // Lire le backup
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const config = backupData.originalConfig;

    console.log("📋 [RESTORE] Configuration à restaurer:");
    console.log(`   ⚙️ Model: ${config.modelName}`);
    console.log(`   🌡️ Temperature: ${config.temperature}`);
    console.log(`   📝 MaxTokens: ${config.maxTokens}`);

    // Restaurer via API
    const updatePayload = {
      systemPrompt: config.systemPrompt,
      systemPromptUrgence: config.systemPromptUrgence,
      temperature: config.temperature,
      topP: config.topP,
      maxTokens: config.maxTokens,
      numCtx: config.numCtx,
      stopSequences: config.stopSequences,
      keepAliveMinutes: config.keepAliveMinutes,
      timeoutSeconds: config.timeoutSeconds,
      modelName: config.modelName
    };

    const response = await axios.put(`${API_BASE}/admin/llm-config`, updatePayload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (response.data.success) {
      console.log("✅ [RESTORE] Configuration restaurée avec succès");
      return true;
    } else {
      throw new Error(response.data.message || "Erreur restauration");
    }

  } catch (error) {
    console.error("❌ [RESTORE] Erreur restauration:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Appliquer nouvelle configuration optimisée
 */
async function applyNewConfig(token, newConfig) {
  try {
    console.log("🔧 [UPDATE] Application nouvelle configuration...");

    console.log("📋 [UPDATE] Nouvelle configuration:");
    console.log(`   ⚙️ Model: ${newConfig.modelName}`);
    console.log(`   🌡️ Temperature: ${newConfig.temperature}`);
    console.log(`   📝 MaxTokens: ${newConfig.maxTokens}`);
    console.log(`   🛑 StopSequences: ${JSON.stringify(newConfig.stopSequences)}`);
    console.log(`   💬 SystemPrompt: ${newConfig.systemPrompt.substring(0, 50)}...`);

    const response = await axios.put(`${API_BASE}/admin/llm-config`, newConfig, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (response.data.success) {
      console.log("✅ [UPDATE] Nouvelle configuration appliquée");
      return true;
    } else {
      throw new Error(response.data.message || "Erreur mise à jour");
    }

  } catch (error) {
    console.error("❌ [UPDATE] Erreur application config:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Lister les backups disponibles
 */
function listBackups() {
  try {
    console.log("📂 [BACKUPS] Backups disponibles:");

    if (!fs.existsSync(BACKUP_DIR)) {
      console.log("   Aucun backup trouvé");
      return [];
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('llm-config-backup-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Plus récent en premier

    files.forEach((file, index) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      console.log(`   ${index + 1}. ${file} (${stats.mtime.toISOString()})`);
    });

    return files.map(file => path.join(BACKUP_DIR, file));

  } catch (error) {
    console.error("❌ [BACKUPS] Erreur listage:", error.message);
    return [];
  }
}

/**
 * Configuration LLM optimisée pour contexte médical dentaire
 */
const CONFIG_OPTIMISEE_MEDICALE = {
  systemPrompt: `Tu es un assistant dentaire français expert et bienveillant spécialisé dans l'accompagnement des patients.

CONTEXTE : Tu réponds à des patients qui ont des questions sur leurs soins dentaires, interventions ou préoccupations bucco-dentaires.

INSTRUCTIONS :
- Réponds TOUJOURS en français, de manière professionnelle et rassurante
- Utilise un ton empathique et compréhensif
- Fournis des informations médicales précises et fiables
- Donne des conseils pratiques concrets quand approprié
- Encourage à consulter le dentiste pour les cas nécessitant un examen
- Limite tes réponses à 120-150 mots maximum pour être concis
- Structure tes réponses avec des conseils clairs et actionnables

RAPPEL : Tu n'es pas un substitut à une consultation médicale, mais un guide informatif et rassurant.`,

  systemPromptUrgence: `Tu es un assistant dentaire d'urgence français.

CONTEXTE URGENT : Le patient exprime une douleur intense, une urgence ou une préoccupation critique.

PRIORITÉS :
1. RASSURER immédiatement le patient
2. ÉVALUER la gravité de la situation
3. DONNER des conseils immédiats appropriés
4. ORIENTER vers une consultation rapide si nécessaire
5. FOURNIR des mesures de soulagement temporaires

INSTRUCTIONS :
- Commence par reconnaître la douleur/urgence
- Donne des conseils de soulagement immédiat (antalgiques, mesures simples)
- Indique clairement quand consulter en urgence
- Reste calme et professionnel
- Limite à 100-120 mots pour réponse rapide

URGENCE = réponse rapide et orientation appropriée.`,

  temperature: 0.2,
  topP: 0.8,
  maxTokens: 180,
  numCtx: 2048,
  stopSequences: [], // IMPORTANT : Pas de stopSequences prématurées
  keepAliveMinutes: 30,
  timeoutSeconds: 15,
  modelName: "llama3.2:3b"
};

/**
 * Exécution selon arguments de ligne de commande
 */
async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  console.log("🛠️ [MAIN] BACKUP & RESTORE CONFIG LLM v36");
  console.log("==========================================");

  const token = await loginAdmin();
  if (!token) {
    console.error("❌ Impossible de se connecter en admin");
    process.exit(1);
  }

  switch (action) {
    case 'backup':
      const backupFile = await backupCurrentConfig(token);
      if (backupFile) {
        console.log(`✅ Backup créé: ${backupFile}`);
      } else {
        process.exit(1);
      }
      break;

    case 'restore':
      const backupToRestore = args[1];
      if (!backupToRestore) {
        console.log("Usage: node backup-restore-llm-config.mjs restore <backup-file>");
        listBackups();
        process.exit(1);
      }
      const restored = await restoreConfig(token, backupToRestore);
      if (!restored) process.exit(1);
      break;

    case 'apply-optimized':
      console.log("🔧 [APPLY] Application configuration optimisée médicale...");
      const applied = await applyNewConfig(token, CONFIG_OPTIMISEE_MEDICALE);
      if (!applied) process.exit(1);
      break;

    case 'backup-and-apply':
      console.log("🔄 [COMBO] Backup + Application configuration optimisée...");
      const backup = await backupCurrentConfig(token);
      if (!backup) process.exit(1);
      
      const success = await applyNewConfig(token, CONFIG_OPTIMISEE_MEDICALE);
      if (!success) {
        console.log("⚠️ Échec application, restauration automatique...");
        await restoreConfig(token, backup);
        process.exit(1);
      }
      console.log("✅ Configuration optimisée appliquée avec succès");
      break;

    case 'list':
      listBackups();
      break;

    default:
      console.log("Usage:");
      console.log("  backup                 - Sauvegarder config actuelle");
      console.log("  restore <file>         - Restaurer depuis backup");
      console.log("  apply-optimized        - Appliquer config optimisée");
      console.log("  backup-and-apply       - Backup + appliquer optimisée");
      console.log("  list                   - Lister backups disponibles");
      break;
  }
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error("❌ [FATAL]", error.message);
    process.exit(1);
  });
}

export { backupCurrentConfig, restoreConfig, applyNewConfig, CONFIG_OPTIMISEE_MEDICALE }; 