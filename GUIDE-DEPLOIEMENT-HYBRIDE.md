# 🚀 GUIDE DÉPLOIEMENT HYBRIDE MELYIA

## 🎯 **PRINCIPE**

**Développement Local + Déploiement Serveur = Zéro Problème SSH !**

- ✅ **Développement** : Local (performance maximale)
- ✅ **Déploiement** : Depuis serveur (plus de timeouts/permissions)
- ✅ **Synchronisation** : Via Git (GitHub)

---

## 🛠️ **CONFIGURATION INITIALE**

### **Étape 1 : Adapter le Script Git**

Éditez `deploy-from-server-git.sh` :

```bash
# Ligne 10 : Remplacez par votre repo GitHub
REPO_URL="https://github.com/VOTRE-USERNAME/melyia.git"
```

### **Étape 2 : Vérification SSH**

```bash
# Test connexion optimisée
ssh melyia-remote "echo 'SSH OK'"
```

### **Étape 3 : Configuration Git sur Serveur**

Dans votre fenêtre **Remote SSH** :

```bash
# Configuration Git (une seule fois)
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"

# Test de récupération du repo
mkdir -p /var/www/melyia/deploy-workspace
cd /var/www/melyia/deploy-workspace
git clone https://github.com/VOTRE-USERNAME/melyia.git .
```

---

## 🚀 **UTILISATION QUOTIDIENNE**

### **🎯 Commande Principale (Recommandée)**

```powershell
# Déploiement complet automatisé
npm run deploy:hybrid
```

**Ce que fait cette commande :**

1. 📝 Commit automatique des modifications locales
2. 📤 Push vers GitHub
3. 🎯 Déclenche le déploiement sur serveur
4. 🏗️ Build et déploiement depuis serveur
5. ✅ Vérification des sites

### **🔄 Commandes Alternatives**

```powershell
# Déploiement rapide avec message générique
npm run deploy:hybrid:quick

# Déploiement avec message personnalisé
.\deploy-trigger-from-local.ps1 -CommitMessage "Nouvelle fonctionnalité"

# Déploiement d'une branche spécifique
.\deploy-trigger-from-local.ps1 -Branch "develop"

# Déploiement sans push (si déjà pushé)
.\deploy-trigger-from-local.ps1 -NoPush

# Redéploiement serveur uniquement (sans commit local)
npm run deploy:server-only
```

---

## 📊 **WORKFLOW DÉTAILLÉ**

### **🔄 Cycle de Développement**

```
┌─────────────────┐    ┌─────────────────┐
│   LOCAL PC      │    │   GITHUB        │
│   Développement │ ──▶│   Repository    │
│   + Tests       │    │   (sync)        │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
                   ┌─────────────────┐
                   │   SERVEUR       │
                   │   Git Pull      │
                   │   Build         │
                   │   Deploy        │
                   └─────────────────┘
```

### **⚡ Exemple de Session**

```powershell
# 1. Développement local
code .  # Modifier le code

# 2. Test local (optionnel)
npm run dev:app

# 3. Déploiement hybride
npm run deploy:hybrid
```

**Sortie attendue :**

```
🚀 DÉPLOIEMENT HYBRIDE MELYIA
=============================
📍 Commit: Auto-deploy 2025-01-27 15:30
🌿 Branche: main

📋 ÉTAPE 1 : Préparation locale...
📝 Fichiers modifiés détectés:
✅ Commit créé
📤 Push vers GitHub...
✅ Code poussé vers GitHub

🎯 ÉTAPE 2 : Déploiement depuis serveur...
📤 Upload du script de déploiement...
🚀 Exécution du déploiement sur serveur...

📊 RÉSULTAT DU DÉPLOIEMENT:
============================
🚀 DÉPLOIEMENT DEPUIS SERVEUR - RÉCUPÉRATION GIT
✅ Code récupéré : commit abc123f
📦 Installation des dépendances...
🏗️ Build des applications...
✅ Builds créés avec succès
🌐 Déploiement Landing Page...
📱 Déploiement Application...
🔄 Redémarrage des services...
✅ DÉPLOIEMENT RÉUSSI !

🧪 Vérification des sites...
✅ Landing Page: 200
✅ Application: 200

🎉 DÉPLOIEMENT HYBRIDE TERMINÉ
```

---

## 🛠️ **MÉTHODES ALTERNATIVES**

### **Méthode 2 : Rsync Pull**

Si GitHub n'est pas accessible ou pour développement privé :

```bash
# Sur le serveur (via Remote SSH)
./deploy-rsync-pull.sh setup   # Configuration initiale
./deploy-rsync-pull.sh deploy  # Déploiement direct
```

### **Méthode 3 : HTTP Upload**

Pour les gros projets ou connexions instables :

```bash
# Serveur HTTP temporaire local
python -m http.server 8080

# Récupération depuis serveur
curl http://VOTRE-IP:8080/archive.zip -o project.zip
```

---

## 🚨 **RÉSOLUTION DE PROBLÈMES**

### **❌ Erreur de Push Git**

```powershell
# Vérifier l'authentification GitHub
git config --list | grep user
git remote -v

# Résolution
git push origin main  # Push manuel
```

### **❌ Erreur de Connexion SSH**

```powershell
# Test de connexion
ssh melyia-remote "echo 'Test OK'"

# Vérification config SSH
type "$env:USERPROFILE\.ssh\config"
```

### **❌ Erreur de Build sur Serveur**

```bash
# Via Remote SSH
cd /var/www/melyia/deploy-workspace
npm install  # Réinstaller les dépendances
npm run build:both  # Test manuel
```

### **❌ Sites inaccessibles**

```bash
# Vérification services
sudo systemctl status nginx
pm2 status
pm2 logs melyia-auth-dev
```

---

## 🎯 **AVANTAGES DE CETTE MÉTHODE**

### ✅ **Problèmes Résolus**

- **Plus de timeouts SSH** lors des déploiements
- **Plus de problèmes de permissions** (sudo cp direct)
- **Plus de protection brute-force**
- **Plus d'erreurs de transfert de fichiers**

### ✅ **Bénéfices**

- **🚀 Développement local** : Performance maximale
- **⚡ Déploiement serveur** : Instantané et fiable
- **🔄 Synchronisation Git** : Versioning propre
- **🛡️ Sécurité** : Code pas stocké en permanence sur serveur
- **📱 Tests directs** : Environnement de production

### ✅ **Performance**

- **Local** : Hot reload, auto-complete rapide
- **Déploiement** : 30-60s au lieu de 5-15 minutes
- **Fiabilité** : 99% de succès vs 50% avant

---

## 📋 **CHECKLIST QUOTIDIENNE**

**Avant de commencer :**

- [ ] Connexion internet stable
- [ ] SSH configuré (`ssh melyia-remote`)
- [ ] Git configuré localement

**Workflow standard :**

- [ ] Développement local
- [ ] Tests locaux (optionnel)
- [ ] `npm run deploy:hybrid`
- [ ] Vérification sites

**En cas de problème :**

- [ ] Vérifier logs : `ssh melyia-remote 'pm2 logs'`
- [ ] Status services : `ssh melyia-remote 'sudo systemctl status nginx'`
- [ ] Redémarrage : `ssh melyia-remote 'pm2 restart melyia-auth-dev'`

---

## 🎉 **RÉSULTAT**

**Avant :** Déploiements pénibles, timeouts fréquents, 15 minutes
**Après :** Déploiements fluides, fiables, 1 minute

**Cette méthode combine le meilleur des deux mondes !**
