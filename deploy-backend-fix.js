import axios from "axios";

console.log("🔧 CORRECTIF BACKEND ADMIN - DÉPLOIEMENT URGENT");
console.log("=================================================");

async function deployBackendFix() {
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

    // 2. Créer manuellement les tables via des requêtes simplifiées
    console.log("\n🔨 Création tables manquantes...");

    const createQueries = [
      // Simplifier les requêtes pour éviter les erreurs
      `CREATE TABLE IF NOT EXISTS dentist_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        practice_info VARCHAR(255) DEFAULT 'Cabinet Dentaire',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS patient_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        dentist_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS admin_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        permissions TEXT DEFAULT '{"super_admin": true}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    console.log(
      "⚠️ ATTENTION: Cette méthode nécessite un accès direct SSH au serveur"
    );
    console.log("📋 Requêtes SQL à exécuter manuellement:");
    console.log("=====================================");

    createQueries.forEach((query, index) => {
      console.log(`\n-- Table ${index + 1}:`);
      console.log(query + ";");
    });

    console.log("\n-- Vue pour les stats:");
    console.log(`CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COALESCE(COUNT(*), 0) FROM patient_documents) as total_documents,
  (SELECT COALESCE(COUNT(*), 0) FROM chat_conversations) as total_conversations,
  (SELECT COUNT(*) FROM users WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as active_users;`);

    console.log("\n🚀 SOLUTION ALTERNATIVE: Corriger directement les APIs");
    console.log("======================================================");

    // 3. Tester une version simplifiée des APIs
    console.log("\n🧪 Test APIs après correction...");

    try {
      const usersResponse = await axios.get(
        "https://app-dev.melyia.com/api/admin/users",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ API Users: Fonctionne !");
    } catch (error) {
      console.log("❌ API Users: Toujours cassée");
      console.log("💡 SOLUTION: Modifier la requête SQL pour être plus simple");
    }

    console.log("\n🎯 PROCHAINES ÉTAPES:");
    console.log(
      "1. SSH vers le serveur: ssh -i ~/.ssh/ovh_key ubuntu@51.91.145.255"
    );
    console.log("2. Exécuter: sudo -u postgres psql melyia_dev");
    console.log("3. Copier-coller les requêtes SQL ci-dessus");
    console.log("4. Redémarrer le backend: pm2 restart auth-dev");
    console.log("5. Tester le dashboard admin à nouveau");
  } catch (error) {
    console.log("❌ Erreur:", error.response?.data || error.message);
  }
}

deployBackendFix();
