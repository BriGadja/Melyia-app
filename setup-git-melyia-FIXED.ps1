# Script: setup-git-melyia-FIXED.ps1
# Description: Configuration Git pour synchronisation multi-machines
# Machine: PC FIXE (execution initiale)

Write-Host "Configuration Git Melyia Multi-Machines..." -ForegroundColor Green

# 1. Verifier Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Erreur: Git non installe. Installez Git for Windows d'abord." -ForegroundColor Red
    Write-Host "Telechargez sur: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host "Git detecte: $(git --version)" -ForegroundColor Green

# 2. Configuration Git globale
Write-Host ""
Write-Host "Configuration Git utilisateur..." -ForegroundColor Yellow
$currentName = git config --global user.name 2>$null
$currentEmail = git config --global user.email 2>$null

if ($currentName) {
    Write-Host "Nom actuel: $currentName" -ForegroundColor White
    $keepName = Read-Host "Garder ce nom? (Y/n)"
    if ($keepName -ne "n") {
        $gitName = $currentName
    } else {
        $gitName = Read-Host "Nouveau nom Git"
    }
} else {
    $gitName = Read-Host "Nom Git (ex: Votre Nom)"
}

if ($currentEmail) {
    Write-Host "Email actuel: $currentEmail" -ForegroundColor White
    $keepEmail = Read-Host "Garder cet email? (Y/n)"
    if ($keepEmail -ne "n") {
        $gitEmail = $currentEmail
    } else {
        $gitEmail = Read-Host "Nouvel email Git"
    }
} else {
    $gitEmail = Read-Host "Email Git (ex: vous@email.com)"
}

git config --global user.name "$gitName"
git config --global user.email "$gitEmail"
git config --global init.defaultBranch main
git config --global core.autocrlf input
git config --global push.default simple
git config --global pull.rebase false

Write-Host "Configuration Git globale terminee" -ForegroundColor Green
Write-Host "   Nom: $gitName" -ForegroundColor White
Write-Host "   Email: $gitEmail" -ForegroundColor White

# 3. Initialiser le repo Melyia (si pas deja fait)
if (!(Test-Path ".git")) {
    Write-Host ""
    Write-Host "Initialisation repo Git..." -ForegroundColor Yellow
    git init
    
    # Creer .gitignore optimise
    $gitignore = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build outputs
dist/
build/
.vite/
.next/
.nuxt/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Cache
.cache/
.temp/
.tmp/

# Backup files
*.backup.*
*.bak
*~

# SSH keys and sensitive files
*.pem
*.key
id_rsa*
known_hosts
authorized_keys

# Cursor specific
.cursor/

# Deploy scripts output
deploy-*.log

# Melyia specific
.last-sync.txt
portable-setup/

# Windows specific
desktop.ini
$RECYCLE.BIN/
"@
    
    $gitignore | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host ".gitignore cree" -ForegroundColor Green
} else {
    Write-Host "Repository Git existant detecte" -ForegroundColor Green
}

# 4. Creer structure pour multi-machines
Write-Host ""
Write-Host "Creation structure multi-machines..." -ForegroundColor Yellow

# Creer dossiers scripts
$folders = @("setup", "dev", "config", "docs")
foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -Path $folder -ItemType Directory -Force | Out-Null
        Write-Host "Dossier cree: $folder" -ForegroundColor Green
    }
}

# 5. Creer README principal
$readme = @"
# Melyia - Application Dentaire avec IA

## Architecture Multi-Machines

Cette configuration permet de developper sur votre **PC fixe** et votre **portable** avec synchronisation automatique via Git, tout en partageant le meme backend serveur.

## Quick Start

### Setup Initial (une seule fois)

**PC Fixe:**
1. .\setup-git-melyia.ps1 (ce script)
2. .\setup\setup-ssh-multi.ps1
3. Configurer repository distant
4. git push -u origin main

**Portable:**
1. git clone [repo-url] melyia
2. Copier dossier portable-setup depuis PC fixe
3. .\setup\setup-portable.ps1

### Workflow Quotidien

**Changement de machine:**
```powershell
# Avant de partir (PC fixe)
.\dev\sync-and-push.ps1 "Fin journee bureau"

# En arrivant (portable)  
git pull origin main
.\dev\start-dev.ps1
```

**Developpement normal:**
```powershell
# Sur n'importe quelle machine
.\dev\start-dev.ps1    # Demarrage env complet
# ... developpement ...
.\dev\sync-and-push.ps1 "Feature terminee"
```

## Scripts Disponibles

- setup-git-melyia.ps1 - Configuration Git initiale (PC fixe)
- setup/setup-ssh-multi.ps1 - Configuration SSH multi-machines (PC fixe)
- setup/setup-portable.ps1 - Setup portable (portable)
- dev/start-dev.ps1 - Demarrage developpement (PC fixe + portable)
- dev/sync-and-push.ps1 - Synchronisation rapide (PC fixe + portable)
- config/configure-cursor-ssh.ps1 - Configuration Cursor (PC fixe + portable)

## Stack Technique

**Frontend:** React + TypeScript + Vite + Tailwind CSS
**Backend:** Node.js + Express + PostgreSQL + pgvector  
**IA:** Ollama (local)
**Deploiement:** Scripts automatises
**SSH:** Cles dediees par machine
"@

$readme | Out-File -FilePath "README.md" -Encoding UTF8

# 6. Remote Git repository setup
Write-Host ""
Write-Host "Configuration repository distant..." -ForegroundColor Yellow
Write-Host "Options disponibles:" -ForegroundColor White
Write-Host "1. GitHub (recommande)" -ForegroundColor White
Write-Host "2. GitLab" -ForegroundColor White  
Write-Host "3. Repository prive existant" -ForegroundColor White
Write-Host "4. Plus tard (configuration manuelle)" -ForegroundColor White

$repoChoice = Read-Host "Choix (1-4)"

switch ($repoChoice) {
    "1" { 
        Write-Host ""
        Write-Host "Prochaines etapes GitHub:" -ForegroundColor Cyan
        Write-Host "1. Allez sur github.com et creez un nouveau repository 'melyia'" -ForegroundColor White
        Write-Host "2. Repository PRIVE recommande pour ce projet" -ForegroundColor Yellow
        Write-Host "3. Une fois cree, executez:" -ForegroundColor White
        Write-Host "   git remote add origin https://github.com/VOTRE-USERNAME/melyia.git" -ForegroundColor Cyan
        Write-Host "   git push -u origin main" -ForegroundColor Cyan
    }
    "2" { 
        Write-Host ""
        Write-Host "Prochaines etapes GitLab:" -ForegroundColor Cyan
        Write-Host "1. Allez sur gitlab.com et creez un nouveau projet 'melyia'" -ForegroundColor White
        Write-Host "2. Projet PRIVE recommande" -ForegroundColor Yellow
        Write-Host "3. Une fois cree, executez:" -ForegroundColor White
        Write-Host "   git remote add origin https://gitlab.com/VOTRE-USERNAME/melyia.git" -ForegroundColor Cyan
        Write-Host "   git push -u origin main" -ForegroundColor Cyan
    }
    "3" {
        $repoUrl = Read-Host "URL du repository existant (https://...)"
        if ($repoUrl) {
            git remote add origin $repoUrl
            Write-Host "Remote ajoute: $repoUrl" -ForegroundColor Green
            Write-Host "Vous pouvez maintenant faire: git push -u origin main" -ForegroundColor Cyan
        }
    }
    "4" {
        Write-Host "Configuration repository reportee" -ForegroundColor Yellow
        Write-Host "N'oubliez pas de configurer votre repository avant d'utiliser le portable" -ForegroundColor Yellow
    }
}

# 7. Premier commit (si nouveau repo)
$status = git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "Creation du commit initial..." -ForegroundColor Yellow
    git add .
    git commit -m "Initial commit - Melyia multi-machines setup"
    Write-Host "Commit initial cree" -ForegroundColor Green
    
    if ($repoChoice -in @("1", "2", "3")) {
        $pushNow = Read-Host "Pousser vers le repository distant maintenant? (Y/n)"
        if ($pushNow -ne "n") {
            git push -u origin main
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Code pousse vers le repository distant" -ForegroundColor Green
            } else {
                Write-Host "Probleme lors du push. Verifiez votre configuration repository" -ForegroundColor Red
            }
        }
    }
}

# 8. Creer script de statut
$statusScript = @"
# Script de verification statut Melyia
Write-Host "STATUT CONFIGURATION MELYIA" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan

# Git
Write-Host ""
Write-Host "GIT:" -ForegroundColor Yellow
git --version
Write-Host "Repository: $(if (Test-Path '.git') { 'Initialise' } else { 'Non initialise' })" -ForegroundColor White
Write-Host "Remote: $(git remote get-url origin 2>`$null || 'Aucun')" -ForegroundColor White
Write-Host "Branch: $(git branch --show-current 2>`$null || 'Aucune')" -ForegroundColor White

# SSH
Write-Host ""
Write-Host "SSH:" -ForegroundColor Yellow
Write-Host "Config: $(if (Test-Path "`$env:USERPROFILE\.ssh\config") { 'Configure' } else { 'Non configure' })" -ForegroundColor White
Write-Host "Cles: $(if (Test-Path "`$env:USERPROFILE\.ssh\melyia_*") { 'Generees' } else { 'Non generees' })" -ForegroundColor White

# Scripts
Write-Host ""
Write-Host "SCRIPTS:" -ForegroundColor Yellow
`$scripts = @("setup\setup-ssh-multi.ps1", "dev\start-dev.ps1", "dev\sync-and-push.ps1")
foreach (`$script in `$scripts) {
    Write-Host "`$script`: $(if (Test-Path `$script) { 'Present' } else { 'Manquant' })" -ForegroundColor White
}

Write-Host ""
Write-Host "Prochaine etape recommandee:" -ForegroundColor Cyan
if (!(Test-Path "`$env:USERPROFILE\.ssh\config")) {
    Write-Host ".\setup\setup-ssh-multi.ps1" -ForegroundColor White
} else {
    Write-Host "Configuration terminee ! Utilisez: .\dev\start-dev.ps1" -ForegroundColor White
}
"@

$statusScript | Out-File -FilePath "status.ps1" -Encoding UTF8

# 9. Resume et prochaines etapes
Write-Host ""
Write-Host "Configuration Git terminee !" -ForegroundColor Green

Write-Host ""
Write-Host "RESUME:" -ForegroundColor Cyan
Write-Host "Git configure ($gitName <$gitEmail>)" -ForegroundColor White
Write-Host "Repository initialise" -ForegroundColor White
Write-Host "Structure multi-machines creee" -ForegroundColor White
Write-Host ".gitignore optimise" -ForegroundColor White
Write-Host "README et documentation" -ForegroundColor White

Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Configuration SSH: .\setup\setup-ssh-multi.ps1" -ForegroundColor White
Write-Host "2. Configuration Cursor: .\config\configure-cursor-ssh.ps1" -ForegroundColor White
Write-Host "3. Test complet: .\setup\test-setup-complet.ps1" -ForegroundColor White
Write-Host "4. Setup portable (apres avoir copie portable-setup/)" -ForegroundColor White

Write-Host ""
Write-Host "CONSEIL:" -ForegroundColor Cyan
Write-Host "Executez maintenant: .\setup\setup-ssh-multi.ps1" -ForegroundColor White

Write-Host ""
Write-Host "Script de statut cree: status.ps1" -ForegroundColor Green
Write-Host "Utilisez-le pour verifier votre configuration a tout moment" -ForegroundColor White

Write-Host ""
Write-Host "Configuration Git Melyia terminee avec succes !" -ForegroundColor Green