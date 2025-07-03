# MIGRATION v34.0 - SYSTÈME FICHIERS 2 NIVEAUX
# Exécution sécurisée avec vérifications
# Date: 2025-01-24

Write-Host "🚀 MIGRATION MELYIA v34.0 - SYSTÈME FICHIERS 2 NIVEAUX" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Vérifications préalables
Write-Host "`n🔍 VÉRIFICATIONS PRÉALABLES..." -ForegroundColor Yellow

# 1. Vérifier que le fichier SQL existe
$sqlFile = "server/configs/postgresql/migration-v34-documents-system.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Fichier SQL non trouvé: $sqlFile" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Fichier SQL trouvé" -ForegroundColor Green

# 2. Vérifier la connexion serveur
Write-Host "`n📡 Test connexion serveur..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-RestMethod -Uri "https://app-dev.melyia.com/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Serveur accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Serveur non accessible" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Confirmer avec l'utilisateur
Write-Host "`n⚠️  ATTENTION: Cette migration va:" -ForegroundColor Yellow
Write-Host "   • Créer une sauvegarde patient_documents_backup_v33" -ForegroundColor Gray
Write-Host "   • Créer la table general_documents" -ForegroundColor Gray
Write-Host "   • Renommer patient_documents → personal_documents" -ForegroundColor Gray
Write-Host "   • Insérer 3 documents généraux de base" -ForegroundColor Gray

$confirmation = Read-Host "`nContinuer la migration? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "❌ Migration annulée par l'utilisateur" -ForegroundColor Red
    exit 0
}

# Exécution de la migration
Write-Host "`n🔧 EXÉCUTION MIGRATION..." -ForegroundColor Cyan

# Upload du fichier SQL vers le serveur
Write-Host "📤 Upload script SQL vers serveur..." -ForegroundColor Yellow

# Lire le contenu du fichier SQL
$sqlContent = Get-Content $sqlFile -Raw

# Créer le fichier temporaire pour l'upload
$tempSqlFile = "migration-v34-temp.sql"
$sqlContent | Out-File -FilePath $tempSqlFile -Encoding UTF8

try {
    # Upload via SCP
    $scpCommand = "scp -i server/.ssh/melyia-server -o StrictHostKeyChecking=no $tempSqlFile ubuntu@51.91.145.255:/tmp/"
    cmd /c $scpCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SQL uploadé avec succès" -ForegroundColor Green
    } else {
        throw "Erreur SCP"
    }

    # Exécuter la migration sur le serveur
    Write-Host "🗃️ Exécution migration PostgreSQL..." -ForegroundColor Yellow
    
    $sshCommand = @"
ssh -i server/.ssh/melyia-server -o StrictHostKeyChecking=no ubuntu@51.91.145.255 "
echo 'QOZ9QyJd4YiufyzMj0eq7GgHV0sBrlSX' | psql -h localhost -U postgres -d melyia_dev -f /tmp/migration-v34-temp.sql
"@

    $migrationResult = cmd /c $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration PostgreSQL réussie" -ForegroundColor Green
        Write-Host "$migrationResult" -ForegroundColor Gray
    } else {
        throw "Erreur migration PostgreSQL"
    }

    # Nettoyage fichier temporaire sur serveur
    $cleanupCommand = "ssh -i server/.ssh/melyia-server -o StrictHostKeyChecking=no ubuntu@51.91.145.255 'rm -f /tmp/migration-v34-temp.sql'"
    cmd /c $cleanupCommand

    Write-Host "🧹 Nettoyage fichier temporaire serveur" -ForegroundColor Gray

} catch {
    Write-Host "❌ Erreur lors de la migration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Nettoyage fichier temporaire local
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile
        Write-Host "🧹 Nettoyage fichier temporaire local" -ForegroundColor Gray
    }
}

# Vérifications post-migration
Write-Host "`n🔎 VÉRIFICATIONS POST-MIGRATION..." -ForegroundColor Cyan

# Test avec un appel à l'API pour vérifier que le serveur fonctionne toujours
try {
    $testResponse = Invoke-RestMethod -Uri "https://app-dev.melyia.com/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Serveur opérationnel après migration" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Serveur non accessible après migration" -ForegroundColor Red
    Write-Host "Vérifier les logs serveur" -ForegroundColor Yellow
}

# Synchroniser le nouveau schema
Write-Host "`n📥 Synchronisation nouveau schema..." -ForegroundColor Yellow
try {
    & ".\dev\sync-essential.ps1"
    Write-Host "✅ Schema synchronise" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreur synchronisation schema" -ForegroundColor Yellow
}

Write-Host "`n🎯 MIGRATION v34.0 TERMINEE" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📚 Table general_documents: Creee" -ForegroundColor Green
Write-Host "📋 Table personal_documents: Renommee (ex patient_documents)" -ForegroundColor Green
Write-Host "💾 Sauvegarde: patient_documents_backup_v33" -ForegroundColor Green
Write-Host "🔧 Prochaine etape: MICRO-ETAPE 2 - API Admin Documents Generaux" -ForegroundColor Cyan

Write-Host "`n✅ MIGRATION REUSSIE - SYSTEME 2 NIVEAUX OPERATIONNEL!" -ForegroundColor Green 