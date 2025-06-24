import axios from "axios";

const BASE_URL = "https://app-dev.melyia.com";

console.log("🔧 CORRECTION API ADMIN USERS");
console.log("==============================");

async function fixAdminAPI() {
  try {
    // 1. Connexion admin
    console.log("🔑 Connexion admin...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    const token = loginResponse.data.token;
    console.log("✅ Token obtenu");

    // 2. Initialiser les tables admin
    console.log("\n🔨 Initialisation des tables admin...");
    try {
      const initResponse = await axios.post(
        `${BASE_URL}/api/admin/init-tables`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ Tables initialisées:", initResponse.data);
    } catch (error) {
      console.log(
        "⚠️ Tables déjà initialisées ou erreur:",
        error.response?.data
      );
    }

    // 3. Test de toutes les APIs admin
    console.log("\n🧪 Test des APIs admin...");

    const apis = [
      { name: "Stats", endpoint: "/api/admin/stats" },
      { name: "Users", endpoint: "/api/admin/users" },
      { name: "Documents", endpoint: "/api/admin/documents" },
      { name: "Conversations", endpoint: "/api/admin/conversations" },
    ];

    for (const api of apis) {
      try {
        const response = await axios.get(`${BASE_URL}${api.endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(
          `✅ ${api.name}: ${response.data.data?.length || "OK"} résultat(s)`
        );
      } catch (error) {
        console.log(
          `❌ ${api.name}: ${error.response?.status} - ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    console.log(
      "\n🎉 Correction terminée ! Testez le dashboard : https://app-dev.melyia.com/admin/dashboard"
    );
  } catch (error) {
    console.log("❌ Erreur:", error.response?.data || error.message);
  }
}

fixAdminAPI();
