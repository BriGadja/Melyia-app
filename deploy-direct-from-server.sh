#!/bin/bash

echo "🚀 DÉPLOIEMENT DIRECT DEPUIS SERVEUR"
echo "===================================="
echo "📍 Localisation: $(pwd)"
echo "⏰ $(date)"
echo ""

# 1. Vérification de l'environnement
echo "🔍 Vérification de l'environnement..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json non trouvé. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm non installé"
    exit 1
fi

echo "✅ Environnement OK"

# 2. Build des applications
echo ""
echo "🏗️ Build des applications..."
echo "📦 Nettoyage et build..."

# Nettoyer et construire
rm -rf dist/
npm run build:both

# Vérifier les builds
if [ ! -d "dist/landing" ]; then
    echo "❌ Build landing failed"
    exit 1
fi

if [ ! -d "dist/app" ]; then
    echo "❌ Build app failed"
    exit 1
fi

echo "✅ Builds créés avec succès"
echo "📊 Landing: $(find dist/landing -type f | wc -l) fichiers"
echo "📊 App: $(find dist/app -type f | wc -l) fichiers"

# 3. Sauvegarde du backend
echo ""
echo "💾 Sauvegarde du backend..."
BACKUP_DIR="/tmp/backend-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"

if [ -f "/var/www/melyia/app-dev/server.js" ]; then
    cp "/var/www/melyia/app-dev/server.js" "$BACKUP_DIR/"
    echo "✅ server.js sauvegardé"
fi

if [ -f "/var/www/melyia/app-dev/package.json" ]; then
    cp "/var/www/melyia/app-dev/package.json" "$BACKUP_DIR/"
    echo "✅ package.json sauvegardé"
fi

# 4. Déploiement Landing Page
echo ""
echo "🌐 Déploiement Landing Page..."
sudo cp -r dist/landing/* /var/www/melyia/dev-site/
sudo chown -R www-data:www-data /var/www/melyia/dev-site/
echo "✅ Landing déployé vers https://dev.melyia.com"

# 5. Déploiement Application
echo ""
echo "📱 Déploiement Application..."
sudo cp -r dist/app/* /var/www/melyia/app-dev/

# Restaurer le backend
if [ -f "$BACKUP_DIR/server.js" ]; then
    sudo cp "$BACKUP_DIR/server.js" "/var/www/melyia/app-dev/"
    echo "✅ Backend server.js restauré"
fi

if [ -f "$BACKUP_DIR/package.json" ]; then
    sudo cp "$BACKUP_DIR/package.json" "/var/www/melyia/app-dev/"
    echo "✅ Backend package.json restauré"
fi

sudo chown -R www-data:www-data /var/www/melyia/app-dev/
echo "✅ Application déployée vers https://app-dev.melyia.com"

# 6. Redémarrage des services
echo ""
echo "🔄 Redémarrage des services..."

# Nginx
sudo systemctl reload nginx
echo "✅ Nginx rechargé"

# PM2
if command -v pm2 &> /dev/null; then
    pm2 restart melyia-auth-dev 2>/dev/null && echo "✅ PM2 redémarré" || echo "⚠️ PM2 restart manuel requis"
    pm2 status | grep melyia-auth-dev || echo "⚠️ Vérifiez PM2 manuellement"
else
    echo "⚠️ PM2 non trouvé - redémarrage manuel requis"
fi

# 7. Tests de vérification
echo ""
echo "🧪 Vérification des sites..."

# Test Landing
LANDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://dev.melyia.com)
echo "🌐 Landing (dev.melyia.com): $LANDING_STATUS"

# Test App
APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com)
echo "📱 App (app-dev.melyia.com): $APP_STATUS"

# Test API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com/api/health)
echo "🏥 API Health: $API_STATUS"

# 8. Résumé final
echo ""
echo "🎯 RÉSUMÉ DU DÉPLOIEMENT"
echo "========================"

if [ "$LANDING_STATUS" = "200" ] && [ "$APP_STATUS" = "200" ]; then
    echo "✅ DÉPLOIEMENT RÉUSSI !"
    echo "🔗 Landing: https://dev.melyia.com"
    echo "🔗 Application: https://app-dev.melyia.com"
    
    if [ "$API_STATUS" = "200" ]; then
        echo "🎉 Backend API également fonctionnel"
    else
        echo "⚠️ Backend API à vérifier manuellement"
    fi
else
    echo "⚠️ Problème détecté - vérification manuelle recommandée"
    echo "   Landing: $LANDING_STATUS (attendu: 200)"
    echo "   App: $APP_STATUS (attendu: 200)"
fi

echo ""
echo "📁 Sauvegarde backend: $BACKUP_DIR"
echo "⏰ Déploiement terminé: $(date)" 