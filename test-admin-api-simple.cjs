const axios = require("axios");

async function testAdminAPI() {
  try {
    console.log("🔍 Test de l'API admin...");

    // 1. Test de connexion d'abord
    console.log("📋 Test connexion...");
    const loginResponse = await axios.post(
      "https://app-dev.melyia.com/api/auth/login",
      {
        email: "brice@melyia.com",
        password: "password",
      }
    );

    if (!loginResponse.data.success) {
      throw new Error("Connexion échouée");
    }

    const token = loginResponse.data.token;
    console.log("✅ Connexion réussie, token obtenu");

    // 2. Test API stats
    console.log("📊 Test API /api/admin/stats...");
    try {
      const statsResponse = await axios.get(
        "https://app-dev.melyia.com/api/admin/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(
        "✅ API stats:",
        statsResponse.data.success ? "OK" : "ERREUR"
      );
      if (statsResponse.data.data) {
        console.log("   - Utilisateurs:", statsResponse.data.data.total_users);
        console.log("   - Dentistes:", statsResponse.data.data.total_dentists);
        console.log("   - Patients:", statsResponse.data.data.total_patients);
      }
    } catch (statsError) {
      console.error(
        "❌ API stats ERREUR:",
        statsError.response?.data || statsError.message
      );
    }

    // 3. Test API users
    console.log("👥 Test API /api/admin/users...");
    try {
      const usersResponse = await axios.get(
        "https://app-dev.melyia.com/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(
        "✅ API users:",
        usersResponse.data.success ? "OK" : "ERREUR"
      );
      if (usersResponse.data.data) {
        console.log(
          "   - Nombre d'utilisateurs:",
          usersResponse.data.data.length
        );
      }
    } catch (usersError) {
      console.error(
        "❌ API users ERREUR:",
        usersError.response?.data || usersError.message
      );
    }

    // 4. Test API documents
    console.log("📄 Test API /api/admin/documents...");
    try {
      const docsResponse = await axios.get(
        "https://app-dev.melyia.com/api/admin/documents",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(
        "✅ API documents:",
        docsResponse.data.success ? "OK" : "ERREUR"
      );
      if (docsResponse.data.data) {
        console.log("   - Nombre de documents:", docsResponse.data.data.length);
      }
    } catch (docsError) {
      console.error(
        "❌ API documents ERREUR:",
        docsError.response?.data || docsError.message
      );
    }
  } catch (error) {
    console.error("💥 ERREUR GENERALE:", error.message);
  }
}

testAdminAPI();
