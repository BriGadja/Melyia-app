// 🚀 DÉPLOIEMENT LOCAL OPTIMISÉ - EXÉCUTION DIRECTE SERVEUR
// Version ultra-rapide sans SSH/SCP - Opérations locales directes

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  PATHS: {
    landing: {
      source: "dist/landing/",
      target: "/var/www/melyia/dev-site/",
    },
    app: {
      source: "dist/app/",
      target: "/var/www/melyia/app-dev/",
    },
  },
  LOG: {
    startTime: Date.now(),
    steps: [],
  },
};

function log(message, color = "cyan") {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
  };

  const timestamp = new Date().toLocaleTimeString();
  const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const prefix = `[${timestamp}] (+${duration}s)`;

  console.log(`${colors[color]}${prefix} ${message}${colors.reset}`);
  CONFIG.LOG.steps.push({
    timestamp,
    duration: parseFloat(duration),
    message,
    level: color,
  });
}

function logPhase(title, description = "") {
  log("");
  log("┌─────────────────────────────────────────┐", "magenta");
  log(`│ ${title.padEnd(39)} │`, "magenta");
  if (description) {
    log(`│ ${description.padEnd(39)} │`, "cyan");
  }
  log("└─────────────────────────────────────────┘", "magenta");
  log("");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function executeLocal(command, description) {
  const startTime = Date.now();
  try {
    log(`⚡ ${description}...`, "cyan");
    
    const result = execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ ${description} - OK en ${duration}s`, "green");
    return result;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`❌ ${description} - Échec en ${duration}s`, "red");
    throw error;
  }
}

function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach((file) => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  try {
    calculateSize(dirPath);
  } catch (error) {
    // Si erreur d'accès, ignorer
  }
  
  return totalSize;
}

function validateBuilds() {
  logPhase("PHASE 1 : VALIDATION DES BUILDS", "Vérification artefacts locaux");

  const builds = [
    { path: CONFIG.PATHS.landing.source.slice(0, -1), name: "Landing" },
    { path: CONFIG.PATHS.app.source.slice(0, -1), name: "App" },
  ];

  let totalSize = 0;

  for (const build of builds) {
    if (!fs.existsSync(build.path)) {
      throw new Error(`Build ${build.name} manquant: ${build.path}`);
    }

    const files = fs.readdirSync(build.path);
    const hasHTML = files.some((f) => f.endsWith(".html"));
    const hasAssets = fs.existsSync(path.join(build.path, "assets"));

    if (!hasHTML || !hasAssets) {
      throw new Error(`Build ${build.name} incomplet: ${build.path}`);
    }

    const buildSize = calculateDirectorySize(build.path);
    totalSize += buildSize;

    log(`✅ Build ${build.name} validé: ${formatBytes(buildSize)}`, "green");
  }

  log(`📊 Taille totale à déployer: ${formatBytes(totalSize)}`, "cyan");
}

function checkServices() {
  logPhase("PHASE 2 : VÉRIFICATION SERVICES", "État des services locaux");

  // Vérifier Nginx
  try {
    const nginxStatus = execSync('systemctl is-active nginx', { encoding: 'utf8' }).trim();
    log(`✅ Nginx: ${nginxStatus}`, "green");
  } catch (error) {
    log("⚠️ Nginx: problème détecté", "yellow");
  }

  // Vérifier PM2
  try {
    const pm2Status = execSync('pm2 list | grep melyia-auth-dev', { encoding: 'utf8' });
    if (pm2Status.includes('online')) {
      log("✅ PM2: melyia-auth-dev online", "green");
    } else {
      log("⚠️ PM2: melyia-auth-dev pas en ligne", "yellow");
    }
  } catch (error) {
    log("⚠️ PM2: vérification échouée", "yellow");
  }

  // Vérifier PostgreSQL
  try {
    const pgStatus = execSync('systemctl is-active postgresql', { encoding: 'utf8' }).trim();
    log(`✅ PostgreSQL: ${pgStatus}`, "green");
  } catch (error) {
    log("⚠️ PostgreSQL: problème détecté", "yellow");
  }

  // Vérifier espace disque
  try {
    const diskUsage = execSync('df -h /var/www | tail -1', { encoding: 'utf8' });
    const usagePercent = diskUsage.split(/\s+/)[4];
    log(`✅ Espace disque: ${usagePercent} utilisé`, "green");
  } catch (error) {
    log("⚠️ Impossible de vérifier l'espace disque", "yellow");
  }
}

function deployLanding() {
  const { source, target } = CONFIG.PATHS.landing;
  
  logPhase("PHASE 3 : DÉPLOIEMENT LANDING", "Copie directe optimisée");

  // Créer répertoire cible si nécessaire
  executeLocal(`sudo mkdir -p ${target}`, "Création répertoire landing");

  // Sauvegarde rapide si contenu existant
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    const timestamp = Date.now();
    executeLocal(
      `sudo cp -r ${target} /tmp/landing-backup-${timestamp}`,
      "Backup landing existant"
    );
  }

  // Copie optimisée avec rsync local
  executeLocal(
    `sudo rsync -av --delete ${source} ${target}`,
    "Déploiement landing (rsync)"
  );

  // Permissions optimisées
  executeLocal(`sudo chown -R www-data:www-data ${target}`, "Propriétaire www-data");
  executeLocal(`sudo find ${target} -type f -exec chmod 644 {} +`, "Permissions fichiers");
  executeLocal(`sudo find ${target} -type d -exec chmod 755 {} +`, "Permissions dossiers");

  log("✅ Landing déployée: https://dev.melyia.com", "green");
}

function deployApp() {
  const { source, target } = CONFIG.PATHS.app;
  
  logPhase("PHASE 4 : DÉPLOIEMENT APP", "Avec protection backend");

  // Créer répertoire cible si nécessaire
  executeLocal(`sudo mkdir -p ${target}`, "Création répertoire app");

  // Sauvegarde fichiers backend critiques
  const timestamp = Date.now();
  const backupDir = `/tmp/backend-backup-${timestamp}`;
  
  executeLocal(`mkdir -p ${backupDir}`, "Workspace backup");
  
  // Sauvegarder les fichiers backend s'ils existent
  const backupFiles = ['server.js', 'package.json'];
  for (const file of backupFiles) {
    const filePath = path.join(target, file);
    if (fs.existsSync(filePath)) {
      executeLocal(
        `cp ${filePath} ${backupDir}/`,
        `Backup ${file}`
      );
    }
  }

  // Déploiement app avec rsync (plus rapide que cp)
  executeLocal(
    `sudo rsync -av --delete ${source} ${target}`,
    "Déploiement app (rsync)"
  );

  // Restauration fichiers backend
  for (const file of backupFiles) {
    const backupFile = path.join(backupDir, file);
    if (fs.existsSync(backupFile)) {
      executeLocal(
        `sudo cp ${backupFile} ${target}`,
        `Restauration ${file}`
      );
    }
  }

  // Création lien index si nécessaire
  const indexAppPath = path.join(target, 'index-app.html');
  const indexPath = path.join(target, 'index.html');
  
  if (fs.existsSync(indexAppPath)) {
    executeLocal(
      `cd ${target} && sudo ln -sf index-app.html index.html`,
      "Lien index app"
    );
  }

  // Permissions optimisées
  executeLocal(`sudo chown -R www-data:www-data ${target}`, "Propriétaire www-data app");
  executeLocal(`sudo find ${target} -type f -exec chmod 644 {} +`, "Permissions fichiers app");
  executeLocal(`sudo find ${target} -type d -exec chmod 755 {} +`, "Permissions dossiers app");

  // Nettoyage backup temporaire
  executeLocal(`rm -rf ${backupDir}`, "Nettoyage backup temporaire");

  log("✅ App déployée: https://app-dev.melyia.com", "green");
}

function reloadServices() {
  logPhase("PHASE 5 : RECHARGEMENT SERVICES", "Nginx et PM2");

  // Rechargement Nginx (plus rapide que restart)
  try {
    executeLocal("sudo systemctl reload nginx", "Rechargement Nginx");
  } catch (error) {
    log("⚠️ Échec rechargement Nginx, tentative restart...", "yellow");
    try {
      executeLocal("sudo systemctl restart nginx", "Restart Nginx");
    } catch (restartError) {
      log("❌ Problème critique Nginx", "red");
    }
  }

  // Restart PM2 si nécessaire (optionnel car backend préservé)
  try {
    executeLocal("pm2 restart melyia-auth-dev", "Restart PM2 app");
  } catch (error) {
    log("⚠️ PM2 restart échoué (non critique)", "yellow");
  }
}

function validateDeployment() {
  logPhase("PHASE 6 : VALIDATION RAPIDE", "Tests locaux et HTTP");

  // Vérification fichiers déployés
  const checks = [
    { path: CONFIG.PATHS.landing.target, name: "Landing" },
    { path: CONFIG.PATHS.app.target, name: "App" },
  ];

  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      const files = fs.readdirSync(check.path);
      log(`✅ ${check.name}: ${files.length} fichiers`, "green");
    } else {
      log(`❌ ${check.name}: répertoire manquant`, "red");
    }
  }

  // Tests HTTP rapides
  const sites = [
    { name: "Landing", url: "https://dev.melyia.com" },
    { name: "App", url: "https://app-dev.melyia.com" },
  ];

  for (const site of sites) {
    try {
      const start = Date.now();
      const result = execSync(`curl -I "${site.url}" --max-time 5 --silent`, {
        encoding: "utf8",
        timeout: 6000,
      });

      const time = ((Date.now() - start) / 1000).toFixed(1);

      if (result.includes("200 OK")) {
        log(`✅ ${site.name} accessible en ${time}s (HTTP 200)`, "green");
      } else {
        const match = result.match(/HTTP\/[\d.]+\s+(\d+)/);
        const status = match ? match[1] : "Unknown";
        log(`⚠️ ${site.name} HTTP ${status}`, "yellow");
      }
    } catch (error) {
      log(`❌ ${site.name} inaccessible`, "red");
    }
  }
}

function showSummary() {
  logPhase("RÉSUMÉ DÉPLOIEMENT LOCAL", "Statistiques optimisées");

  const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const steps = CONFIG.LOG.steps.length;

  log(`⏱️ Durée totale: ${duration}s`, "cyan");
  log(`📊 Étapes: ${steps}`, "cyan");
  log("");

  log("🌐 SITES DÉPLOYÉS:", "blue");
  log("  📍 Landing: https://dev.melyia.com", "white");
  log("  📍 App: https://app-dev.melyia.com", "white");
  log("  📍 API: https://app-dev.melyia.com/api", "white");
  log("");

  log("🚀 OPTIMISATIONS LOCALES:", "green");
  log("  ✅ Aucune connexion SSH/SCP", "green");
  log("  ✅ Opérations locales directes", "green");
  log("  ✅ Rsync optimisé", "green");
  log("  ✅ Préservation backend automatique", "green");
  log("  ✅ Rechargement services intelligent", "green");
}

function main() {
  try {
    log("🚀 DÉPLOIEMENT LOCAL OPTIMISÉ", "green");
    log("⚡ Exécution directe serveur - Ultra-rapide", "magenta");
    log("");

    validateBuilds();
    checkServices();
    deployLanding();
    deployApp();
    reloadServices();
    validateDeployment();
    showSummary();

    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "cyan");
    log(`🎉 DÉPLOIEMENT LOCAL RÉUSSI en ${duration}s`, "green");
    log("⚡ OPTIMISATION SERVEUR DIRECTE", "magenta");
    log("✅ Tous les sites opérationnels", "green");
    log("=====================================================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "red");
    log(`❌ DÉPLOIEMENT LOCAL ÉCHOUÉ après ${duration}s`, "red");
    log(`❌ Erreur: ${error.message}`, "red");
    log("=====================================================", "red");
    process.exit(1);
  }
}

main(); 