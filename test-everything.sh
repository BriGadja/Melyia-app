#!/bin/bash

echo "🧪 TEST COMPLET SYSTÈME MELYIA"
echo "=============================="

# 1. Test PM2
echo "🔍 État PM2..."
pm2 status | grep melyia-auth-dev

# 2. Test API
echo ""
echo "🏥 Test API Health..."
curl -s https://app-dev.melyia.com/api/health | head -c 200

# 3. Test Webhook  
echo ""
echo "🎣 Test Webhook..."
curl -I https://app-dev.melyia.com/hooks/deploy

# 4. Test Sites
echo ""
echo "🌐 Test des sites..."
echo "Landing: $(curl -s -o /dev/null -w "%{http_code}" https://dev.melyia.com)"
echo "App: $(curl -s -o /dev/null -w "%{http_code}" https://app-dev.melyia.com)"

echo ""
echo "✅ Tous les systèmes testés !" 