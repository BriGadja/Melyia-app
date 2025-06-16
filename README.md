# 🦷 Melyia - Application SaaS Dentaire avec IA

> Application complète pour dentistes et patients avec chatbot IA local (Ollama)

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.14.0-green)

## 🏗️ Architecture
Melyia-app/
├── client/src/
│   ├── shared/        # Design System (45+ composants Radix UI)
│   ├── landing/       # Page d'accueil marketing
│   └── app/           # Application authentifiée
├── Infrastructure/    # Backend Express + PostgreSQL + Ollama
└── Scripts/          # Déploiement automatisé

## 🚀 Environnements

| Environnement | Frontend | Backend | Status |
|---------------|----------|---------|--------|
| **Développement** | localhost:5173 | app-dev.melyia.com | ✅ Opérationnel |
| **Staging** | dev.melyia.com | app-dev.melyia.com | ✅ Opérationnel |
| **Production** | melyia.com | app.melyia.com | 🔄 En préparation |

## 🛠️ Technologies

### Frontend
- **React 18** + TypeScript + Vite
- **Radix UI** + Tailwind CSS + Framer Motion
- **TanStack Query** + React Router + Wouter
- **45+ composants UI** réutilisables

### Backend
- **Node.js** + Express + JWT Authentication
- **PostgreSQL 15** + pgvector pour IA
- **Ollama** (LLM local) pour chatbot médical
- **PM2** pour gestion processus

## 🏃‍♂️ Démarrage Rapide

```bash
# Cloner le repository
git clone https://github.com/BriGadja/Melyia-app.git
cd Melyia-app

# Installer les dépendances
npm install

# Variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec tes valeurs

# Démarrer en mode développement
npm run dev:app          # Application auth
npm run dev:landing      # Page d'accueil
🎯 Fonctionnalités
✅ Implémentées

 Authentification JWT complète (login/register)
 Dashboards par rôle (dentiste/patient)
 Upload documents médicaux sécurisé
 Chatbot IA local avec Ollama
 Design System médical professionnel
 Déploiement automatisé vers infrastructure

�� En Cours

 Interface admin chatbot
 Analytics conversations
 Templates réponses prédéfinies
 CI/CD GitHub Actions

🏥 Conformité Médicale
Sécurité HDS

✅ 100% local - Aucune API externe
✅ Chiffrement données au repos et en transit
✅ Audit trail complet des conversations
✅ Anonymisation automatique données sensibles

📞 Contact
Développeur : Brice (BriGadja)
Assistance IA : Claude (Anthropic)
Infrastructure : Le Petit-Quevilly, Normandy, FR
