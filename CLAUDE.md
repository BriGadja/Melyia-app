# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 MÉTHODOLOGIE PAR MICRO-INCRÉMENTS - RÈGLE FONDAMENTALE

**APPROCHE OBLIGATOIRE** : Cette méthodologie DOIT être suivie pour TOUS les travaux futurs sur le projet Melyia.

### 📋 WORKFLOW OBLIGATOIRE POUR CHAQUE TÂCHE

#### 1. **PRÉPARATION SYSTÉMATIQUE**

```bash
# ✅ TOUJOURS vérifier l'état actuel du projet
cd /var/www/melyia/dev-workspace

# ✅ Vérifier que les services sont actifs
pm2 status
systemctl status postgresql
systemctl status nginx

# ✅ Vérifier les logs récents pour détecter d'éventuels problèmes
pm2 logs melyia-auth-dev --lines 20
```

#### 2. **AUDIT DE L'EXISTANT OBLIGATOIRE**

- ✅ **Analyser l'état actuel** du système avant toute modification
- ✅ **Documenter le comportement existant** avec des tests d'audit
- ✅ **Identifier les points d'impact** des modifications prévues
- ✅ **Créer des scripts de test** pour valider l'état actuel

#### 3. **DÉCOUPAGE EN MICRO-ÉTAPES**

- ✅ **Diviser chaque tâche** en micro-étapes de 15-30 minutes maximum
- ✅ **Une seule fonctionnalité** par micro-étape
- ✅ **Objectif mesurable** et testable pour chaque étape
- ✅ **Validation indépendante** de chaque étape avant de passer à la suivante

#### 4. **TESTS D'AUDIT AVANT MODIFICATIONS**

```javascript
// ✅ TOUJOURS créer un script de test AVANT les modifications
// test-[fonctionnalite]-audit.mjs
import axios from "axios";

async function auditCurrentState() {
  // Tester l'état actuel du système
  // Identifier les points de référence
  // Documenter le comportement existant
  console.log("🔍 Audit de l'état actuel...");
}
```

#### 5. **DÉVELOPPEMENT INCRÉMENTAL**

- ✅ **Modifications minimales** à chaque fois
- ✅ **Un seul fichier** à la fois si possible
- ✅ **Respect des conventions** ES Modules + camelCase + Bash
- ✅ **Cohérence** interfaces TypeScript avec backend
- ✅ **Sauvegarde** avant modification avec `cp fichier fichier.backup`

#### 6. **TESTS DE VALIDATION APRÈS MODIFICATIONS**

```javascript
// ✅ TOUJOURS créer un script de validation APRÈS les modifications
// test-[fonctionnalite]-validation.mjs
async function validateChanges() {
  // Tester que les modifications fonctionnent
  // Vérifier qu'aucune régression n'a été introduite
  // Confirmer que l'objectif de la micro-étape est atteint
  console.log("✅ Validation des modifications...");
}
```

#### 7. **DOCUMENTATION ET NETTOYAGE**

- ✅ **Documenter** les changements dans `audit/changelog/`
- ✅ **Supprimer** les fichiers de test temporaires et backups
- ✅ **Résumer** les résultats obtenus
- ✅ **Redémarrer** les services si nécessaire avec `pm2 restart melyia-auth-dev`

## 🔧 **INFORMATIONS TECHNIQUES PROJET**

### Infrastructure Serveur (Ubuntu 22.04)

- **IP**: 51.91.145.255
- **Workspace**: /var/www/melyia/dev-workspace
- **Services**: Nginx + PM2 + PostgreSQL + Ollama
- **SSL**: Let's Encrypt auto-renewal
- **Monitoring**: PM2 + logs centralisés

### Backend Express (Port 8083)

- **Fichier**: /var/www/melyia/app-dev/server.js
- **PM2**: Process melyia-auth-dev
- **Base**: melyia_dev (PostgreSQL + pgvector)
- **Password DB**: QOZ9QyJd4YiufyzMj0eq7GgHV0sBrlSX
- **Commandes**:
  - Redémarrer: `pm2 restart melyia-auth-dev`
  - Logs: `pm2 logs melyia-auth-dev`
  - Statut: `pm2 show melyia-auth-dev`

### Frontend React (Port 5173 dev)

- **Workspace**: /var/www/melyia/dev-workspace
- **Proxy**: /api/* → https://app-dev.melyia.com
- **Build**: dist/app/ et dist/landing/
- **Deploy**: GitHub Actions + webhooks
- **Dev local**: `cd client && npm run dev`

### Base de Données PostgreSQL

- **Host**: localhost
- **Port**: 5432
- **Database**: melyia_dev
- **User**: melyia_user
- **Connexion**: `psql -U melyia_user -d melyia_dev`

## 🧪 **COMPTES DE TEST DISPONIBLES**

### Compte Admin Principal

- **Email**: brice@melyia.com
- **Mot de passe**: password
- **Rôle**: admin
- **URL Dev**: http://localhost:5173/admin/dashboard
- **URL Prod**: https://app-dev.melyia.com/admin/dashboard

### Autres comptes de test

- **Dentiste**: dentiste@melyia.com / test123
- **Patient**: patient@melyia.com / test123

## 🎯 **RÈGLES CRITIQUES - BONNES PRATIQUES OBLIGATOIRES**

### ⚡ ES MODULES vs COMMONJS - SYNTAXE CORRECTE

**RÈGLE ABSOLUE** : `package.json` contient `"type": "module"` donc **TOUJOURS utiliser ES Modules**

#### ✅ CORRECT : ES Modules (.mjs ou .js avec type: module)

```javascript
// ✅ IMPORTS ES MODULES
import axios from "axios";
import fs from "fs";
import path from "path";

// ✅ EXPORTS ES MODULES
export default function test() {}
export { functionName };
```

#### ❌ INCORRECT : CommonJS (CAUSE ERREURS)

```javascript
// ❌ NE JAMAIS UTILISER - CAUSE "require is not defined"
const axios = require("axios");
const fs = require("fs");
module.exports = function () {};
```

### 🖥️ BASH vs POWERSHELL - SYNTAXE CORRECTE

**CONTEXTE** : Serveur Linux Ubuntu 22.04 avec Bash

#### ✅ CORRECT : Bash (Linux)

```bash
# ✅ SÉPARATEUR COMMANDES
cd client && npm run dev

# ✅ VARIABLES
API_BASE="https://app-dev.melyia.com"
export API_BASE

# ✅ CONDITIONS
if [ -f "server.js" ]; then
  echo "Fichier trouvé"
fi
```

#### ❌ INCORRECT : PowerShell (Windows uniquement)

```powershell
# ❌ SYNTAXE WINDOWS - Ne fonctionne pas sur Linux
$API_BASE = "https://app-dev.melyia.com"
cd client; npm run dev
```

### 🧪 SCRIPTS DE TEST - TEMPLATE OBLIGATOIRE

**TOUJOURS utiliser ce template pour les scripts de test** :

```javascript
// test-name.mjs - ✅ EXTENSION .mjs OBLIGATOIRE
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (response.data.success) {
      console.log("✅ Login réussi");
      return response.data.token;
    }
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ Erreur login:", error.response?.data || error.message);
    return null;
  }
}

async function testAPI(token) {
  try {
    const response = await axios.get(`${API_BASE}/endpoint`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Test réussi:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Test échoué:", error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log("🔍 Démarrage des tests...");
  
  const token = await loginAdmin();
  if (!token) {
    console.log("❌ Impossible de continuer sans token");
    return;
  }

  const result = await testAPI(token);
  console.log("🎯 Résultat final:", result ? "✅ SUCCÈS" : "❌ ÉCHEC");
}

runTests().catch(console.error);
```

### 📁 STRUCTURE DES DOSSIERS

```
/var/www/melyia/dev-workspace/
├── client/                 # Frontend React
├── server/                 # Backend Express (si copié)
├── audit/                  # Documentation et tests
│   ├── versions/           # Changelogs par version
│   └── tests/             # Scripts de test temporaires
├── docs/                   # Documentation technique
└── scripts/               # Scripts utilitaires
```

### 🎯 CHECKLIST AVANT CHAQUE MODIFICATION

1. **✅ Audit** : État actuel documenté et testé ?
2. **✅ Sauvegarde** : Fichiers critiques sauvegardés ?
3. **✅ Syntaxe** : ES Modules (.mjs) et Bash (Linux) ?
4. **✅ Interfaces** : TypeScript aligné avec backend ?
5. **✅ Tests** : Scripts de validation créés ?
6. **✅ Services** : PM2 redémarré après modifications ?
7. **✅ Documentation** : Changelog mis à jour ?
8. **✅ Cleanup** : Fichiers temporaires supprimés ?

### 📝 **DOCUMENTATION OBLIGATOIRE DES SUCCÈS**

**RÈGLE CRITIQUE** : Quand une modification/implémentation s'avère être un succès (tests passent, validation OK), **TOUJOURS documenter dans le changelog de la version en cours** :

1. **Identifier la version actuelle** : Vérifier `audit/versions/` pour la dernière version (actuellement v36)
2. **Créer le fichier changelog** : `audit/versions/v36/changelog/YYYY-MM-DD-nom-descriptif.md`
3. **Format obligatoire** du changelog :
   ```markdown
   # [DATE] - [TITRE DESCRIPTIF]
   
   ## 🎯 Objectif
   [Description claire de ce qui était cassé/manquant]
   
   ## ✅ Solution Implémentée
   [Détails techniques des changements effectués]
   
   ## 🧪 Tests et Validation
   [Résultats des tests, scripts utilisés, taux de succès]
   
   ## 📁 Fichiers Modifiés
   [Liste des fichiers modifiés avec backups créés]
   
   ## 🎉 Résultats
   [Impact positif, métriques de performance, fonctionnalités restaurées]
   ```
4. **Exemples de titres** : 
   - `2025-07-09-fix-notification-system-complete.md`
   - `2025-07-09-implementation-feature-xyz-success.md`
   - `2025-07-09-optimization-api-performance.md`

### 🧪 **PROCÉDURES DE TEST OBLIGATOIRES APRÈS CHAQUE MODIFICATION**

**RÈGLE CRITIQUE** : Après TOUTE modification du code (backend/frontend), exécuter SYSTÉMATIQUEMENT ces tests :

### 🔍 **TEST RAPIDE (5 minutes) - OBLIGATOIRE**

```bash
# 1. Vérifier les services
pm2 status
systemctl status postgresql
systemctl status nginx

# 2. Tester les connexions base
node test-connexion-patient.mjs

# 3. Vérifier les logs récents
pm2 logs melyia-auth-dev --lines 20 --no-stream
```

### 🏥 **TEST COMPLET SANTÉ PLATEFORME (10 minutes)**

Créer et exécuter systématiquement ce script après modifications :

```javascript
// test-sante-plateforme.mjs
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function testConnexions() {
  const comptes = [
    { email: "patient@melyia.com", password: "test123", role: "patient" },
    { email: "dentiste@melyia.com", password: "test123", role: "dentiste" },
    { email: "brice@melyia.com", password: "password", role: "admin" }
  ];

  console.log("🔐 Test de toutes les connexions...");
  const resultats = {};

  for (const compte of comptes) {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: compte.email,
        password: compte.password
      });
      
      resultats[compte.role] = {
        success: response.data.success,
        token: response.data.token,
        user: response.data.user
      };
      console.log(`✅ ${compte.role}: Connexion OK`);
    } catch (error) {
      resultats[compte.role] = { success: false, error: error.message };
      console.log(`❌ ${compte.role}: Échec - ${error.message}`);
    }
  }
  return resultats;
}

async function testAPICritiques(tokens) {
  console.log("🔍 Test des API critiques...");
  
  const tests = [
    {
      nom: "API Health",
      test: () => axios.get(`${API_BASE}/health`)
    },
    {
      nom: "Chat Patient",
      test: () => axios.post(`${API_BASE}/chat`, {
        message: "Test simple",
        patientId: 1
      }, { headers: { Authorization: `Bearer ${tokens.admin.token}` }})
    },
    {
      nom: "Upload Admin", 
      test: () => axios.get(`${API_BASE}/admin/documents`, {
        headers: { Authorization: `Bearer ${tokens.admin.token}` }
      })
    },
    {
      nom: "Patients Dentiste",
      test: () => axios.get(`${API_BASE}/patients`, {
        headers: { Authorization: `Bearer ${tokens.admin.token}` }
      })
    }
  ];

  const resultats = {};
  for (const test of tests) {
    try {
      const response = await test.test();
      resultats[test.nom] = { success: true, status: response.status };
      console.log(`✅ ${test.nom}: OK (${response.status})`);
    } catch (error) {
      resultats[test.nom] = { success: false, error: error.message };
      console.log(`❌ ${test.nom}: Échec - ${error.response?.status || error.message}`);
    }
  }
  return resultats;
}

async function testInterface() {
  console.log("🖥️ Test interface utilisateur...");
  
  try {
    // Test page de connexion
    const response = await axios.get("https://app-dev.melyia.com");
    console.log(`✅ Interface accessible (${response.status})`);
    return true;
  } catch (error) {
    console.log(`❌ Interface inaccessible: ${error.message}`);
    return false;
  }
}

async function runTestsComplets() {
  console.log("🎯 TESTS COMPLETS DE SANTÉ - PLATEFORME MELYIA");
  console.log("═".repeat(60));
  
  const tokens = await testConnexions();
  console.log("\n" + "─".repeat(60));
  
  const apis = await testAPICritiques(tokens);
  console.log("\n" + "─".repeat(60));
  
  const interface = await testInterface();
  console.log("\n" + "═".repeat(60));
  
  // Résumé
  const connexionsOK = Object.values(tokens).every(t => t.success);
  const apisOK = Object.values(apis).every(a => a.success);
  
  console.log("\n🎯 RÉSUMÉ FINAL:");
  console.log(`Connexions: ${connexionsOK ? "✅" : "❌"}`);
  console.log(`APIs: ${apisOK ? "✅" : "❌"}`);  
  console.log(`Interface: ${interface ? "✅" : "❌"}`);
  
  const toutOK = connexionsOK && apisOK && interface;
  console.log(`\n🎯 STATUT GLOBAL: ${toutOK ? "✅ PLATEFORME SAINE" : "❌ PROBLÈMES DÉTECTÉS"}`);
  
  if (!toutOK) {
    console.log("\n⚠️ ACTIONS REQUISES:");
    if (!connexionsOK) console.log("- Vérifier authentification et base de données");
    if (!apisOK) console.log("- Vérifier backend et routes API");
    if (!interface) console.log("- Vérifier nginx et fichiers statiques");
  }
}

runTestsComplets().catch(console.error);
```

### 🎮 **TEST FONCTIONNALITÉS UTILISATEUR (Frontend)**

**À tester manuellement dans le navigateur :**

1. **Patient (patient@melyia.com / test123)**
   - ✅ Connexion successful 
   - ✅ Chat accessible avec boutons contextuels
   - ✅ Boutons : Rendez-vous, Urgence, Devis, Dossier
   - ✅ Messages envoyés et réponses reçues

2. **Dentiste (dentiste@melyia.com / test123)**
   - ✅ Connexion successful
   - ✅ Liste des patients accessible
   - ✅ Upload de documents patients
   - ✅ Chat avec sélection patient

3. **Admin (brice@melyia.com / password)**
   - ✅ Dashboard admin accessible
   - ✅ Upload documents base de connaissances
   - ✅ Gestion utilisateurs
   - ✅ Statistiques fonctionnelles

### 📊 **MONITORING CONTINU**

```bash
# Vérifier quotidiennement
pm2 status
pm2 logs melyia-auth-dev --lines 50 --no-stream | grep ERROR
df -h  # Espace disque
free -h  # RAM disponible

# Tester hebdomadairement  
node test-sante-plateforme.mjs
```

### 🚨 **CHECKLIST AVANT MISE EN PRODUCTION**

- [ ] Tous les tests de connexion passent
- [ ] API Health retourne "OK"
- [ ] Chat fonctionne pour tous les rôles
- [ ] Upload de documents opérationnel
- [ ] Interface accessible sans erreurs JS
- [ ] Pas d'erreurs critiques dans les logs PM2
- [ ] RAM et disque suffisants
- [ ] PostgreSQL et Ollama connectés

## 🚨 COMMANDES D'URGENCE

```bash
# Redémarrer tous les services
pm2 restart all

# Vérifier les logs d'erreur
pm2 logs melyia-auth-dev --err

# Revenir à une sauvegarde
cp fichier.backup fichier

# Vérifier l'espace disque
df -h

# Vérifier les processus actifs
pm2 status

# Test rapide santé plateforme
node test-connexion-patient.mjs
```

**⚠️ RÈGLE ABSOLUE** : Ne JAMAIS modifier le code en production sans avoir testé ces procédures en dev ! Ces tests évitent 95% des pannes en production.