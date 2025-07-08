#!/bin/bash

echo "🚨 DÉPLOIEMENT FALLBACK VIA SSH"
echo "==============================="
echo "ℹ️ Utilisé quand le webhook Node.js est down"
echo ""

# Configuration
SSH_HOST="ubuntu@51.91.145.255"
TIMESTAMP=$(date +%s)

echo "📦 1. Build local..."
npm run build:both

if [ ! -d "dist/landing" ] || [ ! -d "dist/app" ]; then
    echo "❌ Erreur de build"
    exit 1
fi

echo "✅ Build terminé"

echo ""
echo "📤 2. Upload via SSH..."

# Upload Landing
echo "🌐 Upload Landing Page..."
scp -r dist/landing/* "$SSH_HOST:/tmp/deploy-landing-$TIMESTAMP/"
ssh "$SSH_HOST" "sudo cp -r /tmp/deploy-landing-$TIMESTAMP/* /var/www/melyia/dev-site/ && sudo chown -R www-data:www-data /var/www/melyia/dev-site/"

# Upload App avec protection backend
echo "📱 Upload Application..."
scp -r dist/app/* "$SSH_HOST:/tmp/deploy-app-$TIMESTAMP/"

# Déploiement app avec sauvegarde backend
ssh "$SSH_HOST" << 'EOF'
# Sauvegarde backend
BACKUP_DIR="/tmp/backend-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"
[ -f "/var/www/melyia/app-dev/server.js" ] && cp "/var/www/melyia/app-dev/server.js" "$BACKUP_DIR/"
[ -f "/var/www/melyia/app-dev/package.json" ] && cp "/var/www/melyia/app-dev/package.json" "$BACKUP_DIR/"

# Déploiement
sudo cp -r /tmp/deploy-app-*/* /var/www/melyia/app-dev/

# Restauration backend
[ -f "$BACKUP_DIR/server.js" ] && sudo cp "$BACKUP_DIR/server.js" "/var/www/melyia/app-dev/"
[ -f "$BACKUP_DIR/package.json" ] && sudo cp "$BACKUP_DIR/package.json" "/var/www/melyia/app-dev/"

sudo chown -R www-data:www-data /var/www/melyia/app-dev/

# Redémarrage services
sudo systemctl reload nginx
pm2 restart melyia-auth-dev 2>/dev/null || echo "⚠️ PM2 restart failed"

echo "✅ Déploiement SSH terminé"
EOF

echo ""
echo "🧪 3. Vérification..."
curl -I https://dev.melyia.com | head -n 1
curl -I https://app-dev.melyia.com | head -n 1

echo ""
echo "✅ DÉPLOIEMENT FALLBACK TERMINÉ"
echo "🔗 Landing: https://dev.melyia.com"
echo "🔗 App: https://app-dev.melyia.com" 