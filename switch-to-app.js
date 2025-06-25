// 🔄 SWITCH TO APP MODE - Bascule vers l'application

import fs from "fs";
import path from "path";

const log = (message, color = "cyan") => {
  const colors = {
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
};

function switchToApp() {
  const clientDir = "./client";
  const indexApp = path.join(clientDir, "index-app.html");
  const indexCurrent = path.join(clientDir, "index.html");

  try {
    // Vérifier que le fichier app existe
    if (!fs.existsSync(indexApp)) {
      throw new Error("Fichier index-app.html non trouvé");
    }

    // Copier index-app.html vers index.html
    fs.copyFileSync(indexApp, indexCurrent);

    log("🔄 Basculé vers le mode APPLICATION", "green");
    log("📍 Point d'entrée: index-app.html");
    log('🚀 Exécutez "npm run dev" pour démarrer');
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, "red");
    process.exit(1);
  }
}

switchToApp();
