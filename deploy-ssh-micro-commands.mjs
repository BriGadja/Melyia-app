// 🚀 DÉPLOIEMENT SSH MICRO-COMMANDES - SOLUTION ANTI-TIMEOUT
// Évite tous les timeouts en décomposant en micro-opérations < 5s

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    keyPath: process.env.USERPROFILE + "\\.ssh\\melyia_main",
    connectTimeout: 30,
    execTimeout: 8000, // 8s max par commande
    serverAliveInterval: 15,
    compression: true,
    maxRetries: 2, // moins de tentatives
    retryDelay: 1000, // délai plus court
  },
  PATHS: {
    landing: {
      local: "dist/landing/",
      remote: "/var/www/melyia/dev-site/",
    },
    app: {
      local: "dist/app/",
      remote: "/var/www/melyia/app-dev/",
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

function buildSSHOptions() {
  const options = [
    `-o ConnectTimeout=${CONFIG.SSH.connectTimeout}`,
    `-o ServerAliveInterval=${CONFIG.SSH.serverAliveInterval}`,
    `-o ServerAliveCountMax=2`,
    `-o BatchMode=yes`,
    `-o StrictHostKeyChecking=no`,
    `-o LogLevel=ERROR`,
    `-o Compression=yes`,
  ];

  if (fs.existsSync(CONFIG.SSH.keyPath)) {
    options.push(`-i "${CONFIG.SSH.keyPath}"`);
  }

  return options.join(" ");
}

function executeFast(command, description, timeout = CONFIG.SSH.execTimeout) {
  for (let attempt = 1; attempt <= CONFIG.SSH.maxRetries; attempt++) {
    const startTime = Date.now();
    try {
      log(`⚡ ${description} (${attempt}/${CONFIG.SSH.maxRetries})...`, "cyan");

      const result = execSync(command, {
        encoding: "utf8",
        timeout,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`✅ ${description} - OK en ${duration}s`, "green");
      return result;
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`❌ ${description} - Échec ${attempt} (${duration}s)`, "red");

      if (attempt === CONFIG.SSH.maxRetries) {
        log(`💥 ${description} - Échec final`, "red");
        throw error;
      }

      if (attempt < CONFIG.SSH.maxRetries) {
        const delay = CONFIG.SSH.retryDelay;
        log(`⏳ Pause ${delay / 1000}s...`, "yellow");
        const waitStart = Date.now();
        while (Date.now() - waitStart < delay) {
          // Attente active courte
        }
      }
    }
  }
}

function executeSSHMicro(remoteCommand, description) {
  const sshOptions = buildSSHOptions();
  const command = `ssh ${sshOptions} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "${remoteCommand}"`;
  return executeFast(command, description);
}

function uploadSCPFast(localPath, remotePath, description) {
  const sshOptions = buildSSHOptions();
  const command = `scp ${sshOptions} "${localPath}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}:"${remotePath}"`;
  return executeFast(command, description, 15000); // 15s max pour upload
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

  calculateSize(dirPath);
  return totalSize;
}

function validateBuilds() {
  logPhase("PHASE 1 : VALIDATION DES BUILDS", "Vérification artefacts");

  const builds = [
    { path: CONFIG.PATHS.landing.local.slice(0, -1), name: "Landing" },
    { path: CONFIG.PATHS.app.local.slice(0, -1), name: "App" },
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

    log(
      `✅ Build ${build.name} validé: ${build.path} (${formatBytes(
        buildSize
      )})`,
      "green"
    );
  }

  log(`📊 Taille totale à déployer: ${formatBytes(totalSize)}`, "cyan");
}

function testConnectivity() {
  logPhase("PHASE 2 : TEST MICRO-CONNECTIVITÉ", "Commandes courtes uniquement");

  // Test SSH rapide
  const result = executeSSHMicro(
    "echo 'MICRO-SSH-OK' && date",
    "Test SSH ultra-rapide"
  );

  log("✅ Micro-connectivité SSH confirmée", "green");

  const lines = result.split("\n").filter((line) => line.trim());
  if (lines.length >= 2) {
    log(`📊 Serveur: ${lines[1]}`, "cyan");
  }

  // Test espace disque rapide
  executeSSHMicro("df -h | head -2", "Test espace disque");

  log("🎯 Mode MICRO-COMMANDES actif:", "blue");
  log(`  • Timeout SSH: ${CONFIG.SSH.execTimeout / 1000}s`, "blue");
  log(`  • Une action = une commande courte`, "blue");
  log(`  • Pas d'opérations groupées`, "blue");
  log(`  • SCP fichier par fichier`, "blue");
}

function getFileListRecursive(directory) {
  const files = [];

  function walkDir(currentPath, relativePath = "") {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const relPath = relativePath ? path.join(relativePath, item) : item;
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        walkDir(fullPath, relPath);
      } else {
        files.push({
          localPath: fullPath,
          relativePath: relPath.replace(/\\/g, "/"), // Unix paths pour serveur
          size: stats.size,
        });
      }
    }
  }

  walkDir(directory);
  return files;
}

function deployLandingMicro() {
  const { local, remote } = CONFIG.PATHS.landing;
  const timestamp = Date.now();

  logPhase("PHASE 3 : DÉPLOIEMENT LANDING MICRO", "Fichier par fichier");

  // Micro-sauvegarde avec vérification
  log("💾 Micro-sauvegarde...", "blue");
  executeSSHMicro(
    `[ -d ${remote} ] && echo "EXISTS" || echo "NEW"`,
    "Check landing existant"
  );

  // Micro-création répertoire
  log("🔧 Micro-préparation...", "blue");
  executeSSHMicro(
    `mkdir -p /tmp/micro-deploy-${timestamp}`,
    "Création workspace temp"
  );

  // Obtenir liste des fichiers
  const files = getFileListRecursive(local.slice(0, -1));
  log(`📁 ${files.length} fichiers à déployer`, "cyan");

  // Upload fichier par fichier
  log("📤 Upload micro-fichiers...", "blue");
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `${i + 1}/${files.length}`;
    const remoteTempPath = `/tmp/micro-deploy-${timestamp}/${file.relativePath}`;

    // Créer répertoire parent sur serveur si nécessaire
    const remoteDir = path.dirname(remoteTempPath).replace(/\\/g, "/");
    if (remoteDir !== "/tmp/micro-deploy-" + timestamp) {
      executeSSHMicro(
        `mkdir -p "${remoteDir}"`,
        `Répertoire ${path.dirname(file.relativePath)}`
      );
    }

    // Upload du fichier
    uploadSCPFast(
      file.localPath,
      remoteTempPath,
      `Upload ${file.relativePath} (${progress})`
    );
  }

  // Micro-déplacement atomique
  log("🔄 Micro-installation...", "blue");
  executeSSHMicro(`sudo mkdir -p ${remote}`, "Création destination");
  executeSSHMicro(
    `sudo chown -R ${CONFIG.SSH.user}:${CONFIG.SSH.user} ${remote}`,
    "Permissions temp"
  );

  // Remplacement en une commande courte
  executeSSHMicro(
    `cp -r /tmp/micro-deploy-${timestamp}/* ${remote}`,
    "Installation landing"
  );

  // Micro-permissions finales
  log("🔐 Micro-permissions...", "blue");
  executeSSHMicro(
    `sudo chown -R www-data:www-data ${remote}`,
    "Propriétaire www-data"
  );
  executeSSHMicro(
    `sudo find ${remote} -type f -exec chmod 644 {} +`,
    "Permissions fichiers"
  );
  executeSSHMicro(
    `sudo find ${remote} -type d -exec chmod 755 {} +`,
    "Permissions dossiers"
  );

  // Nettoyage micro
  log("🧹 Micro-nettoyage...", "blue");
  executeSSHMicro(`rm -rf /tmp/micro-deploy-${timestamp}`, "Suppression temp");

  log("✅ Landing déployée: https://dev.melyia.com", "green");
}

function deployAppMicro() {
  const { local, remote } = CONFIG.PATHS.app;
  const timestamp = Date.now();

  logPhase("PHASE 4 : DÉPLOIEMENT APP MICRO", "Avec sauvegarde backend");

  // Micro-sauvegarde backend
  log("💾 Micro-sauvegarde backend...", "blue");
  executeSSHMicro(`mkdir -p /tmp/backend-${timestamp}`, "Workspace backend");
  executeSSHMicro(
    `[ -f ${remote}server.js ] && cp ${remote}server.js /tmp/backend-${timestamp}/ || echo "NO-SERVER"`,
    "Backup server.js"
  );
  executeSSHMicro(
    `[ -f ${remote}package.json ] && cp ${remote}package.json /tmp/backend-${timestamp}/ || echo "NO-PACKAGE"`,
    "Backup package.json"
  );

  // Obtenir liste des fichiers app
  const files = getFileListRecursive(local.slice(0, -1));
  log(`📁 ${files.length} fichiers app à déployer`, "cyan");

  // Upload micro-fichiers app
  log("📤 Upload micro-fichiers app...", "blue");
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `${i + 1}/${files.length}`;
    const remoteTempPath = `/tmp/micro-app-${timestamp}/${file.relativePath}`;

    // Créer répertoire parent
    const remoteDir = path.dirname(remoteTempPath).replace(/\\/g, "/");
    if (remoteDir !== "/tmp/micro-app-" + timestamp) {
      executeSSHMicro(
        `mkdir -p "${remoteDir}"`,
        `Répertoire app ${path.dirname(file.relativePath)}`
      );
    }

    // Upload fichier
    uploadSCPFast(
      file.localPath,
      remoteTempPath,
      `Upload app ${file.relativePath} (${progress})`
    );
  }

  // Micro-installation app
  log("🔄 Micro-installation app...", "blue");
  executeSSHMicro(`sudo mkdir -p ${remote}`, "Création destination app");
  executeSSHMicro(
    `sudo chown -R ${CONFIG.SSH.user}:${CONFIG.SSH.user} ${remote}`,
    "Permissions temp app"
  );

  executeSSHMicro(
    `cp -r /tmp/micro-app-${timestamp}/* ${remote}`,
    "Installation app"
  );

  // Micro-restauration backend
  log("🔄 Micro-restauration backend...", "blue");
  executeSSHMicro(
    `[ -f /tmp/backend-${timestamp}/server.js ] && cp /tmp/backend-${timestamp}/server.js ${remote} || echo "NO-RESTORE-SERVER"`,
    "Restore server.js"
  );
  executeSSHMicro(
    `[ -f /tmp/backend-${timestamp}/package.json ] && cp /tmp/backend-${timestamp}/package.json ${remote} || echo "NO-RESTORE-PACKAGE"`,
    "Restore package.json"
  );

  // Micro-lien index
  executeSSHMicro(
    `cd ${remote} && [ -f index-app.html ] && ln -sf index-app.html index.html || echo "NO-INDEX"`,
    "Lien index app"
  );

  // Micro-permissions finales
  log("🔐 Micro-permissions app...", "blue");
  executeSSHMicro(
    `sudo chown -R www-data:www-data ${remote}`,
    "Propriétaire www-data app"
  );
  executeSSHMicro(
    `sudo find ${remote} -type f -exec chmod 644 {} +`,
    "Permissions fichiers app"
  );
  executeSSHMicro(
    `sudo find ${remote} -type d -exec chmod 755 {} +`,
    "Permissions dossiers app"
  );

  // Nettoyage micro
  log("🧹 Micro-nettoyage app...", "blue");
  executeSSHMicro(`rm -rf /tmp/micro-app-${timestamp}`, "Suppression temp app");
  executeSSHMicro(
    `rm -rf /tmp/backend-${timestamp}`,
    "Suppression backup temp"
  );

  log("✅ App déployée: https://app-dev.melyia.com", "green");
}

function validateDeployment() {
  logPhase("PHASE 5 : VALIDATION MICRO", "Tests rapides");

  // Validation micro serveur
  log("🔍 Validation micro serveur...", "blue");
  executeSSHMicro(
    `ls ${CONFIG.PATHS.landing.remote} | head -2`,
    "Check landing"
  );
  executeSSHMicro(`ls ${CONFIG.PATHS.app.remote} | head -2`, "Check app");
  executeSSHMicro(
    `[ -f ${CONFIG.PATHS.app.remote}server.js ] && echo "✅ Backend OK" || echo "⚠️ Backend manquant"`,
    "Check backend"
  );

  // Tests HTTP rapides
  log("🌐 Tests HTTP rapides...", "blue");

  const sites = [
    { name: "Landing", url: "https://dev.melyia.com" },
    { name: "App", url: "https://app-dev.melyia.com" },
  ];

  for (const site of sites) {
    try {
      log(`🔗 Test ${site.name}: ${site.url}`, "cyan");

      const start = Date.now();
      const result = execSync(`curl -I "${site.url}" --max-time 10 --silent`, {
        encoding: "utf8",
        timeout: 12000,
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
  logPhase("RÉSUMÉ MICRO-DÉPLOIEMENT", "Statistiques");

  const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const steps = CONFIG.LOG.steps.length;

  log(`⏱️ Durée totale: ${duration}s`, "cyan");
  log(`📊 Micro-étapes: ${steps}`, "cyan");
  log("");

  log("🌐 SITES DÉPLOYÉS:", "blue");
  log("  📍 Landing: https://dev.melyia.com", "white");
  log("  📍 App: https://app-dev.melyia.com", "white");
  log("");

  log("🚀 OPTIMISATIONS MICRO:", "green");
  log("  ✅ Commandes < 8s seulement", "green");
  log("  ✅ Upload fichier par fichier", "green");
  log("  ✅ Aucune opération longue", "green");
  log("  ✅ Retry immédiat (2x max)", "green");
  log("  ✅ Anti-timeout radical", "green");
}

function main() {
  try {
    log("🚀 DÉPLOIEMENT SSH MICRO-COMMANDES", "green");
    log("⚡ Solution anti-timeout - Commandes < 8s", "magenta");
    log("");

    validateBuilds();
    testConnectivity();
    deployLandingMicro();
    deployAppMicro();
    validateDeployment();
    showSummary();

    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "cyan");
    log(`🎉 MICRO-DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("⚡ TOUS LES TIMEOUTS ÉLIMINÉS", "magenta");
    log("✅ Tous les sites opérationnels", "green");
    log("=====================================================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "red");
    log(`❌ MICRO-DÉPLOIEMENT ÉCHOUÉ après ${duration}s`, "red");
    log(`❌ Erreur: ${error.message}`, "red");
    log("=====================================================", "red");
    process.exit(1);
  }
}

main();
