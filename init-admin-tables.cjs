const axios = require("axios");

async function initAdminTables() {
  console.log("🏗️ Initialisation des tables admin via API...");

  try {
    // 1. Tester d'abord la connectivité de base
    console.log("🔍 Test de connectivité...");
    try {
      const healthResponse = await axios.get("http://localhost:8083/");
      console.log("✅ Serveur accessible");
    } catch (error) {
      console.log("❌ Serveur inaccessible:", error.message);
      return;
    }

    // 2. Se connecter en tant qu'admin
    console.log("🔐 Connexion admin...");
    try {
      const loginResponse = await axios.post(
        "http://localhost:8083/api/auth/login",
        {
          email: "brice@melyia.com",
          password: "password",
        }
      );

      const token = loginResponse.data.token;
      console.log("✅ Connexion admin réussie");

      // 3. Appeler l'endpoint d'initialisation
      console.log("🏗️ Création des tables...");
      try {
        const initResponse = await axios.post(
          "http://localhost:8083/api/admin/init-tables",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("✅ Tables créées avec succès!");
        console.log("📊 Statistiques finales:", initResponse.data.stats);

        // 4. Vérifier que les APIs fonctionnent maintenant
        console.log("🔍 Test des APIs admin...");

        const tests = [
          { name: "Stats", url: "http://localhost:8083/api/admin/stats" },
          {
            name: "Utilisateurs",
            url: "http://localhost:8083/api/admin/users",
          },
          {
            name: "Documents",
            url: "http://localhost:8083/api/admin/documents",
          },
          {
            name: "Conversations",
            url: "http://localhost:8083/api/admin/conversations",
          },
        ];

        for (const test of tests) {
          try {
            const response = await axios.get(test.url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log(
              `✅ ${test.name}: ${
                response.data.data?.length || "OK"
              } résultat(s)`
            );
          } catch (error) {
            console.log(
              `❌ ${test.name}: Erreur ${
                error.response?.status || error.message
              }`
            );
          }
        }

        console.log(
          "🎉 Initialisation terminée ! Rafraîchissez le dashboard admin."
        );
      } catch (initError) {
        console.log("❌ Erreur initialisation tables:");
        console.log("Status:", initError.response?.status);
        console.log("Données:", initError.response?.data);
        console.log("Message:", initError.message);
      }
    } catch (loginError) {
      console.log("❌ Erreur connexion admin:");
      console.log("Status:", loginError.response?.status);
      console.log("Données:", loginError.response?.data);
      console.log("Message:", loginError.message);
    }
  } catch (error) {
    console.error("❌ Erreur générale:", error.message);
    console.error("Stack:", error.stack);
  }
}

initAdminTables();
