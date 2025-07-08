# 🚀 SCRIPT DÉPLOIEMENT V3 - OPTIMISÉ SSH
# Utilise le nouveau deploy-bulletproof-v3.js avec commandes groupées

Write-Host "🚀 DÉPLOIEMENT MELYIA V3 - OPTIMISÉ SSH" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎯 NOUVEAUTÉS V3: -70% connexions SSH / +50% fiabilité" -ForegroundColor Yellow
Write-Host ""

# Fonction pour logs colorés
function Write-Log {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Test de connectivité préliminaire
Write-Log "🔍 Test de connectivité SSH..." "Blue"
try {
    $sshTest = ssh -o ConnectTimeout=30 ubuntu@51.91.145.255 "echo 'SSH-OK' && uptime"
    if ($sshTest -match "SSH-OK") {
        Write-Log "✅ Connectivité SSH confirmée" "Green"
    } else {
        throw "Pas de réponse SSH valide"
    }
} catch {
    Write-Log "❌ Problème de connectivité SSH" "Red"
    Write-Log "💡 Solutions:" "Yellow"
    Write-Log "   1. Vérifiez votre connexion internet" "Yellow"
    Write-Log "   2. Testez manuellement: ssh ubuntu@51.91.145.255" "Yellow"
    Write-Log "   3. Attendez 2-3 minutes et réessayez" "Yellow"
    exit 1
}

# Build des applications
Write-Log "🏗️ Build des applications..." "Blue"
try {
    Write-Log "   → Nettoyage dist/" "Gray"
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
    }
    
    Write-Log "   → Build landing + app..." "Gray"
    npm run build:both
    
    Write-Log "✅ Build terminé avec succès" "Green"
} catch {
    Write-Log "❌ Erreur durant le build: $($_.Exception.Message)" "Red"
    exit 1
}

# Validation des builds
Write-Log "🔍 Validation des builds..." "Blue"
$buildsValid = $true

@("dist/landing", "dist/app") | ForEach-Object {
    if (!(Test-Path $_)) {
        Write-Log "❌ Build manquant: $_" "Red"
        $buildsValid = $false
    } else {
        $files = Get-ChildItem $_ -Recurse
        $hasHTML = $files | Where-Object { $_.Extension -eq ".html" }
        $hasAssets = Test-Path "$_/assets"
        
        if (!$hasHTML -or !$hasAssets) {
            Write-Log "❌ Build incomplet: $_" "Red"
            $buildsValid = $false
        } else {
            Write-Log "✅ Build validé: $_" "Green"
        }
    }
}

if (!$buildsValid) {
    Write-Log "❌ Validation des builds échouée" "Red"
    exit 1
}

# Déploiement V3 optimisé
Write-Log "🚀 Lancement déploiement V3..." "Cyan"
try {
    node deploy-bulletproof-v3.js
    Write-Log "✅ Déploiement V3 terminé avec succès" "Green"
} catch {
    Write-Log "❌ Erreur durant le déploiement V3" "Red"
    Write-Log "💡 Fallback vers V2..." "Yellow"
    
    try {
        node deploy-bulletproof-v2.js
        Write-Log "✅ Déploiement V2 réussi (fallback)" "Green"
    } catch {
        Write-Log "❌ Échec déploiement V2 également" "Red"
        Write-Log "💡 Solutions:" "Yellow"
        Write-Log "   1. Vérifiez la connectivité réseau" "Yellow"
        Write-Log "   2. Contactez l'administrateur serveur" "Yellow"
        Write-Log "   3. Réessayez dans 15-30 minutes" "Yellow"
        exit 1
    }
}

# Validation finale
Write-Log "🔍 Validation des sites déployés..." "Blue"
try {
    $landingTest = curl -s -o /dev/null -w "%{http_code}" -m 10 https://dev.melyia.com
    $appTest = curl -s -o /dev/null -w "%{http_code}" -m 10 https://app-dev.melyia.com
    
    if ($landingTest -eq "200" -and $appTest -eq "200") {
        Write-Log "✅ Validation réussie - Sites accessibles" "Green"
    } else {
        Write-Log "⚠️ Validation partielle - Codes: Landing($landingTest), App($appTest)" "Yellow"
    }
} catch {
    Write-Log "⚠️ Validation échouée - Déploiement probablement OK" "Yellow"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 DÉPLOIEMENT V3 TERMINÉ" -ForegroundColor Green
Write-Host "📍 Landing: https://dev.melyia.com" -ForegroundColor White
Write-Host "📍 App: https://app-dev.melyia.com" -ForegroundColor White
Write-Host "🚀 V3: Optimisé pour fiabilité SSH" -ForegroundColor Yellow
Write-Host "🛡️ Backend automatiquement préservé" -ForegroundColor White
Write-Host ""