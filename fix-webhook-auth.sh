#!/bin/bash
echo "🔧 CORRECTION AUTHENTIFICATION WEBHOOK"
echo "======================================"

git add deploy-webhook-landing.mjs deploy-webhook-app.mjs

git commit -m "🔧 FIX: Corriger en-tête authentification webhook

- Changer 'Authorization: Bearer' en 'x-webhook-token' 
- Le serveur validateWebhook attend x-webhook-token
- Scripts testés localement avec succès

CAUSE: Mismatch entre en-tête envoyé et en-tête attendu"

git push origin main

echo "✅ Correction poussée vers GitHub" 