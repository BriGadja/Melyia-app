# 🔧 SSH ET RÉSOLUTION INTERFACE BLANCHE - RÉFÉRENCE CURSORRULES v30.1

## 🚀 **SSH FONCTIONNE TOUJOURS - RÈGLE CRITIQUE**

**IMPORTANT** : Ne **JAMAIS** supposer que SSH ne fonctionne pas ! SSH est opérationnel à 100%.

### **Syntaxe SSH correcte (PowerShell Windows) :**

```bash
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "commande"
```

### **Tests SSH de diagnostic :**

```bash
# 1. Test connexion basique
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "echo 'SSH OK' && date && whoami"

# 2. Test permissions serveur
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "sudo ls -la /var/www/melyia/app-dev/"

# 3. Test assets spécifique
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "sudo ls -la /var/www/melyia/app-dev/assets/"
```

## 🎯 **RÉSOLUTION INTERFACE BLANCHE - MÉTHODOLOGIE ÉPROUVÉE**

### **RÈGLE ABSOLUE : Interface blanche = problème de permissions serveur, PAS de cache !**

### **Diagnostic automatique (5 minutes) :**

#### **1. SSH diagnostic structure (2 minutes) :**

```bash
# Vérifier structure serveur
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "sudo ls -la /var/www/melyia/app-dev/"

# Vérifier permissions assets (CRITIQUE)
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "sudo ls -la /var/www/melyia/app-dev/assets/"
```

**Rechercher :** `drwx------` (permissions 700) sur le dossier assets = PROBLÈME IDENTIFIÉ

#### **2. Test HTTP assets (1 minute) :**

```javascript
// test-assets-diagnostic.mjs
import axios from "axios";

const BASE_URL = "https://app-dev.melyia.com";

// Test HTML pour extraire les assets
const htmlResponse = await axios.get(`${BASE_URL}/index-app.html`);
const cssMatch = htmlResponse.data.match(/\/assets\/[^"]+\.css/);
const jsMatch = htmlResponse.data.match(/\/assets\/[^"]+\.js/);

// Test direct des assets
if (cssMatch) {
  const cssResponse = await axios.get(`${BASE_URL}${cssMatch[0]}`, {
    validateStatus: (status) => status < 500,
  });
  console.log(`CSS: ${cssResponse.status} - ${cssMatch[0]}`);
  if (cssResponse.status === 403) {
    console.log("❌ PROBLÈME: Permissions CSS bloquées");
  }
}
```

#### **3. Correction automatique permissions (1 minute) :**

```bash
# Correction immédiate via SSH
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "sudo chmod 755 /var/www/melyia/app-dev/assets && sudo chmod 644 /var/www/melyia/app-dev/assets/*"

# Vérification correction
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "sudo ls -la /var/www/melyia/app-dev/assets/"
```

#### **4. Validation HTTP (1 minute) :**

```javascript
// Test après correction
const cssTestApres = await axios.get(
  "https://app-dev.melyia.com/assets/index-app-HASH.css"
);
console.log(cssTestApres.status === 200 ? "✅ CORRIGÉ" : "❌ ÉCHEC");
```

## 🚫 **ERREURS À ÉVITER ABSOLUMENT**

### **❌ Supposer que SSH ne fonctionne pas :**

```bash
# ❌ FAUX : "SSH ne marche pas, on va faire autrement"
# ✅ CORRECT : Tester SSH avec diagnostic complet
ssh -i "C:\Users\pc\.ssh\melyia_main" ubuntu@51.91.145.255 "echo 'TEST'"
```

### **❌ Se concentrer sur le cache :**

```javascript
// ❌ FAUX : Perte de temps sur cache-busting
const cacheBuster = Date.now();
window.location.href = `${url}?v=${cacheBuster}`;

// ✅ CORRECT : Test direct permissions
const response = await axios.get("/assets/file.css", {
  validateStatus: () => true,
});
if (response.status === 403) {
  /* Corriger permissions */
}
```

### **❌ Redéploiements multiples :**

```bash
# ❌ FAUX : Redéployer sans diagnostic
npm run deploy:full  # Répété 5 fois

# ✅ CORRECT : Diagnostic puis correction ciblée
ssh ubuntu@server "sudo ls -la /var/www/assets/" # Identifier le problème
ssh ubuntu@server "sudo chmod 755 /var/www/assets/" # Corriger directement
```

## 🎯 **TEMPLATE COMPLET RÉSOLUTION INTERFACE BLANCHE**

```javascript
// resolution-interface-blanche.mjs
import { execSync } from "child_process";
import axios from "axios";

async function resolutionInterfaceBlanche() {
  console.log("🔍 RÉSOLUTION INTERFACE BLANCHE - PROTOCOLE v30.1");
  console.log("Temps estimé : 5 minutes au lieu de 2 heures");

  // 1. Diagnostic SSH structure (PRIORITÉ 1)
  console.log("\n1. 🔍 Diagnostic structure serveur...");
  try {
    const structureResult = execSync(
      'ssh -i "C:\\Users\\pc\\.ssh\\melyia_main" ubuntu@51.91.145.255 "sudo ls -la /var/www/melyia/app-dev/"',
      { encoding: "utf8", timeout: 10000 }
    );
    console.log("✅ Structure serveur accessible");

    // 2. Diagnostic permissions assets
    console.log("\n2. 🔐 Diagnostic permissions assets...");
    const assetsResult = execSync(
      'ssh -i "C:\\Users\\pc\\.ssh\\melyia_main" ubuntu@51.91.145.255 "sudo ls -la /var/www/melyia/app-dev/assets/"',
      { encoding: "utf8", timeout: 10000 }
    );
    console.log("Assets permissions:", assetsResult);

    // Détecter permissions problématiques
    if (assetsResult.includes("drwx------")) {
      console.log("❌ PROBLÈME DÉTECTÉ: Permissions assets restrictives (700)");

      // 3. Correction automatique
      console.log("\n3. 🛠️ Correction permissions automatique...");
      execSync(
        'ssh -i "C:\\Users\\pc\\.ssh\\melyia_main" ubuntu@51.91.145.255 "sudo chmod 755 /var/www/melyia/app-dev/assets && sudo chmod 644 /var/www/melyia/app-dev/assets/*"',
        { encoding: "utf8", timeout: 10000 }
      );
      console.log("✅ Permissions corrigées");
    }
  } catch (sshError) {
    console.log("❌ Erreur SSH:", sshError.message);
    return;
  }

  // 4. Test HTTP assets
  console.log("\n4. 🌐 Test HTTP assets...");
  try {
    const BASE_URL = "https://app-dev.melyia.com";

    // Test HTML pour extraire assets
    const htmlResponse = await axios.get(`${BASE_URL}/index-app.html`);
    const cssMatch = htmlResponse.data.match(/\/assets\/[^"]+\.css/);
    const jsMatch = htmlResponse.data.match(/\/assets\/[^"]+\.js/);

    // Test CSS
    if (cssMatch) {
      const cssResponse = await axios.get(`${BASE_URL}${cssMatch[0]}`, {
        validateStatus: (status) => status < 500,
      });
      console.log(`CSS: ${cssResponse.status} - ${cssMatch[0]}`);

      if (cssResponse.status === 200) {
        console.log("✅ CSS accessible");
      } else if (cssResponse.status === 403) {
        console.log("❌ CSS bloqué - Permissions encore problématiques");
      }
    }

    // Test JS
    if (jsMatch) {
      const jsResponse = await axios.get(`${BASE_URL}${jsMatch[0]}`, {
        validateStatus: (status) => status < 500,
      });
      console.log(`JS: ${jsResponse.status} - ${jsMatch[0]}`);

      if (jsResponse.status === 200) {
        console.log("✅ JS accessible");
      } else if (jsResponse.status === 403) {
        console.log("❌ JS bloqué - Permissions encore problématiques");
      }
    }
  } catch (httpError) {
    console.log("❌ Erreur HTTP:", httpError.message);
  }

  console.log("\n🎯 RÉSOLUTION TERMINÉE");
  console.log("📱 Testez maintenant: https://app-dev.melyia.com");
  console.log("⏱️ Temps total: ~5 minutes vs 2 heures avec méthode cache");
}

resolutionInterfaceBlanche().catch(console.error);
```

## 📋 **CHECKLIST RÉSOLUTION INTERFACE BLANCHE**

### **✅ Étapes obligatoires (ordre strict) :**

1. **[ ] Test SSH basique** : `ssh -i "clé" ubuntu@server "echo 'OK'"`
2. **[ ] Diagnostic structure** : `ssh -i "clé" ubuntu@server "sudo ls -la /var/www/melyia/app-dev/"`
3. **[ ] Diagnostic assets** : `ssh -i "clé" ubuntu@server "sudo ls -la /var/www/melyia/app-dev/assets/"`
4. **[ ] Identifier permissions** : Chercher `drwx------` (problème) vs `drwxr-xr-x` (OK)
5. **[ ] Correction permissions** : `sudo chmod 755 assets && sudo chmod 644 assets/*`
6. **[ ] Test HTTP CSS/JS** : Status 200 = OK, 403 = encore bloqué, 404 = manquant
7. **[ ] Validation interface** : Tester https://app-dev.melyia.com

### **🚫 Interdictions absolues :**

- **[ ] ❌ Supposer SSH ne fonctionne pas** sans test
- **[ ] ❌ Cache-busting** ou force refresh navigateur
- **[ ] ❌ Redéploiements multiples** sans diagnostic
- **[ ] ❌ Modifications headers cache** Nginx
- **[ ] ❌ Perte de temps** sur suppositions cache

### **⏱️ Temps de résolution :**

- **Méthode correcte (SSH + permissions)** : 5 minutes
- **Méthode incorrecte (cache + redéploiements)** : 2+ heures

## 🎯 **INTÉGRATION CURSORRULES**

**Cette section DOIT être ajoutée dans `.cursorrules` principal pour éviter de reproduire cette perte de temps.**

**Priorité 1** : SSH fonctionne toujours
**Priorité 2** : Interface blanche = permissions serveur
**Priorité 3** : Diagnostic puis correction, pas suppositions
