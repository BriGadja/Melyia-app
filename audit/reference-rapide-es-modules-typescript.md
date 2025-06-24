# RÉFÉRENCE RAPIDE - ES MODULES & TYPESCRIPT

## 🚨 ERREURS FRÉQUENTES ET SOLUTIONS

### ❌ Erreur : "require is not defined in ES module scope"

**CAUSE** : `package.json` contient `"type": "module"` - Utilisation de CommonJS au lieu d'ES Modules

```javascript
// ❌ INCORRECT (CommonJS)
const axios = require("axios");
const fs = require("fs");
module.exports = function () {};

// ✅ CORRECT (ES Modules)
import axios from "axios";
import fs from "fs";
export default function () {}
```

### ❌ Erreur : PowerShell "Token '&&' is not a valid statement separator"

**CAUSE** : Syntaxe Bash utilisée dans PowerShell

```powershell
# ❌ INCORRECT (Bash)
cd client && npm run dev

# ✅ CORRECT (PowerShell)
cd client; npm run dev
```

### ❌ Erreur : TypeScript "Property 'firstName' does not exist"

**CAUSE** : Interface TypeScript ne correspond pas aux données backend

```typescript
// ❌ INCORRECT (Interface désynchronisée)
export interface AdminUser {
  first_name: string; // Backend retourne firstName
  last_name: string; // Backend retourne lastName
}

// ✅ CORRECT (Interface alignée)
export interface AdminUser {
  firstName: string; // Correspond au backend
  lastName: string; // Correspond au backend
}
```

## 🎯 TEMPLATES PRÊTS À UTILISER

### Template Script de Test (.mjs)

```javascript
// test-api.mjs
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });
    return response.data.success ? response.data.token : null;
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    return null;
  }
}

async function testAPI(endpoint, token) {
  try {
    const response = await axios.get(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Success:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Failed:", error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log("🧪 Starting tests...");
  const token = await loginAdmin();
  if (!token) return;

  const results = await Promise.all([
    testAPI("/admin/stats", token),
    testAPI("/admin/users", token),
    testAPI("/admin/documents", token),
  ]);

  console.log(
    "🎯 Results:",
    results.every((r) => r) ? "✅ ALL PASS" : "❌ SOME FAIL"
  );
}

runTests().catch(console.error);
```

### Template Interface TypeScript

```typescript
// TOUJOURS vérifier avec le backend d'abord !

// 1. Examiner réponse backend (server.js ou test API)
// 2. Créer interface correspondante
// 3. Tester avec script de validation

export interface AdminStats {
  // Vue admin_stats PostgreSQL
  total_users: number;
  total_dentists: number;
  total_patients: number;
  total_admins: number;
  total_documents: number;
  total_conversations: number;
  active_users: number;
  disk_usage_mb: number;
  recent_activity: RecentActivity[];
  last_updated: string;
}

export interface AdminUser {
  // API /admin/users response
  id: number;
  email: string;
  role: "admin" | "dentist" | "patient";
  firstName: string; // camelCase comme backend
  lastName: string; // camelCase comme backend
  createdAt: string; // camelCase comme backend
  isActive: boolean;
  lastLogin: string | null;
  displayName: string;
}

export interface AdminDocument {
  // API /admin/documents response
  id: number;
  fileName: string; // camelCase comme backend
  filePath: string; // camelCase comme backend
  createdAt: string; // NOT uploaded_at !
  documentType: string;
  fileSize: number;
  dentistEmail: string; // camelCase comme backend
  patientEmail: string; // camelCase comme backend
  patientName: string;
}
```

### Template Commandes PowerShell

```powershell
# Démarrage dev
cd client; npm run dev

# Synchronisation serveur
.\dev\sync-essential.ps1

# Tests
node test-api.mjs

# Variables
$API_BASE = "https://app-dev.melyia.com"
$RESULT = "success"

# Conditions
if ($condition) {
    Write-Host "✅ OK"
} else {
    Write-Host "❌ Failed"
}
```

## 🔍 DIAGNOSTIC RAPIDE

### Problème ES Modules ?

1. ✅ Fichier en `.mjs` ?
2. ✅ `import` au lieu de `require` ?
3. ✅ `export` au lieu de `module.exports` ?

### Problème TypeScript ?

1. ✅ Interface correspond au backend ?
2. ✅ CamelCase vs snake_case ?
3. ✅ Toutes les propriétés présentes ?

### Problème PowerShell ?

1. ✅ `;` au lieu de `&&` ?
2. ✅ Variables avec `$` ?
3. ✅ Syntaxe PowerShell pure ?

## 🎯 CHECKLIST RAPIDE

Avant chaque script/modification :

- [ ] **Extension** : `.mjs` pour Node.js
- [ ] **Imports** : `import` au lieu de `require`
- [ ] **Interface** : Vérifiée avec backend
- [ ] **Tests** : Script de validation créé
- [ ] **PowerShell** : Syntaxe Windows compatible
- [ ] **Cleanup** : Fichiers temporaires supprimés

## 📋 COMPTES DE TEST

- **Admin** : `brice@melyia.com` / `password`
- **Dentiste** : `dentiste@melyia.com` / `test123`
- **Patient** : `patient@melyia.com` / `test123`

## 🔗 APIS DISPONIBLES

- `POST /api/auth/login` - Authentification
- `GET /api/admin/stats` - Statistiques (9 colonnes)
- `GET /api/admin/users` - Utilisateurs (camelCase)
- `GET /api/admin/documents` - Documents (camelCase)
- `GET /api/admin/conversations` - Conversations IA

---

**📌 RÈGLE D'OR** : En cas de doute, TOUJOURS créer un script de test `.mjs` pour valider !
