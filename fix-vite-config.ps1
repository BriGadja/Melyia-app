Write-Host "🔧 CORRECTION VITE.CONFIG.TS - Fix ESM Plugin" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Lire le contenu actuel
if (Test-Path "vite.config.ts") {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    Write-Host "📋 Configuration Vite actuelle lue" -ForegroundColor Cyan
    
    # Commenter la ligne problématique
    $viteConfigFixed = $viteConfig -replace 'import.*@replit/vite-plugin-runtime-error-modal.*', '// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"; // Temporairement désactivé'
    
    # Aussi commenter l'usage du plugin s'il existe
    $viteConfigFixed = $viteConfigFixed -replace 'runtimeErrorOverlay\(\)', '// runtimeErrorOverlay() // Temporairement désactivé'
    
    # Sauvegarder la version corrigée
    $viteConfigFixed | Out-File "vite.config.ts" -Encoding UTF8
    
    Write-Host "✅ Plugin @replit temporairement désactivé" -ForegroundColor Green
    Write-Host "📝 Fichier vite.config.ts corrigé" -ForegroundColor Green
} else {
    Write-Host "❌ vite.config.ts non trouvé" -ForegroundColor Red
}

Write-Host "`n🎯 SOLUTION APPLIQUÉE:" -ForegroundColor Yellow
Write-Host "Plugin Replit commenté pour éviter le conflit ESM" -ForegroundColor White
Write-Host "Votre build devrait maintenant fonctionner" -ForegroundColor White

Write-Host "`n🚀 RELANCER LE DÉPLOIEMENT:" -ForegroundColor Magenta
Write-Host "node deploy-combined.js" -ForegroundColor Cyan
