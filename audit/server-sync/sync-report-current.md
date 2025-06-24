# RAPPORT DE SYNCHRONISATION SERVEUR MELYIA
## Genere le : 2025-06-24 07:29:09

### OBJECTIF
Maintenir la synchronisation entre le serveur de production et l'environnement de developpement local pour permettre a Cursor d'avoir acces aux informations les plus recentes.

### FICHIERS SYNCHRONISES

#### Backend Principal
- server.js (code serveur principal)
- package.json (dependances)
- package-lock.json (versions exactes)

#### Configurations Nginx
- app-dev.melyia.com.conf
- dev.melyia.com.conf  
- melyia.com.conf
- nginx.conf (configuration principale)

#### Base de Donnees PostgreSQL
- Documentation complete generee
- Structure des tables, colonnes, index
- Vues, contraintes, statistiques

#### PM2 Process Manager
- Status JSON en temps reel
- Configuration ecosystem.config.js

#### Logs Systeme
- PM2 application (100 dernieres lignes)
- Nginx erreurs (50 dernieres lignes)
- PostgreSQL (30 dernieres lignes)

### UTILISATION POUR CURSOR

Cursor a maintenant acces a :
1. Code serveur actuel : server/backend/server.js
2. Structure BDD complete : server/configs/postgresql/schema-current.txt
3. Configurations proxy : server/configs/nginx/*.conf
4. Status des services : server/configs/pm2/pm2-status-current.json
5. Logs de debogage : server/logs/*.log

### COMMANDE DE RELANCE
.\dev\sync-server-data.ps1

### OPTIONS DISPONIBLES
- -SkipDatabase : Ignorer la generation de doc BDD
- -SkipLogs : Ignorer la recuperation des logs  
- -Verbose : Affichage detaille des erreurs

Timestamp : 2025-06-24_07-28-16
