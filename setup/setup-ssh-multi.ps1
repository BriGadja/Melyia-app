# Script: setup/setup-ssh-multi.ps1
# Description: Configuration SSH pour PC fixe + portable
# Machine: PC FIXE

Write-Host "🔑 Configuration SSH Multi-Machines Melyia..." -ForegroundColor Green

# 1. Vérifier OpenSSH
Write-Host "`n🔍 Vérification OpenSSH..." -ForegroundColor Yellow
if (!(Get-WindowsCapability -Online | Where-Object Name -like "OpenSSH.Client*").State -eq "Installed") {
    Write-Host "📦 Installation OpenSSH Client..." -ForegroundColor Yellow
    try {
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
        Write-Host "✅ OpenSSH Client installé" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur installation OpenSSH. Installez manuellement depuis Paramètres Windows" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ OpenSSH Client déjà installé" -ForegroundColor Green
}

# 2. Configuration dossier SSH
$sshDir = "$env:USERPROFILE\.ssh"
Write-Host "`n📁 Configuration dossier SSH..." -ForegroundColor Yellow

if (!(Test-Path $sshDir)) {
    New-Item -Path $sshDir -ItemType Directory -Force | Out-Null
    Write-Host "✅ Dossier .ssh créé: $sshDir" -ForegroundColor Green
} else {
    Write-Host "✅ Dossier .ssh existant: $sshDir" -ForegroundColor Green
}

# 3. Générer clés SSH
Write-Host "`n🔐 Génération clés SSH..." -ForegroundColor Yellow

# Clé SSH principale (PC fixe)
$keyPath = "$sshDir\melyia_main"
if (!(Test-Path $keyPath)) {
    Write-Host "🔑 Génération clé SSH principale (PC fixe)..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -C "melyia-main@$(hostname)" -f $keyPath -N '""'
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Clé SSH principale générée: $keyPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur génération clé principale" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Clé SSH principale existante: $keyPath" -ForegroundColor Green
}

# Clé SSH portable
$portableKeyPath = "$sshDir\melyia_portable"
if (!(Test-Path $portableKeyPath)) {
    Write-Host "💻 Génération clé SSH portable..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -C "melyia-portable@multidevice" -f $portableKeyPath -N '""'
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Clé SSH portable générée: $portableKeyPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur génération clé portable" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Clé SSH portable existante: $portableKeyPath" -ForegroundColor Green
}

# 4. Configuration SSH complète
Write-Host "`n⚙️ Configuration SSH..." -ForegroundColor Yellow
$configPath = "$sshDir\config"

# Backup config existant
if (Test-Path $configPath) {
    $backupPath = "$configPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $configPath $backupPath
    Write-Host "💾 Backup config SSH: $backupPath" -ForegroundColor Yellow
}

$configContent = @"
# Configuration SSH Melyia - Multi-Machines
# Générée le $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# ================================================
# MELYIA BACKEND - Configuration PC Fixe
# ================================================
Host melyia-backend
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_main
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ForwardAgent yes
    StrictHostKeyChecking accept-new
    UserKnownHostsFile ~/.ssh/known_hosts
    LogLevel INFO

# ================================================
# MELYIA BACKEND - Configuration Portable
# ================================================
Host melyia-portable
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_portable
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ForwardAgent yes
    StrictHostKeyChecking accept-new
    UserKnownHostsFile ~/.ssh/known_hosts
    LogLevel INFO

# ================================================
# RACCOURCIS UTILES
# ================================================

# Monitoring rapide
Host melyia-monitor
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_main
    RemoteCommand ./melyia-monitor.sh
    RequestTTY yes

# Logs en temps réel
Host melyia-logs
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_main
    RemoteCommand "tail -f /var/log/nginx/access.log | grep melyia"
    RequestTTY yes

# Accès PostgreSQL
Host melyia-db
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_main
    RemoteCommand "sudo -u postgres psql melyia_dev"
    RequestTTY yes
"@

$configContent | Out-File -FilePath $configPath -Encoding UTF8 -Force
Write-Host "✅ Configuration SSH mise à jour: $configPath" -ForegroundColor Green

# 5. Définir permissions SSH (Windows)
Write-Host "`n🔒 Configuration permissions SSH..." -ForegroundColor Yellow
try {
    # Permissions dossier SSH
    icacls $sshDir /inheritance:r | Out-Null
    icacls $sshDir /grant:r "$env:USERNAME:(OI)(CI)F" | Out-Null
    
    # Permissions clés privées
    icacls $keyPath /inheritance:r | Out-Null
    icacls $keyPath /grant:r "$env:USERNAME:R" | Out-Null
    icacls $portableKeyPath /inheritance:r | Out-Null
    icacls $portableKeyPath /grant:r "$env:USERNAME:R" | Out-Null
    
    # Permissions config
    icacls $configPath /inheritance:r | Out-Null
    icacls $configPath /grant:r "$env:USERNAME:R" | Out-Null
    
    Write-Host "✅ Permissions SSH configurées" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Attention: Erreur configuration permissions SSH" -ForegroundColor Yellow
    Write-Host "Les clés peuvent fonctionner mais avec un avertissement" -ForegroundColor Yellow
}

# 6. Créer package pour portable
Write-Host "`n📦 Création package portable..." -ForegroundColor Yellow
$portableSetup = "$env:USERPROFILE\Desktop\melyia-portable-setup"

if (Test-Path $portableSetup) {
    Remove-Item $portableSetup -Recurse -Force
}
New-Item -Path $portableSetup -ItemType Directory -Force | Out-Null

# Copier fichiers nécessaires pour portable
Copy-Item "$portableKeyPath" "$portableSetup\"
Copy-Item "$portableKeyPath.pub" "$portableSetup\"

# Créer config SSH adapté pour portable
$portableConfig = @"
# Configuration SSH Melyia - PORTABLE
# À copier dans ~/.ssh/config sur le portable

Host melyia-backend
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_portable
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ForwardAgent yes
    StrictHostKeyChecking accept-new
    UserKnownHostsFile ~/.ssh/known_hosts

# Raccourcis
Host melyia-monitor
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_portable
    RemoteCommand ./melyia-monitor.sh
    RequestTTY yes

Host melyia-logs
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_portable
    RemoteCommand "tail -f /var/log/nginx/access.log | grep melyia"
    RequestTTY yes
"@

$portableConfig | Out-File -FilePath "$portableSetup\ssh-config-portable" -Encoding UTF8

# 7. Créer script setup pour portable
$portableScript = @"
# Script: setup-portable.ps1
# Description: Configuration SSH Melyia sur ordinateur portable
# Machine: PORTABLE

Write-Host "💻 Setup Melyia sur ordinateur portable..." -ForegroundColor Green

# 1. Vérifier OpenSSH
if (!(Get-WindowsCapability -Online | Where-Object Name -like "OpenSSH.Client*").State -eq "Installed") {
    Write-Host "📦 Installation OpenSSH Client..." -ForegroundColor Yellow
    Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
}

# 2. Créer dossier SSH
$sshDir = "$env:USERPROFILE\.ssh"
New-Item -Path $sshDir -ItemType Directory -Force | Out-Null

# 3. Copier les clés SSH
if (Test-Path "melyia_portable") {
    Copy-Item "melyia_portable" "$sshDir\"
    Copy-Item "melyia_portable.pub" "$sshDir\"
    Write-Host "✅ Clés SSH copiées" -ForegroundColor Green
} else {
    Write-Host "❌ Fichiers clés SSH non trouvés dans le dossier actuel" -ForegroundColor Red
    exit 1
}

# 4. Copier configuration SSH
if (Test-Path "ssh-config-portable") {
    Copy-Item "ssh-config-portable" "$sshDir\config"
    Write-Host "✅ Configuration SSH copiée" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier configuration SSH non trouvé" -ForegroundColor Red
    exit 1
}

# 5. Permissions Windows
try {
    icacls $sshDir /inheritance:r | Out-Null
    icacls $sshDir /grant:r "$env:USERNAME:(OI)(CI)F" | Out-Null
    icacls "$sshDir\melyia_portable" /inheritance:r | Out-Null
    icacls "$sshDir\melyia_portable" /grant:r "$env:USERNAME:R" | Out-Null
    icacls "$sshDir\config" /inheritance:r | Out-Null
    icacls "$sshDir\config" /grant:r "$env:USERNAME:R" | Out-Null
    Write-Host "✅ Permissions configurées" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Attention permissions SSH" -ForegroundColor Yellow
}

# 6. Test connexion
Write-Host "`n🧪 Test connexion SSH..." -ForegroundColor Yellow
ssh -o ConnectTimeout=10 melyia-backend 'echo "✅ SSH portable opérationnel !"'

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Setup portable terminé avec succès !" -ForegroundColor Green
    Write-Host "📋 Vous pouvez maintenant:" -ForegroundColor Cyan
    Write-Host "  1. Cloner le repository Git Melyia" -ForegroundColor White
    Write-Host "  2. Exécuter: .\dev\start-dev.ps1" -ForegroundColor White
    Write-Host "  3. Développer depuis votre portable !" -ForegroundColor White
} else {
    Write-Host "❌ Problème de connexion SSH" -ForegroundColor Red
    Write-Host "Vérifiez que les clés ont été ajoutées sur le serveur" -ForegroundColor Yellow
}
"@

$portableScript | Out-File -FilePath "$portableSetup\setup-portable.ps1" -Encoding UTF8

# 8. Instructions serveur
Write-Host "`n📝 Génération instructions serveur..." -ForegroundColor Yellow

# Récupérer les clés publiques
$mainPublicKey = Get-Content "$keyPath.pub" -Raw
$portablePublicKey = Get-Content "$portableKeyPath.pub" -Raw

# Script pour le serveur
$serverScript = @"
#!/bin/bash
# Script: add-keys-server.sh
# Description: Ajouter clés SSH Melyia sur le serveur
# Machine: SERVEUR (51.91.145.255)

echo "🔑 Ajout clés SSH Melyia multi-machines..."

# Créer dossier SSH si nécessaire
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Backup authorized_keys existant
if [ -f ~/.ssh/authorized_keys ]; then
    cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup.\$(date +%Y%m%d_%H%M%S)
    echo "💾 Backup créé: ~/.ssh/authorized_keys.backup.\$(date +%Y%m%d_%H%M%S)"
fi

# Ajouter clé PC fixe
echo '$($mainPublicKey.Trim())' >> ~/.ssh/authorized_keys
echo "✅ Clé PC fixe ajoutée"

# Ajouter clé portable
echo '$($portablePublicKey.Trim())' >> ~/.ssh/authorized_keys
echo "✅ Clé portable ajoutée"

# Nettoyer doublons et définir permissions
sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

echo ""
echo "🎉 Configuration serveur terminée !"
echo "📋 Tests disponibles:"
echo "  • Depuis PC fixe: ssh melyia-backend"
echo "  • Depuis portable: ssh melyia-backend"
echo "  • Monitoring: ssh melyia-monitor"
echo "  • Logs: ssh melyia-logs"
"@

$serverScript | Out-File -FilePath "$portableSetup\add-keys-server.sh" -Encoding UTF8

# 9. Instructions complètes
$instructions = @"
# 📋 INSTRUCTIONS CONFIGURATION SSH MULTI-MACHINES

## 🎯 Étapes à suivre

### 1. 🖥️ Sur le serveur (51.91.145.255)
```bash
# Connectez-vous au serveur
ssh ubuntu@51.91.145.255

# Téléchargez et exécutez le script
# (Copiez le contenu de add-keys-server.sh et exécutez-le)
chmod +x add-keys-server.sh
./add-keys-server.sh
```

### 2. 💻 Sur votre ordinateur portable
```powershell
# 1. Copiez tout le dossier portable-setup sur votre portable
# 2. Ouvrez PowerShell dans ce dossier  
# 3. Exécutez:
.\setup-portable.ps1
```

### 3. 🧪 Tests de connexion
```powershell
# Depuis PC fixe
ssh melyia-backend

# Depuis portable  
ssh melyia-backend

# Monitoring rapide
ssh melyia-monitor

# Logs en temps réel
ssh melyia-logs
```

## 🔑 Clés générées

**PC Fixe:** $keyPath
**Portable:** $portableKeyPath

## 📞 En cas de problème

1. Vérifiez que les clés sont bien ajoutées sur le serveur
2. Testez la connexion: ssh -v melyia-backend  
3. Vérifiez les permissions des clés SSH
4. Consultez les logs SSH: ssh -vvv melyia-backend

## ✅ Une fois configuré

Vous pourrez utiliser:
- .\dev\start-dev.ps1 (démarrage développement)
- .\dev\sync-and-push.ps1 (synchronisation)  
- ssh melyia-monitor (monitoring serveur)
"@

$instructions | Out-File -FilePath "$portableSetup\INSTRUCTIONS.md" -Encoding UTF8

Write-Host "✅ Package portable créé: $portableSetup" -ForegroundColor Green

# 10. Affichage final
Write-Host "`n🔑 CLÉS SSH GÉNÉRÉES:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🖥️ CLÉ PC FIXE (melyia-backend):" -ForegroundColor Yellow
Write-Host $mainPublicKey -ForegroundColor White
Write-Host "💻 CLÉ PORTABLE (melyia-backend):" -ForegroundColor Yellow  
Write-Host $portablePublicKey -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n📦 FICHIERS CRÉÉS:" -ForegroundColor Cyan
Write-Host "✅ $configPath" -ForegroundColor White
Write-Host "✅ $keyPath" -ForegroundColor White
Write-Host "✅ $portableKeyPath" -ForegroundColor White
Write-Host "✅ $portableSetup\" -ForegroundColor White

Write-Host "`n📋 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "1. 🖥️ Connectez-vous au serveur: ssh ubuntu@51.91.145.255" -ForegroundColor White
Write-Host "2. 📝 Exécutez le script: add-keys-server.sh (dans portable-setup/)" -ForegroundColor White  
Write-Host "3. 🧪 Testez depuis PC fixe: ssh melyia-backend" -ForegroundColor White
Write-Host "4. 💻 Copiez portable-setup/ sur votre portable" -ForegroundColor White
Write-Host "5. 💻 Exécutez setup-portable.ps1 sur le portable" -ForegroundColor White

Write-Host "`n💡 CONSEIL:" -ForegroundColor Cyan
Write-Host "Copiez ce dossier sur une clé USB pour l'installer sur le portable:" -ForegroundColor White
Write-Host "$portableSetup" -ForegroundColor Cyan

Write-Host "`n🎉 Configuration SSH multi-machines terminée !" -ForegroundColor Green