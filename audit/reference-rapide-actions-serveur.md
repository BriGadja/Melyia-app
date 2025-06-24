# 🛠️ RÉFÉRENCE RAPIDE - ACTIONS SERVEUR v28.0

## 🚀 CURSOR + SERVEUR UBUNTU

**Cursor peut maintenant exécuter des actions directes sur le serveur Ubuntu via SSH !**

**Serveur** : ubuntu@51.91.145.255  
**Infrastructure** : Ubuntu 22.04 + Nginx + PM2 + PostgreSQL + Ollama

---

## 🔧 GESTION PM2 - BACKEND

### **Status et monitoring :**

```bash
ssh ubuntu@51.91.145.255 "pm2 list"
ssh ubuntu@51.91.145.255 "pm2 monit"
ssh ubuntu@51.91.145.255 "pm2 logs melyia-auth-dev --lines 20"
```

### **Redémarrage et reload :**

```bash
ssh ubuntu@51.91.145.255 "pm2 restart melyia-auth-dev"
ssh ubuntu@51.91.145.255 "pm2 reload melyia-auth-dev"
ssh ubuntu@51.91.145.255 "pm2 stop melyia-auth-dev"
ssh ubuntu@51.91.145.255 "pm2 start melyia-auth-dev"
```

### **Informations détaillées :**

```bash
ssh ubuntu@51.91.145.255 "pm2 show melyia-auth-dev"
ssh ubuntu@51.91.145.255 "pm2 env 10"  # ID process
```

---

## 🗄️ GESTION POSTGRESQL

### **Connexion et queries rapides :**

```bash
ssh ubuntu@51.91.145.255 "sudo -u postgres psql melyia_dev -c 'SELECT COUNT(*) FROM users;'"
ssh ubuntu@51.91.145.255 "sudo -u postgres psql melyia_dev -c '\\dt'"
ssh ubuntu@51.91.145.255 "sudo -u postgres psql melyia_dev -c '\\d admin_stats'"
```

### **Tests structure BDD :**

```bash
ssh ubuntu@51.91.145.255 "sudo -u postgres psql melyia_dev -c 'SELECT * FROM admin_stats;'"
ssh ubuntu@51.91.145.255 "sudo -u postgres psql melyia_dev -c 'SELECT tablename FROM pg_tables WHERE schemaname = \"public\";'"
```

### **Backup rapide :**

```bash
ssh ubuntu@51.91.145.255 "sudo -u postgres pg_dump melyia_dev > /tmp/backup_$(date +%Y%m%d).sql"
```

---

## 🌐 GESTION NGINX

### **Status et tests :**

```bash
ssh ubuntu@51.91.145.255 "sudo nginx -t"
ssh ubuntu@51.91.145.255 "sudo systemctl status nginx"
ssh ubuntu@51.91.145.255 "sudo systemctl reload nginx"
```

### **Logs en temps réel :**

```bash
ssh ubuntu@51.91.145.255 "tail -f /var/log/nginx/app-dev_access.log"
ssh ubuntu@51.91.145.255 "tail -f /var/log/nginx/app-dev_error.log"
ssh ubuntu@51.91.145.255 "journalctl -u nginx -f"
```

### **Configuration :**

```bash
ssh ubuntu@51.91.145.255 "cat /etc/nginx/sites-enabled/app-dev.melyia.com"
ssh ubuntu@51.91.145.255 "sudo nginx -s reload"
```

---

## 🤖 GESTION OLLAMA - IA LOCALE

### **Status et version :**

```bash
ssh ubuntu@51.91.145.255 "ps aux | grep ollama | grep -v grep"
ssh ubuntu@51.91.145.255 "curl -s http://127.0.0.1:11434/api/version | jq"
ssh ubuntu@51.91.145.255 "curl -s http://127.0.0.1:11434/api/tags | jq"
```

### **Test performance :**

```bash
ssh ubuntu@51.91.145.255 "time curl -s -X POST http://127.0.0.1:11434/api/generate -H 'Content-Type: application/json' -d '{\"model\":\"llama3.2:3b\",\"prompt\":\"Test rapide\",\"stream\":false}' | jq -r '.response'"
```

### **Monitoring ressources :**

```bash
ssh ubuntu@51.91.145.255 "ps aux | grep ollama"
ssh ubuntu@51.91.145.255 "top -p \$(pgrep ollama) -n 1"
```

---

## 📊 DIAGNOSTICS SYSTÈME

### **Espace disque et mémoire :**

```bash
ssh ubuntu@51.91.145.255 "df -h"
ssh ubuntu@51.91.145.255 "free -h"
ssh ubuntu@51.91.145.255 "du -sh /var/www/melyia/*"
ssh ubuntu@51.91.145.255 "du -sh /var/log/nginx/*"
```

### **Processus et ports :**

```bash
ssh ubuntu@51.91.145.255 "netstat -tlnp | grep :808"
ssh ubuntu@51.91.145.255 "ss -tlnp | grep nginx"
ssh ubuntu@51.91.145.255 "ps aux | grep -E '(nginx|node|ollama)'"
```

### **Charge système :**

```bash
ssh ubuntu@51.91.145.255 "uptime"
ssh ubuntu@51.91.145.255 "iostat -x 1 3"
ssh ubuntu@51.91.145.255 "top -bn1 | head -10"
```

---

## 🔒 SÉCURITÉ SSL

### **Certificats Let's Encrypt :**

```bash
ssh ubuntu@51.91.145.255 "sudo certbot certificates"
ssh ubuntu@51.91.145.255 "sudo certbot renew --dry-run"
```

### **Test SSL :**

```bash
ssh ubuntu@51.91.145.255 "openssl s_client -connect app-dev.melyia.com:443 -servername app-dev.melyia.com < /dev/null 2>/dev/null | openssl x509 -noout -dates"
```

---

## 🚀 DÉPLOIEMENT AUTOMATISÉ

### **Backend (server.js) :**

```bash
scp server/backend/server.js ubuntu@51.91.145.255:/var/www/melyia/app-dev/
ssh ubuntu@51.91.145.255 "pm2 restart melyia-auth-dev"
```

### **Frontend React :**

```bash
npm run deploy:app     # Application principale
npm run deploy:landing # Page d'accueil
npm run deploy:full    # Déploiement complet
```

### **Validation déploiement :**

```bash
ssh ubuntu@51.91.145.255 "curl -s https://app-dev.melyia.com/api/health | jq"
```

---

## 🧪 TESTS AUTOMATISÉS

### **Test APIs backend :**

```bash
node test-warmup-chatbot.mjs
node test-admin-real.js
node test-backend-connection.js
```

### **Test direct serveur :**

```bash
ssh ubuntu@51.91.145.255 "curl -s http://localhost:8083/api/health"
ssh ubuntu@51.91.145.255 "curl -s http://127.0.0.1:11434/api/version"
```

---

## 💾 SAUVEGARDE ET MAINTENANCE

### **Backup automatique :**

```bash
ssh ubuntu@51.91.145.255 "sudo -u postgres pg_dump melyia_dev > /tmp/melyia_backup_\$(date +%Y%m%d_%H%M).sql"
ssh ubuntu@51.91.145.255 "tar -czf /tmp/melyia_files_\$(date +%Y%m%d).tar.gz /var/www/melyia/app-dev/"
```

### **Synchronisation locale :**

```bash
.\dev\sync-essential.ps1        # Synchronisation rapide
.\dev\sync-server-data.ps1      # Synchronisation complète
```

---

## 🎯 WORKFLOW DIAGNOSTIC COMPLET

### **En cas de problème :**

1. **Vérification services :**

   ```bash
   ssh ubuntu@51.91.145.255 "pm2 list && sudo systemctl status nginx"
   ```

2. **Logs d'erreur :**

   ```bash
   ssh ubuntu@51.91.145.255 "pm2 logs melyia-auth-dev --lines 50"
   ssh ubuntu@51.91.145.255 "tail -20 /var/log/nginx/app-dev_error.log"
   ```

3. **Test connectivité :**

   ```bash
   ssh ubuntu@51.91.145.255 "curl -s http://localhost:8083/api/health"
   ssh ubuntu@51.91.145.255 "curl -s http://127.0.0.1:11434/api/version"
   ```

4. **Redémarrage sélectif :**
   ```bash
   ssh ubuntu@51.91.145.255 "pm2 restart melyia-auth-dev"
   # OU si nécessaire :
   ssh ubuntu@51.91.145.255 "sudo systemctl reload nginx"
   ```

---

## 🔑 POINTS CLÉS

### **Avantages Cursor + SSH :**

- ✅ **Actions directes** sur serveur production
- ✅ **Diagnostic en temps réel** sans accès manuel
- ✅ **Déploiement immédiat** des corrections
- ✅ **Monitoring proactif** des services

### **Limitations :**

- ❌ **Pas de modifications système critiques** (nécessite sudo interactif)
- ❌ **Pas d'installation de packages** système
- ⚠️ **Actions limitées aux permissions ubuntu**

### **Sécurité :**

- ✅ **SSH key-based** authentication
- ✅ **Commandes read-only** privilégiées
- ✅ **Pas de modifications destructives**

---

**Cette capacité permet à Cursor de résoudre 80% des problèmes serveur de manière autonome !** 🚀
