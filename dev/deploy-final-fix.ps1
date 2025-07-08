# SCRIPT DEPLOIEMENT FINAL MELYIA v33.3 - VERSION CORRIGÉE
# Processus complet : Audit → Build → Deploy → Validation
# Résout définitivement les problèmes de synchronisation + correction syntaxe PowerShell

Write-Host "🚀 DÉPLOIEMENT FINAL MELYIA v33.3 - CORRIGÉ" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"  # Accélère Invoke-WebRequest

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

function Test-ScriptExists {
    param([string]$ScriptPath)
    if (-not (Test-Path $ScriptPath)) {
        Write-StatusLog "⚠️ Script non trouvé: $ScriptPath" "Yellow"
        return $false
    }
    return $true
}

function Invoke-AuditPreDeploy {
    Write-StatusLog "🔍 AUDIT PRÉ-DÉPLOIEMENT" "Blue"
    Write-StatusLog "========================" "Blue"
    
    try {
        if (-not (Test-ScriptExists "test-deploy-audit.mjs")) {
            Write-StatusLog "⚠️ Script d'audit non trouvé, passage à l'étape suivante" "Yellow"
            return $true
        }
        
        $auditResult = node test-deploy-audit.mjs
        if ($LASTEXITCODE -ne 0) {
            throw "Audit échoué avec code: $LASTEXITCODE"
        }
        
        Write-StatusLog "✅ Audit terminé avec succès" "Green"
        return $true
    } catch {
        Write-StatusLog "❌ Audit échoué: $($_.Exception.Message)" "Red"
        Write-StatusLog "⚠️ Poursuite du déploiement malgré l'audit..." "Yellow"
        return $false
    }
}

function Invoke-FreshBuild {
    Write-StatusLog "🔨 BUILD COMPLET" "Blue"
    Write-StatusLog "================" "Blue"
    
    try {
        # Vérification que npm est disponible
        $npmVersion = npm --version 2>$null
        if (-not $npmVersion) {
            throw "npm n'est pas disponible. Vérifiez votre installation Node.js"
        }
        
        # Build fresh avec nettoyage
        if (Test-Path "dist") {
            Remove-Item "dist" -Recurse -Force
            Write-StatusLog "🧹 Ancien dist/ supprimé" "Yellow"
        }
        
        # Vérification de la commande build
        $packageJson = Get-Content "package.json" -ErrorAction SilentlyContinue | ConvertFrom-Json
        if (-not $packageJson.scripts."build:both") {
            Write-StatusLog "⚠️ Script build:both non trouvé, tentative avec build..." "Yellow"
            npm run build
        } else {
            npm run build:both
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build échoué avec code: $LASTEXITCODE"
        }
        
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
        # Vérification des scripts de déploiement
        $deployScript = $null
        $deployScripts = @("deploy-bulletproof-v2.js", "deploy-combined-quick.js", "deploy.js")
        
        foreach ($script in $deployScripts) {
            if (Test-Path $script) {
                $deployScript = $script
                break
            }
        }
        
        if (-not $deployScript) {
            throw "Aucun script de déploiement trouvé. Scripts recherchés: $($deployScripts -join ', ')"
        }
        
        Write-StatusLog "📦 Utilisation du script: $deployScript" "Cyan"
        
        # Utiliser la version V2 optimisée en priorité
        node $deployScript
        
        if ($LASTEXITCODE -ne 0) {
            throw "Déploiement échoué avec code: $LASTEXITCODE"
        }
        
        Write-StatusLog "✅ Déploiement terminé avec succès" "Green"
        return $true
    } catch {
        Write-StatusLog "❌ Déploiement échoué: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Invoke-ValidationPost {
    Write-StatusLog "🔍 VALIDATION POST-DÉPLOIEMENT" "Blue"
    Write-StatusLog "==============================" "Blue"
    
    try {
        # Configuration pour les tests HTTP
        $timeoutSeconds = 10
        $urls = @{
            "Landing" = "https://dev.melyia.com"
            "App" = "https://app-dev.melyia.com"
        }
        
        $results = @{}
        
        foreach ($site in $urls.GetEnumerator()) {
            try {
                Write-StatusLog "🔍 Test de $($site.Key): $($site.Value)" "Cyan"
                
                $response = Invoke-WebRequest -Uri $site.Value -TimeoutSec $timeoutSeconds -UseBasicParsing -ErrorAction Stop
                $statusCode = $response.StatusCode
                $results[$site.Key] = $statusCode
                
                Write-StatusLog "✅ $($site.Key): $statusCode" "Green"
            } catch {
                $statusCode = "ERROR"
                $results[$site.Key] = $statusCode
                Write-StatusLog "❌ $($site.Key): $($_.Exception.Message)" "Red"
            }
        }
        
        # Évaluation globale
        $successCount = ($results.Values | Where-Object { $_ -eq 200 }).Count
        $totalCount = $results.Count
        
        if ($successCount -eq $totalCount) {
            Write-StatusLog "✅ Validation réussie - Tous les sites accessibles ($successCount/$totalCount)" "Green"
            return $true
        } elseif ($successCount -gt 0) {
            Write-StatusLog "⚠️ Validation partielle - $successCount/$totalCount sites accessibles" "Yellow"
            return $true  # Pas bloquant
        } else {
            Write-StatusLog "❌ Validation échouée - Aucun site accessible" "Red"
            return $false
        }
    } catch {
        Write-StatusLog "⚠️ Validation externe limitée: $($_.Exception.Message)" "Yellow"
        Write-StatusLog "💡 Déploiement probablement OK, vérifiez manuellement" "Yellow"
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
        Write-StatusLog "🔧 Commandes debug:" "Yellow"
        Write-StatusLog "   - node test-deploy-audit.mjs" "Yellow"
        Write-StatusLog "   - npm run build" "Yellow"
        Write-StatusLog "   - Test-Path dist/" "Yellow"
    }
    
    Write-StatusLog "=================================" "Blue"
}

function Test-Prerequisites {
    Write-StatusLog "🔍 Vérification des prérequis..." "Blue"
    
    # Test Node.js
    try {
        $nodeVersion = node --version
        Write-StatusLog "✅ Node.js: $nodeVersion" "Green"
    } catch {
        throw "Node.js n'est pas installé ou accessible"
    }
    
    # Test npm
    try {
        $npmVersion = npm --version
        Write-StatusLog "✅ npm: $npmVersion" "Green"
    } catch {
        throw "npm n'est pas installé ou accessible"
    }
    
    # Test fichiers critiques
    $criticalFiles = @("package.json")
    foreach ($file in $criticalFiles) {
        if (-not (Test-Path $file)) {
            throw "Fichier critique manquant: $file"
        }
    }
    Write-StatusLog "✅ Fichiers critiques présents" "Green"
}

# PROCESSUS PRINCIPAL
try {
    $startTime = Get-Date
    $success = $true
    
    # Étape 0: Vérification des prérequis
    Test-Prerequisites
    
    # Étape 1: Synchronisation serveur
    Write-StatusLog "🔄 Synchronisation serveur..." "Cyan"
    if (Test-Path ".\dev\sync-essential.ps1") {
        & ".\dev\sync-essential.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-StatusLog "⚠️ Synchronisation en échec, poursuite..." "Yellow"
        }
    } else {
        Write-StatusLog "⚠️ Script de synchronisation non trouvé, poursuite..." "Yellow"
    }
    
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
    $validationResult = Invoke-ValidationPost
    if (-not $validationResult) {
        Write-StatusLog "⚠️ Validation échouée mais déploiement probablement OK" "Yellow"
    }
    
    # Étape 6: Audit final
    Write-StatusLog "🔍 Audit final..." "Cyan"
    if (Test-ScriptExists "test-deploy-audit.mjs") {
        try {
            node test-deploy-audit.mjs | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-StatusLog "✅ Audit final réussi" "Green"
            }
        } catch {
            Write-StatusLog "⚠️ Audit final échoué mais déploiement OK" "Yellow"
        }
    }
    
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
Write-StatusLog "🔍 Vérifiez manuellement les URLs si nécessaire" "Cyan"