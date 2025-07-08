// 🔍 DIAGNOSTIC TIMEOUTS SSH - ANALYSE COMPLÈTE
// Ce script analyse tous les aspects pouvant causer des timeouts SSH

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    keyPath: process.env.USERPROFILE + "\\.ssh\\melyia_main",
  },
  TESTS: {
    connectTimeout: 30,
    execTimeout: 60000,
    maxRetries: 3,
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
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function formatTime(milliseconds) {
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

function executeSSHWithTiming(
  command,
  description,
  timeout = CONFIG.TESTS.execTimeout
) {
  const startTime = Date.now();

  try {
    log(`🔄 ${description}...`, "cyan");

    const result = execSync(command, {
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const duration = Date.now() - startTime;
    log(`✅ ${description} - ${formatTime(duration)}`, "green");

    return {
      success: true,
      duration,
      output: result,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ ${description} - Erreur après ${formatTime(duration)}`, "red");

    return {
      success: false,
      duration,
      error: error.message,
      exitCode: error.status,
      signal: error.signal,
    };
  }
}

function testBasicConnectivity() {
  log("🌐 Test de connectivité réseau de base...", "blue");

  const results = {};

  // Test ping
  const pingResult = executeSSHWithTiming(
    `ping -n 4 ${CONFIG.SSH.host}`,
    "Test ping réseau",
    10000
  );
  results.ping = pingResult;

  // Test port SSH
  const portResult = executeSSHWithTiming(
    `powershell -Command "Test-NetConnection -ComputerName ${CONFIG.SSH.host} -Port 22"`,
    "Test port SSH 22",
    15000
  );
  results.port = portResult;

  return results;
}

function testSSHAuthentication() {
  log("🔐 Test d'authentification SSH...", "blue");

  const baseSSHCmd = `ssh -o ConnectTimeout=${CONFIG.TESTS.connectTimeout} -o BatchMode=yes -o StrictHostKeyChecking=no`;

  const results = {};

  // Test avec clé
  if (fs.existsSync(CONFIG.SSH.keyPath)) {
    const keyResult = executeSSHWithTiming(
      `${baseSSHCmd} -i "${CONFIG.SSH.keyPath}" ${CONFIG.SSH.user}@${CONFIG.SSH.host} "echo 'SSH-KEY-OK'"`,
      "Test authentification par clé",
      30000
    );
    results.keyAuth = keyResult;
  } else {
    log(`⚠️ Clé SSH non trouvée: ${CONFIG.SSH.keyPath}`, "yellow");
    results.keyAuth = { success: false, error: "Clé SSH non trouvée" };
  }

  // Test sans clé (agent SSH)
  const agentResult = executeSSHWithTiming(
    `${baseSSHCmd} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "echo 'SSH-AGENT-OK'"`,
    "Test authentification par agent",
    30000
  );
  results.agentAuth = agentResult;

  return results;
}

function testSSHPerformance() {
  log("⚡ Test de performance SSH...", "blue");

  const baseSSHCmd = `ssh -o ConnectTimeout=${CONFIG.TESTS.connectTimeout} -o BatchMode=yes`;
  const sshCmd = fs.existsSync(CONFIG.SSH.keyPath)
    ? `${baseSSHCmd} -i "${CONFIG.SSH.keyPath}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}`
    : `${baseSSHCmd} ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  const results = {};

  // Commande simple
  const simpleResult = executeSSHWithTiming(
    `${sshCmd} "echo 'Hello World'"`,
    "Commande simple",
    30000
  );
  results.simpleCommand = simpleResult;

  // Commande avec charge CPU
  const cpuResult = executeSSHWithTiming(
    `${sshCmd} "uptime && free -h && df -h"`,
    "Commande système",
    60000
  );
  results.systemCommand = cpuResult;

  // Commande longue
  const longResult = executeSSHWithTiming(
    `${sshCmd} "find /var/www -name '*.js' -o -name '*.html' | head -20"`,
    "Commande longue",
    60000
  );
  results.longCommand = longResult;

  return results;
}

function testFileTransfer() {
  log("📁 Test de transfert de fichiers...", "blue");

  const results = {};

  // Créer un fichier de test
  const testFile = "./test-ssh-transfer.txt";
  const testContent = "Test SSH Transfer - " + new Date().toISOString();
  fs.writeFileSync(testFile, testContent);

  const baseScpCmd = `scp -o ConnectTimeout=${CONFIG.TESTS.connectTimeout} -o BatchMode=yes`;
  const scpCmd = fs.existsSync(CONFIG.SSH.keyPath)
    ? `${baseScpCmd} -i "${CONFIG.SSH.keyPath}"`
    : baseScpCmd;

  // Test upload
  const uploadResult = executeSSHWithTiming(
    `${scpCmd} ${testFile} ${CONFIG.SSH.user}@${CONFIG.SSH.host}:/tmp/test-upload.txt`,
    "Test upload fichier",
    60000
  );
  results.upload = uploadResult;

  // Test download
  const downloadResult = executeSSHWithTiming(
    `${scpCmd} ${CONFIG.SSH.user}@${CONFIG.SSH.host}:/tmp/test-upload.txt ./test-download.txt`,
    "Test download fichier",
    60000
  );
  results.download = downloadResult;

  // Nettoyage
  try {
    fs.unlinkSync(testFile);
    fs.unlinkSync("./test-download.txt");

    const cleanupSSH = fs.existsSync(CONFIG.SSH.keyPath)
      ? `ssh -i "${CONFIG.SSH.keyPath}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}`
      : `ssh ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

    execSync(`${cleanupSSH} "rm -f /tmp/test-upload.txt"`, { stdio: "ignore" });
  } catch (error) {
    log(`⚠️ Nettoyage: ${error.message}`, "yellow");
  }

  return results;
}

function testDeploymentScenarios() {
  log("🚀 Test de scénarios de déploiement...", "blue");

  const results = {};

  const baseSSHCmd = `ssh -o ConnectTimeout=${CONFIG.TESTS.connectTimeout} -o BatchMode=yes`;
  const sshCmd = fs.existsSync(CONFIG.SSH.keyPath)
    ? `${baseSSHCmd} -i "${CONFIG.SSH.keyPath}" ${CONFIG.SSH.user}@${CONFIG.SSH.host}`
    : `${baseSSHCmd} ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;

  // Test commande groupée (comme dans les déploiements)
  const groupedResult = executeSSHWithTiming(
    `${sshCmd} "mkdir -p /tmp/test-deploy && echo 'Phase 1 OK' && ls -la /tmp/test-deploy && echo 'Phase 2 OK' && rm -rf /tmp/test-deploy && echo 'Phase 3 OK'"`,
    "Commande groupée de déploiement",
    120000
  );
  results.groupedCommand = groupedResult;

  // Test avec sudo
  const sudoResult = executeSSHWithTiming(
    `${sshCmd} "sudo mkdir -p /tmp/test-sudo && sudo chown ${CONFIG.SSH.user}:${CONFIG.SSH.user} /tmp/test-sudo && sudo rm -rf /tmp/test-sudo"`,
    "Commandes avec sudo",
    120000
  );
  results.sudoCommand = sudoResult;

  // Test avec ServerAliveInterval
  const keepAliveResult = executeSSHWithTiming(
    `ssh -o ConnectTimeout=${
      CONFIG.TESTS.connectTimeout
    } -o ServerAliveInterval=30 -o BatchMode=yes ${
      fs.existsSync(CONFIG.SSH.keyPath) ? `-i "${CONFIG.SSH.keyPath}"` : ""
    } ${CONFIG.SSH.user}@${CONFIG.SSH.host} "sleep 60 && echo 'KeepAlive OK'"`,
    "Test KeepAlive (60s)",
    90000
  );
  results.keepAlive = keepAliveResult;

  return results;
}

function analyzeResults(results) {
  log("📊 Analyse des résultats...", "blue");

  const issues = [];
  const recommendations = [];

  // Analyse connectivité
  if (results.connectivity?.ping && !results.connectivity.ping.success) {
    issues.push("❌ Problème de connectivité réseau de base");
    recommendations.push(
      "Vérifier la connexion Internet et les paramètres réseau"
    );
  }

  if (results.connectivity?.port && !results.connectivity.port.success) {
    issues.push("❌ Port SSH 22 inaccessible");
    recommendations.push(
      "Vérifier les règles de firewall et la configuration du serveur"
    );
  }

  // Analyse authentification
  if (results.auth?.keyAuth && !results.auth.keyAuth.success) {
    issues.push("❌ Authentification par clé SSH échoue");
    recommendations.push("Vérifier la clé SSH et les permissions");
  }

  if (results.auth?.agentAuth && !results.auth.agentAuth.success) {
    issues.push("❌ Authentification par agent SSH échoue");
    recommendations.push(
      "Configurer l'agent SSH ou utiliser une clé spécifique"
    );
  }

  // Analyse performance
  if (
    results.performance?.simpleCommand &&
    results.performance.simpleCommand.duration > 10000
  ) {
    issues.push("⚠️ Commandes SSH simples lentes (>10s)");
    recommendations.push(
      "Optimiser la configuration SSH avec compression et keep-alive"
    );
  }

  if (
    results.performance?.longCommand &&
    results.performance.longCommand.duration > 60000
  ) {
    issues.push("⚠️ Commandes SSH longues très lentes (>60s)");
    recommendations.push("Diviser les commandes longues en plusieurs étapes");
  }

  // Analyse transfert
  if (results.transfer?.upload && !results.transfer.upload.success) {
    issues.push("❌ Problème de transfert de fichiers");
    recommendations.push("Vérifier les permissions et l'espace disque");
  }

  // Analyse déploiement
  if (
    results.deployment?.groupedCommand &&
    !results.deployment.groupedCommand.success
  ) {
    issues.push("❌ Commandes groupées de déploiement échouent");
    recommendations.push("Séparer les commandes en phases distinctes");
  }

  if (results.deployment?.keepAlive && !results.deployment.keepAlive.success) {
    issues.push("❌ Problème de maintien de connexion SSH");
    recommendations.push(
      "Configurer ServerAliveInterval et ClientAliveInterval"
    );
  }

  return { issues, recommendations };
}

function generateReport(results, analysis) {
  log("📋 Génération du rapport...", "blue");

  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results,
    analysis,
    summary: {
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
    },
  };

  // Compter les tests
  function countTests(obj) {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === "object") {
        if (obj[key].hasOwnProperty("success")) {
          report.summary.totalTests++;
          if (obj[key].success) {
            report.summary.successfulTests++;
          } else {
            report.summary.failedTests++;
          }
        } else {
          countTests(obj[key]);
        }
      }
    }
  }

  countTests(results);

  // Sauvegarder le rapport
  const reportPath = `./audit-ssh-timeouts-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`📄 Rapport sauvegardé: ${reportPath}`, "green");

  return report;
}

function displaySummary(report) {
  log("📊 RÉSUMÉ DU DIAGNOSTIC SSH", "magenta");
  log("================================", "magenta");

  log(
    `✅ Tests réussis: ${report.summary.successfulTests}/${report.summary.totalTests}`,
    "green"
  );
  log(
    `❌ Tests échoués: ${report.summary.failedTests}/${report.summary.totalTests}`,
    "red"
  );

  if (report.analysis.issues.length > 0) {
    log("\n🚨 PROBLÈMES IDENTIFIÉS:", "red");
    report.analysis.issues.forEach((issue, index) => {
      log(`${index + 1}. ${issue}`, "red");
    });
  }

  if (report.analysis.recommendations.length > 0) {
    log("\n💡 RECOMMANDATIONS:", "yellow");
    report.analysis.recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`, "yellow");
    });
  }

  log("\n🎯 OPTIMISATIONS SUGGÉRÉES:", "cyan");
  log("1. Augmenter ConnectTimeout à 60s", "cyan");
  log("2. Ajouter ServerAliveInterval=30", "cyan");
  log("3. Utiliser compression SSH (-o Compression=yes)", "cyan");
  log("4. Séparer les commandes longues en phases", "cyan");
  log("5. Ajouter un système de retry avec backoff", "cyan");
  log("6. Optimiser les commandes groupées", "cyan");

  log("\n================================", "magenta");
}

async function main() {
  const startTime = Date.now();

  log("🔍 DIAGNOSTIC TIMEOUTS SSH COMPLET", "green");
  log("===================================", "cyan");

  try {
    const results = {};

    // Tests de connectivité
    results.connectivity = testBasicConnectivity();

    // Tests d'authentification
    results.auth = testSSHAuthentication();

    // Tests de performance
    results.performance = testSSHPerformance();

    // Tests de transfert
    results.transfer = testFileTransfer();

    // Tests de déploiement
    results.deployment = testDeploymentScenarios();

    // Analyse des résultats
    const analysis = analyzeResults(results);

    // Génération du rapport
    const report = generateReport(results, analysis);

    // Affichage du résumé
    displaySummary(report);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\n🎉 Diagnostic terminé en ${duration}s`, "green");
  } catch (error) {
    log(`❌ Erreur durant le diagnostic: ${error.message}`, "red");
    process.exit(1);
  }
}

// Démarrage du diagnostic
main().catch(console.error);
