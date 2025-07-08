# 🔍 DIAGNOSTIC SSH - MELYIA V33
# Script de diagnostic pour identifier les problèmes de connexion SSH

Write-Host "🔍 DIAGNOSTIC SSH MELYIA V33" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Cyan
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

# Test 1: Connectivité réseau de base
Write-Log "🌐 Test 1: Connectivité réseau de base..." "Blue"
try {
    $pingResult = ping -n 4 51.91.145.255
    if ($pingResult -match "TTL=") {
        Write-Log "✅ Ping réussi - Réseau opérationnel" "Green"
    } else {
        Write-Log "❌ Ping échoué - Problème réseau" "Red"
    }
} catch {
    Write-Log "❌ Erreur ping: $($_.Exception.Message)" "Red"
}

# Test 2: Connectivité SSH port 22
Write-Log "🔌 Test 2: Connectivité SSH port 22..." "Blue"
try {
    $tcpTest = Test-NetConnection -ComputerName 51.91.145.255 -Port 22 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($tcpTest) {
        Write-Log "✅ Port SSH 22 accessible" "Green"
    } else {
        Write-Log "❌ Port SSH 22 inaccessible" "Red"
    }
} catch {
    Write-Log "❌ Erreur test TCP: $($_.Exception.Message)" "Red"
}

# Test 3: Connexion SSH simple
Write-Log "🔐 Test 3: Connexion SSH simple..." "Blue"
try {
    $sshTest = ssh -o ConnectTimeout=30 -o BatchMode=yes ubuntu@51.91.145.255 "echo 'SSH-OK' && date"
    if ($sshTest -match "SSH-OK") {
        Write-Log "✅ Connexion SSH réussie" "Green"
        Write-Log "   └── Réponse: $($sshTest -replace "`n", " ")" "Gray"
    } else {
        Write-Log "❌ Connexion SSH échouée" "Red"
    }
} catch {
    Write-Log "❌ Erreur SSH: $($_.Exception.Message)" "Red"
}

# Test 4: Charge serveur
Write-Log "📊 Test 4: Charge serveur..." "Blue"
try {
    $loadTest = ssh -o ConnectTimeout=30 ubuntu@51.91.145.255 "uptime && free -h && df -h | head -5"
    if ($loadTest) {
        Write-Log "✅ Informations serveur récupérées" "Green"
        Write-Log "   └── Load: $($loadTest -split "`n" | Select-Object -First 1)" "Gray"
    } else {
        Write-Log "❌ Impossible de récupérer les infos serveur" "Red"
    }
} catch {
    Write-Log "❌ Erreur récupération infos serveur: $($_.Exception.Message)" "Red"
}

# Test 5: Connexions SSH multiples (simulation du problème)
Write-Log "🔄 Test 5: Connexions SSH multiples..." "Blue"
$successCount = 0
$errorCount = 0

for ($i = 1; $i -le 5; $i++) {
    try {
        $multiTest = ssh -o ConnectTimeout=15 ubuntu@51.91.145.255 "echo 'Test $i OK'"
        if ($multiTest -match "Test $i OK") {
            $successCount++
            Write-Log "   ✅ Connexion $i/5 réussie" "Green"
        } else {
            $errorCount++
            Write-Log "   ❌ Connexion $i/5 échouée" "Red"
        }
    } catch {
        $errorCount++
        Write-Log "   ❌ Connexion $i/5 erreur: $($_.Exception.Message)" "Red"
    }
    
    # Pause courte entre connexions
    Start-Sleep -Seconds 2
}

# Test 6: Vérification configuration SSH locale
Write-Log "⚙️ Test 6: Configuration SSH locale..." "Blue"
if (Test-Path "$env:USERPROFILE\.ssh\config") {
    Write-Log "✅ Fichier config SSH trouvé" "Green"
} else {
    Write-Log "ℹ️ Pas de fichier config SSH (normal)" "Yellow"
}

if (Test-Path "$env:USERPROFILE\.ssh\known_hosts") {
    Write-Log "✅ Fichier known_hosts trouvé" "Green"
} else {
    Write-Log "⚠️ Fichier known_hosts manquant" "Yellow"
}

# Résumé diagnostic
Write-Host ""
Write-Host "📋 RÉSUMÉ DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

if ($successCount -eq 5) {
    Write-Log "✅ DIAGNOSTIC EXCELLENT - SSH 100% fonctionnel" "Green"
    Write-Log "💡 Le problème vient probablement de trop de connexions simultanées" "Yellow"
    Write-Log "🎯 Solution: Utilisez deploy-bulletproof-v3.js (commandes groupées)" "Yellow"
} elseif ($successCount -ge 3) {
    Write-Log "⚠️ DIAGNOSTIC MOYEN - SSH partiellement fonctionnel" "Yellow"
    Write-Log "💡 Connexions SSH instables ou serveur surchargé" "Yellow"
    Write-Log "🎯 Solution: Attendez 5-10 minutes et réessayez" "Yellow"
} else {
    Write-Log "❌ DIAGNOSTIC PROBLÉMATIQUE - SSH défaillant" "Red"
    Write-Log "💡 Problème réseau ou serveur surchargé" "Yellow"
    Write-Log "🎯 Solutions:" "Yellow"
    Write-Log "   1. Vérifiez votre connexion internet" "Yellow"
    Write-Log "   2. Contactez l'administrateur serveur" "Yellow"
    Write-Log "   3. Réessayez dans 15-30 minutes" "Yellow"
}

Write-Host ""
Write-Host "📞 SUPPORT TECHNIQUE" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Log "📧 Email: support@melyia.com" "White"
Write-Log "🌐 Status: https://status.melyia.com" "White"
Write-Log "📱 Tel: +33 X XX XX XX XX" "White"
Write-Host ""