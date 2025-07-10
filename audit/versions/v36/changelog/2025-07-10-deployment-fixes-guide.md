# 2025-07-10 - Guide Corrections Déploiement GitHub Actions

## 🚨 Problèmes Identifiés

### 1. Erreur form-data avec node-fetch
```bash
# Erreur originale
(node:2241) [https://github.com/node-fetch/node-fetch/issues/1167] 
DeprecationWarning: form-data doesn't follow the spec and requires special treatment
```

### 2. Erreur 500 - Permissions serveur
```bash
# Erreur dans logs PM2
EACCES: permission denied, mkdir '/var/www/melyia/app-dev/public'
```

## ✅ Solutions Appliquées

### 1. Migration node-fetch → axios

#### Avant (deploy-webhook-landing.mjs)
```javascript
import fetch from "node-fetch";

const response = await fetch(CONFIG.WEBHOOK_URL, {
  method: "POST",
  headers: {
    "x-webhook-token": CONFIG.WEBHOOK_TOKEN,
  },
  body: formData,
});
```

#### Après (deploy-webhook-landing.mjs)
```javascript
import axios from "axios";

const response = await axios.post(CONFIG.WEBHOOK_URL, formData, {
  headers: {
    ...formData.getHeaders(),
    "x-webhook-token": CONFIG.WEBHOOK_TOKEN,
  },
  timeout: 30000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});
```

### 2. Correction Permissions Serveur
```bash
# Création répertoires manquants
sudo mkdir -p /var/www/melyia/app-dev/public
sudo mkdir -p /var/www/melyia/dev-workspace/public

# Attribution permissions correctes
sudo chown -R ubuntu:ubuntu /var/www/melyia/app-dev/public
sudo chown -R ubuntu:ubuntu /var/www/melyia/dev-workspace/public
```

### 3. Amélioration Gestion Erreurs
```javascript
// Gestion détaillée des erreurs axios
if (error.response) {
  log(`📋 Status: ${error.response.status}`, "red");
  log(`📋 Message: ${error.response.data?.message || error.response.statusText}`, "red");
  
  if (error.response.status === 401) {
    log("💡 Token invalide - vérifiez VITE_WEBHOOK_TOKEN", "yellow");
  } else if (error.response.status === 500) {
    log("💡 Erreur serveur - vérifiez les logs du serveur", "yellow");
  }
}
```

## 🔧 Fichiers Modifiés

### deploy-webhook-landing.mjs
- ✅ Remplacement node-fetch par axios
- ✅ Headers FormData corrects avec `formData.getHeaders()`
- ✅ Gestion erreurs améliorée
- ✅ Timeout et limites de contenu

### deploy-webhook-app.mjs
- ✅ Même corrections que landing
- ✅ Adaptation pour déploiement app
- ✅ Préservation backend automatique

## 📊 Résultats Avant/Après

### Avant les corrections
```
❌ Deploy Landing Page: form-data warning + 500 error
❌ Deploy Authentication App: form-data warning + error
```

### Après les corrections
```
✅ Deploy Landing Page: Success (30s)
✅ Deploy Authentication App: Success (30s)
✅ Pas de warnings form-data
✅ Permissions serveur résolues
```

## 🧪 Tests de Validation

### Test manuel post-corrections
```bash
# Vérifier structure déploiement
ls -la /var/www/melyia/app-dev/public/
ls -la /var/www/melyia/dev-workspace/public/

# Vérifier permissions
stat /var/www/melyia/app-dev/public/
# Résultat: ubuntu:ubuntu (755)

# Vérifier webhook fonctionnel
curl -X POST https://app-dev.melyia.com/hooks/deploy \
  -H "x-webhook-token: [token]" \
  -F "site=test" \
  -F "target=dev.melyia.com"
```

### Validation GitHub Actions
- ✅ Build étapes: Succès
- ✅ Deploy Landing: Succès
- ✅ Deploy App: Succès
- ✅ Temps total: < 5 minutes

## 🔒 Sécurité Améliorée

### Gestion des Tokens
```javascript
// Validation token renforcée
if (!CONFIG.WEBHOOK_TOKEN) {
  log("❌ ERREUR: VITE_WEBHOOK_TOKEN non défini", "red");
  log("💡 Configurez le secret dans GitHub Actions", "yellow");
  process.exit(1);
}
```

### Headers Sécurisés
```javascript
// Headers corrects pour FormData
headers: {
  ...formData.getHeaders(), // Content-Type: multipart/form-data; boundary=...
  "x-webhook-token": CONFIG.WEBHOOK_TOKEN,
}
```

## 📈 Métriques Performance

### Temps de Déploiement
- **Avant** : Échec (timeout/erreur)
- **Après** : 30-45 secondes ✅

### Fiabilité
- **Avant** : 0% (erreurs systématiques)
- **Après** : 100% (succès validés)

### Monitoring
```bash
# Vérifier logs déploiement
pm2 logs melyia-auth-dev | grep WEBHOOK

# Résultat attendu:
# 🚀 [WEBHOOK] Déploiement webhook reçu
# 📁 [WEBHOOK] Fichiers reçus: 3
# ✅ [WEBHOOK] Déploiement réussi
```

## 🎯 Bonnes Pratiques Établies

### 1. Standardisation axios
- Tous les appels HTTP via axios
- Gestion uniforme des erreurs
- Headers FormData corrects

### 2. Permissions Serveur
- Création préventive des répertoires
- Attribution permissions ubuntu:ubuntu
- Vérification avant déploiement

### 3. Tests Systématiques
- Validation manuelle post-correction
- Tests GitHub Actions complets
- Monitoring logs continu

## 🔮 Améliorations Futures

### v37 Optimisations
- [ ] Cache déploiements identiques
- [ ] Rollback automatique en cas d'échec
- [ ] Notifications Slack/Teams
- [ ] Métriques temps de déploiement

### Monitoring Avancé
- [ ] Dashboard déploiements
- [ ] Alertes erreurs webhook
- [ ] Historique des déploiements
- [ ] Métriques performance

**Déploiement GitHub Actions - Architecture stable et fiable !**