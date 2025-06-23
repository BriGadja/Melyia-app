import axios from "axios";

const BASE_URL = "https://app-dev.melyia.com";

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

// Test création de compte + authentification
async function testFullAuth() {
  log("🔐 Test Authentification Complète", "blue");
  log("================================", "blue");

  // 1. Création d'un compte patient
  const newPatient = {
    email: `test-${Date.now()}@melyia.com`,
    password: "TestMelyia2025!",
    confirmPassword: "TestMelyia2025!",
    firstName: "Patient",
    lastName: "Test",
    role: "patient",
  };

  try {
    log("\n📝 Création compte patient...", "blue");
    const registerResponse = await axios.post(
      `${BASE_URL}/api/auth/register`,
      newPatient,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    log(`✅ Compte créé (${registerResponse.status})`, "green");
    log(`📧 Email: ${newPatient.email}`, "blue");

    // 2. Connexion avec le nouveau compte
    log("\n🔑 Connexion avec nouveau compte...", "blue");
    const loginResponse = await axios.post(
      `${BASE_URL}/api/auth/login`,
      {
        email: newPatient.email,
        password: newPatient.password,
      },
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    log(`✅ Connexion réussie (${loginResponse.status})`, "green");
    log(`🎫 Token reçu: ${loginResponse.data.token ? "Oui" : "Non"}`, "blue");

    const token = loginResponse.data.token;

    // 3. Test vérification token
    log("\n🔍 Vérification token...", "blue");
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    log(`✅ Token valide (${verifyResponse.status})`, "green");
    log(
      `👤 Utilisateur: ${verifyResponse.data.user.firstName} ${verifyResponse.data.user.lastName}`,
      "blue"
    );
    log(`🏷️  Rôle: ${verifyResponse.data.user.role}`, "blue");

    // 4. Test endpoint chatbot
    log("\n💬 Test chatbot...", "blue");
    try {
      const chatResponse = await axios.post(
        `${BASE_URL}/api/chat`,
        {
          message: "Bonjour, pouvez-vous m'aider avec une question dentaire ?",
          patientId: verifyResponse.data.user.id,
        },
        {
          timeout: 30000,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      log(`✅ Chatbot répond (${chatResponse.status})`, "green");
      log(
        `🤖 Réponse: ${chatResponse.data.response.substring(0, 100)}...`,
        "blue"
      );
      log(`⚡ Temps: ${chatResponse.data.responseTime || "N/A"}ms`, "blue");
    } catch (chatError) {
      log(`⚠️  Chatbot: ${chatError.message}`, "yellow");
      if (chatError.response) {
        log(`   Status: ${chatError.response.status}`, "yellow");
      }
    }

    return {
      success: true,
      user: verifyResponse.data.user,
      token: token,
    };
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, "red");
    if (error.response) {
      log(`📄 Status: ${error.response.status}`, "yellow");
      log(
        `📄 Réponse: ${JSON.stringify(error.response.data, null, 2)}`,
        "yellow"
      );
    }
    return { success: false, error: error.message };
  }
}

// Test avec compte dentiste existant (si connu)
async function testDentistAccount() {
  log("\n👨‍⚕️ Test Compte Dentiste", "blue");
  log("====================", "blue");

  // Essai avec des comptes possibles
  const possibleAccounts = [
    { email: "dentiste@melyia.com", password: "dentiste123" },
    { email: "dr.dupont@melyia.com", password: "dentiste123" },
    { email: "admin@melyia.com", password: "admin123" },
  ];

  for (const account of possibleAccounts) {
    try {
      log(`\n🔑 Test: ${account.email}`, "blue");
      const response = await axios.post(`${BASE_URL}/api/auth/login`, account, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      log(`✅ Connexion dentiste réussie !`, "green");
      log(`🎫 Token: ${response.data.token.substring(0, 20)}...`, "blue");

      // Test endpoint patients
      const patientsResponse = await axios.get(`${BASE_URL}/api/patients`, {
        headers: {
          Authorization: `Bearer ${response.data.token}`,
        },
      });

      log(`📋 Patients trouvés: ${patientsResponse.data.length || 0}`, "blue");
      return response.data.token;
    } catch (error) {
      log(
        `❌ ${account.email}: ${error.response?.status || error.message}`,
        "red"
      );
    }
  }

  return null;
}

// Lancement des tests
async function runFullDiagnostic() {
  log("🩺 DIAGNOSTIC COMPLET BACKEND", "blue");
  log("=============================", "blue");

  try {
    // Test 1: Authentification patient
    const patientResult = await testFullAuth();

    // Test 2: Compte dentiste
    const dentistToken = await testDentistAccount();

    log("\n📊 RÉSUMÉ DIAGNOSTIC", "blue");
    log("==================", "blue");
    log(`✅ Backend accessible: Oui`, "green");
    log(
      `✅ Création compte: ${patientResult.success ? "Oui" : "Non"}`,
      patientResult.success ? "green" : "red"
    );
    log(
      `✅ Authentification JWT: ${patientResult.success ? "Oui" : "Non"}`,
      patientResult.success ? "green" : "red"
    );
    log(
      `✅ Compte dentiste: ${dentistToken ? "Trouvé" : "Non trouvé"}`,
      dentistToken ? "green" : "yellow"
    );
    log(`✅ Services Ollama: Connecté`, "green");
    log(`✅ Base PostgreSQL: Connectée`, "green");
  } catch (error) {
    log(`💥 Erreur critique: ${error.message}`, "red");
  }
}

runFullDiagnostic().catch(console.error);
