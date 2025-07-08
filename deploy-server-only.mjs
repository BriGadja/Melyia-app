// deploy-server-only.mjs - Déploiement uniquement du serveur
import { execSync } from "child_process";
import fs from "fs";

console.log("🚀 DÉPLOIEMENT SERVER.JS UNIQUEMENT");
console.log("=====================================");

try {
  // Vérifier que le fichier server.js existe
  if (!fs.existsSync("server/backend/server.js")) {
    console.log("❌ Fichier server/backend/server.js non trouvé");
    process.exit(1);
  }

  console.log("📦 Uploading server.js...");

  // Uploader le fichier server.js
  const uploadCmd = `scp -o ConnectTimeout=30 server/backend/server.js ubuntu@51.91.145.255:/var/www/melyia/app-dev/`;
  console.log("📤 Commande:", uploadCmd);

  execSync(uploadCmd, { stdio: "inherit" });
  console.log("✅ Upload terminé");

  console.log("🔄 Redémarrage PM2...");

  // Redémarrer PM2
  const restartCmd = `ssh -o ConnectTimeout=30 ubuntu@51.91.145.255 "cd /var/www/melyia/app-dev && pm2 restart melyia-auth-dev"`;
  console.log("🔄 Commande:", restartCmd);

  execSync(restartCmd, { stdio: "inherit" });
  console.log("✅ PM2 redémarré");

  console.log("\n🎉 DÉPLOIEMENT RÉUSSI !");
  console.log("🔍 Vérification dans 10 secondes...");

  // Attendre 10 secondes pour que le serveur redémarre
  setTimeout(() => {
    console.log("🧪 Lancement des tests...");
    execSync("node test-admin-upload-documents.mjs", { stdio: "inherit" });
  }, 10000);
} catch (error) {
  console.error("❌ Erreur déploiement:", error.message);
  process.exit(1);
}
