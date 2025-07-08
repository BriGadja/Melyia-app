#!/bin/bash

# =============================================================================
# DÉPLOIEMENT RSYNC PULL - SERVEUR TIRE DEPUIS LOCAL
# =============================================================================
# Le serveur récupère directement les fichiers depuis le PC local

LOCAL_PC_IP="192.168.1.100"  # À adapter selon votre IP locale
LOCAL_PC_USER="pc"           # Utilisateur Windows
LOCAL_PROJECT_PATH="/c/Users/pc/Documents/Projets/Melyia/"

DEPLOY_DIR="/var/www/melyia/deploy-workspace"
WEB_DIR_LANDING="/var/www/melyia/dev-site"
WEB_DIR_APP="/var/www/melyia/app-dev"

echo "🔄 DÉPLOIEMENT RSYNC PULL - RÉCUPÉRATION DIRECTE"
echo "==============================================="

deploy_rsync_pull() {
    echo "📡 Récupération du code depuis PC local..."
    echo "IP locale: $LOCAL_PC_IP"
    
    # Créer le workspace
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    
    # Options rsync optimisées
    RSYNC_OPTS=(
        "-avz"
        "--delete"
        "--timeout=60"
        "--exclude=node_modules/"
        "--exclude=dist/"
        "--exclude=.git/"
        "--exclude=*.log"
        "--exclude=deploy-*.js"
    )
    
    # Synchronisation depuis PC local
    echo "🔄 Synchronisation rsync..."
    rsync "${RSYNC_OPTS[@]}" \
        "${LOCAL_PC_USER}@${LOCAL_PC_IP}:${LOCAL_PROJECT_PATH}" \
        "$DEPLOY_DIR/"
    
    if [ $? -eq 0 ]; then
        echo "✅ Code récupéré avec succès"
    else
        echo "❌ Erreur lors de la récupération"
        exit 1
    fi
    
    # Installation et build
    echo "📦 Installation des dépendances..."
    npm ci --production=false
    
    echo "🏗️ Build des applications..."
    npm run build:both
    
    # Déploiement comme dans la méthode Git
    echo "🚀 Déploiement des builds..."
    
    # Sauvegarde backend
    BACKUP_DIR="/tmp/melyia-backup-$(date +%s)"
    mkdir -p "$BACKUP_DIR"
    [ -f "$WEB_DIR_APP/server.js" ] && cp "$WEB_DIR_APP/server.js" "$BACKUP_DIR/"
    
    # Copie des fichiers
    sudo cp -r dist/landing/* "$WEB_DIR_LANDING/"
    sudo cp -r dist/app/* "$WEB_DIR_APP/"
    
    # Restauration backend
    [ -f "$BACKUP_DIR/server.js" ] && sudo cp "$BACKUP_DIR/server.js" "$WEB_DIR_APP/"
    
    # Permissions
    sudo chown -R www-data:www-data "$WEB_DIR_LANDING/" "$WEB_DIR_APP/"
    
    # Services
    sudo systemctl reload nginx
    pm2 restart melyia-auth-dev
    
    echo "✅ Déploiement rsync pull terminé!"
}

# Fonction pour configurer les clés SSH pour rsync
setup_rsync_keys() {
    echo "🔑 Configuration des clés SSH pour rsync pull..."
    
    # Générer une clé spécifique pour rsync
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/melyia_rsync -N ""
    
    echo "📤 Copiez cette clé publique sur votre PC local:"
    echo "==============================================="
    cat ~/.ssh/melyia_rsync.pub
    echo "==============================================="
    echo ""
    echo "💡 Sur votre PC Windows, ajoutez cette clé dans:"
    echo "   C:\\Users\\pc\\.ssh\\authorized_keys"
}

case "${1:-deploy}" in
    "deploy")
        deploy_rsync_pull
        ;;
    "setup")
        setup_rsync_keys
        ;;
    *)
        echo "Usage: $0 [deploy|setup]"
        ;;
esac 