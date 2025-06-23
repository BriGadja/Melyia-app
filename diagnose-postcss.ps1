Write-Host "🔍 DIAGNOSTIC POSTCSS - Recherche fichier corrompu" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Chercher les fichiers de configuration PostCSS
$postcssFiles = @(
    "postcss.config.js",
    "postcss.config.json", 
    "postcss.config.cjs",
    "postcss.config.mjs",
    ".postcssrc",
    ".postcssrc.json",
    ".postcssrc.js",
    "client\postcss.config.js",
    "client\postcss.config.json",
    "client\.postcssrc",
    "client\.postcssrc.json"
)

Write-Host "`n�� FICHIERS POSTCSS TROUVÉS:" -ForegroundColor Yellow
$foundFiles = @()

foreach ($file in $postcssFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
        $foundFiles += $file
        
        # Vérifier le contenu pour détecter le problème
        try {
            $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
            if ($content) {
                $preview = ($content -replace "`n", " " -replace "`r", "").Substring(0, [Math]::Min($content.Length, 100))
                Write-Host "    📝 Aperçu: $preview..." -ForegroundColor Cyan
                
                # Détecter les caractères suspects
                if ($content -match "^\s*[^\{\w]") {
                    Write-Host "    ⚠️  SUSPECT: Caractères non-standard au début" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "    ❌ Erreur lecture: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

if ($foundFiles.Count -eq 0) {
    Write-Host "  ❌ Aucun fichier PostCSS trouvé" -ForegroundColor Red
    Write-Host "  💡 Le problème pourrait être dans package.json ou un autre config" -ForegroundColor Yellow
}

Write-Host "`n🎯 SOLUTIONS POSSIBLES:" -ForegroundColor Magenta
Write-Host "1. Supprimer les fichiers PostCSS suspects" -ForegroundColor White
Write-Host "2. Corriger le JSON invalide" -ForegroundColor White
Write-Host "3. Recréer une configuration PostCSS basique" -ForegroundColor White
