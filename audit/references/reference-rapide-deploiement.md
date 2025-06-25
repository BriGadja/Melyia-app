# RÉFÉRENCE RAPIDE - Scripts de Déploiement Melyia

## 🚀 COMMANDES ESSENTIELLES

### ⭐ **RECOMMANDÉ** (Usage quotidien)

```bash
npm run deploy:fast
```

**Ce qu'il fait :** Build automatique + Déploiement rapide sans timeout  
**Durée :** ~11.7s  
**Avantages :** Parfait équilibre simplicité/performance

---

## 📋 TOUTES LES OPTIONS DISPONIBLES

### 🚀 **Déploiement complet (4 versions)**

| Commande                  | Build inclus | Durée | Timeout     | Usage                  |
| ------------------------- | ------------ | ----- | ----------- | ---------------------- |
| `npm run deploy:fast`     | ✅           | 11.7s | ❌          | ⭐ **Quotidien**       |
| `npm run deploy:full`     | ✅           | 11.5s | ⚠️ Possible | Première fois          |
| `npm run deploy:quick`    | ❌           | 2.7s  | ❌          | Développement itératif |
| `npm run deploy:combined` | ❌           | 3.0s  | ⚠️ Possible | Permissions complètes  |

### 🔄 **Développement local**

```bash
npm run dev:landing     # Mode landing page
npm run dev:app         # Mode application auth
```

### 📦 **Builds uniquement**

```bash
npm run build:both      # Landing + App
npm run build:landing   # Landing seule
npm run build:app       # App seule
```

### 🎯 **Déploiements individuels**

```bash
npm run deploy:landing  # Landing seule (build inclus)
npm run deploy:app      # App seule (build inclus)
```

---

## 🎯 WORKFLOWS RECOMMANDÉS

### 🚀 **Développement quotidien**

```bash
# Une commande pour tout faire
npm run deploy:fast
```

### ⚡ **Développement itératif** (modifications fréquentes)

```bash
# Build une fois
npm run build:both

# Deploy à chaque modification (ultra-rapide)
npm run deploy:quick
```

### 🔧 **Premier déploiement / Production**

```bash
# Version complète avec toutes les permissions
npm run deploy:full
```

---

## 📊 COMPARAISON DÉTAILLÉE

### `deploy:fast` ⭐ **OPTIMAL**

- ✅ **Build automatique** : Pas besoin de se souvenir
- ✅ **Aucun timeout** : Permissions basiques suffisantes
- ✅ **Performance** : 11.7s pour déploiement complet
- ✅ **Upload parallèle** : Landing + App simultané
- ✅ **Fiabilité** : Gestion d'erreurs robuste

### `deploy:quick` ⚡ **RAPIDE**

- ⚡ **Ultra-rapide** : 2.7s seulement
- ⚠️ **Build manuel** : Nécessite `npm run build:both` avant
- ✅ **Aucun timeout** : Parfait pour développement
- ✅ **Permissions basiques** : ubuntu:ubuntu 755

### `deploy:full` 🔧 **COMPLET**

- ✅ **Build automatique** : Inclus
- ✅ **Permissions complètes** : www-data pour nginx
- ⚠️ **Timeout possible** : Sur permissions finales
- 🎯 **Usage** : Première fois ou production

---

## 🔧 FICHIERS TECHNIQUES

### Scripts de déploiement

- `deploy-combined.js` : Version complète avec permissions www-data
- `deploy-combined-quick.js` : Version optimisée sans timeouts
- `deploy-to-dev.js` : Déploiement landing uniquement
- `deploy-to-app-dev.js` : Déploiement app uniquement

### Scripts utilitaires

- `switch-to-landing.js` : Basculement vers mode landing
- `switch-to-app.js` : Basculement vers mode application

---

## 🌐 URLS DE VALIDATION

Après déploiement, vérifiez :

- **Landing** : https://dev.melyia.com
- **Application** : https://app-dev.melyia.com

---

## 🚨 DÉPANNAGE RAPIDE

### Erreur "Cannot find module"

```bash
# Vérifier que tous les scripts existent
ls -la deploy-*.js switch-*.js
```

### Permission denied lors upload

```bash
# Utiliser la version quick (permissions préparées)
npm run deploy:quick
```

### Build non trouvé

```bash
# Générer les builds d'abord
npm run build:both
```

### Timeout SSH

```bash
# Utiliser la version sans timeout
npm run deploy:fast
```

---

## 🎯 RÉSUMÉ POUR COMMENCER

### **Nouveau développeur :**

```bash
npm run deploy:fast  # Tout en une commande !
```

### **Développement intensif :**

```bash
npm run build:both   # Une fois
npm run deploy:quick # À chaque modification
```

### **Production :**

```bash
npm run deploy:full  # Version complète
```

**Le système de déploiement Melyia est maintenant ultra-optimisé !** 🚀

---

**Dernière mise à jour** : 2025-01-24  
**Version** : v28.0 - Optimisation déploiement  
**Performance** : 11.7s (deploy:fast) | 2.7s (deploy:quick)
