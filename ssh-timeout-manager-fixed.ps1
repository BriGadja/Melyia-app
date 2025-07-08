# 🔧 SSH TIMEOUT MANAGER - SOLUTION COMPLÈTE (Version corrigée)
# Script PowerShell pour gérer les timeouts SSH et optimiser les déploiements

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("diagnostic", "deploy", "test", "help")]
    [string]$Action = "help",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Configuration
$CONFIG = @{
    SSH = @{
        Host = "51.91.145.255"
        User = "ubuntu"
        KeyPath = "$env:USERPROFILE\.ssh\melyia_main"
    }
    Scripts = @{
        Diagnostic = "diagnostic-ssh-timeouts.mjs"
        Deploy = "deploy-ssh-optimized.mjs"
        Build = "npm run build"
    }
    Colors = @{
        Green = "Green"
        Red = "Red"
        Yellow = "Yellow"
        Cyan = "Cyan"
        Blue = "Blue"
        Magenta = "Magenta"
        White = "White"
    }
}

function Write-ColorLog {
    param([string]$Message, [string]$Color = "White")
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $CONFIG.Colors[$Color]
}

function Test-Prerequisites {
    Write-ColorLog "🔍 Vérification des prérequis..." "Blue"
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version
        Write-ColorLog "✅ Node.js: $nodeVersion" "Green"
    }
    catch {
        Write-ColorLog "❌ Node.js non installé" "Red"
        return $false
    }
    
    # Vérifier npm
    try {
        $npmVersion = npm --version
        Write-ColorLog "✅ npm: $npmVersion" "Green"
    }
    catch {
        Write-ColorLog "❌ npm non installé" "Red"
        return $false
    }
    
    # Vérifier la clé SSH
    if (Test-Path $CONFIG.SSH.KeyPath) {
        Write-ColorLog "✅ Clé SSH trouvée: $($CONFIG.SSH.KeyPath)" "Green"
    }
    else {
        Write-ColorLog "⚠️ Clé SSH non trouvée: $($CONFIG.SSH.KeyPath)" "Yellow"
        Write-ColorLog "💡 Le script utilisera l'agent SSH par défaut" "Yellow"
    }
    
    return $true
}

function Start-SSHDiagnostic {
    Write-ColorLog "🔍 DIAGNOSTIC SSH TIMEOUT" "Magenta"
    Write-ColorLog "=========================" "Magenta"
    
    if (!(Test-Path $CONFIG.Scripts.Diagnostic)) {
        Write-ColorLog "❌ Script de diagnostic manquant: $($CONFIG.Scripts.Diagnostic)" "Red"
        Write-ColorLog "💡 Veuillez régénérer le script de diagnostic" "Yellow"
        return $false
    }
    
    Write-ColorLog "🚀 Lancement du diagnostic complet..." "Blue"
    
    try {
        # Exécuter le diagnostic
        $result = Start-Process -FilePath "node" -ArgumentList $CONFIG.Scripts.Diagnostic -Wait -PassThru -NoNewWindow
        
        if ($result.ExitCode -eq 0) {
            Write-ColorLog "✅ Diagnostic terminé avec succès" "Green"
            
            # Chercher le rapport généré
            $reportFiles = Get-ChildItem -Name "audit-ssh-timeouts-*.json" -ErrorAction SilentlyContinue
            if ($reportFiles.Count -gt 0) {
                $latestReport = $reportFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                Write-ColorLog "📄 Rapport généré: $latestReport" "Green"
                
                # Afficher un résumé du rapport
                try {
                    $report = Get-Content $latestReport | ConvertFrom-Json
                    Write-ColorLog "📊 Résumé: $($report.summary.successfulTests)/$($report.summary.totalTests) tests réussis" "Green"
                    
                    if ($report.analysis.issues.Count -gt 0) {
                        Write-ColorLog "🚨 Problèmes détectés:" "Red"
                        foreach ($issue in $report.analysis.issues) {
                            Write-ColorLog "  - $issue" "Red"
                        }
                    }
                    
                    if ($report.analysis.recommendations.Count -gt 0) {
                        Write-ColorLog "💡 Recommandations:" "Yellow"
                        foreach ($rec in $report.analysis.recommendations) {
                            Write-ColorLog "  - $rec" "Yellow"
                        }
                    }
                }
                catch {
                    Write-ColorLog "⚠️ Impossible de lire le rapport détaillé" "Yellow"
                }
            }
            
            return $true
        }
        else {
            Write-ColorLog "❌ Diagnostic échoué (code: $($result.ExitCode))" "Red"
            return $false
        }
    }
    catch {
        Write-ColorLog "❌ Erreur lors du diagnostic: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Start-OptimizedDeployment {
    Write-ColorLog "🚀 DÉPLOIEMENT SSH OPTIMISÉ" "Magenta"
    Write-ColorLog "============================" "Magenta"
    
    if (!(Test-Path $CONFIG.Scripts.Deploy)) {
        Write-ColorLog "❌ Script de déploiement manquant: $($CONFIG.Scripts.Deploy)" "Red"
        Write-ColorLog "💡 Veuillez régénérer le script de déploiement" "Yellow"
        return $false
    }
    
    # Vérifier les builds
    $buildsExist = (Test-Path "dist/landing") -and (Test-Path "dist/app")
    
    if (!$buildsExist) {
        Write-ColorLog "🔧 Builds manquants, génération..." "Blue"
        
        try {
            $buildResult = Start-Process -FilePath "npm" -ArgumentList "run", "build" -Wait -PassThru -NoNewWindow
            
            if ($buildResult.ExitCode -ne 0) {
                Write-ColorLog "❌ Échec de la génération des builds" "Red"
                return $false
            }
            
            Write-ColorLog "✅ Builds générés avec succès" "Green"
        }
        catch {
            Write-ColorLog "❌ Erreur lors de la génération: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    Write-ColorLog "🚀 Lancement du déploiement optimisé..." "Blue"
    
    try {
        # Exécuter le déploiement
        $result = Start-Process -FilePath "node" -ArgumentList $CONFIG.Scripts.Deploy -Wait -PassThru -NoNewWindow
        
        if ($result.ExitCode -eq 0) {
            Write-ColorLog "✅ Déploiement terminé avec succès" "Green"
            Write-ColorLog "🎯 Optimisations anti-timeout appliquées" "Magenta"
            Write-ColorLog "📍 Landing: https://dev.melyia.com" "White"
            Write-ColorLog "📍 App: https://app-dev.melyia.com" "White"
            return $true
        }
        else {
            Write-ColorLog "❌ Déploiement échoué (code: $($result.ExitCode))" "Red"
            Write-ColorLog "💡 Utilisez le diagnostic pour analyser le problème" "Yellow"
            return $false
        }
    }
    catch {
        Write-ColorLog "❌ Erreur lors du déploiement: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Start-SSHTest {
    Write-ColorLog "🌐 TEST SSH RAPIDE" "Magenta"
    Write-ColorLog "==================" "Magenta"
    
    $sshCommand = "ssh -o ConnectTimeout=30 -o BatchMode=yes $($CONFIG.SSH.User)@$($CONFIG.SSH.Host) `"echo SSH-TEST-OK; date; uptime`""
    
    if (Test-Path $CONFIG.SSH.KeyPath) {
        $sshCommand = "ssh -o ConnectTimeout=30 -o BatchMode=yes -i `"$($CONFIG.SSH.KeyPath)`" $($CONFIG.SSH.User)@$($CONFIG.SSH.Host) `"echo SSH-TEST-OK; date; uptime`""
    }
    
    Write-ColorLog "🔄 Test de connexion SSH..." "Blue"
    
    try {
        $result = Invoke-Expression $sshCommand
        Write-ColorLog "✅ Connexion SSH réussie" "Green"
        Write-ColorLog "📊 Réponse serveur:" "Blue"
        Write-ColorLog "$result" "White"
        return $true
    }
    catch {
        Write-ColorLog "❌ Échec de la connexion SSH" "Red"
        Write-ColorLog "💡 Vérifiez la connectivité réseau et les clés SSH" "Yellow"
        return $false
    }
}

function Show-Help {
    Write-ColorLog "🔧 SSH TIMEOUT MANAGER - AIDE" "Magenta"
    Write-ColorLog "==============================" "Magenta"
    Write-ColorLog ""
    Write-ColorLog "UTILISATION:" "Blue"
    Write-ColorLog "  .\ssh-timeout-manager-fixed.ps1 -Action <action> [options]" "White"
    Write-ColorLog ""
    Write-ColorLog "ACTIONS DISPONIBLES:" "Blue"
    Write-ColorLog "  diagnostic    - Analyser les problèmes SSH et timeouts" "White"
    Write-ColorLog "  deploy       - Déployer avec optimisations anti-timeout" "White"
    Write-ColorLog "  test         - Test rapide de connexion SSH" "White"
    Write-ColorLog "  help         - Afficher cette aide" "White"
    Write-ColorLog ""
    Write-ColorLog "OPTIONS:" "Blue"
    Write-ColorLog "  -Force       - Forcer l'exécution sans confirmation" "White"
    Write-ColorLog "  -Verbose     - Affichage détaillé" "White"
    Write-ColorLog ""
    Write-ColorLog "EXEMPLES:" "Blue"
    Write-ColorLog "  .\ssh-timeout-manager-fixed.ps1 -Action diagnostic" "White"
    Write-ColorLog "  .\ssh-timeout-manager-fixed.ps1 -Action deploy -Force" "White"
    Write-ColorLog "  .\ssh-timeout-manager-fixed.ps1 -Action test -Verbose" "White"
    Write-ColorLog ""
    Write-ColorLog "OPTIMISATIONS INCLUSES:" "Green"
    Write-ColorLog "  ✅ ConnectTimeout augmenté à 60s" "Green"
    Write-ColorLog "  ✅ ServerAliveInterval configuré" "Green"
    Write-ColorLog "  ✅ Compression SSH activée" "Green"
    Write-ColorLog "  ✅ Retry automatique avec backoff" "Green"
    Write-ColorLog "  ✅ Phases de déploiement optimisées" "Green"
    Write-ColorLog "  ✅ Diagnostic complet des problèmes" "Green"
    Write-ColorLog ""
}

function Start-CleanupOldReports {
    Write-ColorLog "🧹 Nettoyage des anciens rapports..." "Blue"
    
    $reportFiles = Get-ChildItem -Name "audit-ssh-timeouts-*.json" -ErrorAction SilentlyContinue
    $reportCount = $reportFiles.Count
    
    if ($reportCount -gt 5) {
        $filesToDelete = $reportFiles | Sort-Object LastWriteTime | Select-Object -First ($reportCount - 5)
        
        foreach ($file in $filesToDelete) {
            Remove-Item $file -Force
            Write-ColorLog "🗑️ Supprimé: $file" "Yellow"
        }
    }
    
    Write-ColorLog "✅ Nettoyage terminé" "Green"
}

# FONCTION PRINCIPALE
function Main {
    Write-ColorLog "🔧 SSH TIMEOUT MANAGER v1.0" "Magenta"
    Write-ColorLog "Configuration: $($CONFIG.SSH.User)@$($CONFIG.SSH.Host)" "Blue"
    Write-ColorLog ""
    
    # Vérifier les prérequis
    if (!(Test-Prerequisites)) {
        Write-ColorLog "❌ Prérequis non satisfaits" "Red"
        exit 1
    }
    
    # Nettoyage des anciens rapports
    Start-CleanupOldReports
    
    # Exécuter l'action demandée
    switch ($Action) {
        "diagnostic" {
            $success = Start-SSHDiagnostic
            if (!$success) { exit 1 }
        }
        "deploy" {
            if (!$Force) {
                $confirmation = Read-Host "Confirmer le déploiement optimisé? (y/N)"
                if ($confirmation -ne "y" -and $confirmation -ne "Y") {
                    Write-ColorLog "❌ Déploiement annulé" "Yellow"
                    exit 0
                }
            }
            $success = Start-OptimizedDeployment
            if (!$success) { exit 1 }
        }
        "test" {
            $success = Start-SSHTest
            if (!$success) { exit 1 }
        }
        "help" {
            Show-Help
        }
        default {
            Write-ColorLog "❌ Action inconnue: $Action" "Red"
            Show-Help
            exit 1
        }
    }
    
    Write-ColorLog ""
    Write-ColorLog "🎉 Opération terminée avec succès" "Green"
}

# Lancement du script principal
Main 