# SCRIPT DIAGNOSTIC MELYIA - Identification des problèmes
Write-Host "🔍 DIAGNOSTIC ENVIRONNEMENT MELYIA" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test 1: PowerShell
Write-Host "📋 Version PowerShell:" -ForegroundColor Yellow
$PSVersionTable.PSVersion

# Test 2: Node.js
Write-Host "
📋 Node.js:" -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non disponible" -ForegroundColor Red
}

# Test 3: npm
Write-Host "
📋 npm:" -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm non disponible" -ForegroundColor Red
}

# Test 4: Fichiers critiques
Write-Host "
📋 Fichiers présents:" -ForegroundColor Yellow
$files = @("package.json", ".\dev\sync-essential.ps1")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MANQUANT" -ForegroundColor Red
    }
}

# Test 5: Scripts de déploiement
Write-Host "
📋 Scripts de déploiement:" -ForegroundColor Yellow
$deployScripts = @("deploy-bulletproof-v2.js", "deploy-combined-quick.js", "deploy.js")
foreach ($script in $deployScripts) {
    if (Test-Path $script) {
        Write-Host "✅ $script" -ForegroundColor Green
    } else {
        Write-Host "❌ $script MANQUANT" -ForegroundColor Red
    }
}

# Test 6: Répertoire de travail
Write-Host "
📋 Répertoire de travail:" -ForegroundColor Yellow
Write-Host "📁 PWD: $(Get-Location)" -ForegroundColor Cyan

# Test 7: Contenu package.json
Write-Host "
📋 Scripts dans package.json:" -ForegroundColor Yellow
if (Test-Path "package.json") {
    try {
        $pkg = Get-Content "package.json" | ConvertFrom-Json
        if ($pkg.scripts) {
            $pkg.scripts | Get-Member -MemberType NoteProperty | ForEach-Object {
                Write-Host "  - $($_.Name)" -ForegroundColor Cyan
            }
        }
    } catch {
        Write-Host "❌ Erreur lecture package.json" -ForegroundColor Red
    }
}

Write-Host "
🎯 Diagnostic terminé. Copiez ce résultat pour analyse." -ForegroundColor Green
