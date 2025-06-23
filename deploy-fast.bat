@echo off
echo 🚀 DÉPLOIEMENT OPTIMISATIONS CHATBOT MELYIA
echo.

echo 1. Backup du serveur actuel...
ssh -i C:\Users\pc\.ssh\ovh_key ubuntu@51.91.145.255 "cp /var/www/melyia/server/backend/server.js /var/www/melyia/server/backend/server.js.backup"
if %errorlevel% equ 0 (
    echo ✅ Backup créé
) else (
    echo ❌ Erreur backup
    pause
    exit /b 1
)

echo.
echo 2. Upload du serveur optimisé...
scp -i C:\Users\pc\.ssh\ovh_key server/backend/server.js ubuntu@51.91.145.255:/var/www/melyia/server/backend/
if %errorlevel% equ 0 (
    echo ✅ Serveur optimisé uploadé
) else (
    echo ❌ Erreur upload
    pause
    exit /b 1
)

echo.
echo 3. Test syntaxe...
ssh -i C:\Users\pc\.ssh\ovh_key ubuntu@51.91.145.255 "cd /var/www/melyia/server/backend && node -c server.js"
if %errorlevel% equ 0 (
    echo ✅ Syntaxe valide
) else (
    echo ❌ Erreur syntaxe - restauration backup
    ssh -i C:\Users\pc\.ssh\ovh_key ubuntu@51.91.145.255 "cp /var/www/melyia/server/backend/server.js.backup /var/www/melyia/server/backend/server.js"
    pause
    exit /b 1
)

echo.
echo 4. Redémarrage PM2...
ssh -i C:\Users\pc\.ssh\ovh_key ubuntu@51.91.145.255 "pm2 restart auth-dev"
if %errorlevel% equ 0 (
    echo ✅ PM2 redémarré
) else (
    echo ❌ Erreur PM2
)

echo.
echo 5. Attente stabilisation (10s)...
timeout /t 10 /nobreak > nul

echo.
echo 6. Test de santé...
ssh -i C:\Users\pc\.ssh\ovh_key ubuntu@51.91.145.255 "curl -f http://localhost:8083/api/health --max-time 10"
if %errorlevel% equ 0 (
    echo ✅ Serveur opérationnel
) else (
    echo ⚠️ Serveur potentiellement instable
)

echo.
echo 7. Test Ollama...
ssh -i C:\Users\pc\.ssh\ovh_key ubuntu@51.91.145.255 "curl -f http://localhost:11434/api/version --max-time 5"
if %errorlevel% equ 0 (
    echo ✅ Ollama accessible
) else (
    echo ⚠️ Problème Ollama
)

echo.
echo ✅ DÉPLOIEMENT TERMINÉ !
echo 🎯 Objectif: Chatbot < 10 secondes
echo 🔍 Testez maintenant le chatbot sur https://app-dev.melyia.com
echo.
pause 