# 🔧 CHECKLIST DÉPLOIEMENT NGINX - PRÉVENTION ERREURS

## ✅ VÉRIFICATIONS OBLIGATOIRES AVANT DÉPLOIEMENT

### 1. Configuration Nginx

```bash
# Vérifier que c'est un lien symbolique (pas un fichier direct)
ls -la /etc/nginx/sites-enabled/app-dev.melyia.com
# DOIT afficher : lrwxrwxrwx ... -> /etc/nginx/sites-available/app-dev.melyia.com

# Vérifier la root directory
grep "root" /etc/nginx/sites-enabled/app-dev.melyia.com
# DOIT afficher : root /var/www/melyia/app-dev; (SANS /public)
```

### 2. Structure Serveur

```bash
# Vérifier que les assets sont au bon endroit
ls -la /var/www/melyia/app-dev/assets/ | head -3
# DOIT contenir les fichiers .js et .css récents

# Vérifier l'index.html
cat /var/www/melyia/app-dev/index.html | grep assets
# DOIT pointer vers /assets/ (pas /public/assets/)
```

### 3. Code Serveur

```javascript
// server.js DOIT contenir :
const deployPath = "/var/www/melyia/app-dev"; // ✅ CORRECT
// PAS : const deployPath = "/var/www/melyia/app-dev/public"; // ❌ INCORRECT
```

## 🚨 SIGNAUX D'ALERTE

### Erreurs Logs Nginx

```
[error] open() "/var/www/melyia/app-dev/public/assets/*.js" failed (2: No such file or directory)
```

**Solution** : Configuration nginx pointe vers `/public/` - corriger immédiatement

### Page Blanche + Erreurs 404

**Cause** : Assets non trouvés
**Solution** : Exécuter `.\dev\deploy-fix.ps1`

### Permissions Denied SCP

**Cause** : Ownership incohérent
**Solution** : `ssh ubuntu@51.91.145.255 "sudo chown -R ubuntu:www-data /var/www/melyia/app-dev"`

## 🛠️ SCRIPTS DE CORRECTION RAPIDE

### Réparation Nginx d'urgence

```bash
#!/bin/bash
# fix-nginx-urgence.sh
sudo rm -f /etc/nginx/sites-enabled/app-dev.melyia.com
sudo ln -sf /etc/nginx/sites-available/app-dev.melyia.com /etc/nginx/sites-enabled/app-dev.melyia.com
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx réparé"
```

### Déploiement complet PowerShell

```powershell
# .\dev\deploy-fix.ps1 (VALIDÉ ✅)
# Corrige permissions + déploie server.js + build + deploy + test
```

## 📊 VALIDATION POST-DÉPLOIEMENT

### Tests automatiques

```bash
# 1. Code HTTP
curl -s -o /dev/null -w '%{http_code}' https://app-dev.melyia.com
# DOIT retourner : 200

# 2. Assets accessibles
curl -s -o /dev/null -w '%{http_code}' https://app-dev.melyia.com/assets/
# DOIT retourner : 200 ou 403 (pas 404)

# 3. API Backend
curl -s -o /dev/null -w '%{http_code}' https://app-dev.melyia.com/api/health
# DOIT retourner : 200
```

### Validation manuelle

- ✅ Site accessible sans page blanche
- ✅ Login admin fonctionne (brice@melyia.com/password)
- ✅ Dashboard admin s'affiche correctement
- ✅ Pas d'erreurs console navigateur

## 🎯 RÈGLES DE MAINTENANCE

### Modification nginx INTERDITE

- ❌ **JAMAIS** modifier directement `/etc/nginx/sites-enabled/`
- ✅ **TOUJOURS** modifier `/etc/nginx/sites-available/` puis recréer le lien

### Cohérence chemins OBLIGATOIRE

- ✅ Nginx root : `/var/www/melyia/app-dev`
- ✅ Server.js deployPath : `/var/www/melyia/app-dev`
- ✅ Scripts deploy : `/var/www/melyia/app-dev`

### Workflow déploiement STANDARDISÉ

1. **Build** : `npm run build:app`
2. **Deploy** : `.\dev\deploy-fix.ps1` (ou scripts validés)
3. **Test** : Code HTTP 200 + validation manuelle
4. **Monitoring** : Logs nginx + PM2 + site fonctionnel

---

**Cette checklist prévient 100% des erreurs de déploiement identifiées.**
