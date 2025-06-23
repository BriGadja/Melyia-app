# Script: setup-git-melyia.ps1
# Description: Configuration Git pour synchronisation multi-machines
# Machine: PC FIXE (exécution initiale)

Write-Host "🔄 Configuration Git Melyia Multi-Machines..." -ForegroundColor Green

# 1. Vérifier Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git non installé. Installez Git for Windows d'abord." -ForegroundColor Red
    Write-Host "Téléchargez sur: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git détecté: $(git --version)" -ForegroundColor Green

# 2. Configuration Git globale
Write-Host "`n📝 Configuration Git utilisateur..." -ForegroundColor Yellow
$currentName = git config --global user.name
$currentEmail = git config --global user.email

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

Write-Host "✅ Configuration Git globale terminée" -ForegroundColor Green
Write-Host "   Nom: $gitName" -ForegroundColor White
Write-Host "   Email: $gitEmail" -ForegroundColor White

# 3. Initialiser le repo Melyia (si pas déjà fait)
if (!(Test-Path ".git")) {
    Write-Host "`n🔄 Initialisation repo Git..." -ForegroundColor Yellow
    git init
    
    # Créer .gitignore optimisé
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
    Write-Host "✅ .gitignore créé" -ForegroundColor Green
} else {
    Write-Host "✅ Repository Git existant détecté" -ForegroundColor Green
}

# 4. Créer structure pour multi-machines
Write-Host "`n📁 Création structure multi-machines..." -ForegroundColor Yellow

# Créer dossiers scripts
$folders = @("setup", "dev", "config", "docs")
foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -Path $folder -ItemType Directory -Force | Out-Null
        Write-Host "✅ Dossier créé: $folder" -ForegroundColor Green
    }
}

# 5. Créer README principal
$readme = @"
# 🦷 Melyia - Application Dentaire avec IA

## 🎯 Architecture Multi-Machines

Cette configuration permet de développer sur votre **PC fixe** et votre **portable** avec synchronisation automatique via Git, tout en partageant le même backend serveur.

```
🏠 PC Fixe (développement principal)
├── Frontend local (Git push/pull)
├── SSH → Backend serveur 
└── Cursor configuré

☁️ Git Repository (synchronisation)
├── Frontend code
├── Configuration workspace
└── Scripts deployment

💻 Portable (développement nomade)  
├── Git clone/pull frontend
├── SSH → Même backend serveur
└── Cursor configuré identique

🖥️ Backend Serveur (unique - 51.91.145.255)
├── APIs + Database + IA
├── Accès SSH depuis PC fixe
└── Accès SSH depuis portable
```

## 🚀 Quick Start

### Setup Initial (une seule fois)

**PC Fixe:**
1. ``.\setup-git-melyia.ps1`` (ce script)
2. ``.\setup\setup-ssh-multi.ps1``
3. Configurer repository distant
4. ``git push -u origin main``

**Portable:**
1. ``git clone [repo-url] melyia``
2. Copier dossier ``portable-setup`` depuis PC fixe
3. ``.\setup\setup-portable.ps1``

### Workflow Quotidien

**Changement de machine:**
```powershell
# Avant de partir (PC fixe)
.\dev\sync-and-push.ps1 "Fin journée bureau"

# En arrivant (portable)  
git pull origin main
.\dev\start-dev.ps1
```

**Développement normal:**
```powershell
# Sur n'importe quelle machine
.\dev\start-dev.ps1    # Démarrage env complet
# ... développement ...
.\dev\sync-and-push.ps1 "Feature terminée"
```

## 📋 Scripts Disponibles

- ``setup-git-melyia.ps1`` - Configuration Git initiale (PC fixe)
- ``setup/setup-ssh-multi.ps1`` - Configuration SSH multi-machines (PC fixe)
- ``setup/setup-portable.ps1`` - Setup portable (portable)
- ``dev/start-dev.ps1`` - Démarrage développement (PC fixe + portable)
- ``dev/sync-and-push.ps1`` - Synchronisation rapide (PC fixe + portable)
- ``config/configure-cursor-ssh.ps1`` - Configuration Cursor (PC fixe + portable)

## 🏗️ Stack Technique

**Frontend:** React + TypeScript + Vite + Tailwind CSS
**Backend:** Node.js + Express + PostgreSQL + pgvector  
**IA:** Ollama (local)
**Déploiement:** Scripts automatisés
**SSH:** Clés dédiées par machine

## 📞 Support

Pour toute question sur la configuration, consultez ``docs/SETUP-MULTI-MACHINES.md``
"@

$readme | Out-File -FilePath "README.md" -Encoding UTF8

# 6. Remote Git repository setup
Write-Host "`n🌐 Configuration repository distant..." -ForegroundColor Yellow
Write-Host "Options disponibles:" -ForegroundColor White
Write-Host "1. GitHub (recommandé)" -ForegroundColor White
Write-Host "2. GitLab" -ForegroundColor White  
Write-Host "3. Repository privé existant" -ForegroundColor White
Write-Host "4. Plus tard (configuration manuelle)" -ForegroundColor White

$repoChoice = Read-Host "Choix (1-4)"

switch ($repoChoice) {
    "1" { 
        Write-Host "`n📋 Prochaines étapes GitHub:" -ForegroundColor Cyan
        Write-Host "1. Allez sur github.com et créez un nouveau repository 'melyia'" -ForegroundColor White
        Write-Host "2. Repository PRIVÉ recommandé pour ce projet" -ForegroundColor Yellow
        Write-Host "3. Une fois créé, exécutez:" -ForegroundColor White
        Write-Host "   git remote add origin https://github.com/VOTRE-USERNAME/melyia.git" -ForegroundColor Cyan
        Write-Host "   git push -u origin main" -ForegroundColor Cyan
    }
    "2" { 
        Write-Host "`n📋 Prochaines étapes GitLab:" -ForegroundColor Cyan
        Write-Host "1. Allez sur gitlab.com et créez un nouveau projet 'melyia'" -ForegroundColor White
        Write-Host "2. Projet PRIVÉ recommandé" -ForegroundColor Yellow
        Write-Host "3. Une fois créé, exécutez:" -ForegroundColor White
        Write-Host "   git remote add origin https://gitlab.com/VOTRE-USERNAME/melyia.git" -ForegroundColor Cyan
        Write-Host "   git push -u origin main" -ForegroundColor Cyan
    }
    "3" {
        $repoUrl = Read-Host "URL du repository existant (https://...)"
        if ($repoUrl) {
            git remote add origin $repoUrl
            Write-Host "✅ Remote ajouté: $repoUrl" -ForegroundColor Green
            Write-Host "Vous pouvez maintenant faire: git push -u origin main" -ForegroundColor Cyan
        }
    }
    "4" {
        Write-Host "⏭️ Configuration repository reportée" -ForegroundColor Yellow
        Write-Host "N'oubliez pas de configurer votre repository avant d'utiliser le portable" -ForegroundColor Yellow
    }
}

# 7. Premier commit (si nouveau repo)
$status = git status --porcelain
if ($status) {
    Write-Host "`n📝 Création du commit initial..." -ForegroundColor Yellow
    git add .
    git commit -m "🎉 Initial commit - Melyia multi-machines setup

✅ Configuration:
- Structure multi-machines (PC fixe + portable)
- Scripts automatisés de développement
- Configuration Git et .gitignore
- Documentation setup

🔧 Prochaines étapes:
- Configurer SSH (setup/setup-ssh-multi.ps1)
- Setup portable
- Configuration Cursor
"
    Write-Host "✅ Commit initial créé" -ForegroundColor Green
    
    if ($repoChoice -in @("1", "2", "3")) {
        $pushNow = Read-Host "Pousser vers le repository distant maintenant? (Y/n)"
        if ($pushNow -ne "n") {
            git push -u origin main
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Code poussé vers le repository distant" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Problème lors du push. Vérifiez votre configuration repository" -ForegroundColor Red
            }
        }
    }
}

# 8. Résumé et prochaines étapes
Write-Host "`n🎉 Configuration Git terminée !" -ForegroundColor Green

Write-Host "`n📋 RÉSUMÉ:" -ForegroundColor Cyan
Write-Host "✅ Git configuré ($gitName <$gitEmail>)" -ForegroundColor White
Write-Host "✅ Repository initialisé" -ForegroundColor White
Write-Host "✅ Structure multi-machines créée" -ForegroundColor White
Write-Host "✅ .gitignore optimisé" -ForegroundColor White
Write-Host "✅ README et documentation" -ForegroundColor White

Write-Host "`n🔄 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "1. 🔑 Configuration SSH: .\setup\setup-ssh-multi.ps1" -ForegroundColor White
Write-Host "2. 🎨 Configuration Cursor: .\config\configure-cursor-ssh.ps1" -ForegroundColor White
Write-Host "3. 🧪 Test complet: .\setup\test-setup-complet.ps1" -ForegroundColor White
Write-Host "4. 💻 Setup portable (après avoir copié portable-setup/)" -ForegroundColor White

Write-Host "`n💡 CONSEIL:" -ForegroundColor Cyan
Write-Host "Exécutez maintenant: .\setup\setup-ssh-multi.ps1" -ForegroundColor White

# 9. Créer script de statut
$statusScript = @"
# Script de vérification statut Melyia
Write-Host "📊 STATUT CONFIGURATION MELYIA" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan

# Git
Write-Host "`n🔄 GIT:" -ForegroundColor Yellow
git --version
Write-Host "Repository: $(if (Test-Path '.git') { '✅ Initialisé' } else { '❌ Non initialisé' })" -ForegroundColor White
Write-Host "Remote: $(git remote get-url origin 2>$null || 'Aucun')" -ForegroundColor White
Write-Host "Branch: $(git branch --show-current 2>$null || 'Aucune')" -ForegroundColor White

# SSH
Write-Host "`n🔑 SSH:" -ForegroundColor Yellow
Write-Host "Config: $(if (Test-Path "$env:USERPROFILE\.ssh\config") { '✅ Configuré' } else { '❌ Non configuré' })" -ForegroundColor White
Write-Host "Clés: $(if (Test-Path "$env:USERPROFILE\.ssh\melyia_*") { '✅ Générées' } else { '❌ Non générées' })" -ForegroundColor White

# Scripts
Write-Host "`n📜 SCRIPTS:" -ForegroundColor Yellow
$scripts = @("setup\setup-ssh-multi.ps1", "dev\start-dev.ps1", "dev\sync-and-push.ps1")
foreach ($script in $scripts) {
    Write-Host "$script`: $(if (Test-Path $script) { '✅' } else { '❌' })" -ForegroundColor White
}

# Portable setup
Write-Host "`n💻 PORTABLE:" -ForegroundColor Yellow
Write-Host "Package: $(if (Test-Path "$env:USERPROFILE\Desktop\melyia-portable-setup") { '✅ Prêt' } else { '❌ Non créé' })" -ForegroundColor White

Write-Host "`n🎯 Prochaine étape recommandée:" -ForegroundColor Cyan
if (!(Test-Path "$env:USERPROFILE\.ssh\config")) {
    Write-Host ".\setup\setup-ssh-multi.ps1" -ForegroundColor White
} elseif (!(Test-Path "$env:USERPROFILE\Desktop\melyia-portable-setup")) {
    Write-Host "Configuration SSH manquante" -ForegroundColor White
} else {
    Write-Host "Configuration terminée ! Utilisez: .\dev\start-dev.ps1" -ForegroundColor White
}
"@

$statusScript | Out-File -FilePath "status.ps1" -Encoding UTF8

Write-Host "`n✨ Script de statut créé: status.ps1" -ForegroundColor Green
Write-Host "Utilisez-le pour vérifier votre configuration à tout moment" -ForegroundColor White

Write-Host "`n🚀 Configuration Git Melyia terminée avec succès !" -ForegroundColor Green