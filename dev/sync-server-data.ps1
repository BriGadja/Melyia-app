#!/usr/bin/env pwsh

# =============================================================================
# SCRIPT DE SYNCHRONISATION SERVEUR MELYIA
# =============================================================================
# Ce script récupère automatiquement :
# - Les fichiers backend critiques (server.js, package.json, etc.)
# - Les configurations nginx
# - Les configurations PM2  
# - La documentation complète de la base PostgreSQL
# - Les logs récents
# =============================================================================

param(
    [switch]$SkipDatabase,
    [switch]$SkipLogs,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$serverIP = "51.91.145.255"
$sshKey = "$env:USERPROFILE\.ssh\melyia_main"
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'

Write-Host "SYNCHRONISATION SERVEUR MELYIA - $timestamp" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# =============================================================================
# 1. CREATION DES DOSSIERS LOCAUX
# =============================================================================
Write-Host "Creation de la structure locale..." -ForegroundColor Yellow

$folders = @(
    "server/backend",
    "server/configs/nginx", 
    "server/configs/pm2",
    "server/configs/postgresql",
    "server/logs",
    "audit/server-sync"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  Cree: $folder" -ForegroundColor Green
    }
}

# =============================================================================
# 2. SYNCHRONISATION GROUPEE FICHIERS (SCP BATCH)
# =============================================================================
Write-Host "Synchronisation des fichiers serveur..." -ForegroundColor Yellow

# Fonction de retry pour SCP
function Invoke-ScpWithRetry {
    param($Source, $Destination, $Retries = 3)
    
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            scp -o ConnectTimeout=10 -o ServerAliveInterval=5 -i $sshKey $Source $Destination
            return $true
        }
        catch {
            Write-Host "    Tentative $i/$Retries echouee..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

# Backend files
$backendFiles = @(
    "/var/www/melyia/app-dev/server.js:server/backend/server.js",
    "/var/www/melyia/app-dev/package.json:server/backend/package.json",
    "/var/www/melyia/app-dev/package-lock.json:server/backend/package-lock.json"
)

Write-Host "  Backend files..." -ForegroundColor Cyan
foreach ($fileMapping in $backendFiles) {
    $remotePath, $localPath = $fileMapping -split ":"
    $fileName = Split-Path $remotePath -Leaf
    
    if (Invoke-ScpWithRetry "ubuntu@${serverIP}:$remotePath" $localPath) {
        Write-Host "    $fileName -> OK" -ForegroundColor Green
    } else {
        Write-Host "    $fileName -> ECHEC" -ForegroundColor Red
    }
}

# Nginx configs
$nginxFiles = @(
    "/etc/nginx/sites-available/app-dev.melyia.com:server/configs/nginx/app-dev.melyia.com.conf",
    "/etc/nginx/sites-available/dev.melyia.com:server/configs/nginx/dev.melyia.com.conf", 
    "/etc/nginx/sites-available/melyia.com:server/configs/nginx/melyia.com.conf",
    "/etc/nginx/nginx.conf:server/configs/nginx/nginx.conf"
)

Write-Host "  Nginx configs..." -ForegroundColor Cyan
foreach ($fileMapping in $nginxFiles) {
    $remotePath, $localPath = $fileMapping -split ":"
    $fileName = Split-Path $remotePath -Leaf
    
    if (Invoke-ScpWithRetry "ubuntu@${serverIP}:$remotePath" $localPath) {
        Write-Host "    $fileName -> OK" -ForegroundColor Green
    } else {
        Write-Host "    $fileName -> ECHEC" -ForegroundColor Red
    }
}

# =============================================================================
# 3. OPERATIONS SERVEUR GROUPEES (UNE SEULE SESSION SSH)
# =============================================================================
Write-Host "Operations serveur distantes..." -ForegroundColor Yellow

# Fonction SSH avec retry
function Invoke-SshWithRetry {
    param($Command, $Description, $Retries = 3)
    
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            $result = ssh -o ConnectTimeout=10 -o ServerAliveInterval=5 -i $sshKey "ubuntu@${serverIP}" $Command
            Write-Host "  $Description -> OK" -ForegroundColor Green
            return $result
        }
        catch {
            Write-Host "  $Description -> Tentative $i/$Retries echouee" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "  $Description -> ECHEC" -ForegroundColor Red
    return $null
}

# Script serveur combine qui fait tout en une fois
$serverScript = @"
#!/bin/bash
echo '=== DEBUT OPERATIONS SERVEUR ==='

# 1. Generation documentation PostgreSQL si demandee
if [ '$(!$SkipDatabase)' = 'True' ]; then
    echo '--- BDD Documentation ---'
    cat > /tmp/db_doc.sql << 'EOSQL'
-- Documentation automatique Base de donnees Melyia
-- Genere le : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

\echo '===== TABLES ====='
SELECT schemaname, tablename, tableowner, hasindexes, hasrules, hastriggers
FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

\echo '===== COLONNES DETAILLEES ====='
SELECT t.table_name, c.column_name, c.data_type, c.character_maximum_length, c.is_nullable, c.column_default,
CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY' ELSE '' END as key_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
LEFT JOIN (SELECT ku.table_name, ku.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name WHERE tc.constraint_type = 'PRIMARY KEY') pk ON pk.table_name = t.table_name AND pk.column_name = c.column_name
LEFT JOIN (SELECT ku.table_name, ku.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY') fk ON fk.table_name = t.table_name AND fk.column_name = c.column_name
WHERE t.table_schema = 'public' ORDER BY t.table_name, c.ordinal_position;

\echo '===== VUES ====='
SELECT table_name, view_definition FROM information_schema.views WHERE table_schema = 'public';
EOSQL
    
    sudo -u postgres psql -d melyia_dev -f /tmp/db_doc.sql
    rm -f /tmp/db_doc.sql
fi

# 2. Status PM2 toujours
echo '--- PM2 Status ---'
pm2 jlist

# 3. Logs si demandes
if [ '$(!$SkipLogs)' = 'True' ]; then
    echo '--- LOGS PM2 ---'
    pm2 logs melyia-auth-dev --lines 100 --nostream
    echo '--- LOGS NGINX ---'
    sudo tail -n 50 /var/log/nginx/error.log
    echo '--- LOGS POSTGRESQL ---'
    sudo tail -n 30 /var/log/postgresql/postgresql-14-main.log
fi

echo '=== FIN OPERATIONS SERVEUR ==='
"@

# Execution du script combine
$serverScript | Out-File -FilePath "temp_server_script.sh" -Encoding UTF8

try {
    # Upload et execution du script
    if (Invoke-ScpWithRetry "temp_server_script.sh" "ubuntu@${serverIP}:/tmp/server_ops.sh") {
        $serverResult = Invoke-SshWithRetry "chmod +x /tmp/server_ops.sh && /tmp/server_ops.sh && rm -f /tmp/server_ops.sh" "Script serveur combine"
        
        if ($serverResult) {
            # Parsing des resultats
            $lines = $serverResult -split "`n"
            $bddSection = @()
            $pm2Section = @()
            $logsSection = @()
            $currentSection = "none"
            
            foreach ($line in $lines) {
                if ($line -match "===== TABLES =====") { $currentSection = "bdd" }
                elseif ($line -match "--- PM2 Status ---") { $currentSection = "pm2" }
                elseif ($line -match "--- LOGS") { $currentSection = "logs" }
                elseif ($line -match "=== FIN") { $currentSection = "none" }
                
                switch ($currentSection) {
                    "bdd" { $bddSection += $line }
                    "pm2" { $pm2Section += $line }
                    "logs" { $logsSection += $line }
                }
            }
            
            # Sauvegarde des resultats
            if (!$SkipDatabase -and $bddSection) {
                $bddSection -join "`n" | Out-File -FilePath "server/configs/postgresql/schema-current.txt" -Encoding UTF8
                Write-Host "  Documentation PostgreSQL sauvegardee" -ForegroundColor Green
            }
            
            if ($pm2Section) {
                $pm2Section -join "`n" | Out-File -FilePath "server/configs/pm2/pm2-status-current.json" -Encoding UTF8
                Write-Host "  Status PM2 sauvegarde" -ForegroundColor Green
            }
            
            if (!$SkipLogs -and $logsSection) {
                $logsSection -join "`n" | Out-File -FilePath "server/logs/combined-$timestamp.log" -Encoding UTF8
                Write-Host "  Logs combines sauvegardes" -ForegroundColor Green
            }
        }
    }
    
    # Ecosystem PM2 separement (fichier)
    if (Invoke-ScpWithRetry "ubuntu@${serverIP}:/var/www/melyia/ecosystem.config.js" "server/configs/pm2/ecosystem.config.js") {
        Write-Host "  Ecosystem PM2 recupere" -ForegroundColor Green
    }
}
catch {
    Write-Host "  Erreur operations serveur" -ForegroundColor Red
    if ($Verbose) { Write-Host "    $($_.Exception.Message)" -ForegroundColor Red }
}

# Nettoyage local
Remove-Item "temp_server_script.sh" -Force -ErrorAction SilentlyContinue

# =============================================================================
# 4. GENERATION DU RAPPORT DE SYNCHRONISATION
# =============================================================================
Write-Host "Generation du rapport de synchronisation..." -ForegroundColor Yellow

$syncReport = @"
# RAPPORT DE SYNCHRONISATION SERVEUR MELYIA
## Genere le : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

### OBJECTIF
Maintenir la synchronisation entre le serveur de production et l'environnement de developpement local pour permettre a Cursor d'avoir acces aux informations les plus recentes.

### FICHIERS SYNCHRONISES

#### Backend Principal
- server.js (code serveur principal)
- package.json (dependances)
- package-lock.json (versions exactes)

#### Configurations Nginx
- app-dev.melyia.com.conf
- dev.melyia.com.conf  
- melyia.com.conf
- nginx.conf (configuration principale)

#### Base de Donnees PostgreSQL
- Documentation complete generee
- Structure des tables, colonnes, index
- Vues, contraintes, statistiques

#### PM2 Process Manager
- Status JSON en temps reel
- Configuration ecosystem.config.js

#### Logs Systeme
- PM2 application (100 dernieres lignes)
- Nginx erreurs (50 dernieres lignes)
- PostgreSQL (30 dernieres lignes)

### UTILISATION POUR CURSOR

Cursor a maintenant acces a :
1. Code serveur actuel : server/backend/server.js
2. Structure BDD complete : server/configs/postgresql/schema-current.txt
3. Configurations proxy : server/configs/nginx/*.conf
4. Status des services : server/configs/pm2/pm2-status-current.json
5. Logs de debogage : server/logs/*.log

### COMMANDE DE RELANCE
.\dev\sync-server-data.ps1

### OPTIONS DISPONIBLES
- -SkipDatabase : Ignorer la generation de doc BDD
- -SkipLogs : Ignorer la recuperation des logs  
- -Verbose : Affichage detaille des erreurs

Timestamp : $timestamp
"@

$syncReport | Out-File -FilePath "audit/server-sync/sync-report-current.md" -Encoding UTF8

Write-Host "Rapport genere: audit/server-sync/sync-report-current.md" -ForegroundColor Green

# =============================================================================
# 5. RESUME FINAL
# =============================================================================
Write-Host "" 
Write-Host "SYNCHRONISATION TERMINEE !" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "Fichiers disponibles pour Cursor :" -ForegroundColor Cyan
Write-Host "  • server/backend/server.js (code serveur actuel)" -ForegroundColor White
Write-Host "  • server/configs/postgresql/schema-current.txt (structure BDD)" -ForegroundColor White  
Write-Host "  • server/configs/nginx/*.conf (configurations proxy)" -ForegroundColor White
Write-Host "  • server/configs/pm2/pm2-status-current.json (status services)" -ForegroundColor White
Write-Host "  • server/logs/*.log (logs systeme recents)" -ForegroundColor White
Write-Host ""
Write-Host "Rapport complet : audit/server-sync/sync-report-current.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour relancer : .\dev\sync-server-data.ps1" -ForegroundColor Yellow 