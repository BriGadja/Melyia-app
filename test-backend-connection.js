import axios from "axios";
import https from "https";

// Configuration des endpoints
const BASE_URL = "https://app-dev.melyia.com";
const ENDPOINTS = {
  health: "/api/health",
  auth_login: "/api/auth/login",
  auth_verify: "/api/auth/verify",
};

// Couleurs pour les logs
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test de connectivité de base
async function testBasicConnectivity() {
  log("\n🔍 Test de connectivité de base...", "blue");

  try {
    const response = await axios.get(`${BASE_URL}${ENDPOINTS.health}`, {
      timeout: 10000,
      headers: {
        "User-Agent": "Melyia-Diagnostic/1.0",
      },
    });

    log(`✅ Serveur accessible (${response.status})`, "green");
    log(`📊 Réponse: ${JSON.stringify(response.data, null, 2)}`, "blue");

    return response.data;
  } catch (error) {
    log(`❌ Erreur de connectivité: ${error.message}`, "red");
    if (error.response) {
      log(`📄 Status: ${error.response.status}`, "yellow");
      log(
        `📄 Headers: ${JSON.stringify(error.response.headers, null, 2)}`,
        "yellow"
      );
    }
    return null;
  }
}

// Test d'authentification
async function testAuthentication() {
  log("\n🔐 Test d'authentification...", "blue");

  const testCredentials = {
    email: "patient@melyia.com",
    password: "patient123",
  };

  try {
    const response = await axios.post(
      `${BASE_URL}${ENDPOINTS.auth_login}`,
      testCredentials,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Melyia-Diagnostic/1.0",
        },
      }
    );

    log(`✅ Authentification réussie (${response.status})`, "green");
    log(`🎫 Token reçu: ${response.data.token ? "Oui" : "Non"}`, "blue");

    return response.data.token;
  } catch (error) {
    log(`❌ Erreur d'authentification: ${error.message}`, "red");
    if (error.response) {
      log(`📄 Status: ${error.response.status}`, "yellow");
      log(
        `📄 Réponse: ${JSON.stringify(error.response.data, null, 2)}`,
        "yellow"
      );
    }
    return null;
  }
}

// Test des services spécifiques
async function testSpecificServices(token) {
  log("\n🧪 Test des services spécifiques...", "blue");

  const services = [
    { name: "Patients", endpoint: "/api/patients" },
    {
      name: "Chat",
      endpoint: "/api/chat",
      method: "POST",
      data: { message: "Test diagnostic", patientId: "1" },
    },
  ];

  for (const service of services) {
    try {
      const config = {
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "Melyia-Diagnostic/1.0",
        },
      };

      let response;
      if (service.method === "POST") {
        response = await axios.post(
          `${BASE_URL}${service.endpoint}`,
          service.data,
          config
        );
      } else {
        response = await axios.get(`${BASE_URL}${service.endpoint}`, config);
      }

      log(`✅ ${service.name}: OK (${response.status})`, "green");
    } catch (error) {
      log(`❌ ${service.name}: ${error.message}`, "red");
      if (error.response) {
        log(
          `   Status: ${error.response.status} - ${error.response.statusText}`,
          "yellow"
        );
      }
    }
  }
}

// Test de performance
async function testPerformance() {
  log("\n⚡ Test de performance...", "blue");

  const startTime = Date.now();

  try {
    await axios.get(`${BASE_URL}${ENDPOINTS.health}`, { timeout: 5000 });
    const endTime = Date.now();
    const latency = endTime - startTime;

    log(`📈 Latence: ${latency}ms`, latency < 1000 ? "green" : "yellow");

    if (latency > 2000) {
      log(`⚠️  Latence élevée détectée`, "yellow");
    }
  } catch (error) {
    log(`❌ Test de performance échoué: ${error.message}`, "red");
  }
}

// Diagnostic SSL/TLS
async function testSSL() {
  log("\n🔒 Test SSL/TLS...", "blue");

  try {
    const url = new URL(BASE_URL);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: ENDPOINTS.health,
      method: "GET",
      rejectUnauthorized: true,
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        log(`✅ SSL/TLS: Certificat valide`, "green");
        log(`📋 Protocol: ${res.socket.getProtocol()}`, "blue");
        resolve();
      });

      req.on("error", (error) => {
        log(`❌ SSL/TLS: ${error.message}`, "red");
        reject(error);
      });

      req.setTimeout(5000, () => {
        log(`⏰ SSL/TLS: Timeout`, "yellow");
        req.destroy();
        reject(new Error("Timeout"));
      });

      req.end();
    });
  } catch (error) {
    log(`❌ Test SSL échoué: ${error.message}`, "red");
  }
}

// Fonction principale
async function runDiagnostic() {
  log("🩺 DIAGNOSTIC BACKEND MELYIA - DÉBUT", "blue");
  log("=====================================", "blue");

  try {
    // 1. Test de base
    const healthData = await testBasicConnectivity();

    if (!healthData) {
      log("\n❌ Serveur inaccessible - Arrêt du diagnostic", "red");
      return;
    }

    // 2. Test SSL
    await testSSL();

    // 3. Test performance
    await testPerformance();

    // 4. Test authentification
    const token = await testAuthentication();

    // 5. Test services (si token disponible)
    if (token) {
      await testSpecificServices(token);
    }

    log("\n=====================================", "blue");
    log("🩺 DIAGNOSTIC TERMINÉ", "blue");
  } catch (error) {
    log(`\n💥 Erreur critique: ${error.message}`, "red");
  }
}

// Lancement automatique du diagnostic
runDiagnostic().catch(console.error);
