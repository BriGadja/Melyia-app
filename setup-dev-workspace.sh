#!/bin/bash

# =============================================================================
# CONFIGURATION WORKSPACE DE DÉVELOPPEMENT MELYIA - FULL REMOTE
# =============================================================================
# Script à exécuter sur le serveur via Remote SSH

set -e

DEV_WORKSPACE="/var/www/melyia/dev-workspace"
GITHUB_REPO="https://github.com/BriGadja/Melyia-app"  # À modifier
BACKUP_DIR="/var/www/melyia/backups/$(date +%Y%m%d_%H%M%S)"

echo "🚀 CONFIGURATION WORKSPACE DE DÉVELOPPEMENT FULL REMOTE"
echo "======================================================="
echo "📍 Workspace: $DEV_WORKSPACE"
echo "🔗 GitHub: $GITHUB_REPO"
echo ""

# =============================================================================
# FONCTION: Vérification des prérequis
# =============================================================================
check_prerequisites() {
    echo "🔧 Vérification des prérequis..."
    
    # Vérifier Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js: $NODE_VERSION"
    else
        echo "❌ Node.js non installé"
        echo "💡 Installation de Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Vérifier npm
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        echo "✅ npm: $NPM_VERSION"
    else
        echo "❌ npm non disponible"
        exit 1
    fi
    
    # Vérifier Git
    if command -v git >/dev/null 2>&1; then
        GIT_VERSION=$(git --version)
        echo "✅ Git: $GIT_VERSION"
    else
        echo "❌ Git non installé"
        sudo apt-get update && sudo apt-get install -y git
    fi
    
    echo ""
}

# =============================================================================
# FONCTION: Configuration de l'environnement
# =============================================================================
setup_environment() {
    echo "🏗️ Configuration de l'environnement..."
    
    # Créer les dossiers
    sudo mkdir -p "$(dirname "$DEV_WORKSPACE")"
    sudo mkdir -p "$BACKUP_DIR"
    
    # Permissions pour l'utilisateur ubuntu
    sudo chown -R ubuntu:ubuntu /var/www/melyia/
    
    echo "✅ Dossiers créés et permissions configurées"
    echo ""
}

# =============================================================================
# FONCTION: Récupération du code
# =============================================================================
setup_project() {
    echo "📥 Récupération du projet Melyia..."
    
    # Si le workspace existe déjà, on fait une sauvegarde
    if [ -d "$DEV_WORKSPACE" ]; then
        echo "⚠️ Workspace existant détecté, sauvegarde..."
        cp -r "$DEV_WORKSPACE" "$BACKUP_DIR/dev-workspace-backup"
        rm -rf "$DEV_WORKSPACE"
    fi
    
    # Méthode 1: Clone depuis GitHub (si repo configuré)
    if [[ "$GITHUB_REPO" != *"VOTRE-USERNAME"* ]]; then
        echo "📂 Clonage depuis GitHub..."
        git clone "$GITHUB_REPO" "$DEV_WORKSPACE"
        cd "$DEV_WORKSPACE"
        
    # Méthode 2: Copie depuis les fichiers existants (si pas de GitHub)
    else
        echo "📂 Pas de repo GitHub configuré"
        echo "💡 Deux options disponibles:"
        echo "   1. Configurer GitHub et relancer"
        echo "   2. Copier les fichiers manuellement"
        echo ""
        echo "🔧 Création du workspace vide pour commencer..."
        mkdir -p "$DEV_WORKSPACE"
        cd "$DEV_WORKSPACE"
        
        # Créer un package.json minimal s'il n'existe pas
        if [ ! -f "package.json" ]; then
            cat > package.json << 'EOF'
{
  "name": "melyia-app",
  "version": "1.0.0",
  "description": "Application SaaS Dentaire avec IA",
  "type": "module",
  "scripts": {
    "dev": "echo 'Configuration en cours...'",
    "build": "echo 'Configuration en cours...'"
  }
}
EOF
        fi
        
        echo "⚠️ Workspace créé mais vide"
        echo "💡 Vous devrez synchroniser votre code manuellement"
        return 0
    fi
    
    echo "✅ Projet récupéré"
    echo ""
}

# =============================================================================
# FONCTION: Installation des dépendances
# =============================================================================
install_dependencies() {
    echo "📦 Installation des dépendances..."
    
    cd "$DEV_WORKSPACE"
    
    if [ -f "package.json" ]; then
        # Installation des dépendances
        npm install
        
        # Vérifier que les scripts de build existent
        if npm run build:both >/dev/null 2>&1; then
            echo "✅ Scripts de build disponibles"
        else
            echo "⚠️ Scripts de build non configurés"
            echo "💡 Vous devrez les configurer manuellement"
        fi
    else
        echo "⚠️ package.json non trouvé"
        echo "💡 Synchronisez votre projet avant de continuer"
    fi
    
    echo ""
}

# =============================================================================
# FONCTION: Configuration des scripts de développement
# =============================================================================
setup_dev_scripts() {
    echo "🛠️ Configuration des scripts de développement..."
    
    cd "$DEV_WORKSPACE"
    
    # Créer le script de déploiement direct
    cat > deploy-direct.sh << 'EODEPLOY'
#!/bin/bash

# Script de déploiement direct depuis le serveur
echo "🚀 Déploiement direct depuis serveur..."

# Build
echo "🏗️ Build des applications..."
npm run build:both

# Vérifier que les builds existent
if [ ! -d "dist/landing" ] || [ ! -d "dist/app" ]; then
    echo "❌ Erreur de build"
    exit 1
fi

# Sauvegarde des fichiers backend
BACKUP_DIR="/tmp/backend-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"

[ -f "/var/www/melyia/app-dev/server.js" ] && cp "/var/www/melyia/app-dev/server.js" "$BACKUP_DIR/"
[ -f "/var/www/melyia/app-dev/package.json" ] && cp "/var/www/melyia/app-dev/package.json" "$BACKUP_DIR/"

# Déploiement Landing
echo "🌐 Déploiement Landing..."
sudo cp -r dist/landing/* /var/www/melyia/dev-site/
sudo chown -R www-data:www-data /var/www/melyia/dev-site/

# Déploiement App (avec protection backend)
echo "📱 Déploiement App..."
sudo cp -r dist/app/* /var/www/melyia/app-dev/

# Restauration des fichiers backend
[ -f "$BACKUP_DIR/server.js" ] && sudo cp "$BACKUP_DIR/server.js" "/var/www/melyia/app-dev/"
[ -f "$BACKUP_DIR/package.json" ] && sudo cp "$BACKUP_DIR/package.json" "/var/www/melyia/app-dev/"

sudo chown -R www-data:www-data /var/www/melyia/app-dev/
sudo chmod 755 /var/www/melyia/app-dev/assets/ 2>/dev/null || true
sudo chmod 644 /var/www/melyia/app-dev/assets/* 2>/dev/null || true

# Redémarrage des services
echo "🔄 Redémarrage des services..."
sudo systemctl reload nginx
pm2 restart melyia-auth-dev 2>/dev/null || echo "⚠️ PM2 restart manuel requis"

# Test des sites
echo "🧪 Test des sites..."
sleep 2

LANDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://dev.melyia.com || echo "000")
APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com || echo "000")

echo "📊 Résultats:"
echo "  🌐 Landing: $LANDING_STATUS"
echo "  📱 App: $APP_STATUS"

if [ "$LANDING_STATUS" = "200" ] && [ "$APP_STATUS" = "200" ]; then
    echo "✅ Déploiement réussi!"
else
    echo "⚠️ Vérification manuelle recommandée"
fi
EODEPLOY
    
    chmod +x deploy-direct.sh
    
    # Créer le script de monitoring
    cat > monitor.sh << 'EOMONITOR'
#!/bin/bash

echo "📊 MONITORING SERVICES MELYIA"
echo "============================="

echo "=== NGINX STATUS ==="
sudo systemctl status nginx --no-pager | head -10

echo ""
echo "=== PM2 STATUS ==="
pm2 status

echo ""
echo "=== DISK USAGE ==="
df -h /var/www/

echo ""
echo "=== RECENT LOGS ==="
pm2 logs melyia-auth-dev --lines 5 2>/dev/null || echo "PM2 logs non disponibles"

echo ""
echo "=== SITES STATUS ==="
curl -s -o /dev/null -w "Landing (dev.melyia.com): %{http_code}\n" https://dev.melyia.com || echo "Landing: Erreur"
curl -s -o /dev/null -w "App (app-dev.melyia.com): %{http_code}\n" https://app-dev.melyia.com || echo "App: Erreur"
EOMONITOR
    
    chmod +x monitor.sh
    
    echo "✅ Scripts de développement créés:"
    echo "  • deploy-direct.sh : Déploiement instantané"
    echo "  • monitor.sh : Monitoring des services"
    echo ""
}

# =============================================================================
# FONCTION: Test final
# =============================================================================
final_check() {
    echo "🧪 Vérification finale..."
    
    cd "$DEV_WORKSPACE"
    
    echo "📊 Statut du workspace:"
    echo "  📍 Localisation: $DEV_WORKSPACE"
    echo "  📁 Taille: $(du -sh . 2>/dev/null | cut -f1)"
    echo "  📄 Fichiers: $(find . -type f | wc -l) fichiers"
    echo "  🔧 Node.js: $(node --version)"
    echo "  📦 npm: $(npm --version)"
    
    if [ -f "package.json" ]; then
        echo "  ✅ package.json présent"
    else
        echo "  ⚠️ package.json manquant"
    fi
    
    if [ -d "node_modules" ]; then
        echo "  ✅ node_modules installé"
    else
        echo "  ⚠️ node_modules manquant"
    fi
    
    echo ""
    echo "🎯 WORKSPACE CONFIGURÉ !"
    echo "========================"
    echo ""
    echo "💡 Prochaines étapes:"
    echo "1. Ouvrir le workspace dans Cursor:"
    echo "   File → Open Folder → $DEV_WORKSPACE"
    echo ""
    echo "2. Commandes de développement:"
    echo "   ./deploy-direct.sh  # Déploiement instantané"
    echo "   ./monitor.sh        # Monitoring services"
    echo ""
    echo "3. Workflow de développement:"
    echo "   - Éditer le code directement"
    echo "   - Tester en localhost:8083"
    echo "   - Déployer avec ./deploy-direct.sh"
}

# =============================================================================
# EXECUTION PRINCIPALE
# =============================================================================
main() {
    check_prerequisites
    setup_environment
    setup_project
    install_dependencies
    setup_dev_scripts
    final_check
}

# Lancement du script
main "$@" 