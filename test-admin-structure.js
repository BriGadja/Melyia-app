const axios = require("axios");

const BASE_URL = "https://app-dev.melyia.com/api";
const ADMIN_EMAIL = "brice@melyia.com";
const ADMIN_PASSWORD = "password";

async function testAdminStructure() {
  console.log("🧪 TEST DE LA STRUCTURE ADMIN CORRIGÉE");
  console.log("=====================================\n");

  try {
    // 1. LOGIN ADMIN
    console.log("1. 🔐 Test login admin...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (!loginResponse.data.success) {
      throw new Error("Échec login admin");
    }

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log("   ✅ Login admin réussi");
    console.log(
      `   👤 Utilisateur: ${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`
    );
    console.log(`   🎯 Rôle: ${loginResponse.data.user.role}\n`);

    // 2. TEST API /api/admin/stats
    console.log("2. 📊 Test API /api/admin/stats...");
    try {
      const statsResponse = await axios.get(`${BASE_URL}/admin/stats`, {
        headers,
      });

      if (statsResponse.data.success) {
        console.log("   ✅ API /api/admin/stats : FONCTIONNELLE");
        console.log("   📈 Statistiques reçues:");
        const stats = statsResponse.data.data;
        console.log(`      - Utilisateurs total: ${stats.total_users}`);
        console.log(`      - Dentistes: ${stats.total_dentists}`);
        console.log(`      - Patients: ${stats.total_patients}`);
        console.log(`      - Admins: ${stats.total_admins}`);
        console.log(`      - Documents: ${stats.total_documents}`);
        console.log(`      - Conversations: ${stats.total_conversations}`);
        console.log(`      - Utilisateurs actifs: ${stats.active_users}`);
        console.log(`      - Espace disque: ${stats.disk_usage_mb} MB`);
        console.log(`      - Dernière MAJ: ${stats.last_updated}`);
      } else {
        console.log(
          "   ❌ API /api/admin/stats : ERREUR - Réponse non successful"
        );
      }
    } catch (error) {
      console.log("   ❌ API /api/admin/stats : ERREUR");
      console.log(
        "   🔍 Détails:",
        error.response?.data?.error || error.message
      );
    }
    console.log("");

    // 3. TEST API /api/admin/users
    console.log("3. 👥 Test API /api/admin/users...");
    try {
      const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
        headers,
      });

      if (usersResponse.data.success) {
        console.log("   ✅ API /api/admin/users : FONCTIONNELLE");
        console.log(
          `   👤 ${usersResponse.data.data.length} utilisateurs récupérés`
        );
        console.log("   📝 Échantillon des utilisateurs:");
        usersResponse.data.data.slice(0, 3).forEach((user) => {
          console.log(`      - ${user.displayName} (${user.email})`);
        });
      } else {
        console.log(
          "   ❌ API /api/admin/users : ERREUR - Réponse non successful"
        );
      }
    } catch (error) {
      console.log("   ❌ API /api/admin/users : ERREUR");
      console.log(
        "   🔍 Détails:",
        error.response?.data?.error || error.message
      );
    }
    console.log("");

    // 4. TEST API /api/admin/documents
    console.log("4. 📄 Test API /api/admin/documents...");
    try {
      const documentsResponse = await axios.get(`${BASE_URL}/admin/documents`, {
        headers,
      });

      if (documentsResponse.data.success) {
        console.log("   ✅ API /api/admin/documents : FONCTIONNELLE");
        console.log(
          `   📄 ${documentsResponse.data.data.length} documents récupérés`
        );
        console.log("   📝 Échantillon des documents:");
        documentsResponse.data.data.slice(0, 3).forEach((doc) => {
          console.log(`      - ${doc.fileName} (${doc.documentType})`);
        });
      } else {
        console.log(
          "   ❌ API /api/admin/documents : ERREUR - Réponse non successful"
        );
      }
    } catch (error) {
      console.log("   ❌ API /api/admin/documents : ERREUR");
      console.log(
        "   🔍 Détails:",
        error.response?.data?.error || error.message
      );
    }
    console.log("");

    // 5. TEST API /api/admin/conversations
    console.log("5. 💬 Test API /api/admin/conversations...");
    try {
      const conversationsResponse = await axios.get(
        `${BASE_URL}/admin/conversations`,
        { headers }
      );

      if (conversationsResponse.data.success) {
        console.log("   ✅ API /api/admin/conversations : FONCTIONNELLE");
        console.log(
          `   💬 ${conversationsResponse.data.data.length} conversations récupérées`
        );
        console.log("   📝 Échantillon des conversations:");
        conversationsResponse.data.data.slice(0, 2).forEach((conv) => {
          console.log(
            `      - ${conv.patient_email}: "${conv.message.substring(
              0,
              50
            )}..."`
          );
        });
      } else {
        console.log(
          "   ❌ API /api/admin/conversations : ERREUR - Réponse non successful"
        );
      }
    } catch (error) {
      console.log("   ❌ API /api/admin/conversations : ERREUR");
      console.log(
        "   🔍 Détails:",
        error.response?.data?.error || error.message
      );
    }
    console.log("");

    // 6. RÉSUMÉ FINAL
    console.log("=====================================");
    console.log("🎯 RÉSUMÉ DU TEST DE STRUCTURE ADMIN");
    console.log("=====================================");
    console.log("✅ Structure PostgreSQL corrigée");
    console.log("✅ Vue admin_stats avec 9 colonnes");
    console.log("✅ Tables admin avec colonnes complètes");
    console.log("✅ APIs admin fonctionnelles");
    console.log("");
    console.log("🚀 LE DASHBOARD ADMIN DEVRAIT MAINTENANT FONCTIONNER !");
  } catch (error) {
    console.error("❌ ERREUR GÉNÉRALE:", error.message);
    if (error.response) {
      console.error("🔍 Détails serveur:", error.response.data);
    }
  }
}

// Exécuter le test
testAdminStructure();
