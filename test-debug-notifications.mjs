// test-debug-notifications.mjs - Debug approfondi
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginUser(email, password) {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password,
  });
  return response.data;
}

async function testNotificationDebug() {
  console.log("🔍 DEBUG NOTIFICATIONS APPROFONDI");
  console.log("=================================");

  try {
    // Login dentiste
    const dentistLogin = await loginUser("dentiste@melyia.com", "test123");
    console.log("✅ Dentiste connecté:", {
      id: dentistLogin.user.id,
      email: dentistLogin.user.email,
      tokenPresent: !!dentistLogin.token,
    });

    // Test requête GET notifications avec logs détaillés
    console.log("\n🔔 Test GET notifications avec headers complets...");

    const headers = {
      Authorization: `Bearer ${dentistLogin.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    console.log("📤 Headers envoyés:", {
      Authorization: headers.Authorization.substring(0, 30) + "...",
      ContentType: headers["Content-Type"],
    });

    // Faire la requête avec interception des logs
    const response = await axios.get(`${API_BASE}/notifications`, {
      headers,
      validateStatus: () => true, // Accepter tous les codes de statut
    });

    console.log("📨 Réponse reçue:");
    console.log("   Status:", response.status);
    console.log("   Headers:", response.headers["content-type"]);
    console.log("   Data:", response.data);

    if (response.status === 200 && response.data.success) {
      console.log("\n✅ Récupération réussie:");
      console.log("   Total:", response.data.data.total_count);
      console.log("   Non lues:", response.data.data.unread_count);
      console.log("   Notifications:", response.data.data.notifications.length);

      if (response.data.data.notifications.length > 0) {
        console.log("\n📋 Première notification:");
        console.log(response.data.data.notifications[0]);
      }
    } else {
      console.log("❌ Erreur dans la réponse");
    }

    // Test direct: créer une notification pour ce dentiste
    console.log("\n📝 Création notification test pour ce dentiste...");
    const adminLogin = await loginUser("brice@melyia.com", "password");

    const createResponse = await axios.post(
      `${API_BASE}/notifications`,
      {
        user_id: dentistLogin.user.id,
        notification_type: "debug_test",
        content:
          "🔧 Test debug direct pour dentiste ID " + dentistLogin.user.id,
        priority: "urgent",
      },
      {
        headers: { Authorization: `Bearer ${adminLogin.token}` },
      }
    );

    console.log("✅ Notification créée:", createResponse.data.data);

    // Retry GET après création
    console.log("\n🔄 Retry GET notifications après création...");
    const retryResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${dentistLogin.token}` },
    });

    console.log("📊 Résultat après création:");
    console.log("   Total:", retryResponse.data.data.total_count);
    console.log("   Non lues:", retryResponse.data.data.unread_count);
    console.log(
      "   Notifications:",
      retryResponse.data.data.notifications.length
    );

    if (retryResponse.data.data.notifications.length > 0) {
      console.log("\n🎉 SUCCESS! Notifications récupérées:");
      retryResponse.data.data.notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. [${notif.priority}] ${notif.content}`);
        console.log(
          `      ID: ${notif.id} | User ID: devrait être ${dentistLogin.user.id}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Erreur debug:", error.response?.data || error.message);
  }
}

testNotificationDebug();
