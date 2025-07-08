// 🔍 DIAGNOSTIC CONNECTIVITÉ AVANCÉ - ANALYSE PROBLÈMES TIMEOUT
// Identifie la cause des timeouts SSH/SCP systématiques

import { execSync } from "child_process";

const CONFIG = {
  SSH: {
    user: "ubuntu",
    host: "51.91.145.255",
    keyPath: process.env.USERPROFILE + "\\.ssh\\melyia_main",
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

function logPhase(title) {
  log("");
  log("┌─────────────────────────────────────────┐", "magenta");
  log(`│ ${title.padEnd(39)} │`, "magenta");
  log("└─────────────────────────────────────────┘", "magenta");
  log("");
}

function executeTest(command, description, timeout = 10000) {
  const startTime = Date.now();
  try {
    log(`🔄 ${description}...`, "cyan");

    const result = execSync(command, {
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ ${description} - Réussi en ${duration}s`, "green");
    return {
      success: true,
      duration: parseFloat(duration),
      result: result.trim(),
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`❌ ${description} - Échoué après ${duration}s`, "red");
    return {
      success: false,
      duration: parseFloat(duration),
      error: error.message,
    };
  }
}

function testConnectiviteReseau() {
  logPhase("TEST 1 : CONNECTIVITÉ RÉSEAU DE BASE");

  // Test ping
  const ping = executeTest(
    `ping -n 4 ${CONFIG.SSH.host}`,
    "Ping serveur (4 paquets)",
    15000
  );

  // Test résolution DNS
  const dns = executeTest(
    `nslookup ${CONFIG.SSH.host}`,
    "Résolution DNS",
    5000
  );

  // Test traceroute (si disponible)
  const tracert = executeTest(
    `tracert -h 10 ${CONFIG.SSH.host}`,
    "Traceroute (10 hops max)",
    30000
  );

  return { ping, dns, tracert };
}

function testConnectiviteSSH() {
  logPhase("TEST 2 : CONNECTIVITÉ SSH");

  const baseSSH = `-o ConnectTimeout=10 -o ServerAliveInterval=5 -o BatchMode=yes -i "${CONFIG.SSH.keyPath}"`;

  // Test connexion SSH basique
  const sshBasic = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "echo SSH-OK"`,
    "SSH basique (10s timeout)",
    12000
  );

  // Test commande rapide
  const sshQuick = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "date"`,
    "SSH commande rapide",
    8000
  );

  // Test commande un peu plus longue
  const sshMedium = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "ls -la /var/www"`,
    "SSH commande medium",
    10000
  );

  return { sshBasic, sshQuick, sshMedium };
}

function testTransfertsSCP() {
  logPhase("TEST 3 : TRANSFERTS SCP");

  const baseSSH = `-o ConnectTimeout=10 -o ServerAliveInterval=5 -o BatchMode=yes -i "${CONFIG.SSH.keyPath}"`;

  // Créer fichier test petit
  try {
    const fs = require("fs");
    fs.writeFileSync("test-small.txt", "Test petit fichier SCP\n".repeat(100));
    fs.writeFileSync(
      "test-medium.txt",
      "Test fichier moyen SCP\n".repeat(5000)
    );
  } catch (error) {
    log(`❌ Erreur création fichiers test: ${error.message}`, "red");
    return { error: "Impossible de créer fichiers test" };
  }

  // Test upload petit fichier
  const scpSmall = executeTest(
    `scp ${baseSSH} test-small.txt ${CONFIG.SSH.user}@${CONFIG.SSH.host}:/tmp/`,
    "SCP petit fichier (2KB)",
    15000
  );

  // Test upload fichier moyen
  const scpMedium = executeTest(
    `scp ${baseSSH} test-medium.txt ${CONFIG.SSH.user}@${CONFIG.SSH.host}:/tmp/`,
    "SCP fichier moyen (100KB)",
    20000
  );

  // Nettoyage fichiers test
  try {
    const fs = require("fs");
    fs.unlinkSync("test-small.txt");
    fs.unlinkSync("test-medium.txt");
  } catch (error) {
    log(`⚠️ Nettoyage partiel: ${error.message}`, "yellow");
  }

  // Nettoyage serveur
  executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "rm -f /tmp/test-*.txt"`,
    "Nettoyage serveur",
    8000
  );

  return { scpSmall, scpMedium };
}

function testChargeServeur() {
  logPhase("TEST 4 : CHARGE SERVEUR");

  const baseSSH = `-o ConnectTimeout=10 -o ServerAliveInterval=5 -o BatchMode=yes -i "${CONFIG.SSH.keyPath}"`;

  // Test charge système
  const load = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "uptime && free -m && df -h"`,
    "Charge système (CPU/RAM/DISK)",
    8000
  );

  // Test processus
  const processes = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "ps aux | head -10"`,
    "Processus actifs (top 10)",
    8000
  );

  // Test nginx
  const nginx = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "sudo systemctl status nginx --no-pager"`,
    "État Nginx",
    8000
  );

  return { load, processes, nginx };
}

function testSecurite() {
  logPhase("TEST 5 : SÉCURITÉ & PROTECTIONS");

  const baseSSH = `-o ConnectTimeout=10 -o ServerAliveInterval=5 -o BatchMode=yes -i "${CONFIG.SSH.keyPath}"`;

  // Test fail2ban
  const fail2ban = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "sudo fail2ban-client status || echo 'FAIL2BAN-ABSENT'"`,
    "État Fail2ban",
    8000
  );

  // Test iptables
  const iptables = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "sudo iptables -L -n | head -20"`,
    "Règles iptables",
    8000
  );

  // Test connexions actives
  const connections = executeTest(
    `ssh ${baseSSH} ${CONFIG.SSH.user}@${CONFIG.SSH.host} "netstat -an | grep :22 | head -10"`,
    "Connexions SSH actives",
    8000
  );

  return { fail2ban, iptables, connections };
}

function analyseResultats(results) {
  logPhase("ANALYSE DIAGNOSTIC");

  const { reseau, ssh, scp, serveur, securite } = results;

  log("📊 RÉSULTATS DÉTAILLÉS:", "blue");
  log("");

  // Analyse réseau
  log("🌐 RÉSEAU:", "cyan");
  if (reseau.ping.success) {
    log(`  ✅ Ping: ${reseau.ping.duration}s`, "green");
  } else {
    log(`  ❌ Ping: ${reseau.ping.error}`, "red");
  }
  if (reseau.dns.success) {
    log(`  ✅ DNS: ${reseau.dns.duration}s`, "green");
  } else {
    log(`  ❌ DNS: ${reseau.dns.error}`, "red");
  }

  // Analyse SSH
  log("🔐 SSH:", "cyan");
  if (ssh.sshBasic.success) {
    log(`  ✅ Connexion basique: ${ssh.sshBasic.duration}s`, "green");
  } else {
    log(`  ❌ Connexion basique: ${ssh.sshBasic.error}`, "red");
  }
  if (ssh.sshQuick.success) {
    log(`  ✅ Commande rapide: ${ssh.sshQuick.duration}s`, "green");
  } else {
    log(`  ❌ Commande rapide: ${ssh.sshQuick.error}`, "red");
  }
  if (ssh.sshMedium.success) {
    log(`  ✅ Commande medium: ${ssh.sshMedium.duration}s`, "green");
  } else {
    log(`  ❌ Commande medium: ${ssh.sshMedium.error}`, "red");
  }

  // Analyse SCP
  log("📤 SCP:", "cyan");
  if (scp.scpSmall && scp.scpSmall.success) {
    log(`  ✅ Petit fichier: ${scp.scpSmall.duration}s`, "green");
  } else if (scp.scpSmall) {
    log(`  ❌ Petit fichier: ${scp.scpSmall.error}`, "red");
  }
  if (scp.scpMedium && scp.scpMedium.success) {
    log(`  ✅ Fichier moyen: ${scp.scpMedium.duration}s`, "green");
  } else if (scp.scpMedium) {
    log(`  ❌ Fichier moyen: ${scp.scpMedium.error}`, "red");
  }

  log("");

  // Diagnostic automatique
  log("🔍 DIAGNOSTIC AUTOMATIQUE:", "yellow");

  if (!reseau.ping.success) {
    log("  🚨 PROBLÈME RÉSEAU MAJEUR - Serveur inaccessible", "red");
  } else if (!ssh.sshBasic.success) {
    log("  🚨 PROBLÈME SSH - Service SSH inaccessible", "red");
  } else if (ssh.sshQuick.success && !ssh.sshMedium.success) {
    log("  ⚠️ PROTECTION ANTI-DOS - Commandes longues bloquées", "yellow");
  } else if (scp.scpSmall && !scp.scpSmall.success) {
    log("  🚨 PROBLÈME SCP TOTAL - Transfers impossibles", "red");
  } else if (scp.scpMedium && !scp.scpMedium.success) {
    log("  ⚠️ LIMITATION TAILLE - Gros fichiers bloqués", "yellow");
  } else if (ssh.sshMedium.duration > 10) {
    log("  ⚠️ LATENCE ÉLEVÉE - Connexion lente", "yellow");
  } else {
    log("  ✅ CONNECTIVITÉ NORMALE - Problème temporaire", "green");
  }

  log("");
  log("💡 RECOMMANDATIONS:", "blue");

  if (!reseau.ping.success || !ssh.sshBasic.success) {
    log("  🔄 Attendre 10-15 minutes et réessayer", "cyan");
    log("  📞 Contacter support OVH si persistant", "cyan");
  } else if (
    ssh.sshQuick.success &&
    ssh.sshMedium.success &&
    (!scp.scpSmall || !scp.scpSmall.success)
  ) {
    log("  🛡️ Protection anti-DOS active sur SCP", "cyan");
    log("  ⏳ Attendre 5-10 minutes avant retry", "cyan");
  } else {
    log("  ✅ Système opérationnel - Retry immédiat possible", "cyan");
  }
}

function main() {
  try {
    log("🔍 DIAGNOSTIC CONNECTIVITÉ AVANCÉ", "green");
    log("🎯 Identification cause timeouts SSH/SCP", "magenta");
    log("");

    const results = {
      reseau: testConnectiviteReseau(),
      ssh: testConnectiviteSSH(),
      scp: testTransfertsSCP(),
      serveur: testChargeServeur(),
      securite: testSecurite(),
    };

    analyseResultats(results);

    log("=====================================================", "cyan");
    log("🎉 DIAGNOSTIC CONNECTIVITÉ TERMINÉ", "green");
    log("📊 Analysez les résultats ci-dessus", "cyan");
    log("=====================================================", "cyan");
  } catch (error) {
    log("=====================================================", "red");
    log(`❌ DIAGNOSTIC ÉCHOUÉ: ${error.message}`, "red");
    log("=====================================================", "red");
    process.exit(1);
  }
}

main();
