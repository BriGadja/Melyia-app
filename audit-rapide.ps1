$AuditDate = Get-Date -Format "yyyyMMdd-HHmm"
Write-Host "=== AUDIT MELYIA REPRISE v22 - $AuditDate ===" -ForegroundColor Green

$CurrentDir = Get-Location
Write-Host "`nRépertoire actuel: $CurrentDir" -ForegroundColor Cyan

# Vérification structure essentielle
Write-Host "`n STRUCTURE PROJET:" -ForegroundColor Yellow
$EssentialDirs = @("client", "dev", "dist", "node_modules", ".ssh")
foreach ($dir in $EssentialDirs) {
    if (Test-Path $dir) {
        Write-Host "   $dir" -ForegroundColor Green
    } else {
        Write-Host "   $dir manquant" -ForegroundColor Red
    }
}

# Vérification fichiers critiques
Write-Host "`n FICHIERS CRITIQUES:" -ForegroundColor Yellow
$EssentialFiles = @("package.json", ".cursorrules", ".env.local", "dev\start-dev-CLEAN.ps1", "dev\sync-and-push-CLEAN.ps1")
foreach ($file in $EssentialFiles) {
    if (Test-Path $file) {
        Write-Host "   $file" -ForegroundColor Green
    } else {
        Write-Host "   $file manquant" -ForegroundColor Red
    }
}

# SSH Config
Write-Host "`n CONFIGURATION SSH:" -ForegroundColor Yellow
if (Test-Path "$env:USERPROFILE\.ssh\melyia_main") {
    Write-Host "   Clé SSH PC fixe présente" -ForegroundColor Green
} else {
    Write-Host "   Clé SSH PC fixe manquante" -ForegroundColor Red
}

# Test rapide connexion
Write-Host "`n TEST CONNEXION BACKEND:" -ForegroundColor Yellow
try {
    ssh -o ConnectTimeout=5 -o BatchMode=yes -i "$env:USERPROFILE\.ssh\melyia_main" ubuntu@51.91.145.255 "echo 'SSH OK'" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   SSH Backend accessible" -ForegroundColor Green
    } else {
        Write-Host "    SSH Backend timeout (normal si clé non configurée)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    SSH non testé" -ForegroundColor Yellow
}

Write-Host "`n=== FIN AUDIT ===" -ForegroundColor Green
