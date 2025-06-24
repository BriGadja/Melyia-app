#!/usr/bin/env pwsh

# =============================================================================
# SYNCHRONISATION ESSENTIELLE MELYIA (ULTRA-FIABLE)
# =============================================================================
# Version simplifiée qui se contente du strict nécessaire
# =============================================================================

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$serverIP = "51.91.145.255"
$sshKey = "$env:USERPROFILE\.ssh\melyia_main"
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'

Write-Host "SYNCHRONISATION ESSENTIELLE MELYIA" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Fonction SCP ultra-robuste
function Copy-FileWithRetry {
    param($Source, $Destination, $Description, $Retries = 5, $Delay = 3)
    
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            # Options SCP optimisées pour connexions instables
            $scpArgs = @(
                '-o', 'ConnectTimeout=15'
                '-o', 'ServerAliveInterval=10'
                '-o', 'ServerAliveCountMax=3'
                '-o', 'TCPKeepAlive=yes'
                '-o', 'Compression=yes'
                '-i', $sshKey
                $Source, $Destination
            )
            
            & scp @scpArgs
            Write-Host "  $Description -> OK" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "  $Description -> Tentative $i/$Retries (pause ${Delay}s)" -ForegroundColor Yellow
            if ($i -lt $Retries) { Start-Sleep -Seconds $Delay }
        }
    }
    Write-Host "  $Description -> ECHEC DEFINITIF" -ForegroundColor Red
    return $false
}

# Fonction SSH simplifiée
function Invoke-SshSimple {
    param($Command, $Description)
    
    try {
        $result = ssh -o ConnectTimeout=15 -o ServerAliveInterval=10 -i $sshKey "ubuntu@${serverIP}" $Command
        Write-Host "  $Description -> OK" -ForegroundColor Green
        return $result
    }
    catch {
        Write-Host "  $Description -> ECHEC" -ForegroundColor Red
        return $null
    }
}

# =============================================================================
# 1. DOSSIERS LOCAUX
# =============================================================================
Write-Host "Preparation locale..." -ForegroundColor Yellow

$essentialFolders = @(
    "server/backend",
    "server/configs/postgresql"
)

foreach ($folder in $essentialFolders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
}

# =============================================================================
# 2. FICHIERS BACKEND CRITIQUES UNIQUEMENT
# =============================================================================
Write-Host "Synchronisation fichiers critiques..." -ForegroundColor Yellow

# Juste les 2 fichiers les plus importants
$success1 = Copy-FileWithRetry "ubuntu@${serverIP}:/var/www/melyia/app-dev/server.js" "server/backend/server.js" "server.js"
$success2 = Copy-FileWithRetry "ubuntu@${serverIP}:/var/www/melyia/app-dev/package.json" "server/backend/package.json" "package.json"

if (!$success1 -or !$success2) {
    Write-Host "ATTENTION: Echec synchronisation backend critique!" -ForegroundColor Red
}

# =============================================================================
# 3. SCHEMA BDD DIRECT (METHODE SIMPLE)
# =============================================================================
Write-Host "Export schema PostgreSQL..." -ForegroundColor Yellow

# Script SQL ultra-simple et compact
$quickSQL = @'
SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
'@

$quickSQL | Out-File -FilePath "quick_schema.sql" -Encoding UTF8

try {
    # Une seule opération groupée
    if (Copy-FileWithRetry "quick_schema.sql" "ubuntu@${serverIP}:/tmp/quick_schema.sql" "Upload SQL") {
        $schemaResult = Invoke-SshSimple "sudo -u postgres psql -d melyia_dev -f /tmp/quick_schema.sql && rm -f /tmp/quick_schema.sql" "Export BDD"
        
        if ($schemaResult) {
            $schemaResult | Out-File -FilePath "server/configs/postgresql/schema-current.txt" -Encoding UTF8
            Write-Host "  Schema BDD sauvegarde" -ForegroundColor Green
        }
    }
}
catch {
    Write-Host "  Erreur schema BDD (non critique)" -ForegroundColor Yellow
}
finally {
    Remove-Item "quick_schema.sql" -Force -ErrorAction SilentlyContinue
}

# =============================================================================
# 4. VERIFICATION FINALE
# =============================================================================
Write-Host "Verification..." -ForegroundColor Yellow

$serverJsSize = if (Test-Path "server/backend/server.js") { (Get-Item "server/backend/server.js").Length } else { 0 }
$schemaSize = if (Test-Path "server/configs/postgresql/schema-current.txt") { (Get-Item "server/configs/postgresql/schema-current.txt").Length } else { 0 }

Write-Host ""
Write-Host "SYNCHRONISATION TERMINEE" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "Fichiers essentiels pour Cursor:" -ForegroundColor Cyan
Write-Host "  • server.js: $([math]::Round($serverJsSize/1KB, 1)) KB" -ForegroundColor White
Write-Host "  • schema BDD: $([math]::Round($schemaSize/1KB, 1)) KB" -ForegroundColor White

if ($serverJsSize -gt 10KB -and $schemaSize -gt 1KB) {
    Write-Host ""
    Write-Host "SUCCES: Fichiers critiques synchronises!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ATTENTION: Verification des fichiers recommandee" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pour sync complete: .\dev\sync-server-data.ps1" -ForegroundColor Gray 