// test-notifications-init.mjs - ✅ Test endpoint spécifique notifications
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginAdmin() {
  try {
    console.log("🔑 Connexion admin...");
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (response.data.success) {
      console.log("✅ Connexion admin réussie");
      return response.data.token;
    }
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ Erreur login:", error.response?.data || error.message);
    return null;
  }
}

async function initNotifications(token) {
  try {
    console.log("🔔 Initialisation table notifications...");
    const response = await axios.post(
      `${API_BASE}/admin/init-notifications`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      console.log("✅ Table notifications créée:", response.data.data);
      return response.data.data;
    }
    throw new Error("Init notifications failed");
  } catch (error) {
    console.error(
      "❌ Erreur init notifications:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function runNotificationsInit() {
  console.log("🧪 TEST INITIALISATION NOTIFICATIONS");
  console.log("=====================================");

  const token = await loginAdmin();
  if (!token) {
    console.log("❌ ÉCHEC: Impossible de se connecter");
    return;
  }

  const result = await initNotifications(token);
  if (!result) {
    console.log("❌ ÉCHEC: Impossible d'initialiser les notifications");
    return;
  }

  console.log("\n🎉 SUCCÈS COMPLET!");
  console.log("✅ Table notifications créée et opérationnelle");
  console.log(`✅ ${result.total_notifications} notifications en base`);
  console.log("✅ Données de test ajoutées");

  console.log("\n📋 Structure table notifications :");
  console.log("   • id (clé primaire auto-incrémentée)");
  console.log("   • user_id (destinataire - FK vers users)");
  console.log("   • sender_id (expéditeur - FK vers users)");
  console.log("   • notification_type (message, appointment, alert, etc.)");
  console.log("   • content (contenu de la notification)");
  console.log("   • link (lien de navigation)");
  console.log("   • priority (normal, high, urgent)");
  console.log("   • is_read (statut lecture)");
  console.log("   • read_at (timestamp de lecture)");
  console.log("   • created_at/updated_at (timestamps)");

  console.log("\n🎯 Prêt pour l'étape 2 :");
  console.log(
    "   • GET /api/notifications (récupérer notifications utilisateur)"
  );
  console.log("   • POST /api/notifications (créer notification)");
  console.log("   • PUT /api/notifications/:id/read (marquer comme lu)");
}

runNotificationsInit().catch(console.error);
