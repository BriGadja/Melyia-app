import axios from "axios";

const BASE_URL = "https://app-dev.melyia.com";

console.log("🔑 TEST CONNEXION ADMIN BRICE@MELYIA.COM");
console.log("==========================================");

async function testAdminLogin() {
  try {
    // Test de connexion avec le compte admin principal
    console.log("📧 Test connexion: brice@melyia.com");

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (loginResponse.data.success) {
      console.log("✅ Connexion admin réussie !");
      console.log("👤 Utilisateur:", loginResponse.data.user);
      console.log("🎯 Redirection:", loginResponse.data.redirectUrl);

      const token = loginResponse.data.token;

      // Test des APIs admin
      console.log("\n📊 Test des APIs admin...");

      try {
        const statsResponse = await axios.get(`${BASE_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ Stats admin:", statsResponse.data.data);
      } catch (error) {
        console.log(
          "❌ Stats admin:",
          error.response?.status,
          error.response?.data
        );
      }

      try {
        const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(
          "✅ Users admin:",
          usersResponse.data.data?.length,
          "utilisateurs"
        );
      } catch (error) {
        console.log(
          "❌ Users admin:",
          error.response?.status,
          error.response?.data
        );
      }
    } else {
      console.log("❌ Échec connexion admin");
      console.log("📄 Réponse:", loginResponse.data);
    }
  } catch (error) {
    console.log("❌ Erreur connexion admin:");
    console.log("📄 Status:", error.response?.status);
    console.log("📄 Réponse:", error.response?.data);

    if (error.response?.status === 401) {
      console.log(
        "\n💡 Le compte admin brice@melyia.com pourrait ne pas exister."
      );
      console.log("💡 Vérifiez la base de données ou créez le compte.");
    }
  }
}

testAdminLogin();
