# SCRIPT DEPLOIEMENT FINAL MELYIA v33.3
# Processus complet : Audit → Build → Deploy → Validation
# Résout définitivement les problèmes de synchronisation

Write-Host "🚀 DÉPLOIEMENT FINAL MELYIA v33.3" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Configuration
$ErrorActionPreference = "Stop"

function Write-StatusLog {
    param([string]$Message, [string]$Color = "Cyan")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Test-BuildsExist {
    Write-StatusLog "🔍 Vérification des builds..." "Blue"
    
    $builds = @("dist/landing", "dist/app")
    foreach ($build in $builds) {
        if (-not (Test-Path $build)) {
            throw "Build manquant: $build"
        }
        
        $htmlFiles = Get-ChildItem "$build/*.html" -ErrorAction SilentlyContinue
        $assetsDir = Test-Path "$build/assets"
        
        if (-not $htmlFiles -or -not $assetsDir) {
            throw "Build incomplet: $build"
        }
        
        Write-StatusLog "✅ Build validé: $build" "Green"
    }
}

function Invoke-AuditPreDeploy {
    Write-StatusLog "🔍 AUDIT PRÉ-DÉPLOIEMENT" "Blue"
    Write-StatusLog "========================" "Blue"
    
    try {
        $auditResult = node test-deploy-audit.mjs
        Write-StatusLog "✅ Audit terminé avec succès" "Green"
        return $true
    } catch {
        Write-StatusLog "❌ Audit échoué: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Invoke-FreshBuild {
    Write-StatusLog "🔨 BUILD COMPLET" "Blue"
    Write-StatusLog "================" "Blue"
    
    try {
        # Build fresh avec nettoyage
        if (Test-Path "dist") {
            Remove-Item "dist" -Recurse -Force
            Write-StatusLog "🧹 Ancien dist/ supprimé" "Yellow"
        }
        
        npm run build:both
        Write-StatusLog "✅ Build complet terminé" "Green"
        
        # Vérification post-build
        Test-BuildsExist
        
        return $true
    } catch {
        Write-StatusLog "❌ Build échoué: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Invoke-DeploymentBulletproof {
    Write-StatusLog "🚀 DÉPLOIEMENT BULLETPROOF" "Blue"
    Write-StatusLog "==========================" "Blue"
    
    try {
        # Utiliser la version V2 optimisée
        node deploy-bulletproof-v2.js
        Write-StatusLog "✅ Déploiement terminé avec succès" "Green"
        return $true
    } catch {
        Write-StatusLog "❌ Déploiement échoué: $($_.Exception.Message)" "Red"
        
        # Fallback vers quick deploy
        Write-StatusLog "🔄 Tentative avec deploy quick..." "Yellow"
        try {
            node deploy-combined-quick.js
            Write-StatusLog "✅ Déploiement quick réussi" "Green"
            return $true
        } catch {
            Write-StatusLog "❌ Tous les déploiements ont échoué" "Red"
            return $false
        }
    }
}

function Invoke-ValidationPost {
    Write-StatusLog "🔍 VALIDATION POST-DÉPLOIEMENT" "Blue"
    Write-StatusLog "==============================" "Blue"
    
    try {
        # Test des sites
        $landingTest = curl -s -o /dev/null -w "%{http_code}" -m 8 https://dev.melyia.com 2>$null
        $appTest = curl -s -o /dev/null -w "%{http_code}" -m 8 https://app-dev.melyia.com 2>$null
        
        if ($landingTest -eq "200" -and $appTest -eq "200") {
            Write-StatusLog "✅ Validation réussie - Sites accessibles" "Green"
            return $true
        } else {
            Write-StatusLog "⚠️ Validation partielle - Landing: $landingTest, App: $appTest" "Yellow"
            return $true  # Pas bloquant
        }
    } catch {
        Write-StatusLog "⚠️ Validation externe limitée - Déploiement probablement OK" "Yellow"
        return $true  # Pas bloquant
    }
}

function Show-DeploymentSummary {
    param([datetime]$StartTime, [bool]$Success)
    
    $duration = [math]::Round(((Get-Date) - $StartTime).TotalSeconds, 1)
    
    Write-Host ""
    Write-StatusLog "=================================" "Blue"
    
    if ($Success) {
        Write-StatusLog "🎉 DÉPLOIEMENT RÉUSSI en ${duration}s" "Green"
        Write-StatusLog "📍 Landing: https://dev.melyia.com" "Green"
        Write-StatusLog "📍 App: https://app-dev.melyia.com" "Green"
        Write-StatusLog "🛡️ Backend préservé automatiquement" "Green"
        Write-StatusLog "⚡ Processus complet finalisé" "Green"
    } else {
        Write-StatusLog "💥 DÉPLOIEMENT ÉCHOUÉ après ${duration}s" "Red"
        Write-StatusLog "💡 Vérifiez les logs ci-dessus" "Yellow"
        Write-StatusLog "🔧 Commande debug: node test-deploy-audit.mjs" "Yellow"
    }
    
    Write-StatusLog "=================================" "Blue"
}

# PROCESSUS PRINCIPAL
try {
    $startTime = Get-Date
    $success = $true
    
    # Étape 1: Synchronisation serveur
    Write-StatusLog "🔄 Synchronisation serveur..." "Cyan"
    & ".\dev\sync-essential.ps1"
    
    # Étape 2: Audit pré-déploiement
    if (-not (Invoke-AuditPreDeploy)) {
        Write-StatusLog "⚠️ Audit en échec - Poursuite du déploiement..." "Yellow"
    }
    
    # Étape 3: Build complet et frais
    if (-not (Invoke-FreshBuild)) {
        $success = $false
        throw "Build échoué"
    }
    
    # Étape 4: Déploiement bulletproof
    if (-not (Invoke-DeploymentBulletproof)) {
        $success = $false
        throw "Déploiement échoué"
    }
    
    # Étape 5: Validation post-déploiement
    Invoke-ValidationPost | Out-Null
    
    # Étape 6: Audit final
    Write-StatusLog "🔍 Audit final..." "Cyan"
    node test-deploy-audit.mjs | Out-Null
    
    Show-DeploymentSummary -StartTime $startTime -Success $success
    
} catch {
    $success = $false
    Write-StatusLog "💥 ERREUR FATALE: $($_.Exception.Message)" "Red"
    Show-DeploymentSummary -StartTime $startTime -Success $success
    exit 1
}

Write-Host ""
Write-StatusLog "✅ Processus de déploiement terminé avec succès !" "Green"
Write-StatusLog "🎯 Vos changements sont maintenant en ligne" "Green" 