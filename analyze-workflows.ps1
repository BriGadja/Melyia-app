Write-Host "🔍 ANALYSE WORKFLOWS GITHUB ACTIONS - MELYIA v22" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 1. Analyse deploy.yml complet
if (Test-Path ".github\workflows\deploy.yml") {
    Write-Host "`n🚀 DEPLOY.YML COMPLET:" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    Get-Content ".github\workflows\deploy.yml"
    Write-Host "`n" -ForegroundColor Gray
} else {
    Write-Host "`n❌ deploy.yml non trouvé" -ForegroundColor Red
}

# 2. Analyse test.yml complet  
if (Test-Path ".github\workflows\test.yml") {
    Write-Host "`n🧪 TEST.YML COMPLET:" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    Get-Content ".github\workflows\test.yml"
    Write-Host "`n" -ForegroundColor Gray
} else {
    Write-Host "`n❌ test.yml non trouvé" -ForegroundColor Red
}

# 3. Vérifier les secrets nécessaires
Write-Host "`n🔐 SECRETS REQUIS POUR WORKFLOWS:" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "D'après vos spécifications v22, les secrets suivants sont nécessaires:" -ForegroundColor White
Write-Host "• WEBHOOK_TOKEN: 2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410" -ForegroundColor Cyan
Write-Host "• SERVER_HOST: 51.91.145.255" -ForegroundColor Cyan  
Write-Host "• SERVER_USER: ubuntu" -ForegroundColor Cyan
Write-Host "• SSH_PRIVATE_KEY: (votre clé SSH)" -ForegroundColor Cyan

# 4. Analyser structure déploiement
Write-Host "`n📁 FICHIERS DÉPLOIEMENT ANALYSÉS:" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow

if (Test-Path "deploy-to-app-dev.js") {
    Write-Host "✅ deploy-to-app-dev.js présent" -ForegroundColor Green
    $deployContent = Get-Content "deploy-to-app-dev.js" -Raw
    if ($deployContent -match "app-dev\.melyia\.com") {
        Write-Host "✅ Configuré pour app-dev.melyia.com" -ForegroundColor Green
    }
    if ($deployContent -match "webhook") {
        Write-Host "✅ Utilise webhook pour déploiement" -ForegroundColor Green
    }
} else {
    Write-Host "❌ deploy-to-app-dev.js manquant" -ForegroundColor Red
}

if (Test-Path "deploy-to-dev.js") {
    Write-Host "✅ deploy-to-dev.js présent" -ForegroundColor Green
} else {
    Write-Host "⚠️  deploy-to-dev.js absent (optionnel)" -ForegroundColor Yellow
}

Write-Host "`n🎯 PROCHAINES ACTIONS:" -ForegroundColor Magenta
Write-Host "======================" -ForegroundColor Magenta
Write-Host "1. Analyser workflows existants vs besoins v22" -ForegroundColor White
Write-Host "2. Configurer secrets GitHub si manquants" -ForegroundColor White  
Write-Host "3. Adapter workflows pour app-dev.melyia.com" -ForegroundColor White
Write-Host "4. Tester déploiement automatique" -ForegroundColor White
