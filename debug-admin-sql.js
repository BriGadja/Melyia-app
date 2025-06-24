import axios from "axios";

console.log("🔍 DIAGNOSTIC SQL APPROFONDI - API ADMIN USERS");
console.log("===============================================");

async function debugAdminSQL() {
  try {
    // 1. Connexion admin
    console.log("🔑 Connexion admin...");
    const loginResponse = await axios.post(
      "https://app-dev.melyia.com/api/auth/login",
      {
        email: "brice@melyia.com",
        password: "password",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Token obtenu");

    // 2. Test de l'API problématique avec plus de détails
    console.log("\n🔍 Test API Users avec détails...");
    try {
      const usersResponse = await axios.get(
        "https://app-dev.melyia.com/api/admin/users",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ API Users fonctionne !");
      console.log("👥 Utilisateurs:", usersResponse.data.data?.length);
    } catch (error) {
      console.log("❌ Erreur API Users détaillée:");
      console.log("Status:", error.response?.status);
      console.log("Headers:", error.response?.headers);
      console.log("Data:", error.response?.data);

      if (error.response?.status === 500) {
        console.log(
          "\n💡 PROBABLE: Erreur SQL dans la requête JOIN des profils"
        );
        console.log("💡 SOLUTION: Simplifier la requête SQL côté backend");
      }
    }

    // 3. Test des autres APIs pour comparaison
    console.log("\n🧪 Test des autres APIs...");

    const apis = [
      { name: "Stats", endpoint: "/api/admin/stats" },
      { name: "Documents", endpoint: "/api/admin/documents" },
      { name: "Conversations", endpoint: "/api/admin/conversations" },
    ];

    for (const api of apis) {
      try {
        const response = await axios.get(
          `https://app-dev.melyia.com${api.endpoint}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(`✅ ${api.name}: OK`);
      } catch (error) {
        console.log(`❌ ${api.name}: ${error.response?.status}`);
      }
    }

    console.log("\n🔧 SOLUTION RECOMMANDÉE:");
    console.log(
      "1. Modifier la requête SQL de /api/admin/users pour être plus simple"
    );
    console.log("2. Éviter les LEFT JOIN complexes qui peuvent poser problème");
    console.log(
      "3. Créer une requête basique: SELECT u.* FROM users u WHERE..."
    );
  } catch (error) {
    console.log("❌ Erreur générale:", error.message);
  }
}

debugAdminSQL();
