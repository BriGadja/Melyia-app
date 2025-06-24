# Scripts de Synchronisation Serveur Melyia

## 🎯 Objectif

Ces scripts permettent de maintenir une synchronisation entre le serveur de production et l'environnement de développement local, donnant à Cursor un accès complet aux informations critiques du serveur.

## 📋 Scripts Disponibles

### 1. `sync-server-data.ps1` - Synchronisation Complète

**Usage :**

```powershell
.\dev\sync-server-data.ps1
```

**Options :**

- `-SkipDatabase` : Ignore la génération de documentation de BDD
- `-SkipLogs` : Ignore la récupération des logs
- `-Verbose` : Affichage détaillé des erreurs

**Ce qu'il fait :**

- ✅ Copie les fichiers backend critiques (`server.js`, `package.json`)
- ✅ Récupère les configurations Nginx
- ✅ Génère la documentation complète PostgreSQL
- ✅ Récupère le statut PM2
- ✅ Copie les logs récents (PM2, Nginx, PostgreSQL)

### 2. `export-database-schema.ps1` - Export BDD Uniquement

**Usage :**

```powershell
.\dev\export-database-schema.ps1
```

**Ce qu'il fait :**

- 🗄️ Génère uniquement la documentation de la base PostgreSQL
- 📄 Sauvegarde dans `melyia_database_doc.txt`
- 📋 Copie de sauvegarde dans `server/configs/postgresql/`

### 3. `sync-essential.ps1` - Synchronisation Ultra-Fiable ⭐

**Usage :**

```powershell
.\dev\sync-essential.ps1
```

**Ce qu'il fait :**

- ⚡ **ULTRA-ROBUSTE** : 5 tentatives + timeouts étendus
- 🎯 **FICHIERS CRITIQUES** : `server.js` + `package.json`
- 🗄️ **Schema BDD simplifié** : Tables + colonnes essentielles
- ✅ **Vérification** : Tailles fichiers + validation
- 🚀 **Rapide** : Seulement les opérations indispensables

## 📁 Structure Créée

Après exécution, Cursor aura accès à :

```
server/
├── backend/
│   ├── server.js           # Code serveur actuel
│   ├── package.json        # Dépendances
│   └── package-lock.json   # Versions exactes
├── configs/
│   ├── nginx/              # Configurations proxy
│   │   ├── app-dev.melyia.com.conf
│   │   ├── dev.melyia.com.conf
│   │   ├── melyia.com.conf
│   │   └── nginx.conf
│   ├── pm2/                # Process manager
│   │   ├── pm2-status-current.json
│   │   └── ecosystem.config.js
│   └── postgresql/         # Base de données
│       └── schema-current.txt
└── logs/                   # Logs système récents
    ├── pm2-app-*.log
    ├── nginx-errors-*.log
    └── postgresql-*.log
```

## 🚀 Workflow Recommandé

### Pour le développement quotidien :

```powershell
# Synchronisation essentielle (RECOMMANDEE)
.\dev\sync-essential.ps1

# OU synchronisation rapide BDD uniquement
.\dev\export-database-schema.ps1
```

### Pour un diagnostic complet :

```powershell
# Synchronisation complète (si sync-essential.ps1 ne suffit pas)
.\dev\sync-server-data.ps1
```

### En cas de problèmes de réseau :

```powershell
# Script le plus fiable (timeouts étendus + 5 tentatives)
.\dev\sync-essential.ps1

# Si échec, fallback sur export BDD seul
.\dev\export-database-schema.ps1
```

### Cas d'utilisation fréquents :

**🐛 Debugging d'un problème serveur :**

1. `.\dev\sync-server-data.ps1` (récupère logs + configs)
2. Cursor analyse les logs et configurations
3. Propositions de corrections ciblées

**📊 Analyse de structure BDD :**

1. `.\dev\export-database-schema.ps1`
2. Cursor compare avec le code (`server.js`)
3. Détection d'incohérences structure/code

**🔧 Modification backend :**

1. `.\dev\sync-server-data.ps1 -SkipLogs` (récupère code actuel)
2. Modifications locales
3. Tests via proxy dev
4. Déploiement

## 🔐 Prérequis

- **Clé SSH** : `~/.ssh/melyia_main` configurée
- **Accès serveur** : `ubuntu@51.91.145.255`
- **PowerShell** : Version 5.1+ ou PowerShell Core

## ⚡ Avantages pour Cursor

1. **Vision complète** : Code + Config + BDD + Logs
2. **Diagnostic précis** : Erreurs avec contexte complet
3. **Solutions ciblées** : Corrections basées sur l'état réel
4. **Cohérence** : Alignement dev/prod garanti

## 🛠️ Dépannage

**Erreur SSH :**

```bash
# Vérifier la clé SSH
ls -la ~/.ssh/melyia_main
ssh -i ~/.ssh/melyia_main ubuntu@51.91.145.255 "echo test"
```

**Erreur PostgreSQL :**

```bash
# Vérifier l'accès BDD sur le serveur
ssh ubuntu@51.91.145.255 "sudo -u postgres psql -d melyia_dev -c '\l'"
```

**Erreur permissions :**

```bash
# Vérifier les permissions des dossiers
ls -la /var/www/melyia/app-dev/
```
