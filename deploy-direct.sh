#!/bin/bash
echo "🚀 Déploiement direct depuis serveur..."

npm run build:both

if [ ! -d "dist/landing" ] || [ ! -d "dist/app" ]; then
    echo "❌ Erreur de build"
    exit 1
fi

# Sauvegarde backend
BACKUP_DIR="/tmp/backend-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"
[ -f "/var/www/melyia/app-dev/server.js" ] && cp "/var/www/melyia/app-dev/server.js" "$BACKUP_DIR/"

# Déploiement
echo "🌐 Déploiement Landing..."
sudo cp -r dist/landing/* /var/www/melyia/dev-site/
sudo chown -R www-data:www-data /var/www/melyia/dev-site/

echo "📱 Déploiement App..."
sudo cp -r dist/app/* /var/www/melyia/app-dev/
[ -f "$BACKUP_DIR/server.js" ] && sudo cp "$BACKUP_DIR/server.js" "/var/www/melyia/app-dev/"
sudo chown -R www-data:www-data /var/www/melyia/app-dev/

# Services
echo "🔄 Redémarrage services..."
sudo systemctl reload nginx
pm2 restart melyia-auth-dev 2>/dev/null || echo "⚠️ PM2 restart manuel requis"

echo "✅ Déploiement réussi!"
