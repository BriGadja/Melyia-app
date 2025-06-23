# Script: dev/start-dev-CLEAN.ps1  
# Description: Demarrage developpement rapide Melyia - VERSION SSH ADAPTEE
# Machine: PC FIXE + PORTABLE

param(
    [string]$Mode = "auto",  # auto, fixe, portable, sync, offline
    [switch]$NoSync = $false,  # Skip la synchronisation Git
    [switch]$OfflineMode = $false,  # Mode sans backend
    [switch]$QuickStart = $false  # Demarrage ultra-rapide
)

Write-Host "Demarrage Developpement Melyia..." -ForegroundColor Green
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# 1. Detection automatique environnement
$isPortable = $false
$hostname = hostname
$machineType = "PC Fixe"

if ($Mode -eq "auto") {
    if ($hostname -like "*portable*" -or $hostname -like "*laptop*" -or $hostname -like "*mobile*") {
        $isPortable = $true
        $machineType = "Portable"
        Write-Host "Detection: Ordinateur portable ($hostname)" -ForegroundColor Yellow
    } else {
        Write-Host "Detection: PC fixe ($hostname)" -ForegroundColor Yellow
    }
} elseif ($Mode -eq "portable") {
    $isPortable = $true
    $machineType = "Portable"
    Write-Host "Mode force: Portable" -ForegroundColor Yellow
} else {
    Write-Host "Mode force: PC fixe" -ForegroundColor Yellow
}

# 2. Configuration SSH adaptee (CORRECTION MAJEURE)
$sshKeyPath = if ($isPortable) { "$env:USERPROFILE\.ssh\melyia_portable" } else { "$env:USERPROFILE\.ssh\melyia_main" }
$sshHost = "ubuntu@51.91.145.255"
$sshCommand = "ssh -i `"$sshKeyPath`" $sshHost"

Write-Host "Configuration SSH: $machineType -> $sshKeyPath" -ForegroundColor Cyan

# 3. Verification environnement de base
Write-Host ""
Write-Host "Verification environnement..." -ForegroundColor Yellow

# Verifier Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git non installe" -ForegroundColor Red
    exit 1
}

# Verifier Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js non installe" -ForegroundColor Red
    exit 1
}

# Verifier npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm non installe" -ForegroundColor Red
    exit 1
}

# Verifier cle SSH
if (!(Test-Path $sshKeyPath)) {
    Write-Host "Cle SSH manquante: $sshKeyPath" -ForegroundColor Red
    Write-Host "Executez d'abord le script setup SSH" -ForegroundColor Yellow
    exit 1
}

Write-Host "Git: $(git --version)" -ForegroundColor Green
Write-Host "Node.js: $(node --version)" -ForegroundColor Green
Write-Host "npm: $(npm --version)" -ForegroundColor Green
Write-Host "SSH Key: $(Split-Path $sshKeyPath -Leaf)" -ForegroundColor Green

# 4. Synchronisation Git (surtout pour portable)
if (!$NoSync -and ($isPortable -or $Mode -eq "sync")) {
    Write-Host ""
    Write-Host "Synchronisation Git..." -ForegroundColor Yellow
    
    # Verifier statut Git
    $hasRepo = Test-Path ".git"
    if (!$hasRepo) {
        Write-Host "Pas de repository Git detecte" -ForegroundColor Red
        Write-Host "Assurez-vous d'etre dans le dossier du projet Melyia" -ForegroundColor Yellow
        exit 1
    }
    
    # Verifier remote
    $hasRemote = git remote get-url origin 2>$null
    if (!$hasRemote) {
        Write-Host "Aucun remote Git configure" -ForegroundColor Yellow
        Write-Host "Mode local seulement" -ForegroundColor White
    } else {
        Write-Host "Remote: $hasRemote" -ForegroundColor White
        
        # Stash changements locaux si necessaire
        $hasChanges = git status --porcelain
        $stashCreated = $false
        
        if ($hasChanges) {
            Write-Host "Changements locaux detectes:" -ForegroundColor Yellow
            git status --short
            
            if (!$QuickStart) {
                $stashChoice = Read-Host "Action: [s]tash, [c]ommit, [i]gnorer, [a]nnuler (s)"
                
                switch ($stashChoice.ToLower()) {
                    "c" {
                        $commitMsg = Read-Host "Message de commit"
                        git add .
                        git commit -m $commitMsg
                        Write-Host "Changements commitees" -ForegroundColor Green
                    }
                    "i" {
                        Write-Host "Changements ignores - risque de conflits" -ForegroundColor Yellow
                    }
                    "a" {
                        Write-Host "Demarrage annule" -ForegroundColor Red
                        exit 0
                    }
                    default {
                        $stashName = "auto-stash-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')-$hostname"
                        git stash push -m $stashName
                        Write-Host "Changements sauvegardes: $stashName" -ForegroundColor Green
                        $stashCreated = $true
                    }
                }
            } else {
                # Mode QuickStart : stash automatique
                $stashName = "quickstart-$(Get-Date -Format 'HH-mm-ss')"
                git stash push -m $stashName
                Write-Host "Auto-stash: $stashName" -ForegroundColor Green
                $stashCreated = $true
            }
        }
        
        # Pull derniere version
        Write-Host "Recuperation derniere version..." -ForegroundColor Yellow
        git pull origin main --rebase
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Code a jour" -ForegroundColor Green
        } else {
            Write-Host "Probleme de synchronisation Git" -ForegroundColor Red
            Write-Host "Continuez en mode local ou resolvez les conflits" -ForegroundColor Yellow
        }
        
        # Proposer restauration du stash
        if ($stashCreated -and !$QuickStart) {
            $restoreStash = Read-Host "Restaurer vos changements locaux? (y/N)"
            if ($restoreStash.ToLower() -eq "y") {
                git stash pop
                Write-Host "Changements restaures" -ForegroundColor Green
            }
        }
    }
}

# 5. Test connexion backend (CORRECTION SSH)
Write-Host ""
Write-Host "Test connexion backend..." -ForegroundColor Yellow
$backendAvailable = $false

if (!$OfflineMode) {
    # Test SSH avec timeout court et syntaxe adaptee
    Write-Host "Test SSH: $sshCommand" -ForegroundColor Gray
    
    $testResult = & cmd /c "ssh -i `"$sshKeyPath`" -o ConnectTimeout=5 -o BatchMode=yes $sshHost `"echo Backend accessible`" 2>nul"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend SSH accessible" -ForegroundColor Green
        $backendAvailable = $true
        
        # Test sante des services
        $serviceStatus = & cmd /c "ssh -i `"$sshKeyPath`" -o BatchMode=yes $sshHost `"systemctl is-active nginx postgresql ollama 2>/dev/null || echo partial`""
        Write-Host "Services: $serviceStatus" -ForegroundColor White
        
    } else {
        Write-Host "Backend SSH inaccessible" -ForegroundColor Red
        
        if (!$QuickStart) {
            Write-Host "Raisons possibles:" -ForegroundColor Yellow
            Write-Host "  • Pas de connexion internet" -ForegroundColor White
            Write-Host "  • Serveur eteint ou maintenance" -ForegroundColor White
            Write-Host "  • Configuration SSH incorrecte" -ForegroundColor White
            
            $continueOffline = Read-Host "Continuer en mode frontend seulement? (Y/n)"
            if ($continueOffline.ToLower() -eq "n") {
                exit 1
            }
        }
        
        $OfflineMode = $true
        Write-Host "Passage en mode offline" -ForegroundColor Yellow
    }
} else {
    Write-Host "Mode offline active" -ForegroundColor Yellow
}

# 6. Installation/mise a jour dependances
Write-Host ""
Write-Host "Verification dependances..." -ForegroundColor Yellow

$needInstall = $false
if (!(Test-Path "node_modules")) {
    $needInstall = $true
    Write-Host "Dossier node_modules manquant" -ForegroundColor Yellow
} elseif (!(Test-Path "package-lock.json")) {
    Write-Host "package-lock.json manquant" -ForegroundColor Yellow
} else {
    # Verifier si package.json plus recent que node_modules
    $packageTime = (Get-Item "package.json").LastWriteTime
    $nodeModulesTime = (Get-Item "node_modules").LastWriteTime
    
    if ($packageTime -gt $nodeModulesTime) {
        $needInstall = $true
        Write-Host "package.json modifie depuis derniere installation" -ForegroundColor Yellow
    }
}

if ($needInstall) {
    Write-Host "Installation dependances..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependances installees" -ForegroundColor Green
    } else {
        Write-Host "Erreur installation dependances" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Dependances a jour" -ForegroundColor Green
}

# 7. Configuration environnement
Write-Host ""
Write-Host "Configuration environnement..." -ForegroundColor Yellow

$envFile = ".env.local"
$needEnvSetup = $false

if (!(Test-Path $envFile)) {
    $needEnvSetup = $true
    Write-Host "Creation fichier environnement..." -ForegroundColor Yellow
} else {
    Write-Host "Fichier environnement existant" -ForegroundColor Green
}

if ($needEnvSetup) {
    $envContent = @"
# Environnement Melyia - $machineType
# Genere le $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# API Configuration
VITE_API_URL=https://app-dev.melyia.com/api
VITE_API_BASE_URL=https://dev.melyia.com/api
VITE_DEV_MODE=true
NODE_ENV=development

# Machine Info
VITE_MACHINE_TYPE=$($machineType.ToLower())
VITE_HOSTNAME=$hostname
VITE_BACKEND_AVAILABLE=$backendAvailable

# Webhook Configuration
VITE_WEBHOOK_TOKEN=2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410
VITE_N8N_WEBHOOK_URL=https://n8n.sablia.io/webhook/melyia-waiting-list

# Development Options
VITE_HOT_RELOAD=true
VITE_DEBUG_MODE=true
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "Fichier environnement cree" -ForegroundColor Green
}

# 8. Demarrage services
Write-Host ""
Write-Host "Demarrage services..." -ForegroundColor Green

$processes = @()

# Frontend en arriere-plan
Write-Host "Demarrage frontend React..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev:app" -WindowStyle Minimized -PassThru
$processes += $frontendProcess
Write-Host "Frontend demarre (PID: $($frontendProcess.Id))" -ForegroundColor Green

# Monitoring backend si disponible (CORRECTION SSH)
if ($backendAvailable) {
    Write-Host "Demarrage monitoring backend..." -ForegroundColor Yellow
    $monitorCommand = "ssh -i `"$sshKeyPath`" $sshHost `"echo 'Monitoring Melyia'; uptime; ps aux | grep -E '(node|ollama)' | head -5; echo 'Tapez exit pour fermer'; bash`""
    $monitorProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $monitorCommand -WindowStyle Minimized -PassThru
    $processes += $monitorProcess
    Write-Host "Monitoring demarre (PID: $($monitorProcess.Id))" -ForegroundColor Green
}

# 9. Ouverture navigateur
Start-Sleep 5
Write-Host ""
Write-Host "Ouverture navigateur..." -ForegroundColor Yellow

$frontendUrl = "http://localhost:5173"
Start-Process $frontendUrl

Write-Host "Navigateur ouvert: $frontendUrl" -ForegroundColor Green

# 10. Resume de la configuration
Write-Host ""
Write-Host "Environnement developpement pret !" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host ""
Write-Host "CONFIGURATION ACTIVE:" -ForegroundColor Cyan
Write-Host "Machine: $machineType ($hostname)" -ForegroundColor White
Write-Host "SSH Key: $(Split-Path $sshKeyPath -Leaf)" -ForegroundColor White
Write-Host "Backend: $(if ($backendAvailable) { "Connecte" } else { "Offline" })" -ForegroundColor White

Write-Host ""
Write-Host "SERVICES ACTIFS:" -ForegroundColor Cyan
Write-Host "• Frontend: $frontendUrl" -ForegroundColor White
Write-Host "• Backend: https://app-dev.melyia.com$(if (!$backendAvailable) { " (indisponible)" })" -ForegroundColor White
Write-Host "• Monitoring: Terminal dedie$(if (!$backendAvailable) { " (indisponible)" })" -ForegroundColor White

Write-Host ""
Write-Host "PROCESSUS LANCES:" -ForegroundColor Cyan
foreach ($proc in $processes) {
    if (!$proc.HasExited) {
        Write-Host "• PID $($proc.Id): Process actif" -ForegroundColor White
    }
}

# 11. Menu actions rapides
if (!$QuickStart) {
    Write-Host ""
    Write-Host "ACTIONS RAPIDES:" -ForegroundColor Cyan
    Write-Host "1. Ouvrir app dev (https://app-dev.melyia.com)" -ForegroundColor White
    Write-Host "2. Push changements rapide" -ForegroundColor White
    Write-Host "3. Deploy sur serveur" -ForegroundColor White
    Write-Host "4. Monitoring serveur $(if (!$backendAvailable) { "(indisponible)" })" -ForegroundColor White
    Write-Host "5. Synchroniser et redemarrer" -ForegroundColor White
    Write-Host "6. Arreter tous les services" -ForegroundColor White
    
    $action = Read-Host "Action rapide (1-6) ou Entree pour continuer"
    
    switch ($action) {
        "1" { 
            Start-Process "https://app-dev.melyia.com"
            Write-Host "App dev ouverte" -ForegroundColor Green
        }
        "2" { 
            Write-Host "Push rapide..." -ForegroundColor Yellow
            git add .
            $commitMsg = Read-Host "Message de commit (optionnel)"
            if (!$commitMsg) { $commitMsg = "Quick update from $machineType" }
            git commit -m $commitMsg
            git push
            Write-Host "Changements pousses" -ForegroundColor Green
        }
        "3" { 
            if ($backendAvailable) {
                Write-Host "Deploiement..." -ForegroundColor Yellow
                npm run deploy:app
                Write-Host "Deploiement termine" -ForegroundColor Green
            } else {
                Write-Host "Backend non disponible pour le deploiement" -ForegroundColor Red
            }
        }
        "4" { 
            if ($backendAvailable) {
                # Connexion SSH avec syntaxe adaptee
                Start-Process powershell -ArgumentList "-NoExit", "-Command", $sshCommand
            } else {
                Write-Host "Backend non disponible" -ForegroundColor Red
            }
        }
        "5" {
            Write-Host "Redemarrage..." -ForegroundColor Yellow
            foreach ($proc in $processes) {
                if (!$proc.HasExited) {
                    $proc.Kill()
                }
            }
            Start-Sleep 2
            & $MyInvocation.MyCommand.Path -QuickStart
        }
        "6" {
            Write-Host "Arret des services..." -ForegroundColor Yellow
            foreach ($proc in $processes) {
                if (!$proc.HasExited) {
                    $proc.Kill()
                    Write-Host "Processus $($proc.Id) arrete" -ForegroundColor Green
                }
            }
        }
    }
}

Write-Host ""
Write-Host "NOTES IMPORTANTES:" -ForegroundColor Cyan
Write-Host "• Sauvegardez regulierement avec: .\dev\sync-and-push.ps1" -ForegroundColor White
Write-Host "• Testez sur: http://localhost:5173 (local) et https://app-dev.melyia.com (prod)" -ForegroundColor White
Write-Host "• Logs disponibles dans les terminaux dedies" -ForegroundColor White

if ($backendAvailable) {
    Write-Host "• SSH backend: $sshCommand" -ForegroundColor White
} else {
    Write-Host "• Mode offline: fonctionnalites backend limitees" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bon developpement sur Melyia !" -ForegroundColor Green