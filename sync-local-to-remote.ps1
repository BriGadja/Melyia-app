#!/usr/bin/env pwsh

# =============================================================================
# SYNCHRONISATION LOCALE VERS REMOTE SSH
# =============================================================================
# Copie votre projet local vers le dev-workspace sur serveur

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$serverHost = "melyia-remote"
$remotePath = "/var/www/melyia/dev-workspace"

Write-Host "SYNCHRONISATION LOCALE VERS REMOTE SSH" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Fichiers/dossiers à exclure de la synchronisation
$excludeItems = @(
    "node_modules"
    "dist"
    ".git"
    "*.log"
    "deploy-*.js"
    "diagnostic-*.mjs"
    "ssh-*.txt"
    "audit-*.json"
    "temp-*.txt"
)

Write-Host "Preparation de la synchronisation..." -ForegroundColor Yellow

# Vérifier qu'on est dans le bon dossier
if (!(Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json non trouvé" -ForegroundColor Red
    Write-Host "💡 Exécutez ce script depuis le dossier racine de Melyia" -ForegroundColor Yellow
    exit 1
}

# Créer le workspace distant s'il n'existe pas
Write-Host "🏗️ Création du workspace distant..." -ForegroundColor Cyan
ssh $serverHost "mkdir -p $remotePath"

# Construire les arguments d'exclusion pour rsync
$excludeArgs = @()
foreach ($item in $excludeItems) {
    $excludeArgs += "--exclude=$item"
}

# Synchronisation avec rsync
Write-Host "📦 Synchronisation des fichiers..." -ForegroundColor Cyan
$rsyncCommand = @(
    "rsync"
    "-avz"
    "--delete"
    $excludeArgs
    "./"
    "${serverHost}:${remotePath}/"
)

Write-Host "🔄 Exécution: $($rsyncCommand -join ' ')" -ForegroundColor Gray

try {
    & $rsyncCommand[0] $rsyncCommand[1..($rsyncCommand.Length-1)]
    Write-Host "✅ Synchronisation réussie" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la synchronisation:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Vérification de la synchronisation
Write-Host "🧪 Vérification..." -ForegroundColor Cyan
$remoteFiles = ssh $serverHost "find $remotePath -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.json' | wc -l"
$localFiles = (Get-ChildItem -Recurse -File -Include "*.ts", "*.tsx", "*.js", "*.json" | Measure-Object).Count

Write-Host "📊 Résultats de synchronisation:" -ForegroundColor Green
Write-Host "  📁 Fichiers locaux (TS/JS/JSON): $localFiles" -ForegroundColor White
Write-Host "  📁 Fichiers distants: $remoteFiles" -ForegroundColor White

if ($remoteFiles -gt 50) {
    Write-Host "✅ Synchronisation semble complète" -ForegroundColor Green
} else {
    Write-Host "⚠️ Synchronisation partielle - vérifiez manuellement" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "SYNCHRONISATION TERMINEE" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "Workspace distant: $remotePath" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Connectez-vous via Remote SSH" -ForegroundColor White
Write-Host "2. Ouvrez le dossier: $remotePath" -ForegroundColor White
Write-Host "3. Lancez: npm install" -ForegroundColor White
Write-Host "4. Testez: npm run build:both" -ForegroundColor White
Write-Host ""
Write-Host "Pour resynchroniser apres modifications:" -ForegroundColor Gray
Write-Host "  .\sync-local-to-remote.ps1" -ForegroundColor Gray 