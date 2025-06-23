import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des déploiements (basée sur vos scripts existants)
const DEPLOYMENTS = {
  landing: {
    name: "Landing Page",
    serverUrl: "https://dev.melyia.com",
    webhookEndpoint: "/hooks/deploy",
    webhookToken:
      "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410",
    buildDir: "./dist/landing",
    buildCommand: "build:landing",
    targetPath: "/var/www/melyia/dev",
    domain: "dev.melyia.com",
  },
  app: {
    name: "Application Auth",
    serverUrl: "https://app-dev.melyia.com",
    webhookEndpoint: "/hooks/deploy",
    webhookToken:
      "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410",
    buildDir: "./dist/app",
    buildCommand: "build:app",
    targetPath: "/var/www/melyia/app-dev",
    domain: "app-dev.melyia.com",
  },
};

/**
 * Utilitaire de logging coloré (copié de deploy-to-dev.js)
 */
function log(message, color = "white") {
  const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[color] || colors.white}${message}${colors.reset}`);
}

/**
 * Build d'un projet spécifique
 */
async function buildProject(deployment) {
  try {
    log(`🔨 Build ${deployment.name}...`, "blue");

    const { spawn } = await import("child_process");

    return new Promise((resolve, reject) => {
      const buildProcess = spawn("npm", ["run", deployment.buildCommand], {
        stdio: "pipe",
        shell: true,
      });

      let output = "";
      buildProcess.stdout.on("data", (data) => {
        output += data.toString();
        process.stdout.write(data);
      });

      buildProcess.stderr.on("data", (data) => {
        output += data.toString();
        process.stderr.write(data);
      });

      buildProcess.on("close", (code) => {
        if (code === 0) {
          log(`✅ Build ${deployment.name} réussi !`, "green");
          resolve(true);
        } else {
          log(`❌ Build ${deployment.name} échoué avec le code ${code}`, "red");
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  } catch (error) {
    log(`❌ Erreur build ${deployment.name}: ${error.message}`, "red");
    return false;
  }
}

/**
 * Collecte récursive des fichiers à déployer (logique de deploy-to-dev.js)
 */
async function collectFiles(buildDir) {
  const files = [];

  function scanDirectory(dirPath, relativePath = "") {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const itemRelativePath = path
        .join(relativePath, item)
        .replace(/\\/g, "/");

      if (fs.statSync(fullPath).isDirectory()) {
        scanDirectory(fullPath, itemRelativePath);
      } else {
        files.push({
          path: fullPath,
          relativePath: itemRelativePath,
          name: item,
          size: fs.statSync(fullPath).size,
        });
      }
    }
  }

  if (!fs.existsSync(buildDir)) {
    throw new Error(`Répertoire build introuvable: ${buildDir}`);
  }

  scanDirectory(buildDir);
  return files;
}

/**
 * Déploiement vers un serveur spécifique (combinaison des deux logiques)
 */
async function deployToTarget(deployment) {
  try {
    log(
      `🚀 Déploiement ${deployment.name} vers ${deployment.domain}...`,
      "blue"
    );

    const files = await collectFiles(deployment.buildDir);

    if (!files || files.length === 0) {
      log(`❌ Aucun fichier à déployer pour ${deployment.name}`, "red");
      return false;
    }

    const form = new FormData();

    // Métadonnées du déploiement (style deploy-to-dev.js)
    form.append(
      "metadata",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        files_count: files.length,
        total_size: files.reduce((sum, f) => sum + f.size, 0),
        source: "cursor-local-combined",
        target: deployment.targetPath,
        version: "22.1.0",
        type: deployment.name.toLowerCase().replace(/\s+/g, "-"),
      })
    );

    // Ajout de tous les fichiers (méthode deploy-to-dev.js + app-dev.js)
    for (const file of files) {
      form.append("files", fs.createReadStream(file.path), {
        filename: file.relativePath,
      });
    }

    log(`📁 Fichiers à déployer depuis ${deployment.buildDir}/`, "blue");
    files.forEach((f) => log(`   - ${f.relativePath}`, "white"));

    log(`📤 Upload vers ${deployment.domain}...`, "blue");

    // Requête de déploiement (compatible avec les deux formats)
    const response = await fetch(
      `${deployment.serverUrl}${deployment.webhookEndpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deployment.webhookToken}`,
          "X-Webhook-Token": deployment.webhookToken, // Compatible app-dev.js
          ...form.getHeaders(),
        },
        body: form,
      }
    );

    const result = await response.json();

    if (response.ok) {
      log(`✅ ${deployment.name} déployée avec succès !`, "green");
      log(`📊 Détails:`, "blue");
      log(`   - Status: ${response.status}`, "yellow");
      log(`   - Fichiers déployés: ${files.length}`, "yellow");
      log(`🌐 Disponible sur: https://${deployment.domain}`, "cyan");
      return true;
    } else {
      log(
        `❌ Erreur déploiement ${deployment.name} (${response.status}): ${
          result.error || result.message
        }`,
        "red"
      );
      if (result.details) {
        log(`   Détails: ${result.details}`, "red");
      }
      return false;
    }
  } catch (error) {
    log(`❌ Erreur déploiement ${deployment.name}: ${error.message}`, "red");
    console.error(error);
    return false;
  }
}

/**
 * 🚀 FONCTION PRINCIPALE - DÉPLOIEMENT COMBINÉ
 */
async function deployBoth() {
  log("\n🚀 === DÉPLOIEMENT COMBINÉ MELYIA v22.1 ===\n", "blue");
  log("🎯 Landing Page + Application Auth", "cyan");

  const startTime = Date.now();
  const results = [];
  let overallSuccess = true;

  try {
    // Étape 1 : Build des deux projets
    log("📦 PHASE 1 : BUILD DES PROJETS", "blue");
    log("================================", "blue");

    for (const [key, deployment] of Object.entries(DEPLOYMENTS)) {
      const buildSuccess = await buildProject(deployment);
      if (!buildSuccess) {
        log(`❌ Build ${deployment.name} échoué - arrêt du processus`, "red");
        process.exit(1);
      }
    }

    log("✅ Tous les builds terminés avec succès !\n", "green");

    // Étape 2 : Déploiements séquentiels
    log("🚀 PHASE 2 : DÉPLOIEMENTS", "blue");
    log("==========================", "blue");

    for (const [key, deployment] of Object.entries(DEPLOYMENTS)) {
      const deploySuccess = await deployToTarget(deployment);
      results.push({
        name: deployment.name,
        success: deploySuccess,
        domain: deployment.domain,
      });
      overallSuccess = overallSuccess && deploySuccess;

      // Pause entre les déploiements pour éviter la surcharge serveur
      if (key === "landing") {
        log("⏳ Pause 3s avant déploiement suivant...\n", "yellow");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // Étape 3 : Résumé final
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("\n🎯 RÉSUMÉ DÉPLOIEMENT", "blue");
    log("====================", "blue");

    results.forEach((result) => {
      const status = result.success ? "✅ SUCCÈS" : "❌ ÉCHEC";
      log(
        `${status} ${result.name} → https://${result.domain}`,
        result.success ? "green" : "red"
      );
    });

    if (overallSuccess) {
      log(`\n🎉 DÉPLOIEMENT COMBINÉ RÉUSSI EN ${duration}s !`, "green");
      log("🌐 Vos sites sont maintenant disponibles :", "cyan");
      log("   • Landing: https://dev.melyia.com", "cyan");
      log("   • Application: https://app-dev.melyia.com", "cyan");
      log(
        "\n💡 Conseil: Videz le cache navigateur (Ctrl+F5) si pas de changement",
        "yellow"
      );
      log("🔧 Prochaine étape : Tester les deux interfaces", "yellow");
    } else {
      log(`\n❌ DÉPLOIEMENT PARTIELLEMENT ÉCHOUÉ (${duration}s)`, "red");
      log("Vérifiez les logs ci-dessus pour plus de détails", "red");
      process.exit(1);
    }
  } catch (error) {
    log(`\n💥 Erreur fatale: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Auto-exécution garantie (style v23.0.0-PERENNE)
log("🔄 Démarrage script de déploiement combiné...", "blue");
deployBoth().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});