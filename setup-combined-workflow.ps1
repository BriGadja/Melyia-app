Write-Host " CRÉATION WORKFLOW DÉPLOIEMENT COMBINÉ" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Créer le dossier workflows s'il n'existe pas
if (-not (Test-Path ".github\workflows")) {
    New-Item -Path ".github\workflows" -ItemType Directory -Force
    Write-Host " Dossier .github\workflows créé" -ForegroundColor Green
}

# Le contenu du workflow sera dans l'artifact ci-dessus
Write-Host " Workflow 'deploy-combined.yml' à créer avec le contenu de l'artifact" -ForegroundColor Yellow

Write-Host "`n ARCHITECTURE FINALE - 3 WORKFLOWS:" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "1. deploy.yml         - Déploiements séparés (existant)" -ForegroundColor Cyan
Write-Host "2. test.yml           - Tests et qualité (existant)" -ForegroundColor Cyan  
Write-Host "3. deploy-combined.yml - Déploiement combiné (nouveau)" -ForegroundColor Green

Write-Host "`n STRATÉGIES DE DÉPLOIEMENT:" -ForegroundColor Yellow
Write-Host " Push sur main        deploy.yml (séparé)" -ForegroundColor White
Write-Host " Manuel + combiné     deploy-combined.yml" -ForegroundColor White
Write-Host " Pull requests        test.yml seulement" -ForegroundColor White

Write-Host "`n PROCHAINES ÉTAPES:" -ForegroundColor Magenta
Write-Host "1. Copier le contenu de l'artifact dans .github\workflows\deploy-combined.yml" -ForegroundColor White
Write-Host "2. Commit et push pour activer le workflow" -ForegroundColor White
Write-Host "3. Tester en mode manuel sur GitHub Actions" -ForegroundColor White
