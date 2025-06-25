Write-Host "🚀 CORRECTION DEPLOIEMENT" -ForegroundColor Green

$SSH_KEY = "$env:USERPROFILE\.ssh\melyia_main"
$SSH_HOST = "ubuntu@51.91.145.255"

Write-Host "1. Permissions..." -ForegroundColor Cyan
ssh -i $SSH_KEY $SSH_HOST "sudo chown -R ubuntu:www-data /var/www/melyia/app-dev"

Write-Host "2. Server.js..." -ForegroundColor Cyan  
scp -i $SSH_KEY server/backend/server.js "$SSH_HOST`:/var/www/melyia/app-dev/"

Write-Host "3. PM2..." -ForegroundColor Cyan
ssh -i $SSH_KEY $SSH_HOST "pm2 restart melyia-auth-dev"

Write-Host "4. Build..." -ForegroundColor Cyan
npm run build:app

Write-Host "5. Deploy..." -ForegroundColor Cyan
scp -i $SSH_KEY -r dist/app/* "$SSH_HOST`:/var/www/melyia/app-dev/"

Write-Host "6. Test..." -ForegroundColor Cyan
$test = ssh -i $SSH_KEY $SSH_HOST "curl -s -o /dev/null -w '%{http_code}' https://app-dev.melyia.com"

Write-Host "TERMINE! Code: $test" -ForegroundColor Green 