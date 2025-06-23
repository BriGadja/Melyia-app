# 🔧 Commandes Diagnostic Serveur Ubuntu Melyia

## 📋 Services PM2

```bash
# Status des services backend
pm2 list
pm2 logs melyia-auth-dev --lines 20
pm2 logs melyia-dev --lines 20

# Monitoring ressources
pm2 monit
```

## 🗄️ Base de Données PostgreSQL

```bash
# Connexion à la base
sudo -u postgres psql -d melyia_dev

# Dans psql :
\dt                                    # Lister tables
SELECT COUNT(*) FROM users;            # Nombre utilisateurs
SELECT COUNT(*) FROM chat_conversations; # Conversations chatbot
SELECT COUNT(*) FROM patient_documents;  # Documents uploadés
\q                                     # Quitter
```

## 🤖 Ollama Local

```bash
# Status Ollama
ps aux | grep ollama | grep -v grep
curl -s http://127.0.0.1:11434/api/version | jq

# Test performance modèle
time curl -s -X POST http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.2:3b","prompt":"Test rapide","stream":false}' | jq -r '.response'
```

## 🌐 Configuration Nginx

```bash
# Configuration site
sudo cat /etc/nginx/sites-enabled/app-dev.conf | head -30

# Logs accès/erreurs
sudo tail -f /var/log/nginx/app-dev_access.log
sudo tail -f /var/log/nginx/app-dev_error.log
```

## 💾 Espace Disque & Ressources

```bash
# Espace disque
df -h

# RAM/CPU
free -h
top -p $(pgrep -d',' ollama)

# Logs backend
tail -f /var/log/melyia/auth-dev-*.log
```

## 🔒 Sécurité

```bash
# Processus actifs
sudo netstat -tlnp | grep :808
sudo ss -tlnp | grep nginx

# Certificats SSL
sudo certbot certificates
```

## 📁 Structure Fichiers

```bash
# Backend
ls -la /var/www/melyia/app-dev/
cat /var/www/melyia/app-dev/package.json | jq '.version,.scripts'

# Documents patients
ls -la /var/www/melyia/documents/ | head -10
du -sh /var/www/melyia/documents/
```
