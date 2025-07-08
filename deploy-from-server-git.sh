#!/bin/bash

# =============================================================================
# DÉPLOIEMENT DEPUIS SERVEUR - RÉCUPÉRATION VIA GIT
# =============================================================================
# Script à exécuter SUR LE SERVEUR via Remote SSH

set -e

REPO_URL="https://github.com/votre-username/melyia.git"  # À adapter
DEPLOY_DIR="/var/www/melyia/deploy-workspace"
WEB_DIR_LANDING="/var/www/melyia/dev-site"
WEB_DIR_APP="/var/www/melyia/app-dev"

echo "🚀 DÉPLOIEMENT DEPUIS SERVEUR - RÉCUPÉRATION GIT"
echo "================================================"

# Fonction de déploiement
deploy_from_git() {
    local branch=${1:-main}
    
    echo "📂 Préparation du workspace de déploiement..."
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    
    # Cloner ou mettre à jour le repo
    if [ -d ".git" ]; then
        echo "🔄 Mise à jour du repository existant..."
        git fetch origin
        git reset --hard origin/$branch
        git clean -fd
    else
        echo "📥 Clonage du repository..."
        git clone "$REPO_URL" .
        git checkout "$branch"
    fi
    
    echo "✅ Code récupéré : commit $(git rev-parse --short HEAD)"
    
    # Vérifier Node.js et npm
    echo "🔧 Vérification de l'environnement..."
    node --version || { echo "❌ Node.js non installé"; exit 1; }
    npm --version || { echo "❌ npm non installé"; exit 1; }
    
    # Installation des dépendances
    echo "📦 Installation des dépendances..."
    npm ci --production=false
    
    # Build
    echo "🏗️ Build des applications..."
    npm run build:both
    
    # Vérification des builds
    if [ ! -d "dist/landing" ]; then
        echo "❌ Build landing échoué"
        exit 1
    fi
    
    if [ ! -d "dist/app" ]; then
        echo "❌ Build app échoué"
        exit 1
    fi
    
    echo "✅ Builds créés avec succès"
    
    # Sauvegarde des fichiers backend critiques
    echo "🛡️ Sauvegarde des fichiers backend..."
    mkdir -p /tmp/melyia-backup-$(date +%s)
    BACKUP_DIR="/tmp/melyia-backup-$(date +%s)"
    
    [ -f "$WEB_DIR_APP/server.js" ] && cp "$WEB_DIR_APP/server.js" "$BACKUP_DIR/"
    [ -f "$WEB_DIR_APP/package.json" ] && cp "$WEB_DIR_APP/package.json" "$BACKUP_DIR/"
    
    # Déploiement Landing
    echo "🌐 Déploiement Landing Page..."
    sudo cp -r dist/landing/* "$WEB_DIR_LANDING/"
    sudo chown -R www-data:www-data "$WEB_DIR_LANDING/"
    
    # Déploiement App (avec protection backend)
    echo "📱 Déploiement Application..."
    sudo cp -r dist/app/* "$WEB_DIR_APP/"
    
    # Restauration des fichiers backend
    [ -f "$BACKUP_DIR/server.js" ] && sudo cp "$BACKUP_DIR/server.js" "$WEB_DIR_APP/"
    [ -f "$BACKUP_DIR/package.json" ] && sudo cp "$BACKUP_DIR/package.json" "$WEB_DIR_APP/"
    
    sudo chown -R www-data:www-data "$WEB_DIR_APP/"
    sudo chmod 755 "$WEB_DIR_APP/assets/" 2>/dev/null || true
    sudo chmod 644 "$WEB_DIR_APP/assets/"* 2>/dev/null || true
    
    # Redémarrage des services
    echo "🔄 Redémarrage des services..."
    sudo systemctl reload nginx
    pm2 restart melyia-auth-dev 2>/dev/null || echo "⚠️ PM2 restart manuel requis"
    
    # Vérification finale
    echo "🧪 Vérification des sites..."
    sleep 2
    
    LANDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://dev.melyia.com)
    APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com)
    
    echo "📊 Status des sites :"
    echo "  🌐 Landing (dev.melyia.com): $LANDING_STATUS"
    echo "  📱 App (app-dev.melyia.com): $APP_STATUS"
    
    if [ "$LANDING_STATUS" = "200" ] && [ "$APP_STATUS" = "200" ]; then
        echo "✅ DÉPLOIEMENT RÉUSSI !"
    else
        echo "⚠️ Vérification manuelle recommandée"
    fi
    
    echo ""
    echo "🎯 Déploiement terminé depuis le serveur"
    echo "📍 Commit déployé: $(git rev-parse --short HEAD)"
    echo "🕒 Timestamp: $(date)"
}

# Fonction de status
show_status() {
    echo "📊 STATUS DU DÉPLOIEMENT"
    echo "========================"
    echo "🌐 Landing: https://dev.melyia.com"
    echo "📱 App: https://app-dev.melyia.com"
    echo ""
    echo "=== NGINX STATUS ==="
    sudo systemctl status nginx --no-pager | head -10
    echo ""
    echo "=== PM2 STATUS ==="
    pm2 status
}

# Menu principal
case "${1:-deploy}" in
    "deploy")
        deploy_from_git "${2:-main}"
        ;;
    "status")
        show_status
        ;;
    "help")
        echo "Usage: $0 [deploy|status|help] [branch]"
        echo ""
        echo "Exemples:"
        echo "  $0 deploy          # Déploie la branche main"
        echo "  $0 deploy develop  # Déploie la branche develop"
        echo "  $0 status          # Affiche le status"
        ;;
    *)
        echo "❌ Commande inconnue: $1"
        echo "Usage: $0 [deploy|status|help] [branch]"
        exit 1
        ;;
esac 