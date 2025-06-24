# 🔄 WORKFLOW DE SYNCHRONISATION LOCAL ↔ SERVEUR

## 🎯 **Principe de base**

> **"Local First"** : Toujours partir du local, jamais modifier directement sur le serveur

## 📋 **Workflows selon le scénario**

### **Scénario 1 : Modification planifiée (RECOMMANDÉ)**

```bash
# 1. Récupérer l'état actuel du serveur
.\sync-from-server.ps1

# 2. Modifier en local
nano server/backend/server.js
# ou
nano server/configs/nginx/app-dev.melyia.com.conf

# 3. Tester en local si possible
npm run dev

# 4. Commit Git
git add .
git commit -m "Update: [description]"

# 5. Déployer
npm run deploy:full

# 6. Vérifier que ça marche
npm run test:backend
```

### **Scénario 2 : Modification d'urgence sur serveur**

```bash
# 1. Faire la correction d'urgence sur le serveur
ssh ubuntu@51.91.145.255
sudo nano /etc/nginx/sites-available/app-dev.melyia.com.conf
sudo systemctl reload nginx

# 2. IMMÉDIATEMENT après, récupérer les changements
.\sync-from-server.ps1

# 3. Commit pour sauvegarder
git add .
git commit -m "Sync: Emergency fix from server"
```

### **Scénario 3 : Vérification régulière**

```bash
# Chaque semaine, vérifier la sync
.\sync-from-server.ps1

# Si des différences apparaissent
git diff server/

# Décider : garder local ou serveur
git add . && git commit -m "Sync: Weekly server state"
```

## 🛠️ **Commandes utiles**

### **Comparer local vs serveur**

```bash
# Comparer un fichier spécifique
scp ubuntu@51.91.145.255:/var/www/melyia/app-dev/server.js /tmp/server-remote.js
diff server/backend/server.js /tmp/server-remote.js
```

### **Sauvegarde rapide**

```bash
# Créer une branche avec l'état serveur actuel
git checkout -b "server-state-$(date +%Y%m%d)"
.\sync-from-server.ps1
git add . && git commit -m "Server state snapshot"
git checkout main
```

## ⚠️ **Règles importantes**

1. **JAMAIS** modifier directement sur le serveur (sauf urgence)
2. **TOUJOURS** sync après une modification serveur
3. **COMMIT** immédiatement après sync
4. **TESTER** avant de déployer
5. **DOCUMENTER** les changements d'urgence

## 📊 **Monitoring des différences**

Je peux créer un script qui vérifie régulièrement si local ≠ serveur et vous alerte.

## 🚨 **En cas de désynchronisation**

Si vous découvrez que local ≠ serveur :

```bash
# 1. Sauvegarder l'état local actuel
git stash push -m "Local state before sync"

# 2. Récupérer l'état serveur
.\sync-from-server.ps1

# 3. Comparer les deux
git diff stash@{0}

# 4. Décider quoi garder
git stash pop  # Si vous voulez garder local
# ou
git add . && git commit -m "Accept server state"  # Si vous gardez serveur
```

## 💡 **Conseil pro**

Utilisez ce workflow et vous aurez toujours une copie locale à jour que je peux analyser pour vous aider !
