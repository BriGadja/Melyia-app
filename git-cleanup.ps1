Write-Host " NETTOYAGE GIT - Commit des modifications" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 1. Voir l'état détaillé
Write-Host "`n État actuel:" -ForegroundColor Yellow
git status

# 2. Ajouter les fichiers utiles
Write-Host "`n Ajout fichiers utiles..." -ForegroundColor Yellow
git add .last-sync.txt
git add audit-rapide.ps1 
git add check-git-status-fixed.ps1

# Ignorer les fichiers temporaires
Write-Host "`n Nettoyage fichiers temporaires..." -ForegroundColor Yellow
if (Test-Path "check-git-status.ps1") {
    Remove-Item "check-git-status.ps1"
    Write-Host "   check-git-status.ps1 supprimé" -ForegroundColor Green
}

if (Test-Path "client/index-landing-temp.html") {
    # Ce fichier semble temporaire, on le remet dans gitignore
    Write-Host "    client/index-landing-temp.html détecté" -ForegroundColor Yellow
    Write-Host "     Voulez-vous le garder ou le supprimer ? (k/s)" -ForegroundColor Cyan
    $choice = Read-Host
    if ($choice -eq 's' -or $choice -eq 'S') {
        Remove-Item "client/index-landing-temp.html"
        Write-Host "   Fichier temporaire supprimé" -ForegroundColor Green
    } else {
        git add "client/index-landing-temp.html"
        Write-Host "   Fichier ajouté au commit" -ForegroundColor Green
    }
}

# 3. Commit avec message descriptif
Write-Host "`n Commit des améliorations..." -ForegroundColor Yellow
git commit -m " Amélioration configuration Git

 Scripts d'audit système (audit-rapide.ps1)
 Outils de vérification Git (check-git-status-fixed.ps1) 
 Mise à jour synchronisation (.last-sync.txt)
 Préparation configuration GitHub Actions

Status: Infrastructure Git optimisée pour développement multi-machines"

Write-Host "`n Push vers GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n NETTOYAGE TERMINÉ" -ForegroundColor Green
