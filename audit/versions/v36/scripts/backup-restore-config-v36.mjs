#!/usr/bin/env node

/**
 * BACKUP & RESTORE CONFIGURATION LLM v36
 * ====================================== 
 * Sauvegarde et restauration sécurisée des configurations
 * pour permettre rollback pendant les optimisations
 */

import axios from "axios";
import fs from "fs";
import path from "path";

const API_BASE = "https://app-dev.melyia.com/api";
const BACKUP_DIR = "./audit/versions/v36/config-backups";

// Créer le dossier de backup s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

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
 * Récupérer la configuration LLM actuelle
 */
async function getConfigurationLLM(token) {
  try {
    console.log("📥 [CONFIG] Récupération configuration actuelle...");
    
    const response = await axios.get(`${API_BASE}/admin/llm-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      console.log("✅ [CONFIG] Configuration récupérée avec succès");
      return response.data.data;
    }
    
    throw new Error("Failed to get config");
  } catch (error) {
    console.error("❌ [CONFIG] Erreur récupération:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Sauvegarder la configuration actuelle
 */
async function backupConfig() {
  try {
    console.log("💾 [BACKUP] DÉBUT SAUVEGARDE CONFIGURATION");
    console.log("=".repeat(50));
    
    const token = await loginAdmin();
    if (!token) throw new Error("Échec authentification admin");
    
    const config = await getConfigurationLLM(token);
    if (!config) throw new Error("Échec récupération configuration");
    
    // Créer le fichier de backup avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `config-backup-${timestamp}.json`);
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "v36_backup",
      source: "production_llm_settings",
      config: config,
      metadata: {
        backup_reason: "Avant optimisations qualité v36",
        rollback_instructions: "Utiliser 'npm run restore-config [fichier]' pour restaurer"
      }
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log("✅ [BACKUP] Configuration sauvegardée :");
    console.log(`   📁 Fichier: ${backupFile}`);
    console.log(`   🤖 Modèle: ${config.modelName}`);
    console.log(`   🌡️ Température: ${config.temperature}`);
    console.log(`   🔧 Max tokens: ${config.maxTokens}`);
    console.log(`   ⏱️ Timeout: ${config.timeoutSeconds}s`);
    
    return backupFile;
    
  } catch (error) {
    console.error("❌ [BACKUP] Erreur sauvegarde:", error.message);
    return null;
  }
}

/**
 * Mettre à jour la configuration LLM
 */
async function updateConfigurationLLM(token, newConfig) {
  try {
    console.log("📤 [UPDATE] Mise à jour configuration...");
    
    const response = await axios.put(`${API_BASE}/admin/llm-config`, newConfig, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      console.log("✅ [UPDATE] Configuration mise à jour avec succès");
      return response.data.data;
    }
    
    throw new Error("Failed to update config");
  } catch (error) {
    console.error("❌ [UPDATE] Erreur mise à jour:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Restaurer une configuration depuis un backup
 */
async function restoreConfig(backupFile) {
  try {
    console.log("♻️ [RESTORE] DÉBUT RESTAURATION CONFIGURATION");
    console.log("=".repeat(50));
    console.log(`📁 [RESTORE] Fichier: ${backupFile}`);
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Fichier de backup non trouvé: ${backupFile}`);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const configToRestore = backupData.config;
    
    console.log(`🕐 [RESTORE] Backup du: ${backupData.timestamp}`);
    console.log(`📝 [RESTORE] Raison: ${backupData.metadata?.backup_reason || 'Non spécifiée'}`);
    
    const token = await loginAdmin();
    if (!token) throw new Error("Échec authentification admin");
    
    const restoredConfig = await updateConfigurationLLM(token, configToRestore);
    if (!restoredConfig) throw new Error("Échec restauration configuration");
    
    console.log("✅ [RESTORE] Configuration restaurée avec succès :");
    console.log(`   🤖 Modèle: ${restoredConfig.modelName}`);
    console.log(`   🌡️ Température: ${restoredConfig.temperature}`);
    console.log(`   🔧 Max tokens: ${restoredConfig.maxTokens}`);
    console.log(`   ⏱️ Timeout: ${restoredConfig.timeoutSeconds}s`);
    
    return restoredConfig;
    
  } catch (error) {
    console.error("❌ [RESTORE] Erreur restauration:", error.message);
    return null;
  }
}

/**
 * Lister les backups disponibles
 */
function listBackups() {
  try {
    console.log("📋 [LIST] BACKUPS DISPONIBLES");
    console.log("=".repeat(50));
    
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('config-backup-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Plus récent en premier
    
    if (files.length === 0) {
      console.log("ℹ️ [LIST] Aucun backup trouvé");
      return [];
    }
    
    files.forEach((file, index) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`${index + 1}. ${file}`);
      console.log(`   📅 Date: ${new Date(stats.mtime).toLocaleString('fr-FR')}`);
      console.log(`   🤖 Modèle: ${backupData.config?.modelName || 'N/A'}`);
      console.log(`   📝 Raison: ${backupData.metadata?.backup_reason || 'N/A'}`);
      console.log("");
    });
    
    return files.map(file => path.join(BACKUP_DIR, file));
    
  } catch (error) {
    console.error("❌ [LIST] Erreur listage backups:", error.message);
    return [];
  }
}

// Interface en ligne de commande
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'backup':
    backupConfig();
    break;
    
  case 'restore':
    const backupFile = args[1];
    if (!backupFile) {
      console.error("❌ Usage: node backup-restore-config-v36.mjs restore [fichier-backup]");
      process.exit(1);
    }
    restoreConfig(backupFile);
    break;
    
  case 'list':
    listBackups();
    break;
    
  default:
    console.log("🛠️ BACKUP & RESTORE CONFIGURATION LLM v36");
    console.log("============================================");
    console.log("");
    console.log("Commandes disponibles :");
    console.log("  backup                    - Sauvegarder la config actuelle");
    console.log("  restore [fichier]         - Restaurer une config");
    console.log("  list                      - Lister les backups disponibles");
    console.log("");
    console.log("Exemples :");
    console.log("  node backup-restore-config-v36.mjs backup");
    console.log("  node backup-restore-config-v36.mjs list");
    console.log("  node backup-restore-config-v36.mjs restore config-backup-2025-07-08T11-30-00-000Z.json");
} 