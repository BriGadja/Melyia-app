# Melyia - Application Dentaire avec IA

## Architecture Multi-Machines

Cette configuration permet de developper sur votre **PC fixe** et votre **portable** avec synchronisation automatique via Git, tout en partageant le meme backend serveur.

## Quick Start

### Setup Initial (une seule fois)

**PC Fixe:**
1. .\setup-git-melyia.ps1 (ce script)
2. .\setup\setup-ssh-multi.ps1
3. Configurer repository distant
4. git push -u origin main

**Portable:**
1. git clone [repo-url] melyia
2. Copier dossier portable-setup depuis PC fixe
3. .\setup\setup-portable.ps1

### Workflow Quotidien

**Changement de machine:**
`powershell
# Avant de partir (PC fixe)
.\dev\sync-and-push.ps1 "Fin journee bureau"

# En arrivant (portable)  
git pull origin main
.\dev\start-dev.ps1
`

**Developpement normal:**
`powershell
# Sur n'importe quelle machine
.\dev\start-dev.ps1    # Demarrage env complet
# ... developpement ...
.\dev\sync-and-push.ps1 "Feature terminee"
`

## Scripts Disponibles

- setup-git-melyia.ps1 - Configuration Git initiale (PC fixe)
- setup/setup-ssh-multi.ps1 - Configuration SSH multi-machines (PC fixe)
- setup/setup-portable.ps1 - Setup portable (portable)
- dev/start-dev.ps1 - Demarrage developpement (PC fixe + portable)
- dev/sync-and-push.ps1 - Synchronisation rapide (PC fixe + portable)
- config/configure-cursor-ssh.ps1 - Configuration Cursor (PC fixe + portable)

## Stack Technique

**Frontend:** React + TypeScript + Vite + Tailwind CSS
**Backend:** Node.js + Express + PostgreSQL + pgvector  
**IA:** Ollama (local)
**Deploiement:** Scripts automatises
**SSH:** Cles dediees par machine
