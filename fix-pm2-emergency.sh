#!/bin/bash

echo "🚨 RÉPARATION D'URGENCE PM2 MELYIA"
echo "=================================="
echo "⏰ $(date)"
echo ""

# 1. Diagnostic PM2
echo "🔍 DIAGNOSTIC PM2..."
echo "--------------------"

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 non installé ! Installation..."
    npm install -g pm2
fi

echo "📊 Statut actuel de PM2:"
pm2 status

echo ""
echo "🔍 Processus melyia-auth-dev spécifiquement:"
pm2 describe melyia-auth-dev 2>/dev/null || echo "❌ Process melyia-auth-dev introuvable"

# 2. Localiser le serveur
echo ""
echo "🔍 LOCALISATION DU SERVEUR..."
echo "------------------------------"

SERVER_PATHS=(
    "/var/www/melyia/app-dev/server.js"
    "/var/www/melyia/server/backend/server.js"
    "/var/www/melyia/dev-workspace/server/backend/server.js"
)

SERVER_FOUND=""
for path in "${SERVER_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo "✅ Serveur trouvé: $path"
        SERVER_FOUND="$path"
        break
    else
        echo "❌ Non trouvé: $path"
    fi
done

if [ -z "$SERVER_FOUND" ]; then
    echo "💥 ERREUR CRITIQUE: Aucun server.js trouvé !"
    echo "📋 Localisation manuelle requise"
    find /var/www/melyia -name "server.js" -type f 2>/dev/null || echo "Aucun server.js trouvé"
    exit 1
fi

# 3. Vérifier le port et les dépendances
echo ""
echo "🔍 VÉRIFICATION CONFIGURATION..."
echo "--------------------------------"

# Vérifier si le port 8083 est occupé
PORT_8083=$(netstat -tlnp 2>/dev/null | grep :8083 || echo "Port 8083 libre")
echo "🔌 Port 8083: $PORT_8083"

# Vérifier node_modules
SERVER_DIR=$(dirname "$SERVER_FOUND")
if [ -d "$SERVER_DIR/node_modules" ]; then
    echo "✅ node_modules présent dans $SERVER_DIR"
else
    echo "❌ node_modules manquant dans $SERVER_DIR"
    echo "📦 Installation des dépendances nécessaire"
fi

# 4. Arrêt et nettoyage
echo ""
echo "🛑 ARRÊT ET NETTOYAGE..."
echo "------------------------"

pm2 stop melyia-auth-dev 2>/dev/null || echo "Process déjà arrêté"
pm2 delete melyia-auth-dev 2>/dev/null || echo "Process déjà supprimé"

# Tuer tout processus sur le port 8083
echo "🔫 Nettoyage port 8083..."
fuser -k 8083/tcp 2>/dev/null || echo "Aucun processus sur port 8083"

# 5. Installation des dépendances si nécessaire
if [ ! -d "$SERVER_DIR/node_modules" ]; then
    echo ""
    echo "📦 INSTALLATION DÉPENDANCES..."
    echo "------------------------------"
    cd "$SERVER_DIR"
    npm install
    echo "✅ Dépendances installées"
fi

# 6. Redémarrage PM2
echo ""
echo "🚀 REDÉMARRAGE PM2..."
echo "--------------------"

cd "$SERVER_DIR"
echo "📍 Répertoire: $(pwd)"
echo "📄 Fichier: $SERVER_FOUND"

# Démarrer le serveur avec PM2
pm2 start "$SERVER_FOUND" --name "melyia-auth-dev" --watch

# Attendre 3 secondes pour le démarrage
sleep 3

# 7. Vérification
echo ""
echo "🧪 VÉRIFICATION POST-DÉMARRAGE..."
echo "--------------------------------"

pm2 status

echo ""
echo "📡 Test des endpoints..."

# Test Health API
echo "🏥 Test API Health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com/api/health)
echo "   Résultat: $HEALTH_STATUS"

# Test Webhook
echo "🎣 Test Webhook..."
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com/hooks/deploy)
echo "   Résultat: $WEBHOOK_STATUS"

# 8. Résumé final
echo ""
echo "🎯 RÉSUMÉ DE LA RÉPARATION"
echo "=========================="

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ RÉPARATION RÉUSSIE !"
    echo "🎉 L'API fonctionne maintenant"
    echo "🔗 Application: https://app-dev.melyia.com/login"
    echo "🔗 API Health: https://app-dev.melyia.com/api/health"
    
    echo ""
    echo "🛠️ Actions recommandées:"
    echo "- Rafraîchir la page de connexion (Ctrl+F5)"
    echo "- Tester la connexion avec les comptes de démo"
    echo "- Les webhooks GitHub Actions devraient maintenant fonctionner"
    
else
    echo "⚠️ PROBLÈME PERSISTANT"
    echo "📋 Vérifications manuelles nécessaires:"
    echo "- pm2 logs melyia-auth-dev"
    echo "- sudo systemctl status nginx"
    echo "- Vérifier les variables d'environnement"
fi

echo ""
echo "📊 Logs en temps réel: pm2 logs melyia-auth-dev"
echo "⏰ Réparation terminée: $(date)" 