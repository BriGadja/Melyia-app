#!/usr/bin/env pwsh

# =============================================================================
# DÉCLENCHEUR DE DÉPLOIEMENT DEPUIS LOCAL
# =============================================================================
# Script local qui : push → déclenche déploiement serveur

param(
    [string]$CommitMessage = "Auto-deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [string]$Branch = "main",
    [switch]$NoPush,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$serverHost = "melyia-remote"  # Utilise la config SSH optimisée

Write-Host "🚀 DÉPLOIEMENT HYBRIDE MELYIA" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "📍 Commit: $CommitMessage" -ForegroundColor White
Write-Host "🌿 Branche: $Branch" -ForegroundColor White
Write-Host ""

# =============================================================================
# ÉTAPE 1 : PRÉPARATION ET VALIDATION LOCALE
# =============================================================================
Write-Host "📋 ÉTAPE 1 : Préparation locale..." -ForegroundColor Yellow

# Vérifier que nous sommes dans un repo Git
if (!(Test-Path ".git")) {
    Write-Host "❌ Erreur: Pas dans un repository Git" -ForegroundColor Red
    exit 1
}

# Vérifier le status Git
$gitStatus = git status --porcelain
if ($gitStatus -and !$NoPush) {
    Write-Host "📝 Fichiers modifiés détectés:" -ForegroundColor Green
    git status --short
    Write-Host ""
    
    # Add et commit
    Write-Host "💾 Commit des modifications..." -ForegroundColor Cyan
    git add .
    git commit -m $CommitMessage
    
    Write-Host "✅ Commit créé" -ForegroundColor Green
} else {
    Write-Host "✅ Aucune modification à commiter" -ForegroundColor Green
}

# Push vers GitHub
if (!$NoPush) {
    Write-Host "📤 Push vers GitHub..." -ForegroundColor Cyan
    git push origin $Branch
    Write-Host "✅ Code poussé vers GitHub" -ForegroundColor Green
} else {
    Write-Host "⏭️ Push ignoré (flag -NoPush)" -ForegroundColor Yellow
}

# =============================================================================
# ÉTAPE 2 : DÉCLENCHEMENT DU DÉPLOIEMENT SUR SERVEUR
# =============================================================================
Write-Host ""
Write-Host "🎯 ÉTAPE 2 : Déploiement depuis serveur..." -ForegroundColor Yellow

# Uploader le script de déploiement si nécessaire
Write-Host "📤 Upload du script de déploiement..." -ForegroundColor Cyan
scp -o ConnectTimeout=30 "deploy-from-server-git.sh" "${serverHost}:/tmp/deploy-melyia.sh"

# Rendre le script exécutable et le lancer
Write-Host "🚀 Exécution du déploiement sur serveur..." -ForegroundColor Cyan
$deployCommand = @"
chmod +x /tmp/deploy-melyia.sh && /tmp/deploy-melyia.sh deploy $Branch
"@

try {
    $deployResult = ssh -o ConnectTimeout=60 -o ServerAliveInterval=30 $serverHost $deployCommand
    
    Write-Host ""
    Write-Host "📊 RÉSULTAT DU DÉPLOIEMENT:" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    Write-Host $deployResult -ForegroundColor White
    
    # Vérification finale
    Write-Host ""
    Write-Host "🧪 Vérification des sites..." -ForegroundColor Cyan
    
    try {
        $landingTest = Invoke-WebRequest -Uri "https://dev.melyia.com" -UseBasicParsing -TimeoutSec 10
        $appTest = Invoke-WebRequest -Uri "https://app-dev.melyia.com" -UseBasicParsing -TimeoutSec 10
        
        Write-Host "✅ Landing Page: $($landingTest.StatusCode)" -ForegroundColor Green
        Write-Host "✅ Application: $($appTest.StatusCode)" -ForegroundColor Green
        
    } catch {
        Write-Host "⚠️ Erreur de vérification: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "💡 Vérifiez manuellement les sites" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ ERREUR LORS DU DÉPLOIEMENT:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Actions de récupération suggérées:" -ForegroundColor Yellow
    Write-Host "1. Vérifier la connexion SSH: ssh $serverHost" -ForegroundColor White
    Write-Host "2. Vérifier les logs: ssh $serverHost 'pm2 logs melyia-auth-dev'" -ForegroundColor White
    Write-Host "3. Status serveur: ssh $serverHost 'sudo systemctl status nginx'" -ForegroundColor White
    exit 1
}

# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================
Write-Host ""
Write-Host "🎉 DÉPLOIEMENT HYBRIDE TERMINÉ" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "🌐 Sites déployés:" -ForegroundColor White
Write-Host "  📍 Landing: https://dev.melyia.com" -ForegroundColor Cyan
Write-Host "  📍 App: https://app-dev.melyia.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Avantages de cette méthode:" -ForegroundColor White
Write-Host "  ✅ Développement local rapide" -ForegroundColor Green
Write-Host "  ✅ Déploiement depuis serveur (plus de timeouts SSH)" -ForegroundColor Green
Write-Host "  ✅ Code synchronisé via Git" -ForegroundColor Green
Write-Host "  ✅ Workflow automatisé" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Prochaines fois, utilisez simplement:" -ForegroundColor Yellow
Write-Host "  .\deploy-trigger-from-local.ps1" -ForegroundColor White 