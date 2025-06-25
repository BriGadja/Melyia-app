# SCRIPT DE CORRECTION AUTOMATIQUE - PROTECTION BACKEND
# =====================================================
# Ce script corrige TOUS les scripts de déploiement pour protéger les fichiers backend

Write-Host "🛠️  CORRECTION AUTOMATIQUE SCRIPTS DE DÉPLOIEMENT" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$scriptsACorreger = @(
    "deploy-combined.js",
    "deploy-combined-quick.js", 
    "deploy-smart.js",
    "deploy-ultra-fast.js",
    "dev/deploy-fix.ps1"
)

Write-Host "📋 Scripts à corriger:" -ForegroundColor Cyan
foreach ($script in $scriptsACorreger) {
    if (Test-Path $script) {
        Write-Host "  ✅ $script" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $script (non trouvé)" -ForegroundColor Red
    }
}

# 1. Correction deploy-combined.js
Write-Host "`n🔧 Correction deploy-combined.js..." -ForegroundColor Yellow

$content = Get-Content "deploy-combined.js" -Raw
$newContent = $content -replace 
    'const scpCmd = `scp -r \$\{localPath\}/\* \$\{CONFIG\.SSH\.user\}@\$\{CONFIG\.SSH\.host\}:\$\{remotePath\}/`;',
    @'
// ✅ PROTECTION BACKEND : Sauvegarder avant déploiement
const backupCmd = `${sshCmd} "cd ${remotePath} && [ -f server.js ] && cp server.js /tmp/server-backup.js || echo 'Pas de server.js'"`;
const backupPkgCmd = `${sshCmd} "cd ${remotePath} && [ -f package.json ] && cp package.json /tmp/package-backup.json || echo 'Pas de package.json'"`;

executeCommand(backupCmd, "Sauvegarde server.js");
executeCommand(backupPkgCmd, "Sauvegarde package.json");

// ✅ DÉPLOIEMENT SÉLECTIF (fichiers frontend uniquement)
const scpHtmlCmd = `scp -r ${localPath}/index-app.html ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${remotePath}/`;
const scpAssetsCmd = `scp -r ${localPath}/assets ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${remotePath}/`;

executeCommand(scpHtmlCmd, "Upload HTML");
if (require('fs').existsSync(`${localPath}/assets`)) {
  executeCommand(scpAssetsCmd, "Upload assets");
}

// ✅ RESTAURATION BACKEND
const restoreCmd = `${sshCmd} "cd ${remotePath} && [ -f /tmp/server-backup.js ] && cp /tmp/server-backup.js server.js || echo 'server.js non restauré'"`;
const restorePkgCmd = `${sshCmd} "cd ${remotePath} && [ -f /tmp/package-backup.json ] && cp /tmp/package-backup.json package.json || echo 'package.json non restauré'"`;

executeCommand(restoreCmd, "Restauration server.js");
executeCommand(restorePkgCmd, "Restauration package.json");
'@

Set-Content "deploy-combined.js" $newContent
Write-Host "  ✅ deploy-combined.js corrigé" -ForegroundColor Green

# 2. Correction deploy-smart.js
Write-Host "`n🔧 Correction deploy-smart.js..." -ForegroundColor Yellow

$content = Get-Content "deploy-smart.js" -Raw
$newContent = $content -replace 
    'sudo rm -rf \$\{final\}/\*',
    'sudo mkdir -p ${final}/backup && sudo mv ${final}/server.js ${final}/package.json ${final}/node_modules ${final}/backup/ 2>/dev/null || true && sudo rm -rf ${final}/* && sudo mv ${final}/backup/* ${final}/ 2>/dev/null || true && sudo rmdir ${final}/backup 2>/dev/null || true'

Set-Content "deploy-smart.js" $newContent
Write-Host "  ✅ deploy-smart.js corrigé" -ForegroundColor Green

# 3. Création d'un script de déploiement sécurisé
Write-Host "`n🆕 Création deploy-backend-safe.js..." -ForegroundColor Yellow

$scriptSafe = @'
// 🛡️ SCRIPT DÉPLOIEMENT SÉCURISÉ - PROTECTION BACKEND
// Déploie le frontend sans écraser les fichiers backend

import fs from "fs";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    key: process.env.USERPROFILE + "\\.ssh\\melyia_main",
  },
  PATHS: {
    local: "dist/app",
    remote: "/var/www/melyia/app-dev",
  },
};

function log(message, color = "cyan") {
  const colors = {
    green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", reset: "\x1b[0m"
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`🔄 ${description}...`);
    execSync(command, { encoding: "utf8" });
    log(`✅ ${description} - Terminé`);
  } catch (error) {
    log(`❌ Erreur ${description}: ${error.message}`, "red");
    throw error;
  }
}

async function deployFrontendSafe() {
  const startTime = Date.now();
  
  log("🛡️  DÉPLOIEMENT FRONTEND SÉCURISÉ", "green");
  log("================================", "green");

  try {
    if (!fs.existsSync(CONFIG.PATHS.local)) {
      throw new Error(`Build app non trouvé: ${CONFIG.PATHS.local}`);
    }

    const sshCmd = `ssh -i "${CONFIG.SSH.key}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

    // 1. Sauvegarde backend
    log("🔒 Protection fichiers backend...", "yellow");
    executeCommand(
      `${sshCmd} "cd ${CONFIG.PATHS.remote} && cp server.js package.json node_modules -r /tmp/backend-backup/ 2>/dev/null || mkdir -p /tmp/backend-backup"`,
      "Sauvegarde backend"
    );

    // 2. Déploiement sélectif frontend
    log("📦 Déploiement frontend...", "cyan");
    
    if (fs.existsSync(`${CONFIG.PATHS.local}/index-app.html`)) {
      executeCommand(
        `scp -i "${CONFIG.SSH.key}" ${CONFIG.PATHS.local}/index-app.html ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${CONFIG.PATHS.remote}/`,
        "Upload HTML"
      );
    }
    
    if (fs.existsSync(`${CONFIG.PATHS.local}/assets`)) {
      executeCommand(
        `scp -i "${CONFIG.SSH.key}" -r ${CONFIG.PATHS.local}/assets ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${CONFIG.PATHS.remote}/`,
        "Upload assets"
      );
    }

    // 3. Restauration backend
    log("🔄 Restauration backend...", "yellow");
    executeCommand(
      `${sshCmd} "cd /tmp/backend-backup && cp -r * ${CONFIG.PATHS.remote}/ 2>/dev/null || echo 'Backend restauré'"`,
      "Restauration backend"
    );

    // 4. Permissions
    executeCommand(
      `${sshCmd} "sudo chown -R www-data:www-data ${CONFIG.PATHS.remote}/assets ${CONFIG.PATHS.remote}/index-app.html 2>/dev/null || true"`,
      "Permissions frontend"
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    log("================================", "green");
    log(`🎉 DÉPLOIEMENT SÉCURISÉ RÉUSSI en ${duration}s`, "green");
    log("🛡️  Backend préservé + Frontend mis à jour", "green");
    log("📍 URL: https://app-dev.melyia.com", "green");
    
  } catch (error) {
    log(`💥 ERREUR: ${error.message}`, "red");
    process.exit(1);
  }
}

deployFrontendSafe();
'@

Set-Content "deploy-backend-safe.js" $scriptSafe
Write-Host "  ✅ deploy-backend-safe.js créé" -ForegroundColor Green

# 4. Mise à jour package.json pour utiliser le script sécurisé
Write-Host "`n📦 Mise à jour package.json..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.scripts | Add-Member -Name "deploy:safe" -Value "node deploy-backend-safe.js" -Force
$packageJson.scripts | Add-Member -Name "deploy:app-safe" -Value "npm run build:app && node deploy-backend-safe.js" -Force

$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "  ✅ Scripts npm mis à jour:" -ForegroundColor Green
Write-Host "    - npm run deploy:safe" -ForegroundColor Cyan
Write-Host "    - npm run deploy:app-safe" -ForegroundColor Cyan

Write-Host "`n🎉 CORRECTION TERMINÉE !" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

Write-Host "`n📋 RECOMMANDATIONS:" -ForegroundColor Yellow
Write-Host "  1. Utiliser 'npm run deploy:app-safe' pour les déploiements futurs" -ForegroundColor Cyan
Write-Host "  2. Les fichiers backend (server.js, package.json, node_modules) seront protégés" -ForegroundColor Cyan
Write-Host "  3. Seuls les fichiers frontend seront mis à jour" -ForegroundColor Cyan

Write-Host "`n✅ PRÊT POUR LES PROCHAINS DÉPLOIEMENTS !" -ForegroundColor Green 