#  ARCHITECTURE MELYIA - VUE COMPLÈTE

##  OVERVIEW INFRASTRUCTURE

### Frontend (Cursor Local)
- **React 18** + TypeScript + Vite
- **Port**: 5173 (dev)
- **Proxy**: /api/*  https://app-dev.melyia.com

### Backend (Serveur Ubuntu)
- **Express.js** + JWT + PostgreSQL
- **Port**: 8083 (auth-dev)
- **PM2**: Process auth-dev
- **Logs**: /var/log/melyia/

### Base de Données
- **PostgreSQL 15**
- **Bases**: melyia_dev, melyia_app_dev
- **Extensions**: pgvector (IA)

### IA Local
- **Ollama** llama3.2:3b
- **Port**: 11434
- **Keep-alive**: 24h

### Proxy/SSL
- **Nginx** reverse proxy
- **SSL**: Let's Encrypt (auto-renewal)
- **Domaines**: melyia.com, app-dev.melyia.com, dev.melyia.com

##  WORKFLOW DÉVELOPPEMENT

1. **Code** dans Cursor (frontend)
2. **API calls** via proxy  backend
3. **Deploy** via GitHub Actions ou scripts
4. **Monitor** via PM2 + logs

##  STRUCTURE FICHIERS CLÉS

### Backend
- `/var/www/melyia/app-dev/server.js` - Serveur principal
- `/var/www/melyia/app-dev/package.json` - Dépendances
- `/var/www/melyia/app-dev/.env` - Variables environnement

### Nginx
- `/etc/nginx/sites-available/` - Configurations sites
- `/etc/nginx/nginx.conf` - Config principale

### PM2
- Process: auth-dev (port 8083)
- Auto-restart + monitoring

### PostgreSQL  
- melyia_dev: Développement
- melyia_app_dev: Application auth (pgvector)

##  ENDPOINTS API

- `POST /api/auth/login` - Connexion
- `GET /api/patients` - Liste patients
- `POST /api/documents/upload` - Upload docs
- `POST /api/chat` - Chatbot IA
- `GET /api/health` - Status
