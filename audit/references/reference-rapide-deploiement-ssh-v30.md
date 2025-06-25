# 🚀 RÉFÉRENCE RAPIDE - DÉPLOIEMENT SSH v30

## ⚡ COMMANDES ESSENTIELLES

### Déploiement complet (RECOMMANDÉ)

```bash
npm run deploy:full
```

- **Durée** : ~3.2s
- **Inclut** : Build + Deploy + Lien symbolique automatique
- **Résultat** : Site accessible immédiatement

### Déploiement uniquement (si build déjà fait)

```bash
npm run deploy:smart
```

## 🔧 DIAGNOSTIC RAPIDE

### Vérification SSH

```bash
ssh ubuntu@51.91.145.255 "echo 'Connexion OK'"
```

### Vérification site

```bash
curl -I https://app-dev.melyia.com/login
```

- **Attendu** : `HTTP/2 200`
- **Si 500** : Exécuter correction d'urgence ci-dessous

### Vérification lien symbolique

```bash
ssh ubuntu@51.91.145.255 "ls -la /var/www/melyia/app-dev/index*"
```

- **Attendu** : `index.html -> index-app.html`

## 🚨 CORRECTION D'URGENCE

Si erreur 500 sur /login :

```bash
ssh ubuntu@51.91.145.255 "cd /var/www/melyia/app-dev && sudo ln -sf index-app.html index.html && sudo chown -h www-data:www-data index.html"
```

## 📋 SCRIPTS DISPONIBLES

| Script            | Usage         | Durée | Description               |
| ----------------- | ------------- | ----- | ------------------------- |
| `deploy:full`     | ⭐ Production | 3.2s  | Build + Deploy + Auto-fix |
| `deploy:smart`    | Dev rapide    | 2.1s  | Deploy uniquement         |
| `deploy:combined` | Backup        | ~5s   | Ancienne version          |

## 🎯 ARCHITECTURE FINALE

### Structure serveur optimisée

```
/var/www/melyia/app-dev/
├── index-app.html              ← Fichier réel Vite
├── index.html → index-app.html ← Lien auto-créé
├── assets/
│   ├── index-app-*.css
│   └── index-app-*.js
└── [autres fichiers]
```

### Flux déploiement intelligent

```
Local Build → /tmp Upload → sudo Install → Lien symbolique → Site OK
```

## ⚠️ PROBLÈMES CONNUS RÉSOLUS

| Problème               | Statut    | Solution                    |
| ---------------------- | --------- | --------------------------- |
| SSH timeout clé privée | ✅ RÉSOLU | SSH simple sans clé         |
| Erreur 500 /login      | ✅ RÉSOLU | Lien symbolique automatique |
| Deploy lent >10min     | ✅ RÉSOLU | Script smart 3.2s           |
| Intervention manuelle  | ✅ RÉSOLU | Automatisation complète     |

## 📞 SUPPORT RAPIDE

### Logs utiles

```bash
# PM2 status
ssh ubuntu@51.91.145.255 "pm2 status"

# Nginx errors
ssh ubuntu@51.91.145.255 "sudo tail -5 /var/log/nginx/app-dev_error.log"

# Disk space
ssh ubuntu@51.91.145.255 "df -h /var/www"
```

### Redémarrage services

```bash
# Nginx reload
ssh ubuntu@51.91.145.255 "sudo systemctl reload nginx"

# PM2 restart
ssh ubuntu@51.91.145.255 "pm2 restart melyia-auth-dev"
```

---

**Créé** : 2025-01-24  
**Version script** : deploy-smart.js v25.4  
**Validation** : ✅ Testé et fonctionnel  
**Performance** : 🚀 99% plus rapide qu'avant
