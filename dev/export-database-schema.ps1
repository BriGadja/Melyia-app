#!/usr/bin/env pwsh

# =============================================================================
# EXPORT SCHEMA BASE DE DONNEES MELYIA
# =============================================================================
# Script rapide pour exporter uniquement la structure de la base PostgreSQL
# =============================================================================

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

Write-Host "Export du schema de base de donnees Melyia" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Script SQL pour la documentation complete
$sqlContent = @'
-- Documentation automatique Base de donnees Melyia
-- Genere le : {0}

-- ===== TABLES =====
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===== COLONNES DETAILLEES =====
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        ELSE ''
    END as key_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON pk.table_name = t.table_name AND pk.column_name = c.column_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON fk.table_name = t.table_name AND fk.column_name = c.column_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- ===== INDEX =====
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ===== VUES =====
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public';

-- ===== CONTRAINTES =====
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public'
ORDER BY table_name;
'@

# Formatage avec timestamp et sauvegarde
$formattedSQL = $sqlContent -f $timestamp
$formattedSQL | Out-File -FilePath "database-documentation.sql" -Encoding UTF8

# Execution sur le serveur
Write-Host "Connexion au serveur et export..." -ForegroundColor Yellow

try {
    # Copie du fichier SQL sur le serveur
    scp -i "$env:USERPROFILE\.ssh\melyia_main" "database-documentation.sql" "ubuntu@51.91.145.255:/tmp/database-documentation.sql"
    
    # Execution et recuperation du resultat
    ssh -i "$env:USERPROFILE\.ssh\melyia_main" ubuntu@51.91.145.255 "sudo -u postgres psql -d melyia_dev -f /tmp/database-documentation.sql" > melyia_database_doc.txt
    
    Write-Host "Documentation base de donnees generee dans melyia_database_doc.txt" -ForegroundColor Green
    
    # Copie aussi dans le dossier server si il existe
    if (Test-Path "server/configs/postgresql") {
        Copy-Item "melyia_database_doc.txt" "server/configs/postgresql/schema-export.txt"
        Write-Host "Copie sauvegardee dans server/configs/postgresql/schema-export.txt" -ForegroundColor Green
    }
    
    # Nettoyage du fichier temporaire sur le serveur
    ssh -i "$env:USERPROFILE\.ssh\melyia_main" ubuntu@51.91.145.255 "rm -f /tmp/database-documentation.sql"
}
catch {
    Write-Host "Erreur lors de l'export de la base de donnees" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Nettoyage local
if (Test-Path "database-documentation.sql") {
    Remove-Item "database-documentation.sql" -Force
}

Write-Host ""
Write-Host "Documentation disponible :" -ForegroundColor Cyan
Write-Host "   • melyia_database_doc.txt (principal)" -ForegroundColor White
if (Test-Path "server/configs/postgresql/schema-export.txt") {
    Write-Host "   • server/configs/postgresql/schema-export.txt (sauvegarde)" -ForegroundColor White
} 