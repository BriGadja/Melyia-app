Write-Host " VÉRIFICATION SYNCHRONISATION GIT - MELYIA v22" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 1. Vérifier l'état Git local
Write-Host "`n ÉTAT GIT LOCAL:" -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "   Repository Git présent" -ForegroundColor Green
    
    # Remote configuré ?
    $remotes = git remote -v 2>$null
    if ($remotes) {
        Write-Host "   Remote configuré:" -ForegroundColor Green
        $remotes | ForEach-Object { Write-Host "    $_" -ForegroundColor Cyan }
    } else {
        Write-Host "   Aucun remote configuré" -ForegroundColor Red
    }
    
    # Branche actuelle
    $currentBranch = git branch --show-current 2>$null
    Write-Host "   Branche actuelle: $currentBranch" -ForegroundColor Cyan
    
    # État des fichiers
    $status = git status --porcelain 2>$null
    if ($status) {
        Write-Host "    Fichiers non commitués:" -ForegroundColor Yellow
        $status | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    } else {
        Write-Host "   Working directory propre" -ForegroundColor Green
    }
    
    # Derniers commits (approche simplifiée)
    try {
        $lastCommit = git log -1 --oneline 2>$null
        Write-Host "   Dernier commit: $lastCommit" -ForegroundColor Cyan
        
        # Test si on peut faire git status (upstream configuré)
        $gitStatus = git status -sb 2>$null
        if ($gitStatus -match "ahead|behind") {
            Write-Host "    Synchronisation nécessaire avec GitHub" -ForegroundColor Yellow
            Write-Host "    $gitStatus" -ForegroundColor Yellow
        } elseif ($gitStatus) {
            Write-Host "   Branche synchronisée" -ForegroundColor Green
        }
    } catch {
        Write-Host "    État synchronisation non déterminable" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "   Pas de repository Git local" -ForegroundColor Red
}

# 2. Test connexion GitHub
Write-Host "`n TEST CONNEXION GITHUB:" -ForegroundColor Yellow
try {
    $curlResult = curl -s "https://api.github.com/repos/BriGadja/Melyia-app" 2>$null
    if ($curlResult) {
        $response = $curlResult | ConvertFrom-Json
        Write-Host "   Repository GitHub accessible" -ForegroundColor Green
        Write-Host "   Nom: $($response.name)" -ForegroundColor Cyan
        if ($response.description) {
            Write-Host "   Description: $($response.description)" -ForegroundColor Cyan
        }
        Write-Host "   Dernière MAJ: $($response.updated_at)" -ForegroundColor Cyan
        Write-Host "   Branche défaut: $($response.default_branch)" -ForegroundColor Cyan
    } else {
        Write-Host "    Réponse vide de GitHub" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    Impossible de contacter GitHub API" -ForegroundColor Yellow
}

# 3. Vérifier structure GitHub Actions
Write-Host "`n GITHUB ACTIONS:" -ForegroundColor Yellow
if (Test-Path ".github") {
    if (Test-Path ".github\workflows") {
        $workflows = Get-ChildItem ".github\workflows" -Filter "*.yml" -ErrorAction SilentlyContinue
        if ($workflows) {
            Write-Host "   Workflows présents:" -ForegroundColor Green
            $workflows | ForEach-Object { Write-Host "    $($_.Name)" -ForegroundColor Cyan }
        } else {
            Write-Host "    Dossier workflows vide" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    Dossier .github sans workflows" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Pas de configuration GitHub Actions" -ForegroundColor Red
}

# 4. Vérifier fichiers projet essentiels
Write-Host "`n FICHIERS PROJET:" -ForegroundColor Yellow
$essentialFiles = @(
    "package.json",
    "deploy-to-app-dev.js", 
    "dev\start-dev-CLEAN.ps1",
    "dev\sync-and-push-CLEAN.ps1"
)

foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "   $file" -ForegroundColor Green
    } else {
        Write-Host "   $file manquant" -ForegroundColor Red
    }
}

Write-Host "`n PROCHAINES ÉTAPES:" -ForegroundColor Magenta
Write-Host "1. Synchroniser Git si nécessaire" -ForegroundColor White
Write-Host "2. Créer GitHub Actions pour CI/CD" -ForegroundColor White
Write-Host "3. Configurer secrets et variables" -ForegroundColor White
Write-Host "4. Tester déploiement automatique" -ForegroundColor White
