// 🔍 DIAGNOSTIC SSH SIMPLIFIÉ - TESTS ESSENTIELS RAPIDES
// Version optimisée pour Windows sans timeouts

import fs from "fs";
import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    keyPath: process.env.USERPROFILE + "\\.ssh\\melyia_main",
    connectTimeout: 30,
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

function buildSSHCommand() {
  const options = [
    `-o ConnectTimeout=${CONFIG.SSH.connectTimeout}`,
    `-o BatchMode=yes`,
    `-o StrictHostKeyChecking=no`,
    `-o LogLevel=ERROR`,
  ];

  if (fs.existsSync(CONFIG.SSH.keyPath)) {
    options.push(`-i "${CONFIG.SSH.keyPath}"`);
  }

  return `ssh ${options.join(" ")} ${CONFIG.SSH.user}@${CONFIG.SSH.host}`;
}

function runTest(testName, command, timeout = 30000) {
  try {
    log(`🔄 Test: ${testName}...`, "blue");
    const startTime = Date.now();

    const result = execSync(command, {
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ ${testName} - Réussi en ${duration}s`, "green");

    return {
      success: true,
      duration: parseFloat(duration),
      result: result.trim(),
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`❌ ${testName} - Échoué après ${duration}s`, "red");
    log(`💡 Erreur: ${error.message}`, "yellow");

    return {
      success: false,
      duration: parseFloat(duration),
      error: error.message,
    };
  }
}

function main() {
  const startTime = Date.now();

  log("🔍 DIAGNOSTIC SSH SIMPLIFIÉ - TESTS ESSENTIELS", "magenta");
  log("============================================", "magenta");
  log("");

  const results = {
    summary: { totalTests: 0, successfulTests: 0, failedTests: 0 },
    tests: [],
    recommendations: [],
  };

  const sshBase = buildSSHCommand();

  // Test 1: Connectivité de base
  const test1 = runTest(
    "Connectivité SSH de base",
    `${sshBase} "echo 'SSH-CONNECTIVITY-OK'"`,
    30000
  );
  results.tests.push({ name: "Connectivité SSH", ...test1 });
  results.summary.totalTests++;
  if (test1.success) results.summary.successfulTests++;
  else results.summary.failedTests++;

  // Test 2: Informations système
  if (test1.success) {
    const test2 = runTest(
      "Informations système",
      `${sshBase} "date && uptime && whoami"`,
      20000
    );
    results.tests.push({ name: "Informations système", ...test2 });
    results.summary.totalTests++;
    if (test2.success) results.summary.successfulTests++;
    else results.summary.failedTests++;
  }

  // Test 3: Permissions web
  if (test1.success) {
    const test3 = runTest(
      "Vérification permissions web",
      `${sshBase} "ls -la /var/www/melyia/ | head -3"`,
      20000
    );
    results.tests.push({ name: "Permissions web", ...test3 });
    results.summary.totalTests++;
    if (test3.success) results.summary.successfulTests++;
    else results.summary.failedTests++;
  }

  // Test 4: Espace disque
  if (test1.success) {
    const test4 = runTest(
      "Espace disque disponible",
      `${sshBase} "df -h / | tail -1"`,
      15000
    );
    results.tests.push({ name: "Espace disque", ...test4 });
    results.summary.totalTests++;
    if (test4.success) results.summary.successfulTests++;
    else results.summary.failedTests++;
  }

  // Test 5: Services web
  if (test1.success) {
    const test5 = runTest(
      "État des services web",
      `${sshBase} "sudo systemctl is-active nginx && pm2 status --silent | head -3"`,
      25000
    );
    results.tests.push({ name: "Services web", ...test5 });
    results.summary.totalTests++;
    if (test5.success) results.summary.successfulTests++;
    else results.summary.failedTests++;
  }

  // Génération des recommandations
  if (results.summary.successfulTests === 0) {
    results.recommendations.push(
      "Vérifier la connectivité réseau et les clés SSH"
    );
    results.recommendations.push("Confirmer que le serveur est accessible");
  } else if (results.summary.successfulTests < results.summary.totalTests) {
    results.recommendations.push(
      "Certains tests ont échoué - vérifier les permissions"
    );
    results.recommendations.push("Vérifier les services nginx et PM2");
  } else {
    results.recommendations.push(
      "Tous les tests sont passés - SSH optimisé prêt"
    );
  }

  // Résumé final
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  log("", "white");
  log("📊 RÉSUMÉ DU DIAGNOSTIC", "blue");
  log("======================", "blue");
  log(`⏱️ Durée totale: ${totalDuration}s`, "cyan");
  log(
    `📊 Tests: ${results.summary.successfulTests}/${results.summary.totalTests} réussis`,
    "cyan"
  );

  if (results.summary.successfulTests === results.summary.totalTests) {
    log("✅ DIAGNOSTIC COMPLET: Tous les tests SSH passent", "green");
    log("🎯 Le système est prêt pour le déploiement", "green");
  } else if (results.summary.successfulTests > 0) {
    log("⚠️ DIAGNOSTIC PARTIEL: Certains problèmes détectés", "yellow");
    log("💡 Le déploiement peut fonctionner avec limitations", "yellow");
  } else {
    log("❌ DIAGNOSTIC ÉCHOUÉ: Problèmes SSH majeurs", "red");
    log("🚨 Résoudre les problèmes avant déploiement", "red");
  }

  log("", "white");
  log("💡 RECOMMANDATIONS:", "blue");
  results.recommendations.forEach((rec) => {
    log(`  • ${rec}`, "cyan");
  });

  // Sauvegarde du rapport
  const reportFile = `diagnostic-ssh-simple-${Date.now()}.json`;
  try {
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    log("", "white");
    log(`📄 Rapport sauvegardé: ${reportFile}`, "green");
  } catch (error) {
    log(`⚠️ Impossible de sauvegarder le rapport: ${error.message}`, "yellow");
  }

  log("", "white");
  log("🔧 COMMANDES SUIVANTES RECOMMANDÉES:", "blue");
  if (results.summary.successfulTests >= 3) {
    log("  npm run deploy:full          # Déploiement complet", "green");
  } else {
    log("  npm run deploy:ssh-test      # Test de base", "yellow");
  }

  // Code de sortie
  if (results.summary.successfulTests === 0) {
    process.exit(1);
  }
}

main();
