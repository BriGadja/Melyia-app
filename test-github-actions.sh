#!/bin/bash

echo "🧪 TEST GITHUB ACTIONS APRÈS RÉPARATION PM2"
echo "==========================================="
echo "⏰ $(date)"
echo ""

echo "📝 Ajout des fichiers..."
git add .

echo "💾 Commit de test..."
git commit -m "🧪 TEST: Webhook GitHub Actions après réparation PM2

✅ PM2 melyia-auth-dev maintenant online
✅ API Health endpoint fonctionnel (200)
✅ Webhook endpoint accessible
✅ Corrections authentification x-webhook-token appliquées

Test: Vérifier que le déploiement GitHub Actions fonctionne"

echo "📤 Push vers GitHub..."
git push origin main

echo ""
echo "✅ COMMIT ENVOYÉ VERS GITHUB !"
echo ""
echo "🎯 ACTIONS À SUIVRE:"
echo "1. Ouvrir GitHub Actions dans votre navigateur"
echo "2. Vérifier que le workflow se lance automatiquement"  
echo "3. Observer si les jobs 'Deploy Landing Page' et 'Deploy Authentication App' réussissent"
echo "4. Plus d'erreurs 'Unexpected token' attendues !"
echo ""
echo "🔗 URL GitHub Actions: https://github.com/BriceGadja/Melyia-app/actions" 