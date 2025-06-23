# Script de verification statut Melyia
Write-Host "STATUT CONFIGURATION MELYIA" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan

# Git
Write-Host ""
Write-Host "GIT:" -ForegroundColor Yellow
git --version

$hasGitRepo = Test-Path '.git'
Write-Host "Repository: $(if ($hasGitRepo) { 'Initialise' } else { 'Non initialise' })" -ForegroundColor White

$remoteUrl = git remote get-url origin 2>$null
Write-Host "Remote: $(if ($remoteUrl) { $remoteUrl } else { 'Aucun' })" -ForegroundColor White

$currentBranch = git branch --show-current 2>$null
Write-Host "Branch: $(if ($currentBranch) { $currentBranch } else { 'Aucune' })" -ForegroundColor White

# SSH
Write-Host ""
Write-Host "SSH:" -ForegroundColor Yellow
$sshConfigExists = Test-Path "$env:USERPROFILE\.ssh\config"
Write-Host "Config: $(if ($sshConfigExists) { 'Configure' } else { 'Non configure' })" -ForegroundColor White

$sshKeysExist = Test-Path "$env:USERPROFILE\.ssh\melyia_*"
Write-Host "Cles: $(if ($sshKeysExist) { 'Generees' } else { 'Non generees' })" -ForegroundColor White

# Scripts
Write-Host ""
Write-Host "SCRIPTS:" -ForegroundColor Yellow
$scripts = @("setup\setup-ssh-multi.ps1", "dev\start-dev.ps1", "dev\sync-and-push.ps1")
foreach ($script in $scripts) {
    $scriptExists = Test-Path $script
    Write-Host "$script : $(if ($scriptExists) { 'Present' } else { 'Manquant' })" -ForegroundColor White
}

Write-Host ""
Write-Host "Prochaine etape recommandee:" -ForegroundColor Cyan
if (!$sshConfigExists) {
    Write-Host ".\setup\setup-ssh-multi.ps1" -ForegroundColor White
} else {
    Write-Host "Configuration terminee ! Utilisez: .\dev\start-dev.ps1" -ForegroundColor White
}
