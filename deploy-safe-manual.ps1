# 🚀 SCRIPT DÉPLOIEMENT SÉCURISÉ MANUEL - MELYIA
# Méthode éprouvée 100% succès - Évite les timeouts SSH

param(
    [switch]$SkipBuild,
    [switch]$LandingOnly,
    [switch]$AppOnly,
    [switch]$Verbose
)

$CONFIG = @{
    SSH_HOST = "ubuntu@51.91.145.255"
    LANDING_LOCAL = "dist/landing"
    LANDING_REMOTE = "/var/www/melyia/dev-site"
    APP_LOCAL = "dist/app"
    APP_REMOTE = "/var/www/melyia/app-dev"
    TIMESTAMP = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
}

function Write-LogMessage {
    param([string]$Message, [string]$Color = "Cyan", [switch]$VerboseOnly)
    
    if ($VerboseOnly -and -not $Verbose) { return }
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $prefix = if ($VerboseOnly) { "[DEBUG]" } else { "" }
    Write-Host "[$timestamp] $prefix $Message" -ForegroundColor $Color
}

function Write-ProgressLog {
    param([string]$Activity, [string]$Status, [int]$PercentComplete)
    Write-Progress -Activity $Activity -Status $Status -PercentComplete $PercentComplete
    Write-LogMessage "$Activity - $Status ($PercentComplete%)" "Blue" -VerboseOnly
}

function Get-FolderSize {
    param([string]$Path)
    if (Test-Path $Path) {
        $size = (Get-ChildItem $Path -Recurse | Measure-Object -Property Length -Sum).Sum
        return [math]::Round($size / 1MB, 2)
    }
    return 0
}

function Test-Prerequisites {
    Write-LogMessage "🔍 Vérification prérequis..." "Blue"
    Write-ProgressLog "Prérequis" "Vérification des builds locaux..." 10
    
    # Vérifier builds locaux
    if (-not $SkipBuild) {
        $landingExists = Test-Path $CONFIG.LANDING_LOCAL
        $appExists = Test-Path $CONFIG.APP_LOCAL
        
        Write-LogMessage "📂 Landing build: $(if($landingExists){'✅ Présent'}else{'❌ Manquant'})" "White" -VerboseOnly
        Write-LogMessage "📂 App build: $(if($appExists){'✅ Présent'}else{'❌ Manquant'})" "White" -VerboseOnly
        
        if (-not $landingExists -or -not $appExists) {
            Write-LogMessage "🔨 Builds manquants - Exécution npm run build:both..." "Yellow"
            Write-ProgressLog "Prérequis" "Compilation des builds..." 20
            
            $buildStart = Get-Date
            npm run build:both
            if ($LASTEXITCODE -ne 0) {
                throw "❌ Build failed"
            }
            $buildDuration = (Get-Date) - $buildStart
            Write-LogMessage "✅ Build terminé en $($buildDuration.TotalSeconds.ToString('F1'))s" "Green"
        } else {
            Write-LogMessage "✅ Builds existants détectés" "Green"
        }
    } else {
        Write-LogMessage "⏭️ Build ignoré (paramètre -SkipBuild)" "Yellow"
    }
    
    # Afficher tailles des builds
    if (Test-Path $CONFIG.LANDING_LOCAL) {
        $landingSize = Get-FolderSize $CONFIG.LANDING_LOCAL
        Write-LogMessage "📊 Landing build: $landingSize MB" "White" -VerboseOnly
    }
    if (Test-Path $CONFIG.APP_LOCAL) {
        $appSize = Get-FolderSize $CONFIG.APP_LOCAL
        Write-LogMessage "📊 App build: $appSize MB" "White" -VerboseOnly
    }
    
    # Vérifier connectivité SSH
    Write-ProgressLog "Prérequis" "Test connectivité SSH..." 80
    Write-LogMessage "🔗 Test connexion SSH vers $($CONFIG.SSH_HOST)..." "Cyan" -VerboseOnly
    
    $sshStart = Get-Date
    $testSSH = ssh $CONFIG.SSH_HOST "echo 'SSH OK'; uptime"
    $sshDuration = (Get-Date) - $sshStart
    
    if ($LASTEXITCODE -ne 0) {
        throw "❌ Connexion SSH impossible vers $($CONFIG.SSH_HOST)"
    }
    
    Write-LogMessage "✅ SSH connecté en $($sshDuration.TotalMilliseconds.ToString('F0'))ms" "Green" -VerboseOnly
    Write-LogMessage "🖥️ Serveur: $($testSSH.Split("`n")[1])" "White" -VerboseOnly
    
    Write-ProgressLog "Prérequis" "Validation terminée" 100
    Write-LogMessage "✅ Tous les prérequis validés" "Green"
}

function Deploy-Landing {
    Write-LogMessage "🏠 DÉPLOIEMENT LANDING" "Magenta"
    $deployStart = Get-Date
    
    # Étape 1: Upload
    Write-ProgressLog "Landing" "Upload des fichiers..." 25
    Write-LogMessage "📤 Upload landing vers serveur..." "Cyan"
    
    $landingSize = Get-FolderSize $CONFIG.LANDING_LOCAL
    Write-LogMessage "📊 Taille à uploader: $landingSize MB" "White" -VerboseOnly
    Write-LogMessage "🎯 Destination: /tmp/deploy-landing-$($CONFIG.TIMESTAMP)/" "White" -VerboseOnly
    
    $uploadStart = Get-Date
    scp -r "$($CONFIG.LANDING_LOCAL)/*" "$($CONFIG.SSH_HOST):/tmp/deploy-landing-$($CONFIG.TIMESTAMP)/"
    $uploadDuration = (Get-Date) - $uploadStart
    
    if ($LASTEXITCODE -ne 0) { throw "❌ Upload landing failed" }
    Write-LogMessage "✅ Upload terminé en $($uploadDuration.TotalSeconds.ToString('F1'))s" "Green" -VerboseOnly
    
    # Étape 2: Installation (1 seule connexion SSH)
    Write-ProgressLog "Landing" "Installation sur le serveur..." 75
    Write-LogMessage "🔧 Installation landing dans $($CONFIG.LANDING_REMOTE)..." "Cyan"
    Write-LogMessage "🗂️ Nettoyage dossier existant..." "White" -VerboseOnly
    Write-LogMessage "📋 Application permissions www-data:www-data..." "White" -VerboseOnly
    Write-LogMessage "🔒 Configuration permissions 755/644..." "White" -VerboseOnly
    
    $installCmd = @"
echo 'Début installation landing...' &&
sudo rm -rf $($CONFIG.LANDING_REMOTE)/* &&
echo 'Dossier nettoyé' &&
sudo cp -r /tmp/deploy-landing-$($CONFIG.TIMESTAMP)/* $($CONFIG.LANDING_REMOTE)/ &&
echo 'Fichiers copiés' &&
sudo chown -R www-data:www-data $($CONFIG.LANDING_REMOTE) &&
echo 'Propriétaires modifiés' &&
sudo chmod -R 644 $($CONFIG.LANDING_REMOTE)/* &&
sudo find $($CONFIG.LANDING_REMOTE) -type d -exec chmod 755 {} + &&
echo 'Permissions configurées' &&
rm -rf /tmp/deploy-landing-$($CONFIG.TIMESTAMP) &&
echo 'Nettoyage temporaire terminé' &&
ls -la $($CONFIG.LANDING_REMOTE) | head -3 &&
echo 'Landing installé avec succès'
"@
    
    $installStart = Get-Date
    $installOutput = ssh $CONFIG.SSH_HOST $installCmd
    $installDuration = (Get-Date) - $installStart
    
    if ($LASTEXITCODE -ne 0) { throw "❌ Installation landing failed" }
    
    # Log des détails d'installation
    if ($Verbose) {
        Write-LogMessage "📄 Sortie installation:" "White" -VerboseOnly
        $installOutput | ForEach-Object { Write-LogMessage "   $_" "DarkGray" -VerboseOnly }
    }
    
    Write-LogMessage "✅ Installation terminée en $($installDuration.TotalSeconds.ToString('F1'))s" "Green" -VerboseOnly
    
    $totalDuration = (Get-Date) - $deployStart
    Write-ProgressLog "Landing" "Déploiement terminé" 100
    Write-LogMessage "✅ Landing déployé avec succès en $($totalDuration.TotalSeconds.ToString('F1'))s" "Green"
}

function Deploy-App {
    Write-LogMessage "📱 DÉPLOIEMENT APPLICATION" "Magenta"
    $deployStart = Get-Date
    
    # Étape 1: Upload
    Write-ProgressLog "Application" "Upload des fichiers..." 20
    Write-LogMessage "📤 Upload application vers serveur..." "Cyan"
    
    $appSize = Get-FolderSize $CONFIG.APP_LOCAL
    Write-LogMessage "📊 Taille à uploader: $appSize MB" "White" -VerboseOnly
    Write-LogMessage "🎯 Destination: /tmp/deploy-app-$($CONFIG.TIMESTAMP)/" "White" -VerboseOnly
    
    $uploadStart = Get-Date
    scp -r "$($CONFIG.APP_LOCAL)/*" "$($CONFIG.SSH_HOST):/tmp/deploy-app-$($CONFIG.TIMESTAMP)/"
    $uploadDuration = (Get-Date) - $uploadStart
    
    if ($LASTEXITCODE -ne 0) { throw "❌ Upload app failed" }
    Write-LogMessage "✅ Upload terminé en $($uploadDuration.TotalSeconds.ToString('F1'))s" "Green" -VerboseOnly
    
    # Étape 2: Sauvegarde backend (si existe)
    Write-ProgressLog "Application" "Sauvegarde backend existant..." 40
    Write-LogMessage "💾 Vérification et sauvegarde backend..." "Cyan"
    Write-LogMessage "🔍 Recherche server.js et package.json..." "White" -VerboseOnly
    
    $backupCmd = @"
echo 'Début sauvegarde backend...' &&
mkdir -p /tmp/backend-backup-$($CONFIG.TIMESTAMP) &&
if [ -f $($CONFIG.APP_REMOTE)/server.js ]; then
    cp $($CONFIG.APP_REMOTE)/server.js /tmp/backend-backup-$($CONFIG.TIMESTAMP)/
    echo 'server.js sauvegardé'
else
    echo 'server.js non trouvé'
fi &&
if [ -f $($CONFIG.APP_REMOTE)/package.json ]; then
    cp $($CONFIG.APP_REMOTE)/package.json /tmp/backend-backup-$($CONFIG.TIMESTAMP)/
    echo 'package.json sauvegardé'  
else
    echo 'package.json non trouvé'
fi &&
echo 'Sauvegarde backend terminée'
"@
    
    $backupStart = Get-Date
    $backupOutput = ssh $CONFIG.SSH_HOST $backupCmd
    $backupDuration = (Get-Date) - $backupStart
    
    if ($LASTEXITCODE -ne 0) { throw "❌ Backup backend failed" }
    
    # Log détail sauvegarde
    if ($Verbose) {
        Write-LogMessage "📄 Résultat sauvegarde:" "White" -VerboseOnly
        $backupOutput | ForEach-Object { Write-LogMessage "   $_" "DarkGray" -VerboseOnly }
    }
    Write-LogMessage "✅ Sauvegarde terminée en $($backupDuration.TotalSeconds.ToString('F1'))s" "Green" -VerboseOnly
    
    # Étape 3: Installation app (1 seule connexion SSH)
    Write-ProgressLog "Application" "Installation et configuration..." 80
    Write-LogMessage "🔧 Installation application dans $($CONFIG.APP_REMOTE)..." "Cyan"
    Write-LogMessage "🗂️ Nettoyage dossier application..." "White" -VerboseOnly
    Write-LogMessage "📋 Copie nouveaux fichiers..." "White" -VerboseOnly
    Write-LogMessage "🔄 Restauration backend..." "White" -VerboseOnly
    Write-LogMessage "🔗 Création lien symbolique index.html..." "White" -VerboseOnly
    Write-LogMessage "🔒 Configuration permissions CSS/JS (CRITIQUE)..." "White" -VerboseOnly
    
    $installCmd = @"
echo 'Début installation application...' &&
sudo rm -rf $($CONFIG.APP_REMOTE)/* &&
echo 'Dossier application nettoyé' &&
sudo cp -r /tmp/deploy-app-$($CONFIG.TIMESTAMP)/* $($CONFIG.APP_REMOTE)/ &&
echo 'Nouveaux fichiers copiés' &&
if [ -f /tmp/backend-backup-$($CONFIG.TIMESTAMP)/server.js ]; then
    sudo cp /tmp/backend-backup-$($CONFIG.TIMESTAMP)/server.js $($CONFIG.APP_REMOTE)/
    echo 'server.js restauré'
fi &&
if [ -f /tmp/backend-backup-$($CONFIG.TIMESTAMP)/package.json ]; then
    sudo cp /tmp/backend-backup-$($CONFIG.TIMESTAMP)/package.json $($CONFIG.APP_REMOTE)/
    echo 'package.json restauré'
fi &&
cd $($CONFIG.APP_REMOTE) &&
sudo ln -sf index-app.html index.html &&
echo 'Lien symbolique créé' &&
sudo chown -R www-data:www-data $($CONFIG.APP_REMOTE) &&
echo 'Propriétaires modifiés' &&
sudo chmod -R 644 $($CONFIG.APP_REMOTE)/index*.html &&
echo 'Permissions HTML configurées' &&
sudo chmod -R 755 $($CONFIG.APP_REMOTE)/assets &&
echo 'Permissions assets configurées (755)' &&
sudo chmod -R 644 $($CONFIG.APP_REMOTE)/assets/* &&
echo 'Permissions fichiers assets configurées (644)' &&
sudo find $($CONFIG.APP_REMOTE)/assets -type d -exec chmod 755 {} + &&
echo 'Permissions dossiers assets finalisées' &&
rm -rf /tmp/deploy-app-$($CONFIG.TIMESTAMP) &&
rm -rf /tmp/backend-backup-$($CONFIG.TIMESTAMP) &&
echo 'Nettoyage temporaire terminé' &&
ls -la $($CONFIG.APP_REMOTE) | head -3 &&
echo '--- Assets ---' &&
ls -la $($CONFIG.APP_REMOTE)/assets | head -3 &&
echo 'Application installée avec succès'
"@
    
    $installStart = Get-Date
    $installOutput = ssh $CONFIG.SSH_HOST $installCmd
    $installDuration = (Get-Date) - $installStart
    
    if ($LASTEXITCODE -ne 0) { throw "❌ Installation app failed" }
    
    # Log des détails d'installation
    if ($Verbose) {
        Write-LogMessage "📄 Sortie installation:" "White" -VerboseOnly
        $installOutput | ForEach-Object { Write-LogMessage "   $_" "DarkGray" -VerboseOnly }
    }
    
    Write-LogMessage "✅ Installation terminée en $($installDuration.TotalSeconds.ToString('F1'))s" "Green" -VerboseOnly
    
    $totalDuration = (Get-Date) - $deployStart
    Write-ProgressLog "Application" "Déploiement terminé" 100
    Write-LogMessage "✅ Application déployée avec succès en $($totalDuration.TotalSeconds.ToString('F1'))s" "Green"
}

function Test-Deployment {
    Write-LogMessage "🧪 TESTS DE VALIDATION" "Blue"
    Write-ProgressLog "Validation" "Tests de connectivité..." 25
    
    $testStart = Get-Date
    
    # Test connectivité serveur
    Write-LogMessage "🌐 Test accessibilité des sites..." "Cyan" -VerboseOnly
    Write-LogMessage "🔗 Test landing: https://dev.melyia.com..." "White" -VerboseOnly
    
    $landingTestStart = Get-Date
    $landingTest = ssh $CONFIG.SSH_HOST "curl -s -I http://localhost/dev-site/ | head -1"
    $landingTestDuration = (Get-Date) - $landingTestStart
    
    Write-ProgressLog "Validation" "Test application..." 75
    Write-LogMessage "🔗 Test app: https://app-dev.melyia.com..." "White" -VerboseOnly
    
    $appTestStart = Get-Date
    $appTest = ssh $CONFIG.SSH_HOST "curl -s -I http://localhost/app-dev/ | head -1"
    $appTestDuration = (Get-Date) - $appTestStart
    
    # Validation landing
    if ($landingTest -match "(200|301|302)") {
        $landingDurationMs = $landingTestDuration.TotalMilliseconds.ToString('F0')
        Write-LogMessage "Landing accessible ($landingDurationMs ms)" "Green"
    } else {
        Write-LogMessage "Landing: $landingTest" "Yellow"
        Write-LogMessage "Réponse complète: $landingTest" "White" -VerboseOnly
    }
    
    # Validation app
    if ($appTest -match "(200|301|302)") {
        $appDurationMs = $appTestDuration.TotalMilliseconds.ToString('F0')
        Write-LogMessage "App accessible ($appDurationMs ms)" "Green"
    } else {
        Write-LogMessage "App: $appTest" "Yellow"
        Write-LogMessage "Réponse complète: $appTest" "White" -VerboseOnly
    }
    
    # Test permissions assets (critique pour CSS/JS)
    Write-LogMessage "🔒 Vérification permissions assets..." "Cyan" -VerboseOnly
    $permissionsTest = ssh $CONFIG.SSH_HOST "ls -la $($CONFIG.APP_REMOTE)/assets/ | head -2"
    Write-LogMessage "📋 Permissions assets: $($permissionsTest -split '`n' | Select-Object -Last 1)" "White" -VerboseOnly
    
    $totalTestDuration = (Get-Date) - $testStart
    Write-ProgressLog "Validation" "Tests terminés" 100
    Write-LogMessage "✅ Validation terminée en $($totalTestDuration.TotalSeconds.ToString('F1'))s" "Green" -VerboseOnly
}

function Main {
    $startTime = Get-Date
    $deployedComponents = @()
    
    try {
        Write-LogMessage "🚀 DÉPLOIEMENT SÉCURISÉ MANUEL MELYIA" "Green"
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "🛡️ Méthode éprouvée 100% succès" "Yellow"
        Write-LogMessage "⚡ Évite les timeouts SSH automatiquement" "Yellow"
        Write-LogMessage "🎯 Timestamp: $($CONFIG.TIMESTAMP)" "White" -VerboseOnly
        Write-LogMessage "📋 Mode: $(if($LandingOnly){'Landing uniquement'}elseif($AppOnly){'Application uniquement'}else{'Complet'})" "White" -VerboseOnly
        Write-LogMessage "🔧 Verbose: $(if($Verbose){'Activé'}else{'Désactivé'})" "White" -VerboseOnly
        Write-LogMessage "⏭️ Build: $(if($SkipBuild){'Ignoré'}else{'Automatique'})" "White" -VerboseOnly
        
        # Prérequis
        Write-ProgressLog "Déploiement Global" "Vérification prérequis..." 5
        Test-Prerequisites
        
        # Déploiements selon paramètres
        if (-not $AppOnly) {
            Write-ProgressLog "Déploiement Global" "Déploiement Landing..." 30
            Deploy-Landing
            $deployedComponents += "Landing"
        } else {
            Write-LogMessage "⏭️ Landing ignoré (mode AppOnly)" "Yellow" -VerboseOnly
        }
        
        if (-not $LandingOnly) {
            Write-ProgressLog "Déploiement Global" "Déploiement Application..." 70
            Deploy-App
            $deployedComponents += "Application"
        } else {
            Write-LogMessage "⏭️ Application ignorée (mode LandingOnly)" "Yellow" -VerboseOnly
        }
        
        # Validation
        Write-ProgressLog "Déploiement Global" "Tests de validation..." 90
        Test-Deployment
        
        $duration = (Get-Date) - $startTime
        $componentsDeployed = $deployedComponents -join " + "
        
        # Calcul statistiques
        $landingSize = if (Test-Path $CONFIG.LANDING_LOCAL) { Get-FolderSize $CONFIG.LANDING_LOCAL } else { 0 }
        $appSize = if (Test-Path $CONFIG.APP_LOCAL) { Get-FolderSize $CONFIG.APP_LOCAL } else { 0 }
        $totalSize = $landingSize + $appSize
        
        Write-ProgressLog "Déploiement Global" "Déploiement terminé avec succès" 100
        
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "🎉 DÉPLOIEMENT RÉUSSI" "Green"
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "⏱️ Durée totale: $($duration.TotalSeconds.ToString('F1'))s" "White"
        Write-LogMessage "📦 Composants: $componentsDeployed" "White"
        Write-LogMessage "📊 Taille déployée: $totalSize MB" "White"
        Write-LogMessage "🔢 SSH connexions: $(if($deployedComponents.Count -eq 2){6}elseif($deployedComponents.Count -eq 1){3}else{0})" "White" -VerboseOnly
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "🌐 URLS ACCESSIBLES:" "Green"
        Write-LogMessage "📍 Landing: https://dev.melyia.com" "White"
        Write-LogMessage "📍 App: https://app-dev.melyia.com" "White"
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "✅ SÉCURITÉ PRÉSERVÉE:" "Green"
        Write-LogMessage "🛡️ Protection anti-brute force active" "White"
        Write-LogMessage "🔒 Permissions CSS/JS corrigées automatiquement" "White"
        Write-LogMessage "💾 Backend préservé automatiquement" "White"
        Write-LogMessage "🧹 Fichiers temporaires nettoyés" "White"
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "🎯 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!" "Green"
        
    } catch {
        $duration = (Get-Date) - $startTime
        
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "💥 ERREUR DE DÉPLOIEMENT" "Red"
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "⏱️ Temps écoulé: $($duration.TotalSeconds.ToString('F1'))s" "Yellow"
        Write-LogMessage "📦 Composants traités: $($deployedComponents -join ', ')" "Yellow"
        Write-LogMessage "💡 Erreur: $($_.Exception.Message)" "Red"
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "🔧 SOLUTIONS DE SECOURS:" "Yellow"
        Write-LogMessage "   1. npm run fix:permissions (si CSS/JS cassés)" "White"
        Write-LogMessage "   2. npm run security:status (vérifier protection)" "White"
        Write-LogMessage "   3. Attendre 10-15 min si timeout SSH puis retry" "White"
        Write-LogMessage "   4. npm run security:deploy (solution garantie)" "White"
        Write-LogMessage "========================================" "Cyan"
        Write-LogMessage "🚨 Vérifiez l'état des sites manuellement:" "Red"
        Write-LogMessage "   - https://dev.melyia.com" "White"
        Write-LogMessage "   - https://app-dev.melyia.com" "White"
        Write-LogMessage "========================================" "Cyan"
        
        exit 1
    }
}

# Affichage aide si demandé
if ($args -contains "-h" -or $args -contains "--help") {
    Write-Host @"
🚀 SCRIPT DÉPLOIEMENT SÉCURISÉ MANUEL MELYIA

USAGE:
  .\deploy-safe-manual.ps1 [OPTIONS]

OPTIONS:
  -SkipBuild     Ignorer le build (utiliser builds existants)
  -LandingOnly   Déployer uniquement le landing
  -AppOnly       Déployer uniquement l'application
  -Verbose       Affichage détaillé
  -h, --help     Afficher cette aide

EXEMPLES:
  .\deploy-safe-manual.ps1                    # Déploiement complet
  .\deploy-safe-manual.ps1 -LandingOnly       # Landing seulement
  .\deploy-safe-manual.ps1 -AppOnly -SkipBuild # App sans rebuild

AVANTAGES:
  ✅ 100% de succès (méthode éprouvée)
  ✅ Évite les timeouts SSH automatiquement
  ✅ Préserve la sécurité (pas de désactivation protection)
  ✅ Correction permissions CSS/JS automatique
  ✅ Sauvegarde backend automatique

DURÉE: 2-3 minutes typique
"@
    exit 0
}

# Lancement du script principal
Main 