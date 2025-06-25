// 🔄 SWITCH TO LANDING MODE - Bascule vers la landing page

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

function switchToLanding() {
  const clientDir = "./client";
  const indexLanding = path.join(clientDir, "index-landing.html");
  const indexCurrent = path.join(clientDir, "index.html");

  try {
    // Vérifier que le fichier landing existe
    if (!fs.existsSync(indexLanding)) {
      throw new Error("Fichier index-landing.html non trouvé");
    }

    // Copier index-landing.html vers index.html
    fs.copyFileSync(indexLanding, indexCurrent);

    log("🔄 Basculé vers le mode LANDING PAGE", "green");
    log("📍 Point d'entrée: index-landing.html");
    log('🚀 Exécutez "npm run dev" pour démarrer');
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, "red");
    process.exit(1);
  }
}

switchToLanding();
