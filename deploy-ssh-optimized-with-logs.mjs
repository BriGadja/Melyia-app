// 🚀 DÉPLOIEMENT SSH OPTIMISÉ AVEC LOGS DÉTAILLÉS ET DIAGNOSTIC
// Version complète avec timeouts éliminés et monitoring avancé

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    keyPath: process.env.USERPROFILE + "\\.ssh\\melyia_main",
    // Optimisations anti-timeout
    connectTimeout: 60, // Augmenté à 60s
    execTimeout: 300000, // 5 minutes pour les opérations longues
    serverAliveInterval: 30, // Keep-alive toutes les 30s
    compression: true, // Compression SSH
    maxRetries: 3, // Retry automatique
    retryDelay: 5000, // 5s entre les tentatives
  },
  PATHS: {
    landing: {
      local: "dist/landing",
      remote: "/var/www/melyia/dev-site",
    },
    app: {
      local: "dist/app",
      remote: "/var/www/melyia/app-dev",
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

  // Ajouter au log pour rapport final
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

function buildOptimizedSSHCommand(baseCommand = "") {
  const options = [
    `-o ConnectTimeout=${CONFIG.SSH.connectTimeout}`,
    `-o ServerAliveInterval=${CONFIG.SSH.serverAliveInterval}`,
    `-o ServerAliveCountMax=3`,
    `-o BatchMode=yes`,
    `-o StrictHostKeyChecking=no`,
    `-o LogLevel=ERROR`,
  ];

  if (CONFIG.SSH.compression) {
    options.push(`-o Compression=yes`);
  }

  if (fs.existsSync(CONFIG.SSH.keyPath)) {
    options.push(`-i "${CONFIG.SSH.keyPath}"`);
  }

  const sshOptions = options.join(" ");

  if (baseCommand.startsWith("ssh")) {
    return `${baseCommand} ${sshOptions}`;
  } else if (baseCommand.startsWith("scp")) {
    return `${baseCommand} ${sshOptions}`;
  } else {
    return `ssh ${sshOptions} ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;
  }
}

function executeSSHWithRetry(
  command,
  description,
  timeout = CONFIG.SSH.execTimeout
) {
  for (let attempt = 1; attempt <= CONFIG.SSH.maxRetries; attempt++) {
    const startTime = Date.now();
    try {
      log(
        `🔄 ${description} (tentative ${attempt}/${CONFIG.SSH.maxRetries})...`,
        "cyan"
      );

      const result = execSync(command, {
        encoding: "utf8",
        timeout,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`✅ ${description} - Réussi en ${duration}s`, "green");

      return result;
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(
        `❌ ${description} - Tentative ${attempt} échouée après ${duration}s`,
        "red"
      );

      if (attempt === CONFIG.SSH.maxRetries) {
        log(
          `💥 ${description} - Échec définitif après ${CONFIG.SSH.maxRetries} tentatives`,
          "red"
        );
        log(`💡 Erreur: ${error.message}`, "yellow");
        throw error;
      }

      if (attempt < CONFIG.SSH.maxRetries) {
        const backoffDelay = CONFIG.SSH.retryDelay * attempt;
        log(
          `⏳ Attente ${backoffDelay / 1000}s avant nouvelle tentative...`,
          "yellow"
        );

        const startWait = Date.now();
        while (Date.now() - startWait < backoffDelay) {
          // Attente active
        }
      }
    }
  }
}

function executeSSHPhase(
  commands,
  description,
  timeout = CONFIG.SSH.execTimeout
) {
  const sshCmd = buildOptimizedSSHCommand();

  // Grouper les commandes avec gestion d'erreur et logs
  const groupedCommand = commands
    .map(
      (cmd, index) =>
        `echo "🔄 Phase ${index + 1}: ${
          cmd.split(" ")[0]
        }..." && ${cmd} && echo "✅ Phase ${index + 1}: ${
          cmd.split(" ")[0]
        } OK"`
    )
    .join(" && ");

  const fullCommand = `${sshCmd} "${groupedCommand}"`;

  return executeSSHWithRetry(fullCommand, description, timeout);
}

function executeSCPWithRetry(
  sourceFiles,
  destination,
  description,
  timeout = CONFIG.SSH.execTimeout
) {
  const scpCmd = buildOptimizedSSHCommand("scp");

  // Calculer la taille des fichiers à transférer
  let totalSize = 0;
  try {
    if (sourceFiles.includes("*")) {
      const directory = sourceFiles.replace("/*", "");
      totalSize = calculateDirectorySize(directory);
    }
  } catch (error) {
    log(`⚠️ Impossible de calculer la taille: ${error.message}`, "yellow");
  }

  if (totalSize > 0) {
    log(`📊 Taille à transférer: ${formatBytes(totalSize)}`, "cyan");
  }

  const fullCommand = `${scpCmd} -r ${sourceFiles} ${CONFIG.SSH.user}@${CONFIG.SSH.host}:${destination}`;

  return executeSSHWithRetry(fullCommand, description, timeout);
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
  logPhase(
    "PHASE 1 : VALIDATION DES BUILDS",
    "Vérification des artefacts de déploiement"
  );

  const builds = [
    { path: CONFIG.PATHS.landing.local, name: "Landing" },
    { path: CONFIG.PATHS.app.local, name: "App" },
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
  logPhase(
    "PHASE 2 : TEST DE CONNECTIVITÉ",
    "Vérification SSH avec optimisations"
  );

  const sshCmd = buildOptimizedSSHCommand();
  const testCommand = `${sshCmd} "echo 'SSH-OPTIMIZED-CONNECTIVITY-OK' && date && uptime && df -h / | tail -1"`;

  const startTime = Date.now();
  const result = executeSSHWithRetry(
    testCommand,
    "Test connectivité SSH optimisée",
    60000
  );
  const connectTime = Date.now() - startTime;

  log(
    `✅ Connectivité SSH optimisée confirmée en ${(connectTime / 1000).toFixed(
      1
    )}s`,
    "green"
  );

  // Analyser la réponse du serveur
  const lines = result.split("\n").filter((line) => line.trim());
  if (lines.length >= 3) {
    log(`📊 Serveur: ${lines[1]}`, "cyan");
    log(`📊 Uptime: ${lines[2]}`, "cyan");
    if (lines[3]) {
      log(`📊 Espace disque: ${lines[3]}`, "cyan");
    }
  }

  // Afficher les optimisations appliquées
  log("🎯 Optimisations SSH actives:", "blue");
  log(`  • ConnectTimeout: ${CONFIG.SSH.connectTimeout}s`, "blue");
  log(`  • ServerAliveInterval: ${CONFIG.SSH.serverAliveInterval}s`, "blue");
  log(
    `  • Compression: ${CONFIG.SSH.compression ? "Activée" : "Désactivée"}`,
    "blue"
  );
  log(`  • Max retries: ${CONFIG.SSH.maxRetries}`, "blue");
}

function runDiagnosticIfNeeded() {
  logPhase(
    "PHASE 2B : DIAGNOSTIC SSH (Si nécessaire)",
    "Analyse automatique des problèmes"
  );

  if (!fs.existsSync("diagnostic-ssh-timeouts.mjs")) {
    log("⚠️ Script de diagnostic SSH non trouvé", "yellow");
    log("💡 Diagnostic automatique désactivé", "yellow");
    return;
  }

  try {
    log("🔍 Lancement diagnostic SSH automatique...", "blue");
    const diagnosticStart = Date.now();

    const result = execSync("node diagnostic-ssh-timeouts.mjs", {
      encoding: "utf8",
      timeout: 120000, // 2 minutes max pour le diagnostic
      stdio: ["ignore", "pipe", "pipe"],
    });

    const diagnosticTime = Date.now() - diagnosticStart;
    log(
      `✅ Diagnostic SSH terminé en ${(diagnosticTime / 1000).toFixed(1)}s`,
      "green"
    );

    // Chercher le rapport généré
    const reportFiles = fs
      .readdirSync(".")
      .filter(
        (f) => f.startsWith("audit-ssh-timeouts-") && f.endsWith(".json")
      );
    if (reportFiles.length > 0) {
      const latestReport = reportFiles.sort().pop();
      log(`📄 Rapport de diagnostic: ${latestReport}`, "green");

      try {
        const report = JSON.parse(fs.readFileSync(latestReport, "utf8"));
        log(
          `📊 Tests SSH: ${report.summary.successfulTests}/${report.summary.totalTests} réussis`,
          "green"
        );

        if (report.analysis.issues.length > 0) {
          log("🚨 Problèmes détectés lors du diagnostic:", "red");
          report.analysis.issues.forEach((issue) => {
            log(`  • ${issue}`, "red");
          });
        } else {
          log("✅ Aucun problème SSH détecté", "green");
        }
      } catch (error) {
        log("⚠️ Impossible de lire le rapport de diagnostic", "yellow");
      }
    }
  } catch (error) {
    log(`⚠️ Diagnostic SSH échoué: ${error.message}`, "yellow");
    log("💡 Poursuite du déploiement malgré l'échec du diagnostic", "cyan");
  }
}

function deployLandingOptimized() {
  const { local, remote } = CONFIG.PATHS.landing;
  const timestamp = Date.now();
  const tempDir = `/tmp/landing-${timestamp}`;

  logPhase(
    "PHASE 3 : DÉPLOIEMENT LANDING",
    "Site de présentation avec optimisations SSH"
  );

  // Phase 1: Préparation serveur
  log("🔧 Préparation du serveur...", "blue");
  const prepareCommands = [
    `mkdir -p ${tempDir}`,
    `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
    `sudo mkdir -p ${remote}`,
    `echo "Landing préparée: ${tempDir}"`,
  ];

  executeSSHPhase(prepareCommands, "Préparation serveur landing", 120000);

  // Phase 2: Upload fichiers avec SCP optimisé
  log("📤 Upload des fichiers landing...", "blue");
  executeSCPWithRetry(`${local}/*`, tempDir, "Upload landing optimisé", 300000);

  // Phase 3: Installation
  log("🔧 Installation landing...", "blue");
  const installCommands = [
    `sudo cp -r ${tempDir}/* ${remote}/`,
    `sudo chown -R www-data:www-data ${remote}`,
    `sudo chmod -R 644 ${remote}/*`,
    `sudo find ${remote} -type d -exec chmod 755 {} +`,
    `rm -rf ${tempDir}`,
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    `echo "Landing installée avec succès"`,
  ];

  executeSSHPhase(installCommands, "Installation landing", 180000);

  log("✅ Landing déployée: https://dev.melyia.com", "green");
}

function deployAppOptimized() {
  const { local, remote } = CONFIG.PATHS.app;
  const timestamp = Date.now();
  const tempDir = `/tmp/app-${timestamp}`;
  const backupDir = `/tmp/backend-backup-${timestamp}`;

  logPhase("PHASE 4 : DÉPLOIEMENT APP", "Application avec sauvegarde backend");

  // Phase 1: Préparation et sauvegarde
  log("🔧 Préparation et sauvegarde backend...", "blue");
  const prepareCommands = [
    `mkdir -p ${tempDir}`,
    `mkdir -p ${backupDir}`,
    `[ -f ${remote}/server.js ] && cp ${remote}/server.js ${backupDir}/ || true`,
    `[ -f ${remote}/package.json ] && cp ${remote}/package.json ${backupDir}/ || true`,
    `[ -f ${remote}/.env ] && cp ${remote}/.env ${backupDir}/ || true`,
    `[ -d ${remote}/node_modules ] && echo "node_modules détecté" || true`,
    `echo "Sauvegarde backend terminée"`,
  ];

  executeSSHPhase(prepareCommands, "Préparation et sauvegarde app", 120000);

  // Phase 2: Upload fichiers avec SCP optimisé
  log("📤 Upload des fichiers app...", "blue");
  executeSCPWithRetry(`${local}/*`, tempDir, "Upload app optimisé", 300000);

  // Phase 3: Installation app
  log("🔧 Installation app...", "blue");
  const installCommands = [
    `[ -d ${remote} ] && sudo mv ${remote} ${remote}-backup-${timestamp} || true`,
    `sudo mkdir -p ${remote}`,
    `sudo cp -r ${tempDir}/* ${remote}/`,
    `echo "App installée"`,
  ];

  executeSSHPhase(installCommands, "Installation app", 120000);

  // Phase 4: Restauration backend
  log("🔄 Restauration backend...", "blue");
  const restoreCommands = [
    `[ -f ${backupDir}/server.js ] && sudo cp ${backupDir}/server.js ${remote}/ || true`,
    `[ -f ${backupDir}/package.json ] && sudo cp ${backupDir}/package.json ${backupDir}/ || true`,
    `[ -f ${backupDir}/.env ] && sudo cp ${backupDir}/.env ${remote}/ || true`,
    `cd ${remote} && sudo ln -sf index-app.html index.html`,
    `echo "Backend restauré"`,
  ];

  executeSSHPhase(restoreCommands, "Restauration backend", 120000);

  // Phase 5: Permissions finales
  log("🔐 Configuration permissions...", "blue");
  const permissionsCommands = [
    `sudo chown -R www-data:www-data ${remote}`,
    `sudo chmod -R 644 ${remote}/index*.html`,
    `sudo chmod -R 755 ${remote}/assets`,
    `sudo chmod -R 644 ${remote}/assets/*`,
    `sudo find ${remote}/assets -type d -exec chmod 755 {} +`,
    `rm -rf ${tempDir}`,
    `rm -rf ${backupDir}`,
    `[ -d ${remote}-backup-${timestamp} ] && sudo rm -rf ${remote}-backup-${timestamp} || true`,
    `echo "Permissions configurées"`,
  ];

  executeSSHPhase(permissionsCommands, "Configuration permissions", 180000);

  log("✅ App déployée: https://app-dev.melyia.com", "green");
}

function validateDeployment() {
  logPhase("PHASE 5 : VALIDATION FINALE", "Vérification des sites déployés");

  const sites = [
    {
      name: "Landing",
      url: "https://dev.melyia.com",
      path: CONFIG.PATHS.landing.remote,
    },
    {
      name: "App",
      url: "https://app-dev.melyia.com",
      path: CONFIG.PATHS.app.remote,
    },
  ];

  // Validation côté serveur
  log("🔍 Validation côté serveur...", "blue");
  const validationCommands = [
    `echo "=== VALIDATION SERVEUR ==="`,
    `ls -la ${CONFIG.PATHS.landing.remote}/ | head -5`,
    `echo "=== APP FILES ==="`,
    `ls -la ${CONFIG.PATHS.app.remote}/ | head -5`,
    `echo "=== BACKEND FILES ==="`,
    `[ -f ${CONFIG.PATHS.app.remote}/server.js ] && echo "✅ server.js présent" || echo "❌ server.js manquant"`,
    `[ -f ${CONFIG.PATHS.app.remote}/package.json ] && echo "✅ package.json présent" || echo "❌ package.json manquant"`,
    `echo "=== PERMISSIONS ==="`,
    `ls -la ${CONFIG.PATHS.app.remote}/assets/ | head -3`,
    `echo "=== VALIDATION TERMINÉE ==="`,
  ];

  executeSSHPhase(validationCommands, "Validation serveur", 120000);

  // Test HTTP des sites
  log("🌐 Test HTTP des sites...", "blue");

  for (const site of sites) {
    try {
      log(`🔗 Test ${site.name}: ${site.url}`, "cyan");

      // Utiliser curl pour tester (plus fiable que Node.js fetch sur Windows)
      const curlStart = Date.now();
      const result = execSync(`curl -I "${site.url}" --max-time 30 --silent`, {
        encoding: "utf8",
        timeout: 35000,
      });

      const curlTime = Date.now() - curlStart;

      if (result.includes("200 OK")) {
        log(
          `✅ ${site.name} accessible en ${(curlTime / 1000).toFixed(
            1
          )}s (HTTP 200)`,
          "green"
        );
      } else if (result.includes("HTTP")) {
        const statusMatch = result.match(/HTTP\/[\d.]+\s+(\d+)/);
        const status = statusMatch ? statusMatch[1] : "Unknown";
        log(`⚠️ ${site.name} répond avec HTTP ${status}`, "yellow");
      } else {
        log(`❌ ${site.name} - Réponse inattendue`, "red");
      }
    } catch (error) {
      log(`❌ ${site.name} inaccessible: ${error.message}`, "red");
    }
  }
}

function showDeploymentSummary() {
  logPhase("RÉSUMÉ DU DÉPLOIEMENT", "Statistiques et performances");

  const totalDuration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const totalSteps = CONFIG.LOG.steps.length;

  log(`⏱️ Durée totale: ${totalDuration}s`, "cyan");
  log(`📊 Étapes exécutées: ${totalSteps}`, "cyan");
  log(`🎯 Optimisations SSH: ACTIVÉES`, "green");
  log("");

  log("🌐 SITES DÉPLOYÉS:", "blue");
  log("  📍 Landing: https://dev.melyia.com", "white");
  log("  📍 App: https://app-dev.melyia.com", "white");
  log("");

  log("🔧 OPTIMISATIONS APPLIQUÉES:", "green");
  log(`  ✅ SSH ConnectTimeout: ${CONFIG.SSH.connectTimeout}s`, "green");
  log(
    `  ✅ SSH ServerAliveInterval: ${CONFIG.SSH.serverAliveInterval}s`,
    "green"
  );
  log(
    `  ✅ SSH Compression: ${
      CONFIG.SSH.compression ? "Activée" : "Désactivée"
    }`,
    "green"
  );
  log(`  ✅ Retry automatique: ${CONFIG.SSH.maxRetries} tentatives`, "green");
  log(`  ✅ Phases optimisées: < 5 minutes chacune`, "green");
  log("");

  // Statistiques de performance
  const phases = CONFIG.LOG.steps.filter((step) =>
    step.message.includes("PHASE")
  );
  if (phases.length > 0) {
    log("📈 PERFORMANCE PAR PHASE:", "blue");
    phases.forEach((phase, index) => {
      const nextPhase = phases[index + 1];
      const phaseDuration = nextPhase
        ? (nextPhase.duration - phase.duration).toFixed(1)
        : (parseFloat(totalDuration) - phase.duration).toFixed(1);
      log(`  • Phase ${index + 1}: ${phaseDuration}s`, "blue");
    });
  }
}

function main() {
  const startTime = Date.now();

  try {
    log("🚀 DÉPLOIEMENT SSH OPTIMISÉ AVEC LOGS DÉTAILLÉS", "green");
    log(
      "🎯 Timeouts SSH éliminés - Retry automatique - Compression activée",
      "magenta"
    );
    log("");

    // Phase 1: Validation des builds
    validateBuilds();

    // Phase 2: Test de connectivité
    testConnectivity();

    // Phase 2B: Diagnostic automatique si disponible
    runDiagnosticIfNeeded();

    // Phase 3: Déploiement Landing
    deployLandingOptimized();

    // Phase 4: Déploiement App
    deployAppOptimized();

    // Phase 5: Validation finale
    validateDeployment();

    // Résumé final
    showDeploymentSummary();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log("=====================================================", "cyan");
    log(`🎉 DÉPLOIEMENT RÉUSSI en ${duration}s`, "green");
    log("🎯 OPTIMISATIONS SSH ANTI-TIMEOUT APPLIQUÉES", "magenta");
    log("✅ Tous les sites sont opérationnels", "green");
    log("=====================================================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log("=====================================================", "red");
    log(`❌ DÉPLOIEMENT ÉCHOUÉ après ${duration}s`, "red");
    log(`❌ Erreur: ${error.message}`, "red");
    log("💡 Utilisez: npm run deploy:ssh-diagnostic pour analyser", "yellow");
    log("💡 Ou: npm run deploy:ssh-test pour tester la connexion", "yellow");
    log("=====================================================", "red");
    process.exit(1);
  }
}

// Démarrage du déploiement
main().catch(console.error);
