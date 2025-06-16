import fs from "fs";
import path from "path";

const clientDir = path.join(process.cwd(), "client");

try {
  const mainIndexPath = path.join(clientDir, "index.html");
  const appIndexPath = path.join(clientDir, "index-app.html");
  const landingTempPath = path.join(clientDir, "index-landing-temp.html");
  const landingIndexPath = path.join(clientDir, "index-landing.html");

  // Sauvegarder l'index actuel comme app
  if (fs.existsSync(mainIndexPath)) {
    fs.copyFileSync(mainIndexPath, appIndexPath);
  }

  // Restaurer l'index landing
  if (fs.existsSync(landingTempPath)) {
    fs.renameSync(landingTempPath, mainIndexPath);
  } else if (fs.existsSync(landingIndexPath)) {
    fs.copyFileSync(landingIndexPath, mainIndexPath);
  } else {
    // Créer index.html pour landing si il n'existe pas
    const landingHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Melyia - Assistant IA Dentaire</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/landing/main.tsx"></script>
  </body>
</html>`;
    fs.writeFileSync(mainIndexPath, landingHtml);
  }

  console.log("✅ Switched to LANDING mode");
} catch (error) {
  console.error("❌ Erreur switch landing:", error.message);
}
