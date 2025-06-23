Write-Host " AJOUT SCRIPT COMBINÉ AU PACKAGE.JSON - VERSION CORRIGÉE" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# Lire le package.json actuel
$packageContent = Get-Content "package.json" -Raw | ConvertFrom-Json

# Ajouter le script de déploiement combiné (VERSION CORRIGÉE)
if (-not $packageContent.scripts) {
    $packageContent.scripts = New-Object PSObject
}

# Ajouter les scripts avec la syntaxe correcte
$packageContent.scripts | Add-Member -MemberType NoteProperty -Name "deploy:combined" -Value "node deploy-combined.js" -Force
$packageContent.scripts | Add-Member -MemberType NoteProperty -Name "test:deploy" -Value "echo 'Test connectivité...' && curl -I https://dev.melyia.com && curl -I https://app-dev.melyia.com" -Force

# Sauvegarder le package.json
$packageContent | ConvertTo-Json -Depth 10 | Out-File "package.json" -Encoding UTF8

Write-Host " Scripts ajoutés à package.json:" -ForegroundColor Green
Write-Host "   npm run deploy:combined  - Déploiement Landing + App" -ForegroundColor Cyan
Write-Host "   npm run test:deploy      - Test connectivité sites" -ForegroundColor Cyan

Write-Host "`n UTILISATION:" -ForegroundColor Yellow
Write-Host "npm run deploy:combined   # Votre nouveau script combiné !" -ForegroundColor White
