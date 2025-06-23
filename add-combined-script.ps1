Write-Host " AJOUT SCRIPT COMBINÉ AU PACKAGE.JSON" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Lire le package.json actuel
$packageContent = Get-Content "package.json" -Raw | ConvertFrom-Json

# Ajouter le script de déploiement combiné
if (-not $packageContent.scripts) {
    $packageContent.scripts = @{}
}

$packageContent.scripts | Add-Member -Name "deploy:combined" -Value "node deploy-combined.js" -Force

# Ajouter aussi un script de test rapide
$packageContent.scripts | Add-Member -Name "test:deploy" -Value "echo 'Test de connectivité...' && curl -I https://dev.melyia.com && curl -I https://app-dev.melyia.com" -Force

# Sauvegarder le package.json
$packageContent | ConvertTo-Json -Depth 10 | Out-File "package.json" -Encoding UTF8

Write-Host " Scripts ajoutés à package.json:" -ForegroundColor Green
Write-Host "   npm run deploy:combined  - Déploiement Landing + App" -ForegroundColor Cyan
Write-Host "   npm run test:deploy      - Test connectivité sites" -ForegroundColor Cyan

Write-Host "`n UTILISATION LOCALE:" -ForegroundColor Yellow
Write-Host "npm run deploy:combined   # Déploie les deux en une commande" -ForegroundColor White
Write-Host "npm run deploy:app        # Déploie seulement l'app" -ForegroundColor White  
Write-Host "npm run deploy:landing    # Déploie seulement la landing" -ForegroundColor White
