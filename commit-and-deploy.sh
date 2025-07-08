#!/bin/bash

echo "🎯 COMMIT + DÉPLOIEMENT COMPLET"
echo "==============================="

# 1. Commit des corrections webhook
echo "📝 Commit des corrections webhook..."
git add deploy-webhook-landing.mjs deploy-webhook-app.mjs deploy-direct-from-server.sh

if git diff --cached --quiet; then
    echo "ℹ️ Aucune modification à committer"
else
    git commit -m "🔧 FIX: Authentification webhook + script déploiement direct

- Changer Authorization en x-webhook-token dans les webhooks
- Ajouter script de déploiement direct depuis serveur
- Résoudre le problème HTML/JSON du webhook GitHub Actions"

    git push origin main
    echo "✅ Corrections poussées vers GitHub"
fi

# 2. Déploiement immédiat
echo ""
echo "🚀 Lancement du déploiement direct..."
chmod +x deploy-direct-from-server.sh
./deploy-direct-from-server.sh 