// test-server-sync-check.mjs - Vérification synchronisation local/serveur
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function compareLocalVsRemote() {
  console.log("🔍 === COMPARAISON LOCAL vs SERVEUR ===\n");

  // Vérification fichier local
  try {
    const localStats = fs.statSync("server/backend/server.js");
    const localSizeKB = Math.round(localStats.size / 1024);
    console.log(
      `📁 LOCAL server.js: ${localSizeKB}KB (modifié: ${localStats.mtime.toLocaleString()})`
    );

    // Lire quelques lignes du fichier local pour identifier la version
    const localContent = fs.readFileSync("server/backend/server.js", "utf8");
    const appointmentRoutes = localContent.match(
      /app\.(get|post|put|delete)\(['"\/]*appointments/g
    );
    console.log(
      `📋 LOCAL - Routes appointments trouvées: ${
        appointmentRoutes ? appointmentRoutes.length : 0
      }`
    );

    if (appointmentRoutes && appointmentRoutes.length > 0) {
      console.log("✅ LOCAL contient les APIs de rendez-vous:");
      appointmentRoutes.forEach((route) => console.log(`   - ${route}`));
    } else {
      console.log("❌ LOCAL ne contient PAS les APIs de rendez-vous");
    }
  } catch (error) {
    console.log("❌ Erreur lecture fichier local:", error.message);
  }

  console.log("\n" + "─".repeat(60) + "\n");

  // Vérification fichier serveur distant
  try {
    console.log("🌐 SERVEUR DISTANT - Vérification...");

    const commands = [
      {
        name: "Taille serveur.js distant",
        cmd: 'ssh -o StrictHostKeyChecking=no ubuntu@51.91.145.255 "ls -lh /var/www/melyia/app-dev/server.js"',
      },
      {
        name: "Date modification serveur.js",
        cmd: 'ssh -o StrictHostKeyChecking=no ubuntu@51.91.145.255 "stat /var/www/melyia/app-dev/server.js"',
      },
      {
        name: "Routes appointments dans serveur distant",
        cmd: "ssh -o StrictHostKeyChecking=no ubuntu@51.91.145.255 \"grep -c 'app\\..*appointments' /var/www/melyia/app-dev/server.js || echo '0 routes appointments trouvées'\"",
      },
    ];

    for (const command of commands) {
      try {
        console.log(`🔍 ${command.name}:`);
        const { stdout } = await execAsync(command.cmd);
        console.log(stdout.trim());
      } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
      }
      console.log();
    }
  } catch (error) {
    console.log("❌ Erreur connexion serveur:", error.message);
  }
}

async function checkPM2Status() {
  console.log("🔧 === STATUS PM2 SERVEUR ===\n");

  try {
    const { stdout } = await execAsync(
      'ssh -o StrictHostKeyChecking=no ubuntu@51.91.145.255 "pm2 status"'
    );
    console.log(stdout);

    console.log("\n💡 ACTIONS RECOMMANDÉES:");
    console.log("1. Si server.js distant est différent → Redéployer");
    console.log("2. Si PM2 n'est pas à jour → Restart PM2");
    console.log("3. Vérifier les logs PM2 pour les erreurs");
  } catch (error) {
    console.log("❌ Erreur PM2:", error.message);
  }
}

async function runSyncCheck() {
  console.log("🚀 === DIAGNOSTIC SYNCHRONISATION SERVEUR ===");
  console.log(`📅 ${new Date().toLocaleString()}\n`);

  await compareLocalVsRemote();
  await checkPM2Status();

  console.log("\n🎯 === SOLUTIONS POSSIBLES ===");
  console.log("A. Redéployer server.js: ./dev/sync-and-push-CLEAN.ps1");
  console.log("B. Restart PM2: ssh + pm2 restart melyia-auth-dev");
  console.log("C. Vérifier logs: ssh + pm2 logs melyia-auth-dev");
}

runSyncCheck().catch(console.error);
