// 🚀 DÉPLOIEMENT WEBHOOK APPLICATION - GitHub Actions v35.0
// Envoie les fichiers de dist/app/ au webhook du serveur

import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

const CONFIG = {
  WEBHOOK_URL: "https://app-dev.melyia.com/hooks/deploy",
  SOURCE_DIR: "dist/app",
  TARGET_SITE: "app-dev.melyia.com",
  WEBHOOK_TOKEN: process.env.VITE_WEBHOOK_TOKEN,
};

function log(message, color = "cyan") {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    blue: "\x1b[34m",
    reset: "\x1b[0m",
  };
  
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function validateToken() {
  if (!CONFIG.WEBHOOK_TOKEN) {
    log("❌ ERREUR: VITE_WEBHOOK_TOKEN non défini", "red");
    log("💡 Configurez le secret dans GitHub Actions", "yellow");
    process.exit(1);
  }
  log("✅ Token webhook configuré", "green");
}

function validateBuild() {
  if (!fs.existsSync(CONFIG.SOURCE_DIR)) {
    log(`❌ ERREUR: Répertoire ${CONFIG.SOURCE_DIR} non trouvé`, "red");
    log("💡 Exécutez d'abord: npm run build:app", "yellow");
    process.exit(1);
  }
  
  const files = fs.readdirSync(CONFIG.SOURCE_DIR);
  const hasIndex = files.includes("index.html");
  const hasAssets = fs.existsSync(path.join(CONFIG.SOURCE_DIR, "assets"));
  
  if (!hasIndex || !hasAssets) {
    log(`❌ ERREUR: Build incomplete dans ${CONFIG.SOURCE_DIR}`, "red");
    log(`   - index.html: ${hasIndex ? "✅" : "❌"}`, hasIndex ? "green" : "red");
    log(`   - assets/: ${hasAssets ? "✅" : "❌"}`, hasAssets ? "green" : "red");
    process.exit(1);
  }
  
  log(`✅ Build validé: ${files.length} fichiers`, "green");
}

function getAllFiles(dir, basePath = "") {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else {
      files.push({
        filepath: fullPath,
        name: relativePath.replace(/\\/g, "/"), // Normaliser les chemins
      });
    }
  }
  
  return files;
}

async function deployViaWebhook() {
  try {
    log("🚀 Déploiement Application via webhook...", "blue");
    
    // Collecter tous les fichiers
    const files = getAllFiles(CONFIG.SOURCE_DIR);
    log(`📁 ${files.length} fichiers à déployer`, "cyan");
    
    // Préparer FormData
    const formData = new FormData();
    formData.append("site", "app");
    formData.append("target", CONFIG.TARGET_SITE);
    
    // Ajouter tous les fichiers
    for (const file of files) {
      const fileBuffer = fs.readFileSync(file.filepath);
      formData.append("files", fileBuffer, {
        filename: file.name,
        contentType: file.name.endsWith(".html") ? "text/html" : 
                     file.name.endsWith(".js") ? "application/javascript" :
                     file.name.endsWith(".css") ? "text/css" :
                     "application/octet-stream"
      });
      log(`  📄 ${file.name}`, "cyan");
    }
    
    // Envoyer la requête
    log("📤 Envoi vers le serveur...", "blue");
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.WEBHOOK_TOKEN}`,
      },
      body: formData,
      timeout: 30000, // 30 secondes
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      log("✅ DÉPLOIEMENT APPLICATION RÉUSSI !", "green");
      log(`🔐 Site: https://${CONFIG.TARGET_SITE}`, "green");
      log(`📊 Fichiers déployés: ${result.files?.length || files.length}`, "green");
      if (result.structure) {
        log(`📁 Structure: ${result.structure.deployPath}`, "cyan");
        log(`🎯 Assets: ${result.structure.assetsCount} fichiers`, "cyan");
      }
      log("⚠️ Backend préservé automatiquement", "yellow");
    } else {
      throw new Error(`Webhook error: ${result.message || response.statusText}`);
    }
    
  } catch (error) {
    log(`❌ ERREUR DÉPLOIEMENT: ${error.message}`, "red");
    
    if (error.code === "ECONNREFUSED") {
      log("💡 Serveur inaccessible - vérifiez la connectivité", "yellow");
    } else if (error.code === "ETIMEDOUT") {
      log("💡 Timeout - réessayez dans quelques minutes", "yellow");
    } else if (error.message.includes("401")) {
      log("💡 Token invalide - vérifiez VITE_WEBHOOK_TOKEN", "yellow");
    }
    
    process.exit(1);
  }
}

async function main() {
  try {
    log("🚀 DÉPLOIEMENT WEBHOOK APPLICATION v35.0", "green");
    log("=".repeat(50), "cyan");
    
    validateToken();
    validateBuild();
    await deployViaWebhook();
    
    log("=".repeat(50), "cyan");
    log("🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !", "green");
    
  } catch (error) {
    log(`💥 ERREUR FATALE: ${error.message}`, "red");
    process.exit(1);
  }
}

main(); 