# 🚀 OPTIMISATIONS CHATBOT - PERFORMANCE SUB-10 SECONDES

## 📊 SITUATION INITIALE

- **Problème**: Temps de réponse > 1 minute (83 secondes observés)
- **Objectif**: Passer sous les 10 secondes
- **Architecture**: Ollama + llama3.2:3b + Express + React

## ⚡ OPTIMISATIONS IMPLÉMENTÉES

### 1. **API BACKEND (server.js)**

#### 🔧 Simplification de l'intent detection

```javascript
// AVANT: Classification complexe avec 4 catégories
// APRÈS: Classification binaire urgence/général
const messageLower = message.toLowerCase();
let intent = "general";
let isUrgent = false;

if (
  messageLower.includes("urgent") ||
  messageLower.includes("douleur") ||
  messageLower.includes("mal")
) {
  intent = "urgence";
  isUrgent = true;
}
```

#### 📄 Réduction des documents chargés

```javascript
// AVANT: LIMIT 5 documents + 800 caractères par document
// APRÈS: LIMIT 2 documents + 200 caractères par document
const documentsQuery = `
  SELECT id, title, content, document_type, file_name, created_at
  FROM patient_documents
  WHERE patient_id = $1 AND processing_status = 'completed'
  ORDER BY created_at DESC
  LIMIT 2  -- Réduit de 5 à 2
`;
```

#### 🎯 Prompt ultra-compact

```javascript
// AVANT: Prompt complexe >500 caractères avec instructions détaillées
// APRÈS: Prompt minimal <200 caractères
const fullPrompt = `${systemPrompt}

DOSSIER: ${contextPrompt}

QUESTION: ${message}

Réponds en français, max 150 mots, précis et rassurant.

RÉPONSE:`;
```

#### ⚙️ Configuration Ollama optimisée

```javascript
// OPTIMISATIONS CRITIQUES:
{
  model: 'llama3.2:3b',
  keep_alive: "30m",        // 30min au lieu de 24h (économie mémoire)
  options: {
    temperature: 0.2,       // Plus déterministe (0.3 → 0.2)
    top_p: 0.8,             // Plus focalisé (0.9 → 0.8)
    num_predict: 200,       // Limite réponse (400 → 200 tokens)
    num_ctx: 1024,          // Contexte réduit (2048 → 1024)
    stop: ["\n\nQUESTION:", "\n\nDOSSIER:", "RÉPONSE:", "\n---"]
  }
},
timeout: 15000  // 15s au lieu de 5min
```

#### 💾 Sauvegarde asynchrone

```javascript
// AVANT: Sauvegarde bloquante avant la réponse
// APRÈS: Sauvegarde non-bloquante
setImmediate(async () => {
  try {
    await pool.query(/* INSERT conversation */);
  } catch (saveError) {
    console.error("⚠️ Erreur sauvegarde async:", saveError.message);
  }
});
```

### 2. **KEEP-ALIVE OPTIMISÉ**

#### 🔄 Warm-up intelligent

```javascript
// OPTIMISATIONS:
- Prompt minimal: "OK" au lieu de "Hello"
- num_predict: 1 (un seul token)
- timeout: 3s au lieu de 5s
- keep_alive: 30m optimisé
- Retry intelligent avec 3 tentatives
- Fréquence augmentée: 15min au lieu de 1h
```

### 3. **ARCHITECTURE FAST_MODE**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │     Ollama      │
│   React         │────│    Express       │────│   llama3.2:3b   │
│                 │    │                  │    │                 │
│ • Timeout 15s   │    │ • Prompt compact │    │ • keep_alive 30m│
│ • UI optimisée  │    │ • Docs limités   │    │ • ctx réduit    │
│                 │    │ • Save async     │    │ • stop tokens   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📈 GAINS DE PERFORMANCE ATTENDUS

### 🎯 Temps de réponse cibles:

- **Excellent**: ≤ 3 secondes (utilisateur ne remarque pas l'attente)
- **Acceptable**: ≤ 10 secondes (objectif projet)
- **Problématique**: > 10 secondes (nécessite optimisation supplémentaire)

### ⚡ Optimisations spécifiques:

1. **Prompt size**: 500+ caractères → ~150 caractères (**-70%**)
2. **Documents**: 5 docs × 800 chars → 2 docs × 200 chars (**-75%**)
3. **Tokens génération**: 400 → 200 tokens (**-50%**)
4. **Contexte**: 2048 → 1024 tokens (**-50%**)
5. **Timeout**: 300s → 15s (**-95%**)

## 🛠️ SCRIPTS DE TEST

### Test de performance complet:

```bash
node test-chat-performance.js
```

### Test optimisation Ollama:

```bash
node optimize-ollama.js
```

### Déploiement optimisations:

```bash
node deploy-optimizations.js
```

## 📋 MONITORING POST-DÉPLOIEMENT

### 🔍 Métriques à surveiller:

1. **Temps de réponse API chat** (objectif < 10s)
2. **Temps traitement Ollama** (doit être la majorité du temps total)
3. **Taux de succès des requêtes** (>95%)
4. **Utilisation mémoire serveur** (modèle llama3.2:3b = ~4GB)
5. **Charge CPU pendant génération**

### 📊 Commandes de monitoring:

```bash
# Logs temps réel
ssh ubuntu@51.91.145.255 "pm2 logs auth-dev --lines 50"

# Statut système
ssh ubuntu@51.91.145.255 "free -h && htop"

# Test Ollama direct
curl http://51.91.145.255:11434/api/version
```

## 🚨 PLAN DE ROLLBACK

### Si performances dégradées:

```bash
# 1. Restaurer backup
ssh ubuntu@51.91.145.255 "cd /var/www/melyia/server/backend && cp server.js.backup.* server.js"

# 2. Redémarrer PM2
ssh ubuntu@51.91.145.255 "pm2 restart auth-dev"

# 3. Vérifier service
curl https://app-dev.melyia.com/api/health
```

## 🔮 OPTIMISATIONS FUTURES POSSIBLES

### 🧠 Si performances encore insuffisantes:

1. **Modèle plus léger**:

   - Tester `llama3.2:1b` (plus rapide mais moins précis)
   - Ou modèles spécialisés médicaux plus petits

2. **Cache intelligent**:

   - Cache des réponses fréquentes
   - Pré-calcul des contextes patients

3. **Load balancing**:

   - Plusieurs instances Ollama
   - Queue de requêtes avec priorités

4. **Hardware**:
   - GPU dédié pour l'inférence
   - Plus de RAM pour keep-alive permanent

## ✅ VALIDATION DU SUCCÈS

### Critères de succès:

- [ ] Temps moyen < 10 secondes
- [ ] 95% des requêtes sous 15 secondes
- [ ] Aucune dégradation qualité des réponses
- [ ] Système stable sous charge normale
- [ ] Logs sans erreurs critiques

### Tests d'acceptation:

1. **Test utilisateur final**: Dialogue naturel via interface web
2. **Test de charge**: 5 utilisateurs simultanés
3. **Test de robustesse**: 100 requêtes consécutives
4. **Test edge cases**: Prompts très longs, caractères spéciaux

---

**Date de déploiement**: [À compléter]  
**Version**: v2.0 - FAST_MODE  
**Responsable**: Équipe dev Melyia
