# Script: setup/setup-ssh-multi-CLEAN.ps1
# Description: Configuration SSH pour PC fixe + portable
# Machine: PC FIXE

Write-Host "Configuration SSH Multi-Machines Melyia..." -ForegroundColor Green

# 1. Verifier OpenSSH
Write-Host ""
Write-Host "Verification OpenSSH..." -ForegroundColor Yellow
if (!(Get-WindowsCapability -Online | Where-Object Name -like "OpenSSH.Client*").State -eq "Installed") {
    Write-Host "Installation OpenSSH Client..." -ForegroundColor Yellow
    try {
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
        Write-Host "OpenSSH Client installe" -ForegroundColor Green
    } catch {
        Write-Host "Erreur installation OpenSSH. Installez manuellement depuis Parametres Windows" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OpenSSH Client deja installe" -ForegroundColor Green
}

# 2. Configuration dossier SSH
$sshDir = "$env:USERPROFILE\.ssh"
Write-Host ""
Write-Host "Configuration dossier SSH..." -ForegroundColor Yellow

if (!(Test-Path $sshDir)) {
    New-Item -Path $sshDir -ItemType Directory -Force | Out-Null
    Write-Host "Dossier .ssh cree: $sshDir" -ForegroundColor Green
} else {
    Write-Host "Dossier .ssh existant: $sshDir" -ForegroundColor Green
}

# 3. Generer cles SSH
Write-Host ""
Write-Host "Generation cles SSH..." -ForegroundColor Yellow

# Cle SSH principale (PC fixe)
$keyPath = "$sshDir\melyia_main"
if (!(Test-Path $keyPath)) {
    Write-Host "Generation cle SSH principale (PC fixe)..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -C "melyia-main@$(hostname)" -f $keyPath -N '""'
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Cle SSH principale generee: $keyPath" -ForegroundColor Green
    } else {
        Write-Host "Erreur generation cle principale" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Cle SSH principale existante: $keyPath" -ForegroundColor Green
}

# Cle SSH portable
$portableKeyPath = "$sshDir\melyia_portable"
if (!(Test-Path $portableKeyPath)) {
    Write-Host "Generation cle SSH portable..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -C "melyia-portable@multidevice" -f $portableKeyPath -N '""'
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Cle SSH portable generee: $portableKeyPath" -ForegroundColor Green
    } else {
        Write-Host "Erreur generation cle portable" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Cle SSH portable existante: $portableKeyPath" -ForegroundColor Green
}

# 4. Configuration SSH complete
Write-Host ""
Write-Host "Configuration SSH..." -ForegroundColor Yellow
$configPath = "$sshDir\config"

# Backup config existant
if (Test-Path $configPath) {
    $backupPath = "$configPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $configPath $backupPath
    Write-Host "Backup config SSH: $backupPath" -ForegroundColor Yellow
}

$configContent = @"
# Configuration SSH Melyia - Multi-Machines
# Generee le $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# MELYIA BACKEND - Configuration PC Fixe
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

# MELYIA BACKEND - Configuration Portable
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

# RACCOURCIS UTILES
# Monitoring rapide
Host melyia-monitor
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_main
    RemoteCommand ./melyia-monitor.sh
    RequestTTY yes

# Logs en temps reel
Host melyia-logs
    HostName 51.91.145.255
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/melyia_main
    RemoteCommand "tail -f /var/log/nginx/access.log | grep melyia"
    RequestTTY yes
"@

$configContent | Out-File -FilePath $configPath -Encoding UTF8 -Force
Write-Host "Configuration SSH mise a jour: $configPath" -ForegroundColor Green

# 5. Definir permissions SSH (Windows)
Write-Host ""
Write-Host "Configuration permissions SSH..." -ForegroundColor Yellow
try {
    # Permissions dossier SSH
    icacls $sshDir /inheritance:r | Out-Null
    icacls $sshDir /grant:r "$env:USERNAME:(OI)(CI)F" | Out-Null
    
    # Permissions cles privees
    icacls $keyPath /inheritance:r | Out-Null
    icacls $keyPath /grant:r "$env:USERNAME:R" | Out-Null
    icacls $portableKeyPath /inheritance:r | Out-Null
    icacls $portableKeyPath /grant:r "$env:USERNAME:R" | Out-Null
    
    # Permissions config
    icacls $configPath /inheritance:r | Out-Null
    icacls $configPath /grant:r "$env:USERNAME:R" | Out-Null
    
    Write-Host "Permissions SSH configurees" -ForegroundColor Green
} catch {
    Write-Host "Attention: Erreur configuration permissions SSH" -ForegroundColor Yellow
    Write-Host "Les cles peuvent fonctionner mais avec un avertissement" -ForegroundColor Yellow
}

# 6. Creer package pour portable
Write-Host ""
Write-Host "Creation package portable..." -ForegroundColor Yellow
$portableSetup = "$env:USERPROFILE\Desktop\melyia-portable-setup"

if (Test-Path $portableSetup) {
    Remove-Item $portableSetup -Recurse -Force
}
New-Item -Path $portableSetup -ItemType Directory -Force | Out-Null

# Copier fichiers necessaires pour portable
Copy-Item "$portableKeyPath" "$portableSetup\"
Copy-Item "$portableKeyPath.pub" "$portableSetup\"

# Creer config SSH adapte pour portable
$portableConfig = @"
# Configuration SSH Melyia - PORTABLE
# A copier dans ~/.ssh/config sur le portable

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

# 7. Creer script setup pour portable
$portableScript = @'
# Script: setup-portable.ps1
# Description: Configuration SSH Melyia sur ordinateur portable
# Machine: PORTABLE

Write-Host "Setup Melyia sur ordinateur portable..." -ForegroundColor Green

# 1. Verifier OpenSSH
if (!(Get-WindowsCapability -Online | Where-Object Name -like "OpenSSH.Client*").State -eq "Installed") {
    Write-Host "Installation OpenSSH Client..." -ForegroundColor Yellow
    Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
}

# 2. Creer dossier SSH
$sshDir = "$env:USERPROFILE\.ssh"
New-Item -Path $sshDir -ItemType Directory -Force | Out-Null

# 3. Copier les cles SSH
if (Test-Path "melyia_portable") {
    Copy-Item "melyia_portable" "$sshDir\"
    Copy-Item "melyia_portable.pub" "$sshDir\"
    Write-Host "Cles SSH copiees" -ForegroundColor Green
} else {
    Write-Host "Fichiers cles SSH non trouves dans le dossier actuel" -ForegroundColor Red
    exit 1
}

# 4. Copier configuration SSH
if (Test-Path "ssh-config-portable") {
    Copy-Item "ssh-config-portable" "$sshDir\config"
    Write-Host "Configuration SSH copiee" -ForegroundColor Green
} else {
    Write-Host "Fichier configuration SSH non trouve" -ForegroundColor Red
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
    Write-Host "Permissions configurees" -ForegroundColor Green
} catch {
    Write-Host "Attention permissions SSH" -ForegroundColor Yellow
}

# 6. Test connexion
Write-Host ""
Write-Host "Test connexion SSH..." -ForegroundColor Yellow
ssh -o ConnectTimeout=10 melyia-backend 'echo "SSH portable operationnel !"'

if ($LASTEXITCODE -eq 0) {
    Write-Host "Setup portable termine avec succes !" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant:" -ForegroundColor Cyan
    Write-Host "  1. Cloner le repository Git Melyia" -ForegroundColor White
    Write-Host "  2. Executer: .\dev\start-dev.ps1" -ForegroundColor White
    Write-Host "  3. Developper depuis votre portable !" -ForegroundColor White
} else {
    Write-Host "Probleme de connexion SSH" -ForegroundColor Red
    Write-Host "Verifiez que les cles ont ete ajoutees sur le serveur" -ForegroundColor Yellow
}
'@

$portableScript | Out-File -FilePath "$portableSetup\setup-portable.ps1" -Encoding UTF8

# 8. Instructions serveur
Write-Host ""
Write-Host "Generation instructions serveur..." -ForegroundColor Yellow

# Recuperer les cles publiques
$mainPublicKey = Get-Content "$keyPath.pub" -Raw
$portablePublicKey = Get-Content "$portableKeyPath.pub" -Raw

# Script pour le serveur
$serverScript = @"
#!/bin/bash
# Script: add-keys-server.sh
# Description: Ajouter cles SSH Melyia sur le serveur
# Machine: SERVEUR (51.91.145.255)

echo "Ajout cles SSH Melyia multi-machines..."

# Creer dossier SSH si necessaire
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Backup authorized_keys existant
if [ -f ~/.ssh/authorized_keys ]; then
    cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup.\$(date +%Y%m%d_%H%M%S)
    echo "Backup cree"
fi

# Ajouter cle PC fixe
echo '$($mainPublicKey.Trim())' >> ~/.ssh/authorized_keys
echo "Cle PC fixe ajoutee"

# Ajouter cle portable
echo '$($portablePublicKey.Trim())' >> ~/.ssh/authorized_keys
echo "Cle portable ajoutee"

# Nettoyer doublons et definir permissions
sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

echo ""
echo "Configuration serveur terminee !"
echo "Tests disponibles:"
echo "  • Depuis PC fixe: ssh melyia-backend"
echo "  • Depuis portable: ssh melyia-backend"
echo "  • Monitoring: ssh melyia-monitor"
echo "  • Logs: ssh melyia-logs"
"@

$serverScript | Out-File -FilePath "$portableSetup\add-keys-server.sh" -Encoding UTF8

# 9. Instructions completes
$instructions = @"
# INSTRUCTIONS CONFIGURATION SSH MULTI-MACHINES

## Etapes a suivre

### 1. Sur le serveur (51.91.145.255)
```bash
# Connectez-vous au serveur
ssh ubuntu@51.91.145.255

# Telechargez et executez le script
# (Copiez le contenu de add-keys-server.sh et executez-le)
chmod +x add-keys-server.sh
./add-keys-server.sh
```

### 2. Sur votre ordinateur portable
```powershell
# 1. Copiez tout le dossier portable-setup sur votre portable
# 2. Ouvrez PowerShell dans ce dossier  
# 3. Executez:
.\setup-portable.ps1
```

### 3. Tests de connexion
```powershell
# Depuis PC fixe
ssh melyia-backend

# Depuis portable  
ssh melyia-backend

# Monitoring rapide
ssh melyia-monitor

# Logs en temps reel
ssh melyia-logs
```

## Cles generees

**PC Fixe:** $keyPath
**Portable:** $portableKeyPath

## En cas de probleme

1. Verifiez que les cles sont bien ajoutees sur le serveur
2. Testez la connexion: ssh -v melyia-backend  
3. Verifiez les permissions des cles SSH
4. Consultez les logs SSH: ssh -vvv melyia-backend

## Une fois configure

Vous pourrez utiliser:
- .\dev\start-dev.ps1 (demarrage developpement)
- .\dev\sync-and-push.ps1 (synchronisation)  
- ssh melyia-monitor (monitoring serveur)
"@

$instructions | Out-File -FilePath "$portableSetup\INSTRUCTIONS.md" -Encoding UTF8

Write-Host "Package portable cree: $portableSetup" -ForegroundColor Green

# 10. Affichage final
Write-Host ""
Write-Host "CLES SSH GENEREES:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "CLE PC FIXE (melyia-backend):" -ForegroundColor Yellow
Write-Host $mainPublicKey -ForegroundColor White
Write-Host "CLE PORTABLE (melyia-backend):" -ForegroundColor Yellow  
Write-Host $portablePublicKey -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host ""
Write-Host "FICHIERS CREES:" -ForegroundColor Cyan
Write-Host "$configPath" -ForegroundColor White
Write-Host "$keyPath" -ForegroundColor White
Write-Host "$portableKeyPath" -ForegroundColor White
Write-Host "$portableSetup\" -ForegroundColor White

Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Connectez-vous au serveur: ssh ubuntu@51.91.145.255" -ForegroundColor White
Write-Host "2. Executez le script: add-keys-server.sh (dans portable-setup/)" -ForegroundColor White  
Write-Host "3. Testez depuis PC fixe: ssh melyia-backend" -ForegroundColor White
Write-Host "4. Copiez portable-setup/ sur votre portable" -ForegroundColor White
Write-Host "5. Executez setup-portable.ps1 sur le portable" -ForegroundColor White

Write-Host ""
Write-Host "CONSEIL:" -ForegroundColor Cyan
Write-Host "Copiez ce dossier sur une cle USB pour l'installer sur le portable:" -ForegroundColor White
Write-Host "$portableSetup" -ForegroundColor Cyan

Write-Host ""
Write-Host "Configuration SSH multi-machines terminee !" -ForegroundColor Green