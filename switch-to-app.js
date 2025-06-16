import fs from "fs";
import path from "path";

const clientDir = path.join(process.cwd(), "client");

try {
  // Vérifier que index-app.html existe
  const appIndexPath = path.join(clientDir, "index-app.html");
  const mainIndexPath = path.join(clientDir, "index.html");
  const landingTempPath = path.join(clientDir, "index-landing-temp.html");

  // Si index.html existe, le sauvegarder comme landing
  if (fs.existsSync(mainIndexPath)) {
    fs.renameSync(mainIndexPath, landingTempPath);
  }

  // Si index-app.html existe, le copier comme index.html
  if (fs.existsSync(appIndexPath)) {
    fs.copyFileSync(appIndexPath, mainIndexPath);
  } else {
    // Créer index.html pour app si il n'existe pas
    const appHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Melyia - Application Dentaire</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>`;
    fs.writeFileSync(mainIndexPath, appHtml);
  }

  console.log("✅ Switched to APP mode");
} catch (error) {
  console.error("❌ Erreur switch app:", error.message);
}
