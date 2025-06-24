# 🏗️ ARCHITECTURE COMPLÈTE - MELYIA v26.0

> **Mise à jour** : 2025-01-24  
> **Environnement** : Production + Développement  
> **Status** : ✅ Opérationnel avec corrections admin

---

## 🌐 INFRASTRUCTURE SERVEUR

### 🖥️ **Serveur Production**

- **IP** : 51.91.145.255
- **OS** : Ubuntu 22.04 LTS
- **Provider** : OVH
- **SSL** : Let's Encrypt (auto-renewal)
- **Monitoring** : PM2 + logs centralisés

### 🔧 **Services Système**

```
🔹 Nginx (Reverse Proxy + SSL)
  ├── melyia.com (Landing)
  ├── app-dev.melyia.com (Application)
  └── dev.melyia.com (Développement)

🔹 PM2 (Process Manager)
  └── melyia-auth-dev (Port 8083)

🔹 PostgreSQL 15
  ├── Base: melyia_dev
  ├── User: melyia_user
  └── Extension: pgvector

🔹 Ollama (IA Locale)
  ├── Model: llama3.2:3b
  ├── Port: 11434
  └── Keep-alive: 30 minutes
```

---

## 🎯 ARCHITECTURE APPLICATIVE

### 📱 **Frontend React (Vite)**

```
client/
├── index-app.html          # Point d'entrée application
├── index-landing.html      # Point d'entrée landing
└── src/
    ├── app/               # Application principale
    │   ├── pages/
    │   │   ├── admin/     # Dashboard admin ✅
    │   │   ├── dentist/   # Interface dentiste
    │   │   └── patient/   # Interface patient
    │   └── components/
    │       ├── chatbot/   # Chat IA
    │       └── upload/    # Upload documents
    ├── landing/           # Page d'accueil
    └── shared/            # Composants partagés
```

### 🔗 **Backend Express (Node.js)**

```
server/backend/server.js   # Serveur principal (1628 lignes)
├── Auth (JWT)             # /api/auth/*
├── Patients              # /api/patients
├── Documents             # /api/documents/*
├── Chat IA               # /api/chat
├── Admin APIs ✅         # /api/admin/*
└── Webhook Deploy        # /hooks/deploy
```

### 🗄️ **Base de Données PostgreSQL**

```
melyia_dev
├── users (table principale)
├── admin_profiles ✅ (+ access_level, updated_at)
├── dentist_profiles ✅ (+ practice_name, specializations)
├── patient_profiles ✅ (+ birth_date, emergency_contact)
├── patient_documents ✅ (+ 8 colonnes)
├── chat_conversations ✅ (+ métadonnées IA)
├── waitlist
└── admin_stats (vue) ✅ (9 colonnes)
```

---

## 🤖 INTELLIGENCE ARTIFICIELLE

### 🧠 **Ollama Local**

- **Modèle** : llama3.2:3b (3 milliards de paramètres)
- **Architecture** : DIRECT_OLLAMA_KEEPALIVE
- **Endpoint** : http://127.0.0.1:11434
- **Optimisations** :
  - Keep-alive : 30 minutes
  - Timeout : 15 secondes
  - Contexte : 1024 tokens
  - Réponse : 200 tokens max

### 💬 **Pipeline Chat**

```
Frontend → Backend → Ollama → PostgreSQL
    ↓         ↓         ↓         ↓
Interface  Context   Réponse  Sauvegarde
Patient   Documents    IA      Historique
```

---

## 🔄 WORKFLOW DÉVELOPPEMENT

### 🛠️ **Développement Local**

```bash
# Frontend (Port 5173)
npm run dev

# Proxy automatique
/api/* → https://app-dev.melyia.com
```

### 🚀 **Déploiement**

```bash
# Build + Deploy automatique
npm run deploy:full

# Webhook intelligent
POST /hooks/deploy
├── Détection type fichier
├── Structure assets/ automatique
└── Permissions Ubuntu
```

---

## 🔐 SÉCURITÉ & AUTHENTICATION

### 🎫 **JWT Authentication**

- **Secret** : Configuré via environnement
- **Durée** : 7 jours
- **Middleware** : Protection toutes APIs

### 👥 **Rôles Utilisateurs**

```
🔹 admin
  ├── Dashboard complet ✅
  ├── Gestion utilisateurs
  ├── Analytics globales
  └── Supervision documents

🔹 dentist
  ├── Patients assignés
  ├── Upload documents
  ├── Chat IA médical
  └── Tableaux de bord

🔹 patient
  ├── Profil personnel
  ├── Documents médicaux
  ├── Chat assistance
  └── Historique soins
```

---

## 📊 APIS BACKEND DISPONIBLES

### 🔓 **Authentification**

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/verify` - Vérification token

### 👑 **Administration** ✅

- `GET /api/admin/stats` - Statistiques (9 colonnes)
- `GET /api/admin/users` - Liste utilisateurs
- `GET /api/admin/documents` - Documents globaux
- `GET /api/admin/conversations` - Historique chat
- `DELETE /api/admin/users/:id` - Suppression utilisateur

### 🏥 **Fonctionnel**

- `GET /api/patients` - Liste patients (dentistes)
- `POST /api/documents/upload` - Upload documents
- `POST /api/chat` - Chat IA optimisé
- `GET /api/health` - État services

### 🔧 **Système**

- `POST /hooks/deploy` - Déploiement automatique
- `POST /api/admin/init-tables` - Initialisation BDD

---

## 🧪 COMPTES DE TEST

### 👑 **Admin Principal**

- **Email** : brice@melyia.com
- **Password** : password
- **URL** : http://localhost:5173/admin/dashboard

### 🦷 **Dentiste Test**

- **Email** : dentiste@melyia.com
- **Password** : test123

### 🧑‍⚕️ **Patient Test**

- **Email** : patient@melyia.com
- **Password** : test123

---

## 📈 PERFORMANCE & MONITORING

### ⚡ **Optimisations v26.0**

- **Index PostgreSQL** : 7 index de performance
- **Ollama Keep-alive** : Modèle pré-chargé 30min
- **Requêtes SQL** : Simplifiées pour admin
- **Vue admin_stats** : Calculée temps réel

### 📊 **Métriques Surveillées**

- Temps réponse APIs admin
- Performance vue admin_stats
- Logs PM2 erreurs
- Espace disque documents
- Sessions utilisateurs actives

---

## 🔄 STATUT ACTUEL (v26.0)

### ✅ **Fonctionnel**

- ✅ Dashboard admin opérationnel
- ✅ Structure PostgreSQL cohérente
- ✅ APIs admin sans erreur
- ✅ Chat IA optimisé
- ✅ Déploiement automatique

### 🔧 **En cours d'amélioration**

- 📝 Documentation audit complète
- 🧪 Tests automatisés étendus
- 📊 Monitoring avancé

### 🎯 **Prochaines étapes**

- Extension pgvector optimisée
- Interface dentiste avancée
- Module de facturation
- API mobile (future)

---

> **📝 Note** : Architecture synchronisée avec `.cursorrules` v26.0 et corrections admin du 2025-01-24
