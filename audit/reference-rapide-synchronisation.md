# RÉFÉRENCE RAPIDE - Synchronisation Serveur Melyia

## 🚀 DÉBUT DE SESSION OBLIGATOIRE

```powershell
# À lancer au début de chaque session de travail
.\dev\sync-essential.ps1
```

**Résultat attendu :**

- ✅ server.js : ~49.7 KB (code serveur complet)
- ✅ package.json : ~630 B (dépendances)
- ✅ schema BDD : ~6.8 KB (structure PostgreSQL)

## 📋 SCRIPTS DISPONIBLES

### 1. `sync-essential.ps1` ⭐ RECOMMANDÉ

```powershell
.\dev\sync-essential.ps1
```

- **Quand** : Début de session + usage quotidien
- **Durée** : ~10 secondes
- **Fiabilité** : 100% (5 tentatives + timeouts 15s)
- **Contenu** : Fichiers critiques uniquement

### 2. `export-database-schema.ps1`

```powershell
.\dev\export-database-schema.ps1
```

- **Quand** : Modifications BDD spécifiques
- **Durée** : ~5 secondes
- **Contenu** : Structure PostgreSQL détaillée

### 3. `sync-server-data.ps1`

```powershell
.\dev\sync-server-data.ps1
```

- **Quand** : Diagnostic serveur complet
- **Durée** : ~30 secondes (selon réseau)
- **Contenu** : Backend + Nginx + PM2 + logs

## 🔍 VÉRIFICATION RAPIDE

### Fichiers essentiels synchronisés :

```
server/backend/server.js          # > 40 KB
server/backend/package.json       # Présent
server/configs/postgresql/schema-current.txt  # > 5 KB
```

### Informations serveur récupérées :

- **Service** : melyia-auth-service v1.0.0
- **Port** : 8083
- **Base** : PostgreSQL melyia_dev
- **Stack** : Express + JWT + Multer + Ollama
- **Tables** : 7 tables + 1 vue (77 colonnes total)

## ⚠️ DÉPANNAGE RAPIDE

### Si timeouts SSH :

```powershell
# Utiliser le script le plus robuste
.\dev\sync-essential.ps1

# Si échec, fallback BDD seule
.\dev\export-database-schema.ps1
```

### Si fichiers trop petits :

- Relancer la synchronisation
- Vérifier connexion SSH : `ssh -i ~/.ssh/melyia_main ubuntu@51.91.145.255 "echo test"`

## 📊 STRUCTURE SERVEUR

### Backend :

- **Fichier** : /var/www/melyia/app-dev/server.js
- **Process** : PM2 melyia-auth-dev
- **Config** : PostgreSQL + Ollama + Multer

### Base PostgreSQL :

- **Database** : melyia_dev
- **User** : melyia_user
- **Tables** : users, admin_profiles, dentist_profiles, patient_profiles, patient_documents, chat_conversations, waitlist
- **Vue** : admin_stats

---

**Dernière mise à jour** : 2025-01-24  
**Version** : v27.0  
**Status** : ✅ Opérationnel
