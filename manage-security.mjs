// 🛡️ GESTIONNAIRE PROTECTION ANTI-BRUTE FORCE
// Désactivation temporaire contrôlée pour déploiement

import { execSync } from "child_process";

const CONFIG = {
  SSH: "ubuntu@51.91.145.255",
  FAIL2BAN: {
    service: "fail2ban",
    jail: "sshd",
    configPath: "/etc/fail2ban/jail.local",
  },
  TIMEOUTS: {
    deploy: 300, // 5 minutes max pour déploiement
    securityRestore: 10, // 10 secondes pour réactiver
  },
};

function log(message, color = "cyan") {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function executeSSH(command, description) {
  try {
    log(`🔧 ${description}...`, "cyan");
    const result = execSync(`ssh ${CONFIG.SSH} "${command}"`, {
      encoding: "utf8",
      timeout: 30000,
    });
    log(`✅ ${description} - OK`, "green");
    return result;
  } catch (error) {
    log(`❌ ${description} - Erreur: ${error.message}`, "red");
    throw error;
  }
}

function disableProtection() {
  log("🔓 DÉSACTIVATION PROTECTION ANTI-BRUTE FORCE", "yellow");

  // Vérifier statut actuel
  const status = executeSSH(
    "sudo systemctl is-active fail2ban",
    "Vérification statut fail2ban"
  );

  if (status.trim() === "active") {
    // Sauvegarder IPs bannies actuelles
    executeSSH(
      "sudo fail2ban-client status sshd | grep 'Banned IP list' > /tmp/banned-ips-backup.txt || true",
      "Sauvegarde IPs bannies"
    );

    // Arrêter temporairement
    executeSSH("sudo systemctl stop fail2ban", "Arrêt fail2ban");

    log("🔓 Protection anti-brute force DÉSACTIVÉE", "yellow");
    log("⏰ Réactivation automatique prévue dans 5 minutes", "white");
  } else {
    log("ℹ️ Protection déjà désactivée", "white");
  }
}

function enableProtection() {
  log("🔒 RÉACTIVATION PROTECTION ANTI-BRUTE FORCE", "yellow");

  // Redémarrer le service
  executeSSH("sudo systemctl start fail2ban", "Redémarrage fail2ban");

  // Restaurer IPs bannies si backup existe
  executeSSH(
    "[ -f /tmp/banned-ips-backup.txt ] && sudo fail2ban-client reload || true",
    "Restauration IPs bannies"
  );

  // Nettoyage
  executeSSH("rm -f /tmp/banned-ips-backup.txt", "Nettoyage fichiers temp");

  // Vérification finale
  const status = executeSSH(
    "sudo systemctl is-active fail2ban",
    "Vérification statut final"
  );

  if (status.trim() === "active") {
    log("🔒 Protection anti-brute force RÉACTIVÉE", "green");
  } else {
    log("⚠️ Problème réactivation - vérification manuelle requise", "red");
  }
}

function deployWithProtectionManaged() {
  let protectionDisabled = false;

  try {
    // PHASE 1: Désactiver protection
    disableProtection();
    protectionDisabled = true;

    // PHASE 2: Déploiement rapide
    log("🚀 DÉPLOIEMENT RAPIDE (protection désactivée)", "green");
    execSync("npm run deploy:direct", {
      stdio: "inherit",
      timeout: CONFIG.TIMEOUTS.deploy * 1000,
    });

    // PHASE 3: Réactiver protection
    enableProtection();
    protectionDisabled = false;

    log("🎉 DÉPLOIEMENT TERMINÉ - Protection restaurée", "green");
  } catch (error) {
    log(`💥 Erreur: ${error.message}`, "red");

    // URGENCE: Réactiver protection même en cas d'erreur
    if (protectionDisabled) {
      log("🚨 RÉACTIVATION D'URGENCE PROTECTION", "red");
      try {
        enableProtection();
      } catch (restoreError) {
        log("💥 CRITIQUE: Impossible de réactiver la protection!", "red");
        log(
          "🚨 ACTION MANUELLE REQUISE: ssh ubuntu@51.91.145.255 'sudo systemctl start fail2ban'",
          "red"
        );
      }
    }

    throw error;
  }
}

// COMMANDES DISPONIBLES
const command = process.argv[2];

switch (command) {
  case "disable":
    disableProtection();
    log(
      "⚠️ N'OUBLIEZ PAS de réactiver avec: npm run security:enable",
      "yellow"
    );
    break;

  case "enable":
    enableProtection();
    break;

  case "deploy":
    deployWithProtectionManaged();
    break;

  case "status":
    const status = executeSSH(
      "sudo systemctl is-active fail2ban",
      "Statut protection"
    );
    log(`📊 Protection anti-brute force: ${status.trim()}`, "white");
    break;

  default:
    log("🔧 GESTIONNAIRE PROTECTION ANTI-BRUTE FORCE", "cyan");
    log("Usage:", "white");
    log("  npm run security:disable  - Désactiver protection", "white");
    log("  npm run security:enable   - Réactiver protection", "white");
    log(
      "  npm run security:deploy   - Déployer avec gestion automatique",
      "white"
    );
    log("  npm run security:status   - Vérifier statut", "white");
    break;
}
