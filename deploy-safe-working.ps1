# Script de déploiement sécurisé et fonctionnel pour Melyia
# Version simplifiée sans caractères spéciaux

param(
    [switch]$SkipBuild,
    [switch]$LandingOnly,
    [switch]$AppOnly,
    [switch]$Verbose,
    [switch]$Help
)

# Configuration
$CONFIG = @{
    SSH_HOST = "ubuntu@51.91.145.255"
    LANDING_LOCAL = "dist/landing"
    LANDING_REMOTE = "/var/www/melyia/dev-site"
    APP_LOCAL = "dist/app"
    APP_REMOTE = "/var/www/melyia/app-dev"
    TIMESTAMP = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
}

function Write-Log {
    param([string]$Message, [string]$Color = "White", [switch]$VerboseOnly)
    
    if ($VerboseOnly -and -not $Verbose) { return }
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $prefix = if ($VerboseOnly) { "[DEBUG]" } else { "[INFO]" }
    Write-Host "[$timestamp] $prefix $Message" -ForegroundColor $Color
}

function Test-SSH {
    Write-Log "Test connexion SSH..." "Cyan"
    $result = ssh $CONFIG.SSH_HOST "echo 'SSH OK'"
    if ($LASTEXITCODE -eq 0) {
        Write-Log "SSH connecté avec succès" "Green"
        return $true
    } else {
        Write-Log "Échec connexion SSH" "Red"
        return $false
    }
}

function Build-Projects {
    if ($SkipBuild) {
        Write-Log "Build ignoré (paramètre -SkipBuild)" "Yellow"
        return
    }
    
    Write-Log "Démarrage des builds..." "Cyan"
    npm run build:both
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Build terminé avec succès" "Green"
    } else {
        throw "Échec du build"
    }
}

function Deploy-LandingPage {
    Write-Log "DÉPLOIEMENT LANDING PAGE" "Magenta"
    
    # Upload fichiers
    Write-Log "Upload landing vers serveur..." "Cyan"
    scp -r "$($CONFIG.LANDING_LOCAL)/*" "$($CONFIG.SSH_HOST):/tmp/deploy-landing-$($CONFIG.TIMESTAMP)/"
    if ($LASTEXITCODE -ne 0) { throw "Échec upload landing" }
    
    # Installation
    Write-Log "Installation landing..." "Cyan"
    $installCmd = "sudo rm -rf $($CONFIG.LANDING_REMOTE)/* && sudo cp -r /tmp/deploy-landing-$($CONFIG.TIMESTAMP)/* $($CONFIG.LANDING_REMOTE)/ && sudo chown -R www-data:www-data $($CONFIG.LANDING_REMOTE) && sudo chmod -R 644 $($CONFIG.LANDING_REMOTE)/* && sudo find $($CONFIG.LANDING_REMOTE) -type d -exec chmod 755 {} + && rm -rf /tmp/deploy-landing-$($CONFIG.TIMESTAMP)"
    
    $output = ssh $CONFIG.SSH_HOST $installCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Landing déployé avec succès" "Green"
        if ($Verbose) {
            Write-Log "Sortie installation:" "White" -VerboseOnly
            Write-Log $output "DarkGray" -VerboseOnly
        }
    } else {
        throw "Échec installation landing"
    }
}

function Deploy-Application {
    Write-Log "DÉPLOIEMENT APPLICATION" "Magenta"
    
    # Upload fichiers
    Write-Log "Upload application vers serveur..." "Cyan"
    scp -r "$($CONFIG.APP_LOCAL)/*" "$($CONFIG.SSH_HOST):/tmp/deploy-app-$($CONFIG.TIMESTAMP)/"
    if ($LASTEXITCODE -ne 0) { throw "Échec upload app" }
    
    # Sauvegarde backend
    Write-Log "Sauvegarde backend existant..." "Cyan"
    $backupCmd = "mkdir -p /tmp/backend-backup-$($CONFIG.TIMESTAMP) && if [ -f $($CONFIG.APP_REMOTE)/server.js ]; then cp $($CONFIG.APP_REMOTE)/server.js /tmp/backend-backup-$($CONFIG.TIMESTAMP)/; fi && if [ -f $($CONFIG.APP_REMOTE)/package.json ]; then cp $($CONFIG.APP_REMOTE)/package.json /tmp/backend-backup-$($CONFIG.TIMESTAMP)/; fi"
    
    $backupOutput = ssh $CONFIG.SSH_HOST $backupCmd
    if ($LASTEXITCODE -ne 0) { throw "Échec sauvegarde backend" }
    
    # Installation application
    Write-Log "Installation application..." "Cyan"
    $installCmd = "sudo rm -rf $($CONFIG.APP_REMOTE)/* && sudo cp -r /tmp/deploy-app-$($CONFIG.TIMESTAMP)/* $($CONFIG.APP_REMOTE)/ && if [ -f /tmp/backend-backup-$($CONFIG.TIMESTAMP)/server.js ]; then sudo cp /tmp/backend-backup-$($CONFIG.TIMESTAMP)/server.js $($CONFIG.APP_REMOTE)/; fi && if [ -f /tmp/backend-backup-$($CONFIG.TIMESTAMP)/package.json ]; then sudo cp /tmp/backend-backup-$($CONFIG.TIMESTAMP)/package.json $($CONFIG.APP_REMOTE)/; fi && cd $($CONFIG.APP_REMOTE) && sudo ln -sf index-app.html index.html && sudo chown -R www-data:www-data $($CONFIG.APP_REMOTE) && sudo chmod -R 644 $($CONFIG.APP_REMOTE)/index*.html && sudo chmod -R 755 $($CONFIG.APP_REMOTE)/assets && sudo chmod -R 644 $($CONFIG.APP_REMOTE)/assets/* && sudo find $($CONFIG.APP_REMOTE)/assets -type d -exec chmod 755 {} + && rm -rf /tmp/deploy-app-$($CONFIG.TIMESTAMP) && rm -rf /tmp/backend-backup-$($CONFIG.TIMESTAMP)"
    
    $output = ssh $CONFIG.SSH_HOST $installCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Application déployée avec succès" "Green"
        if ($Verbose) {
            Write-Log "Sortie installation:" "White" -VerboseOnly
            Write-Log $output "DarkGray" -VerboseOnly
        }
    } else {
        throw "Échec installation application"
    }
}

function Test-Deployment {
    Write-Log "TESTS DE VALIDATION" "Blue"
    
    # Test landing
    Write-Log "Test accessibilité landing..." "Cyan" -VerboseOnly
    $landingTest = ssh $CONFIG.SSH_HOST "curl -s -I http://localhost/dev-site/ | head -1"
    if ($landingTest -match "(200|301|302)") {
        Write-Log "Landing accessible" "Green"
    } else {
        Write-Log "Landing: $landingTest" "Yellow"
    }
    
    # Test application
    Write-Log "Test accessibilité application..." "Cyan" -VerboseOnly
    $appTest = ssh $CONFIG.SSH_HOST "curl -s -I http://localhost/app-dev/ | head -1"
    if ($appTest -match "(200|301|302)") {
        Write-Log "Application accessible" "Green"
    } else {
        Write-Log "Application: $appTest" "Yellow"
    }
    
    Write-Log "Tests terminés" "Green"
}

function Show-Help {
    Write-Host @"
SCRIPT DÉPLOIEMENT SÉCURISÉ MELYIA

USAGE:
  .\deploy-safe-working.ps1 [OPTIONS]

OPTIONS:
  -SkipBuild     Ignorer le build
  -LandingOnly   Déployer uniquement le landing  
  -AppOnly       Déployer uniquement l'application
  -Verbose       Affichage détaillé
  -Help          Afficher cette aide

EXEMPLES:
  .\deploy-safe-working.ps1
  .\deploy-safe-working.ps1 -LandingOnly
  .\deploy-safe-working.ps1 -AppOnly -SkipBuild
  .\deploy-safe-working.ps1 -Verbose

URLS:
  Landing: https://dev.melyia.com
  App: https://app-dev.melyia.com
"@
}

function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    $startTime = Get-Date
    
    try {
        Write-Log "=== DÉPLOIEMENT SÉCURISÉ MELYIA ===" "Green"
        Write-Log "Mode: $(if($LandingOnly){'Landing uniquement'}elseif($AppOnly){'App uniquement'}else{'Complet'})" "Cyan"
        Write-Log "Timestamp: $($CONFIG.TIMESTAMP)" "White" -VerboseOnly
        
        # Test SSH
        if (-not (Test-SSH)) {
            throw "Impossible de se connecter au serveur"
        }
        
        # Build si nécessaire
        Build-Projects
        
        # Déploiements
        if (-not $AppOnly) {
            Deploy-LandingPage
        }
        
        if (-not $LandingOnly) {
            Deploy-Application
        }
        
        # Tests
        Test-Deployment
        
        $duration = (Get-Date) - $startTime
        Write-Log "=== DÉPLOIEMENT RÉUSSI ===" "Green"
        Write-Log "Durée: $($duration.TotalSeconds.ToString('F1'))s" "White"
        Write-Log "Landing: https://dev.melyia.com" "White"
        Write-Log "App: https://app-dev.melyia.com" "White"
        
    } catch {
        $duration = (Get-Date) - $startTime
        Write-Log "=== ERREUR DE DÉPLOIEMENT ===" "Red"
        Write-Log "Durée: $($duration.TotalSeconds.ToString('F1'))s" "Yellow"
        Write-Log "Erreur: $($_.Exception.Message)" "Red"
        Write-Log "Vérifiez manuellement les sites:" "Yellow"
        Write-Log "  - https://dev.melyia.com" "White"
        Write-Log "  - https://app-dev.melyia.com" "White"
        exit 1
    }
}

# Exécution
Main 