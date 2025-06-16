# 🦷 Melyia - Application SaaS Dentaire avec IA

> Application complète pour dentistes et patients avec chatbot IA local (Ollama)

[![Deploy Status](https://github.com/BriGadja/Melyia-app/workflows/🚀%20Deploy%20Melyia%20to%20Staging/badge.svg)](https://github.com/BriGadja/Melyia-app/actions)
[![Tests](https://github.com/BriGadja/Melyia-app/workflows/🧪%20Tests%20&%20Quality/badge.svg)](https://github.com/BriGadja/Melyia-app/actions)

## 🌐 Environnements Live

| Environnement    | URL                        | Status    | Deploy                                                       |
| ---------------- | -------------------------- | --------- | ------------------------------------------------------------ |
| **Landing Page** | https://dev.melyia.com     | ✅ Auto   | ![Deploy](https://img.shields.io/badge/deploy-auto-green)    |
| **Application**  | https://app-dev.melyia.com | ✅ Auto   | ![Deploy](https://img.shields.io/badge/deploy-auto-green)    |
| **Production**   | https://melyia.com         | 🔄 Manuel | ![Deploy](https://img.shields.io/badge/deploy-manual-yellow) |

## 🚀 Architecture

Melyia-app/
├── 🎨 Frontend (React 18 + TypeScript)
│ ├── client/src/landing/ # Page marketing
│ ├── client/src/app/ # Application auth
│ └── client/src/shared/ # Design System (45+ composants)
├── 🔧 Backend (Node.js + Express)
│ ├── Authentication JWT # Login/Register
│ ├── PostgreSQL + pgvector # Base données + IA
│ └── Ollama Integration # Chatbot local
└── 🚀 Infrastructure
├── PM2 Process Manager # Services backend
├── Nginx + SSL # Reverse proxy
└── GitHub Actions # CI/CD automatique

## 📊 Métriques Techniques

- **Performance IA** : < 3s réponses chatbot
- **Build Time** : < 30s (Landing + App)
- **Bundle Size** : ~217KB JS optimisé
- **Components** : 45+ composants React réutilisables
- **Security** : 100% local, conformité HDS

## 🏃‍♂️ Développement Local

````bash
# Installation
git clone https://github.com/BriGadja/Melyia-app.git
cd Melyia-app
npm install

# Configuration
cp .env.example .env.local
# Éditer .env.local avec tes tokens

# Développement
npm run dev:landing    # http://localhost:5173 (landing)
npm run dev:app        # http://localhost:5173 (app)

# Déploiement
git push origin main   # → Auto-deploy vers staging
🎯 Fonctionnalités
✅ Opérationnelles

 Authentification JWT complète (dentiste/patient)
 Dashboards par rôle avec navigation intelligente
 Upload documents médicaux multi-formats
 Chatbot IA local avec Ollama (réponses <3s)
 Design System médical professionnel
 CI/CD automatique GitHub → Infrastructure

🔄 En Développement

 Interface admin configuration chatbot
 Analytics conversations temps réel
 Templates réponses prédéfinies
 Streaming réponses WebSocket

🏥 Conformité Médicale
Sécurité HDS ✅

100% local - Aucune API externe
Audit trail complet conversations
Chiffrement données sensibles
Anonymisation automatique

Infrastructure ✅

Uptime > 99.9% validé
SSL multi-domaines auto-renouvelé
Monitoring temps réel
Sauvegarde automatique

🛠️ Stack Technique
ComposantTechnologieVersionStatusFrontendReact + TypeScript18.3.1✅BuildVite5.4.19✅UIRadix UI + TailwindLatest✅BackendExpress + JWT4.21.2✅DatabasePostgreSQL + pgvector15.13✅IAOllama (llama3.2:3b)Local✅InfrastructureUbuntu + Nginx + PM225.04✅
📞 Contact & Support
Développeur : Brice (@BriGadja)
Assistant IA : Claude (Anthropic)
Infrastructure : Le Petit-Quevilly, Normandy, FR


🤖 Note pour Claude : Repository public pour assistance développement. Code backend sur infrastructure dédiée.
'@ | Out-File -FilePath "README.md" -Encoding UTF8 -Force


## **📤 Commit et Activation CI/CD**

```powershell
# Ajouter les nouveaux fichiers
git add .

# Commit avec les workflows
git commit -m "🚀 Setup CI/CD GitHub Actions + Documentation

✅ Workflows automatiques:
  - Deploy staging sur push main
  - Tests qualité sur PR
  - Notifications déploiement

✅ Documentation GitHub:
  - README avec badges status
  - Métriques techniques live
  - Instructions développement

✅ Configuration secrets:
  - WEBHOOK_TOKEN pour déploiement auto
  - Variables environnement CI/CD

🎯 Prêt pour développement automatisé!"

# Push pour activer les workflows
git push origin main
````
