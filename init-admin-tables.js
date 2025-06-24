const fetch = require("node-fetch");

async function initAdminTables() {
  console.log("🏗️ Initialisation des tables admin via API...");

  try {
    // 1. Se connecter en tant qu'admin
    console.log("🔐 Connexion admin...");
    const loginResponse = await fetch("http://localhost:8083/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "brice@melyia.com",
        password: "password",
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Erreur login: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log("✅ Connexion admin réussie");

    // 2. Appeler l'endpoint d'initialisation
    console.log("🏗️ Création des tables...");
    const initResponse = await fetch(
      "http://localhost:8083/api/admin/init-tables",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!initResponse.ok) {
      const errorData = await initResponse.json();
      throw new Error(
        `Erreur init: ${initResponse.status} - ${errorData.error}`
      );
    }

    const initData = await initResponse.json();
    console.log("✅ Tables créées avec succès!");
    console.log("📊 Statistiques finales:", initData.stats);

    // 3. Vérifier que les APIs fonctionnent maintenant
    console.log("🔍 Test des APIs admin...");

    const tests = [
      { name: "Stats", url: "http://localhost:8083/api/admin/stats" },
      { name: "Utilisateurs", url: "http://localhost:8083/api/admin/users" },
      { name: "Documents", url: "http://localhost:8083/api/admin/documents" },
      {
        name: "Conversations",
        url: "http://localhost:8083/api/admin/conversations",
      },
    ];

    for (const test of tests) {
      try {
        const response = await fetch(test.url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(
            `✅ ${test.name}: ${data.data?.length || "OK"} résultat(s)`
          );
        } else {
          console.log(`❌ ${test.name}: Erreur ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    console.log(
      "🎉 Initialisation terminée ! Rafraîchissez le dashboard admin."
    );
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

initAdminTables();
