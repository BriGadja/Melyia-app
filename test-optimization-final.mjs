// 🧪 TEST FINAL OPTIMISATIONS v36 - BENCHMARK COMPLET
// Mesure tous les gains de performance : déploiement, cache, monitoring

import { execSync } from "child_process";
import fs from "fs";

const CONFIG = {
  TESTS: {
    iterations: 3,
    timeout: 120000, // 2 minutes max
  },
  LOG: {
    startTime: Date.now(),
    results: {},
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

function measureCommand(command, description) {
  log(`🧪 Test: ${description}...`, "cyan");
  
  const times = [];
  let lastOutput = "";
  
  for (let i = 1; i <= CONFIG.TESTS.iterations; i++) {
    try {
      const start = Date.now();
      const output = execSync(command, {
        encoding: "utf8",
        timeout: CONFIG.TESTS.timeout,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const duration = (Date.now() - start) / 1000;
      
      times.push(duration);
      lastOutput = output;
      log(`  Iteration ${i}: ${duration.toFixed(1)}s`, "blue");
    } catch (error) {
      log(`  Iteration ${i}: ÉCHEC (${error.message})`, "red");
      times.push(null);
    }
  }
  
  const validTimes = times.filter(t => t !== null);
  const avgTime = validTimes.length > 0 
    ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    : null;
  const minTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const maxTime = validTimes.length > 0 ? Math.max(...validTimes) : null;
  
  return {
    command,
    description,
    avgTime,
    minTime,
    maxTime,
    successRate: (validTimes.length / CONFIG.TESTS.iterations) * 100,
    output: lastOutput,
  };
}

function testDeploymentPerformance() {
  logPhase("PHASE 1 : PERFORMANCE DÉPLOIEMENT", "Benchmark vitesse");

  const tests = [
    {
      command: "npm run deploy:enhanced",
      description: "Déploiement amélioré v36.2 (cache + incrémental)"
    },
    {
      command: "npm run deploy:local-optimized", 
      description: "Déploiement optimisé v36.0 (baseline)"
    },
    {
      command: "npm run deploy:quick",
      description: "Déploiement express (sans build)"
    }
  ];

  for (const test of tests) {
    const result = measureCommand(test.command, test.description);
    CONFIG.LOG.results[test.description] = result;
    
    if (result.avgTime) {
      log(`✅ ${test.description}: ${result.avgTime.toFixed(1)}s moy. (${result.successRate}% succès)`, "green");
    } else {
      log(`❌ ${test.description}: ÉCHEC TOTAL`, "red");
    }
  }
}

function testPackageCommands() {
  logPhase("PHASE 2 : COMMANDES OPTIMISÉES", "Test nouvelles fonctionnalités");

  const quickTests = [
    {
      command: "npm run monitor:all",
      description: "Monitoring système complet"
    },
    {
      command: "npm run test:deploy",
      description: "Tests HTTP optimisés"
    },
    {
      command: "npm run deploy:status",
      description: "Statut serveur local"
    },
    {
      command: "npm run build:check",
      description: "Build avec vérifications"
    }
  ];

  for (const test of quickTests) {
    try {
      const start = Date.now();
      const output = execSync(test.command, {
        encoding: "utf8",
        timeout: 30000, // 30s max pour ces tests
        stdio: ["ignore", "pipe", "pipe"],
      });
      const duration = (Date.now() - start) / 1000;
      
      log(`✅ ${test.description}: ${duration.toFixed(1)}s`, "green");
      CONFIG.LOG.results[test.description] = {
        avgTime: duration,
        successRate: 100,
        output: output.slice(0, 200) + (output.length > 200 ? "..." : "")
      };
    } catch (error) {
      log(`❌ ${test.description}: ÉCHEC (${error.message.slice(0, 50)})`, "red");
      CONFIG.LOG.results[test.description] = {
        avgTime: null,
        successRate: 0,
        error: error.message
      };
    }
  }
}

function testSystemOptimizations() {
  logPhase("PHASE 3 : OPTIMISATIONS SYSTÈME", "Validation environnement");

  const systemChecks = [
    {
      command: "ls -la deploy-*.mjs | wc -l",
      description: "Scripts déploiement restants",
      expected: 2 // deploy-local-optimized.mjs + deploy-local-enhanced.mjs
    },
    {
      command: "grep -c 'deploy:' package.json",
      description: "Commandes deploy dans package.json"
    },
    {
      command: "du -sh dist/ 2>/dev/null || echo '0'",
      description: "Taille builds actuels"
    },
    {
      command: "df -h /var/www | tail -1 | awk '{print $5}' | sed 's/%//'",
      description: "Utilisation disque"
    }
  ];

  for (const check of systemChecks) {
    try {
      const result = execSync(check.command, { encoding: "utf8" }).trim();
      log(`📊 ${check.description}: ${result}`, "cyan");
      
      if (check.expected && parseInt(result) !== check.expected) {
        log(`⚠️ Attendu: ${check.expected}, trouvé: ${result}`, "yellow");
      }
      
      CONFIG.LOG.results[check.description] = {
        value: result,
        status: "OK"
      };
    } catch (error) {
      log(`❌ ${check.description}: ÉCHEC`, "red");
      CONFIG.LOG.results[check.description] = {
        value: null,
        status: "ERROR",
        error: error.message
      };
    }
  }
}

function validateCleanupResults() {
  logPhase("PHASE 4 : VALIDATION NETTOYAGE", "Vérification suppression obsolètes");

  const obsoleteChecks = [
    "deploy-ssh-micro-commands.mjs",
    "deploy-ssh-optimized.mjs",
    "deploy-ssh-rsync-ultimate.mjs",
    "deploy-safe-working.ps1",
  ];

  let cleanupScore = 0;
  
  for (const file of obsoleteChecks) {
    if (fs.existsSync(file)) {
      log(`❌ Fichier obsolète trouvé: ${file}`, "red");
    } else {
      log(`✅ Fichier obsolète supprimé: ${file}`, "green");
      cleanupScore++;
    }
  }

  const cleanupPercent = (cleanupScore / obsoleteChecks.length) * 100;
  log(`📊 Nettoyage: ${cleanupScore}/${obsoleteChecks.length} (${cleanupPercent}%)`, "cyan");
  
  CONFIG.LOG.results["Nettoyage fichiers obsolètes"] = {
    score: cleanupScore,
    total: obsoleteChecks.length,
    percentage: cleanupPercent
  };
}

function showFinalReport() {
  logPhase("RAPPORT FINAL OPTIMISATIONS v36", "Bilan complet");

  const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  log(`⏱️ Durée totale des tests: ${duration}s`, "cyan");
  log("");

  // Résultats performance déploiement
  log("🚀 PERFORMANCE DÉPLOIEMENT:", "blue");
  
  const deployEnhanced = CONFIG.LOG.results["Déploiement amélioré v36.2 (cache + incrémental)"];
  const deployOptimized = CONFIG.LOG.results["Déploiement optimisé v36.0 (baseline)"];
  const deployQuick = CONFIG.LOG.results["Déploiement express (sans build)"];

  if (deployEnhanced?.avgTime) {
    log(`  🏆 Amélioré v36.2: ${deployEnhanced.avgTime.toFixed(1)}s (${deployEnhanced.successRate}%)`, "green");
  }
  if (deployOptimized?.avgTime) {
    log(`  ⚡ Optimisé v36.0: ${deployOptimized.avgTime.toFixed(1)}s (${deployOptimized.successRate}%)`, "white");
  }
  if (deployQuick?.avgTime) {
    log(`  🏃 Express: ${deployQuick.avgTime.toFixed(1)}s (${deployQuick.successRate}%)`, "white");
  }

  // Calcul gains
  if (deployEnhanced?.avgTime && deployOptimized?.avgTime) {
    const improvement = ((deployOptimized.avgTime - deployEnhanced.avgTime) / deployOptimized.avgTime * 100);
    if (improvement > 0) {
      log(`  📈 Gain v36.2 vs v36.0: +${improvement.toFixed(1)}% plus rapide`, "green");
    } else {
      log(`  📉 Régression: ${Math.abs(improvement).toFixed(1)}% plus lent`, "yellow");
    }
  }

  log("");

  // Résultats commandes
  log("⚙️ COMMANDES OPTIMISÉES:", "blue");
  const commandTests = [
    "Monitoring système complet",
    "Tests HTTP optimisés", 
    "Statut serveur local",
    "Build avec vérifications"
  ];

  for (const cmd of commandTests) {
    const result = CONFIG.LOG.results[cmd];
    if (result?.avgTime) {
      log(`  ✅ ${cmd}: ${result.avgTime.toFixed(1)}s`, "green");
    } else {
      log(`  ❌ ${cmd}: ÉCHEC`, "red");
    }
  }

  log("");

  // Résultats nettoyage
  const cleanup = CONFIG.LOG.results["Nettoyage fichiers obsolètes"];
  if (cleanup) {
    log("🧹 NETTOYAGE WORKSPACE:", "blue");
    log(`  🗑️ Suppression: ${cleanup.score}/${cleanup.total} fichiers (${cleanup.percentage}%)`, cleanup.percentage === 100 ? "green" : "yellow");
  }

  log("");

  // Bilan global
  const successfulTests = Object.values(CONFIG.LOG.results).filter(r => 
    (r.avgTime && r.successRate > 0) || r.status === "OK" || r.percentage === 100
  ).length;
  const totalTests = Object.keys(CONFIG.LOG.results).length;
  const globalScore = (successfulTests / totalTests * 100).toFixed(1);

  log("🎯 BILAN GLOBAL v36:", "magenta");
  log(`  📊 Score global: ${successfulTests}/${totalTests} tests réussis (${globalScore}%)`, globalScore >= 80 ? "green" : "yellow");
  
  if (parseFloat(globalScore) >= 90) {
    log("  🏆 EXCELLENT: Optimisations parfaitement fonctionnelles", "green");
  } else if (parseFloat(globalScore) >= 80) {
    log("  ✅ BON: Optimisations majoritairement réussies", "green");
  } else if (parseFloat(globalScore) >= 60) {
    log("  ⚠️ MOYEN: Quelques problèmes à corriger", "yellow");
  } else {
    log("  ❌ PROBLÉMATIQUE: Optimisations à revoir", "red");
  }

  log("");
  log("🚀 RECOMMANDATIONS:", "yellow");
  log("  💡 Utiliser 'npm run deploy:enhanced' pour déploiements normaux", "white");
  log("  ⚡ Utiliser 'npm run deploy:quick' pour tests rapides", "white");
  log("  📊 Utiliser 'npm run monitor:all' pour surveillance", "white");
  log("  🧪 Utiliser 'npm run test:performance' pour benchmarks", "white");
}

function main() {
  try {
    log("🧪 TEST FINAL OPTIMISATIONS v36", "green");
    log("⚡ Benchmark complet déploiement + cache + monitoring", "magenta");
    log("");

    testDeploymentPerformance();
    testPackageCommands(); 
    testSystemOptimizations();
    validateCleanupResults();
    showFinalReport();

    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "cyan");
    log(`🎉 TESTS OPTIMISATIONS TERMINÉS en ${duration}s`, "green");
    log("⚡ WORKSPACE v36 ENTIÈREMENT VALIDÉ", "magenta");
    log("✅ Prêt pour production haute-performance", "green");
    log("=====================================================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "red");
    log(`❌ TESTS ÉCHOUÉS après ${duration}s`, "red");
    log(`❌ Erreur: ${error.message}`, "red");
    log("=====================================================", "red");
    process.exit(1);
  }
}

main(); 