# Script de déploiement pour server.js avec routes LLM
# Micro-étape 2 : Validation des routes API

Write-Host "🚀 DÉPLOIEMENT SERVER.JS - ROUTES LLM CONFIG" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 1. Vérifier que le fichier local existe
if (-not (Test-Path "server/backend/server.js")) {
    Write-Host "❌ Fichier server/backend/server.js non trouvé" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item "server/backend/server.js").Length
Write-Host "📁 Fichier local: server/backend/server.js ($fileSize bytes)" -ForegroundColor Cyan

# 2. Upload du fichier via scp dans /tmp d'abord
Write-Host "📤 Upload fichier server.js..." -ForegroundColor Yellow

try {
    # Upload dans /tmp avec nom unique
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $tempFileName = "server_llm_$timestamp.js"
    
    scp "server/backend/server.js" "ubuntu@51.91.145.255:/tmp/$tempFileName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Upload réussi: /tmp/$tempFileName" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur upload SCP" -ForegroundColor Red
        exit 1
    }
    
    # 3. Déplacement et permissions via SSH
    Write-Host "📋 Déplacement vers /var/www/melyia/app-dev/..." -ForegroundColor Yellow
    
    ssh ubuntu@51.91.145.255 @"
        sudo cp /tmp/$tempFileName /var/www/melyia/app-dev/server.js && \
        sudo chown ubuntu:ubuntu /var/www/melyia/app-dev/server.js && \
        sudo chmod 644 /var/www/melyia/app-dev/server.js && \
        rm /tmp/$tempFileName && \
        echo 'Déploiement terminé'
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Fichier déployé avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du déplacement" -ForegroundColor Red
        exit 1
    }
    
    # 4. Redémarrage PM2
    Write-Host "🔄 Redémarrage PM2..." -ForegroundColor Yellow
    
    ssh ubuntu@51.91.145.255 "pm2 restart melyia-auth-dev"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PM2 redémarré avec succès" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Erreur redémarrage PM2" -ForegroundColor Yellow
    }
    
    # 5. Vérification des logs
    Write-Host "📋 Vérification des logs PM2..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    ssh ubuntu@51.91.145.255 "pm2 logs melyia-auth-dev --lines 10"
    
    Write-Host "`n✅ DÉPLOIEMENT TERMINÉ" -ForegroundColor Green
    Write-Host "🧪 Prêt pour tester les routes LLM config !" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur lors du déploiement: $_" -ForegroundColor Red
    exit 1
} 