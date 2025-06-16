# =============================================================================
# AUDIT FRONTEND CURSOR v17.1 - VERSION CORRIGEE
# =============================================================================
# Usage: PowerShell -ExecutionPolicy Bypass -File audit-frontend-cursor.ps1
# Repertoire: C:\Users\pc\Documents\Projets\Melyia
# =============================================================================

$AuditDate = Get-Date -Format "yyyyMMdd-HHmm"
$AuditFile = "frontend-audit-$AuditDate.log"

Write-Host "AUDIT FRONTEND CURSOR v17.1 - $AuditDate" -ForegroundColor Green
Write-Output "AUDIT FRONTEND CURSOR v17.1 - $AuditDate" | Out-File -FilePath $AuditFile
Write-Output "=============================================" | Out-File -FilePath $AuditFile -Append

# =============================================================================
# 1. VERIFICATION ENVIRONNEMENT
# =============================================================================
Write-Host "`nENVIRONNEMENT DEVELOPPEMENT" -ForegroundColor Yellow
Write-Output "`nENVIRONNEMENT DEVELOPPEMENT" | Out-File -FilePath $AuditFile -Append
Write-Output "===============================" | Out-File -FilePath $AuditFile -Append

$CurrentDir = Get-Location
Write-Output "Repertoire: $CurrentDir" | Out-File -FilePath $AuditFile -Append
Write-Host "Repertoire: $CurrentDir"

# Verifier structure projet
if ((Test-Path "package.json") -and (Test-Path "client\src")) {
    Write-Host "OK Projet Melyia detecte" -ForegroundColor Green
    Write-Output "OK Projet Melyia detecte" | Out-File -FilePath $AuditFile -Append
} else {
    Write-Host "ERREUR Structure projet incorrecte" -ForegroundColor Red
    Write-Output "ERREUR Structure projet incorrecte" | Out-File -FilePath $AuditFile -Append
    Write-Output "Verifier: C:\Users\pc\Documents\Projets\Melyia" | Out-File -FilePath $AuditFile -Append
}

# Version Node.js
try {
    $NodeVersion = node --version 2>$null
    if ($NodeVersion) {
        Write-Host "Node.js: $NodeVersion" -ForegroundColor Green
        Write-Output "Node.js: $NodeVersion" | Out-File -FilePath $AuditFile -Append
    }
} catch {
    Write-Host "ERREUR Node.js non detecte" -ForegroundColor Red
    Write-Output "ERREUR Node.js non detecte" | Out-File -FilePath $AuditFile -Append
}

# Version npm
try {
    $NpmVersion = npm --version 2>$null
    if ($NpmVersion) {
        Write-Host "npm: $NpmVersion" -ForegroundColor Green
        Write-Output "npm: $NpmVersion" | Out-File -FilePath $AuditFile -Append
    }
} catch {
    Write-Output "ERREUR npm non detecte" | Out-File -FilePath $AuditFile -Append
}

# =============================================================================
# 2. STRUCTURE PROJET
# =============================================================================
Write-Host "`nSTRUCTURE PROJET" -ForegroundColor Yellow
Write-Output "`nSTRUCTURE PROJET" | Out-File -FilePath $AuditFile -Append
Write-Output "===================" | Out-File -FilePath $AuditFile -Append

$Directories = @("client", "client\src", "client\src\app", "client\src\landing", "client\src\shared", "dist", "node_modules")
foreach ($Dir in $Directories) {
    if (Test-Path $Dir) {
        Write-Host "OK $Dir" -ForegroundColor Green
        Write-Output "OK $Dir" | Out-File -FilePath $AuditFile -Append
    } else {
        Write-Host "MANQUE $Dir" -ForegroundColor Red
        Write-Output "MANQUE $Dir" | Out-File -FilePath $AuditFile -Append
    }
}

# =============================================================================
# 3. CONFIGURATION PACKAGE.JSON
# =============================================================================
Write-Host "`nPACKAGE.JSON" -ForegroundColor Yellow
Write-Output "`nPACKAGE.JSON" | Out-File -FilePath $AuditFile -Append
Write-Output "===============" | Out-File -FilePath $AuditFile -Append

if (Test-Path "package.json") {
    try {
        $PackageContent = Get-Content "package.json" -Raw
        $PackageJson = $PackageContent | ConvertFrom-Json
        
        Write-Host "OK package.json analyse" -ForegroundColor Green
        Write-Output "OK package.json analyse" | Out-File -FilePath $AuditFile -Append
        
        Write-Output "`nScripts disponibles:" | Out-File -FilePath $AuditFile -Append
        if ($PackageJson.scripts) {
            $PackageJson.scripts.PSObject.Properties | ForEach-Object {
                Write-Output "  $($_.Name): $($_.Value)" | Out-File -FilePath $AuditFile -Append
            }
        }
        
        Write-Output "`nDependances principales:" | Out-File -FilePath $AuditFile -Append
        if ($PackageJson.dependencies) {
            $PackageJson.dependencies.PSObject.Properties.Name | Select-Object -First 10 | ForEach-Object {
                Write-Output "  $_" | Out-File -FilePath $AuditFile -Append
            }
        }
    } catch {
        Write-Host "ERREUR lecture package.json" -ForegroundColor Red
        Write-Output "ERREUR lecture package.json" | Out-File -FilePath $AuditFile -Append
    }
} else {
    Write-Host "ERREUR package.json manquant" -ForegroundColor Red
    Write-Output "ERREUR package.json manquant" | Out-File -FilePath $AuditFile -Append
}

# =============================================================================
# 4. FICHIERS CONFIGURATION
# =============================================================================
Write-Host "`nCONFIGURATION" -ForegroundColor Yellow
Write-Output "`nCONFIGURATION" | Out-File -FilePath $AuditFile -Append
Write-Output "=================" | Out-File -FilePath $AuditFile -Append

$ConfigFiles = @(
    @{Path="vite.config.ts"; Name="Vite Config"},
    @{Path=".cursorrules"; Name="Cursor Rules"},
    @{Path=".env.local"; Name="Env Local"},
    @{Path=".vscode\settings.json"; Name="VSCode Settings"},
    @{Path="tsconfig.json"; Name="TypeScript Config"}
)

foreach ($File in $ConfigFiles) {
    if (Test-Path $File.Path) {
        try {
            $Lines = (Get-Content $File.Path -ErrorAction SilentlyContinue).Count
            Write-Host "OK $($File.Name) ($Lines lignes)" -ForegroundColor Green
            Write-Output "OK $($File.Name) ($Lines lignes)" | Out-File -FilePath $AuditFile -Append
        } catch {
            Write-Host "OK $($File.Name) (erreur lecture)" -ForegroundColor Yellow
            Write-Output "OK $($File.Name) (erreur lecture)" | Out-File -FilePath $AuditFile -Append
        }
    } else {
        Write-Host "MANQUE $($File.Name)" -ForegroundColor Red
        Write-Output "MANQUE $($File.Name)" | Out-File -FilePath $AuditFile -Append
    }
}

# =============================================================================
# 5. COMPOSANTS REACT
# =============================================================================
Write-Host "`nCOMPOSANTS REACT" -ForegroundColor Yellow
Write-Output "`nCOMPOSANTS REACT" | Out-File -FilePath $AuditFile -Append
Write-Output "===================" | Out-File -FilePath $AuditFile -Append

if (Test-Path "client\src") {
    try {
        $TsxFiles = Get-ChildItem -Path "client\src" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
        $TsFiles = Get-ChildItem -Path "client\src" -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue
        
        Write-Host "Fichiers .tsx: $($TsxFiles.Count)" -ForegroundColor Cyan
        Write-Host "Fichiers .ts: $($TsFiles.Count)" -ForegroundColor Cyan
        
        Write-Output "Fichiers .tsx: $($TsxFiles.Count)" | Out-File -FilePath $AuditFile -Append
        Write-Output "Fichiers .ts: $($TsFiles.Count)" | Out-File -FilePath $AuditFile -Append
        
        # Composants par repertoire
        if (Test-Path "client\src\shared\components\ui") {
            $UiComponents = Get-ChildItem -Path "client\src\shared\components\ui" -Filter "*.tsx" -ErrorAction SilentlyContinue
            Write-Host "Composants UI: $($UiComponents.Count)" -ForegroundColor Cyan
            Write-Output "Composants UI: $($UiComponents.Count)" | Out-File -FilePath $AuditFile -Append
        }
        
        if (Test-Path "client\src\app\pages") {
            $AppPages = Get-ChildItem -Path "client\src\app\pages" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
            Write-Host "Pages app: $($AppPages.Count)" -ForegroundColor Cyan
            Write-Output "Pages app: $($AppPages.Count)" | Out-File -FilePath $AuditFile -Append
        }
        
        if (Test-Path "client\src\landing\pages") {
            $LandingPages = Get-ChildItem -Path "client\src\landing\pages" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
            Write-Host "Pages landing: $($LandingPages.Count)" -ForegroundColor Cyan
            Write-Output "Pages landing: $($LandingPages.Count)" | Out-File -FilePath $AuditFile -Append
        }
    } catch {
        Write-Output "ERREUR analyse composants React" | Out-File -FilePath $AuditFile -Append
    }
} else {
    Write-Host "ERREUR Repertoire client\src manquant" -ForegroundColor Red
    Write-Output "ERREUR Repertoire client\src manquant" | Out-File -FilePath $AuditFile -Append
}

# =============================================================================
# 6. COMPOSANTS CHATBOT
# =============================================================================
Write-Host "`nCOMPOSANTS CHATBOT" -ForegroundColor Yellow
Write-Output "`nCOMPOSANTS CHATBOT" | Out-File -FilePath $AuditFile -Append
Write-Output "=====================" | Out-File -FilePath $AuditFile -Append

if (Test-Path "client\src") {
    try {
        $ChatbotFiles = @()
        $ChatbotFiles += Get-ChildItem -Path "client\src" -Recurse -Filter "*chat*" -ErrorAction SilentlyContinue
        $ChatbotFiles += Get-ChildItem -Path "client\src" -Recurse -Filter "*Chat*" -ErrorAction SilentlyContinue
        
        if ($ChatbotFiles.Count -gt 0) {
            Write-Host "OK $($ChatbotFiles.Count) composants chatbot detectes" -ForegroundColor Green
            Write-Output "OK $($ChatbotFiles.Count) composants chatbot detectes:" | Out-File -FilePath $AuditFile -Append
            $ChatbotFiles | ForEach-Object {
                $RelativePath = $_.FullName.Replace((Get-Location).Path, ".")
                Write-Output "  $RelativePath" | Out-File -FilePath $AuditFile -Append
            }
        } else {
            Write-Host "ATTENTION Aucun composant chatbot detecte" -ForegroundColor Yellow
            Write-Output "ATTENTION Aucun composant chatbot detecte" | Out-File -FilePath $AuditFile -Append
        }
    } catch {
        Write-Output "ERREUR recherche composants chatbot" | Out-File -FilePath $AuditFile -Append
    }
}

# =============================================================================
# 7. ETAT BUILD
# =============================================================================
Write-Host "`nETAT BUILD" -ForegroundColor Yellow
Write-Output "`nETAT BUILD" | Out-File -FilePath $AuditFile -Append
Write-Output "=============" | Out-File -FilePath $AuditFile -Append

if (Test-Path "dist") {
    Write-Host "OK Repertoire dist present" -ForegroundColor Green
    Write-Output "OK Repertoire dist present" | Out-File -FilePath $AuditFile -Append
    
    try {
        if (Test-Path "dist\app") {
            $AppFiles = Get-ChildItem -Path "dist\app" -Recurse -ErrorAction SilentlyContinue
            $AppSize = ($AppFiles | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Host "Build app: $([math]::Round($AppSize, 2)) MB" -ForegroundColor Cyan
            Write-Output "Build app: $([math]::Round($AppSize, 2)) MB" | Out-File -FilePath $AuditFile -Append
        }
        
        if (Test-Path "dist\landing") {
            $LandingFiles = Get-ChildItem -Path "dist\landing" -Recurse -ErrorAction SilentlyContinue
            $LandingSize = ($LandingFiles | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Host "Build landing: $([math]::Round($LandingSize, 2)) MB" -ForegroundColor Cyan
            Write-Output "Build landing: $([math]::Round($LandingSize, 2)) MB" | Out-File -FilePath $AuditFile -Append
        }
    } catch {
        Write-Output "ERREUR calcul taille builds" | Out-File -FilePath $AuditFile -Append
    }
} else {
    Write-Host "ATTENTION Aucun build disponible" -ForegroundColor Yellow
    Write-Output "ATTENTION Aucun build disponible" | Out-File -FilePath $AuditFile -Append
}

# =============================================================================
# 8. SCRIPTS DEPLOY
# =============================================================================
Write-Host "`nSCRIPTS DEPLOY" -ForegroundColor Yellow
Write-Output "`nSCRIPTS DEPLOY" | Out-File -FilePath $AuditFile -Append
Write-Output "=================" | Out-File -FilePath $AuditFile -Append

$DeployFiles = @("deploy-to-app-dev.js", "deploy-to-dev.js")
foreach ($File in $DeployFiles) {
    if (Test-Path $File) {
        Write-Host "OK $File" -ForegroundColor Green
        Write-Output "OK $File" | Out-File -FilePath $AuditFile -Append
    } else {
        Write-Host "MANQUE $File" -ForegroundColor Red
        Write-Output "MANQUE $File" | Out-File -FilePath $AuditFile -Append
    }
}

# =============================================================================
# 9. RESUME
# =============================================================================
Write-Host "`nRESUME AUDIT FRONTEND" -ForegroundColor Yellow
Write-Output "`nRESUME AUDIT FRONTEND" | Out-File -FilePath $AuditFile -Append
Write-Output "========================" | Out-File -FilePath $AuditFile -Append

$Score = 0
$Total = 8

if (Test-Path "package.json") { $Score++ }
if (Test-Path "vite.config.ts") { $Score++ }
if (Test-Path ".cursorrules") { $Score++ }
if (Test-Path ".env.local") { $Score++ }
if (Test-Path "client\src\shared") { $Score++ }
if (Test-Path "dist") { $Score++ }
if (Test-Path "node_modules") { $Score++ }
if (Test-Path "deploy-to-app-dev.js") { $Score++ }

Write-Host "`nScore configuration: $Score/$Total" -ForegroundColor Magenta
Write-Output "`nScore configuration: $Score/$Total" | Out-File -FilePath $AuditFile -Append

if ($Score -ge 7) {
    Write-Host "EXCELLENT Frontend pret developpement" -ForegroundColor Green
    Write-Output "EXCELLENT Frontend pret developpement" | Out-File -FilePath $AuditFile -Append
} elseif ($Score -ge 5) {
    Write-Host "BON Frontend - Quelques ameliorations possibles" -ForegroundColor Yellow
    Write-Output "BON Frontend - Quelques ameliorations possibles" | Out-File -FilePath $AuditFile -Append
} else {
    Write-Host "A CONFIGURER Frontend - Actions requises" -ForegroundColor Red
    Write-Output "A CONFIGURER Frontend - Actions requises" | Out-File -FilePath $AuditFile -Append
}

Write-Host "`nAUDIT FRONTEND TERMINE" -ForegroundColor Green
Write-Host "Rapport sauvegarde: $AuditFile" -ForegroundColor Cyan
Write-Output "`nAUDIT FRONTEND TERMINE" | Out-File -FilePath $AuditFile -Append
Write-Output "Rapport sauvegarde: $AuditFile" | Out-File -FilePath $AuditFile -Append

# Proposer de copier vers serveur
Write-Host "`nPour integrer a l'audit serveur:" -ForegroundColor Yellow
Write-Host "scp $AuditFile ubuntu@51.91.145.255:/tmp/" -ForegroundColor Cyan