# SCRIPT DE SYNCHRONISATION SERVEUR → LOCAL
# Utilisation: .\sync-from-server.ps1

$SERVER_IP = "51.91.145.255"
$SSH_USER = "ubuntu"  # Remplacer par votre utilisateur SSH

Write-Host "🔄 Synchronisation des configurations serveur → local..." -ForegroundColor Yellow

# Créer les dossiers s'ils n'existent pas
New-Item -ItemType Directory -Force -Path "server/configs/nginx" | Out-Null
New-Item -ItemType Directory -Force -Path "server/configs/pm2" | Out-Null
New-Item -ItemType Directory -Force -Path "server/configs/postgresql" | Out-Null

try {
    # 1. Synchroniser les configs Nginx
    Write-Host "📥 Récupération configs Nginx..." -ForegroundColor Blue
    scp -r "${SSH_USER}@${SERVER_IP}:/etc/nginx/sites-available/*melyia*" "server/configs/nginx/"
    
    # 2. Synchroniser le code backend
    Write-Host "📥 Récupération backend..." -ForegroundColor Blue
    scp "${SSH_USER}@${SERVER_IP}:/var/www/melyia/app-dev/server.js" "server/backend/"
    scp "${SSH_USER}@${SERVER_IP}:/var/www/melyia/app-dev/package.json" "server/backend/"
    
    # 3. Récupérer les statuts PM2
    Write-Host "📥 Récupération statuts PM2..." -ForegroundColor Blue
    ssh "${SSH_USER}@${SERVER_IP}" "pm2 status" > "server/configs/pm2/pm2-status.txt"
    ssh "${SSH_USER}@${SERVER_IP}" "pm2 list" > "server/configs/pm2/pm2-list.txt"
    
    # 4. Exporter le schéma PostgreSQL
    Write-Host "📥 Récupération schéma PostgreSQL..." -ForegroundColor Blue
    ssh "${SSH_USER}@${SERVER_IP}" "sudo -u postgres pg_dump --schema-only melyia_dev" > "server/configs/postgresql/schema-melyia_dev.sql"
    
    # 5. Récupérer les logs récents
    Write-Host "📥 Récupération logs récents..." -ForegroundColor Blue
    New-Item -ItemType Directory -Force -Path "server/logs" | Out-Null
    ssh "${SSH_USER}@${SERVER_IP}" "sudo tail -n 100 /var/log/nginx/app-dev_error.log" > "server/logs/nginx-error.log"
    ssh "${SSH_USER}@${SERVER_IP}" "pm2 logs melyia-auth-dev --lines 50" > "server/logs/pm2-melyia.log"
    
    Write-Host "✅ Synchronisation terminée !" -ForegroundColor Green
    Write-Host "📝 N'oubliez pas de commit les changements dans Git" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Erreur lors de la synchronisation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Vérifiez votre connexion SSH et vos permissions" -ForegroundColor Yellow
}

# Afficher un résumé
Write-Host "`n📊 Fichiers synchronisés:" -ForegroundColor Cyan
Get-ChildItem -Recurse server/configs, server/backend, server/logs -File | ForEach-Object {
    $lastWrite = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
    Write-Host "  $($_.FullName) (modifié: $lastWrite)" -ForegroundColor Gray
} 