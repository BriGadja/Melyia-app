# Script: dev/sync-and-push-CLEAN.ps1
# Description: Synchronisation rapide pour changement de machine - VERSION SSH ADAPTEE
# Machine: PC FIXE + PORTABLE

param(
    [string]$Message = "",
    [string]$Type = "auto",  # auto, commit, stash, force
    [switch]$Quick = $false,  # Mode rapide sans questions
    [switch]$Deploy = $false  # Deployer apres push
)

Write-Host "Synchronisation Multi-Machines Melyia..." -ForegroundColor Green
Write-Host "Machine: $(hostname) | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# 1. Detection machine et configuration SSH
$hostname = hostname
$isPortable = $hostname -like "*portable*" -or $hostname -like "*laptop*" -or $hostname -like "*mobile*"
$machineType = if ($isPortable) { "Portable" } else { "PC Fixe" }

# Configuration SSH adaptee
$sshKeyPath = if ($isPortable) { "$env:USERPROFILE\.ssh\melyia_portable" } else { "$env:USERPROFILE\.ssh\melyia_main" }
$sshHost = "ubuntu@51.91.145.255"
$sshCommand = "ssh -i `"$sshKeyPath`" $sshHost"

Write-Host "Configuration: $machineType -> $(Split-Path $sshKeyPath -Leaf)" -ForegroundColor Cyan

# 2. Verifications preliminaires
Write-Host ""
Write-Host "Verifications..." -ForegroundColor Yellow

# Verifier qu'on est dans un repo Git
if (!(Test-Path ".git")) {
    Write-Host "Pas de repository Git detecte" -ForegroundColor Red
    Write-Host "Assurez-vous d'etre dans le dossier du projet Melyia" -ForegroundColor Yellow
    exit 1
}

# Verifier cle SSH
if (!(Test-Path $sshKeyPath)) {
    Write-Host "Cle SSH manquante: $sshKeyPath" -ForegroundColor Red
    Write-Host "Executez d'abord le script setup SSH" -ForegroundColor Yellow
    exit 1
}

# Verifier remote
$hasRemote = git remote get-url origin 2>$null
if (!$hasRemote) {
    Write-Host "Aucun remote Git configure" -ForegroundColor Red
    Write-Host "Configurez d'abord votre repository distant" -ForegroundColor Yellow
    exit 1
}

Write-Host "Repository: $hasRemote" -ForegroundColor Green
Write-Host "SSH Key: $(Split-Path $sshKeyPath -Leaf)" -ForegroundColor Green

# Verifier connexion internet/remote
Write-Host "Test connexion au repository..." -ForegroundColor Yellow
git ls-remote origin HEAD 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Impossible de contacter le repository distant" -ForegroundColor Red
    Write-Host "Verifiez votre connexion internet" -ForegroundColor Yellow
    exit 1
}
Write-Host "Repository distant accessible" -ForegroundColor Green

# 3. Analyse de l'etat Git
Write-Host ""
Write-Host "Analyse de l'etat Git..." -ForegroundColor Yellow

$currentBranch = git branch --show-current
$status = git status --porcelain
$hasChanges = $status.Count -gt 0
$unstaged = git diff --name-only
$staged = git diff --staged --name-only

Write-Host "Branche courante: $currentBranch" -ForegroundColor White

if (!$hasChanges) {
    Write-Host "Aucun changement local detecte" -ForegroundColor Green
    
    # Verifier s'il y a des changements distants
    git fetch origin $currentBranch 2>$null
    $behind = git rev-list --count HEAD..origin/$currentBranch
    $ahead = git rev-list --count origin/$currentBranch..HEAD
    
    if ($behind -gt 0) {
        Write-Host "$behind commit(s) en retard sur le remote" -ForegroundColor Yellow
        git pull origin $currentBranch
        Write-Host "Repository synchronise" -ForegroundColor Green
    } elseif ($ahead -gt 0) {
        Write-Host "$ahead commit(s) en avance sur le remote" -ForegroundColor Yellow
        git push origin $currentBranch
        Write-Host "Commits pousses vers le remote" -ForegroundColor Green
    } else {
        Write-Host "Repository parfaitement synchronise" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Synchronisation terminee - aucune action necessaire" -ForegroundColor Green
    exit 0
}

# 4. Affichage des changements
Write-Host ""
Write-Host "Changements detectes:" -ForegroundColor Yellow
Write-Host "=" * 40 -ForegroundColor Gray

# Fichiers modifies
if ($unstaged) {
    Write-Host "Fichiers modifies (non stages):" -ForegroundColor Yellow
    $unstaged | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
}

# Fichiers stages
if ($staged) {
    Write-Host "Fichiers stages:" -ForegroundColor Green
    $staged | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
}

# Statut complet court
Write-Host ""
Write-Host "Resume:" -ForegroundColor Cyan
git status --short | ForEach-Object { 
    $statusChar = $_.Substring(0,2)
    $fileName = $_.Substring(3)
    $color = switch ($statusChar.Trim()) {
        "M" { "Yellow" }
        "A" { "Green" }
        "D" { "Red" }
        "??" { "Magenta" }
        default { "White" }
    }
    Write-Host "  $statusChar $fileName" -ForegroundColor $color
}

# 5. Determination du type de synchronisation
$syncType = $Type
$commitMessage = $Message

if ($Type -eq "auto" -and !$Quick) {
    Write-Host ""
    Write-Host "Type de synchronisation:" -ForegroundColor Cyan
    Write-Host "1. Commit (changements permanents)" -ForegroundColor White
    Write-Host "2. Stash (changements temporaires)" -ForegroundColor White
    Write-Host "3. Force push (ecraser remote)" -ForegroundColor White
    Write-Host "4. Voir differences detaillees" -ForegroundColor White
    Write-Host "5. Annuler" -ForegroundColor White
    
    $choice = Read-Host "Choix (1-5)"
    
    switch ($choice) {
        "1" { $syncType = "commit" }
        "2" { $syncType = "stash" }
        "3" { $syncType = "force" }
        "4" { 
            Write-Host ""
            Write-Host "Differences detaillees:" -ForegroundColor Cyan
            git diff --stat
            Write-Host "" -ForegroundColor White
            git diff
            
            $proceed = Read-Host "Continuer avec la synchronisation? [c]ommit, [s]tash, [a]nnuler (c)"
            switch ($proceed.ToLower()) {
                "s" { $syncType = "stash" }
                "a" { exit 0 }
                default { $syncType = "commit" }
            }
        }
        "5" { 
            Write-Host "Synchronisation annulee" -ForegroundColor Red
            exit 0 
        }
        default { $syncType = "commit" }
    }
} elseif ($Quick) {
    # Mode rapide : commit par defaut
    $syncType = "commit"
    if (!$commitMessage) {
        $commitMessage = "Quick sync from $(hostname) - $(Get-Date -Format 'HH:mm')"
    }
}

# 6. Execution de la synchronisation
Write-Host ""
Write-Host "Execution synchronisation ($syncType)..." -ForegroundColor Green

switch ($syncType) {
    "commit" {
        # === MODE COMMIT ===
        Write-Host "Mode Commit - Changements permanents" -ForegroundColor Green
        
        # Demander message de commit si pas fourni
        if (!$commitMessage) {
            Write-Host ""
            Write-Host "Message de commit:" -ForegroundColor Yellow
            Write-Host "Suggestions:" -ForegroundColor Gray
            Write-Host "  • feat: nouvelle fonctionnalite" -ForegroundColor White
            Write-Host "  • fix: correction de bug" -ForegroundColor White
            Write-Host "  • style: amelioration UI/UX" -ForegroundColor White
            Write-Host "  • refactor: refactorisation code" -ForegroundColor White
            Write-Host "  • docs: mise a jour documentation" -ForegroundColor White
            Write-Host "  • wip: travail en cours" -ForegroundColor White
            
            $commitMessage = Read-Host "Message"
            if (!$commitMessage) {
                $commitMessage = "Update from $(hostname) - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            }
        }
        
        # Ajouter tous les fichiers
        git add .
        Write-Host "Fichiers ajoutes au staging" -ForegroundColor Green
        
        # Commit
        git commit -m $commitMessage
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Commit cree: $commitMessage" -ForegroundColor Green
        } else {
            Write-Host "Erreur lors du commit" -ForegroundColor Red
            exit 1
        }
        
        # Push vers remote
        Write-Host "Push vers remote..." -ForegroundColor Yellow
        git push origin $currentBranch
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Changements pousses vers $currentBranch" -ForegroundColor Green
        } else {
            Write-Host "Erreur lors du push" -ForegroundColor Red
            exit 1
        }
    }
    
    "stash" {
        # === MODE STASH ===
        Write-Host "Mode Stash - Changements temporaires" -ForegroundColor Yellow
        
        # Creer stash avec nom descriptif
        $stashName = "sync-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')-$(hostname)"
        if ($commitMessage) {
            $stashName += "-$($commitMessage -replace '[^a-zA-Z0-9-]', '')"
        }
        
        git stash push -m $stashName -u
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Stash cree: $stashName" -ForegroundColor Green
        } else {
            Write-Host "Erreur lors du stash" -ForegroundColor Red
            exit 1
        }
        
        # Pousser le stash comme branche temporaire pour partage
        Write-Host "Creation branche temporaire pour partage..." -ForegroundColor Yellow
        
        $tempBranch = "temp/$stashName"
        git checkout -b $tempBranch
        git stash pop
        git add .
        git commit -m "TEMP STASH: $commitMessage"
        git push origin $tempBranch
        
        # Retour a la branche principale
        git checkout $currentBranch
        git branch -D $tempBranch
        
        Write-Host "Branche temporaire creee: $tempBranch" -ForegroundColor Green
        Write-Host "Pour recuperer sur autre machine:" -ForegroundColor Cyan
        Write-Host "   git fetch origin $tempBranch" -ForegroundColor White
        Write-Host "   git checkout $tempBranch" -ForegroundColor White
        Write-Host "   git checkout $currentBranch" -ForegroundColor White
        Write-Host "   git cherry-pick $tempBranch" -ForegroundColor White
    }
    
    "force" {
        # === MODE FORCE ===
        Write-Host "Mode Force - Ecrasement du remote" -ForegroundColor Red
        Write-Host "ATTENTION: Cette action va ecraser l'historique distant" -ForegroundColor Yellow
        
        if (!$Quick) {
            $confirm = Read-Host "Etes-vous sur? Tapez 'FORCE' pour confirmer"
            if ($confirm -ne "FORCE") {
                Write-Host "Force push annule" -ForegroundColor Red
                exit 0
            }
        }
        
        git add .
        $forceMessage = if ($commitMessage) { $commitMessage } else { "Force sync from $(hostname)" }
        git commit -m $forceMessage
        
        git push origin $currentBranch --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Force push termine" -ForegroundColor Green
        } else {
            Write-Host "Erreur lors du force push" -ForegroundColor Red
            exit 1
        }
    }
}

# 7. Deploiement automatique (optionnel) avec SSH adapte
if ($Deploy -and $syncType -eq "commit") {
    Write-Host ""
    Write-Host "Deploiement automatique..." -ForegroundColor Green
    
    # Verifier connexion backend
    Write-Host "Test connexion backend pour deploiement..." -ForegroundColor Yellow
    
    $testResult = & cmd /c "ssh -i `"$sshKeyPath`" -o ConnectTimeout=5 -o BatchMode=yes $sshHost `"echo Backend accessible`" 2>nul"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend accessible pour deploiement" -ForegroundColor Green
        
        # Verifier que les scripts de deploiement existent
        if (Test-Path "package.json") {
            $packageJson = Get-Content "package.json" | ConvertFrom-Json
            if ($packageJson.scripts."deploy:app") {
                Write-Host "Deploiement vers app-dev..." -ForegroundColor Yellow
                npm run deploy:app
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Deploiement reussi" -ForegroundColor Green
                    Write-Host "Testez sur: https://app-dev.melyia.com" -ForegroundColor Cyan
                } else {
                    Write-Host "Erreur de deploiement" -ForegroundColor Red
                }
            } else {
                Write-Host "Script deploy:app non trouve dans package.json" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Backend inaccessible - deploiement annule" -ForegroundColor Red
        Write-Host "Vous pouvez deployer plus tard avec: npm run deploy:app" -ForegroundColor Yellow
    }
}

# 8. Nettoyage et optimisation
Write-Host ""
Write-Host "Nettoyage..." -ForegroundColor Yellow

# Nettoyer branches temporaires anciennes (locales)
$tempBranches = git branch | Where-Object { $_ -like "*temp/*" }
if ($tempBranches) {
    Write-Host "Suppression branches temporaires locales anciennes..." -ForegroundColor Yellow
    $tempBranches | ForEach-Object {
        $branch = $_.Trim().Replace("* ", "")
        if ($branch -ne $currentBranch) {
            git branch -D $branch 2>$null
        }
    }
}

# Garbage collection Git
git gc --auto --quiet 2>$null

Write-Host "Nettoyage termine" -ForegroundColor Green

# 9. Creer note de synchronisation
$syncNote = @"
SYNCHRONISATION MELYIA
========================
Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Machine: $(hostname) ($machineType)
Utilisateur: $env:USERNAME
SSH Key: $(Split-Path $sshKeyPath -Leaf)
Type: $syncType
Branche: $currentBranch
Message: $(if ($commitMessage) { $commitMessage } else { "N/A" })

Etat avant sync:
$(git log --oneline -3)

Prochaines etapes sur autre machine:
1. git pull origin $currentBranch
2. .\dev\start-dev.ps1

Configuration SSH pour autre machine:
$sshCommand

Fichiers synchronises:
$($status | Out-String)
"@

$syncNote | Out-File -FilePath ".last-sync.txt" -Encoding UTF8

# 10. Resume final
Write-Host ""
Write-Host "SYNCHRONISATION TERMINEE !" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host ""
Write-Host "RESUME:" -ForegroundColor Cyan
Write-Host "Machine: $machineType ($(hostname))" -ForegroundColor White
Write-Host "SSH Key: $(Split-Path $sshKeyPath -Leaf)" -ForegroundColor White
Write-Host "Type: $syncType" -ForegroundColor White
Write-Host "Branche: $currentBranch" -ForegroundColor White
Write-Host "Message: $(if ($commitMessage) { $commitMessage } else { "N/A" })" -ForegroundColor White
Write-Host "Timestamp: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor White

if ($syncType -eq "commit") {
    Write-Host ""
    Write-Host "Changements commitees et poussees" -ForegroundColor Green
    Write-Host "Disponibles immediatement sur autres machines" -ForegroundColor Green
} elseif ($syncType -eq "stash") {
    Write-Host ""
    Write-Host "Changements sauvegardes en stash temporaire" -ForegroundColor Yellow
    Write-Host "Branche temporaire creee pour partage" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "SUR VOTRE AUTRE MACHINE:" -ForegroundColor Cyan
if ($syncType -eq "commit") {
    Write-Host "git pull origin $currentBranch" -ForegroundColor White
    Write-Host ".\dev\start-dev.ps1" -ForegroundColor White
} else {
    Write-Host "Consultez les instructions dans .last-sync.txt" -ForegroundColor White
}

Write-Host ""
Write-Host "COMMANDES UTILES:" -ForegroundColor Cyan
Write-Host "• Statut: git status" -ForegroundColor White
Write-Host "• Historique: git log --oneline -5" -ForegroundColor White
Write-Host "• Branches: git branch -a" -ForegroundColor White
Write-Host "• Stashes: git stash list" -ForegroundColor White
Write-Host "• SSH Backend: $sshCommand" -ForegroundColor White

Write-Host ""
Write-Host "CONSEIL:" -ForegroundColor Cyan
Write-Host "Synchronisez regulierement pour eviter les conflits" -ForegroundColor White

Write-Host ""
Write-Host "Synchronisation Melyia terminee avec succes !" -ForegroundColor Green