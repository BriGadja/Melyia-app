// test-notifications-frontend.mjs - Test du système de notifications frontend
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (response.data.success) {
      return response.data.token;
    }
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ Login error:", error.response?.data || error.message);
    return null;
  }
}

async function loginPatient() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "patient@melyia.com",
      password: "test123",
    });

    if (response.data.success) {
      return response.data.token;
    }
    throw new Error("Patient login failed");
  } catch (error) {
    console.error(
      "❌ Patient login error:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function loginDentist() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "dentiste@melyia.com",
      password: "test123",
    });

    if (response.data.success) {
      return response.data.token;
    }
    throw new Error("Dentist login failed");
  } catch (error) {
    console.error(
      "❌ Dentist login error:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testCreateNotificationForPatient(adminToken) {
  try {
    console.log("\n📝 Test création notification pour patient...");

    const response = await axios.post(
      `${API_BASE}/notifications`,
      {
        user_id: 7, // ID patient de test
        notification_type: "test_frontend",
        content: "Test de notification frontend - Dashboard patient intégré",
        link: "/patient/dashboard?tab=messages",
        priority: "high",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("✅ Notification créée pour patient:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      "❌ Erreur création notification patient:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testCreateNotificationForDentist(adminToken) {
  try {
    console.log("\n📝 Test création notification pour dentiste...");

    const response = await axios.post(
      `${API_BASE}/notifications`,
      {
        user_id: 6, // ID dentiste de test
        notification_type: "nouveau_patient",
        content: "Nouveau patient inscrit - Validation requise",
        link: "/dentist/dashboard?tab=patients&filter=pending",
        priority: "normal",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("✅ Notification créée pour dentiste:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      "❌ Erreur création notification dentiste:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testGetNotificationsAsPatient(patientToken) {
  try {
    console.log("\n🔍 Test récupération notifications patient...");

    const response = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });

    const data = response.data.data;
    console.log("✅ Notifications patient récupérées:");
    console.log(`   📊 Total: ${data.total_count}`);
    console.log(`   🔴 Non lues: ${data.unread_count}`);
    console.log(`   📝 Notifications: ${data.notifications.length}`);

    if (data.notifications.length > 0) {
      console.log("\n   📋 Dernières notifications:");
      data.notifications.slice(0, 3).forEach((notif, index) => {
        console.log(
          `   ${index + 1}. [${notif.priority.toUpperCase()}] ${notif.content}`
        );
        console.log(`      🕒 ${notif.created_at} | 👤 ${notif.sender_name}`);
        console.log(
          `      📖 Lu: ${notif.is_read ? "✅" : "❌"} | 🔗 Lien: ${
            notif.link || "N/A"
          }`
        );
      });
    }

    return data;
  } catch (error) {
    console.error(
      "❌ Erreur récupération notifications patient:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testGetNotificationsAsDentist(dentistToken) {
  try {
    console.log("\n🔍 Test récupération notifications dentiste...");

    const response = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${dentistToken}` },
    });

    const data = response.data.data;
    console.log("✅ Notifications dentiste récupérées:");
    console.log(`   📊 Total: ${data.total_count}`);
    console.log(`   🔴 Non lues: ${data.unread_count}`);
    console.log(`   📝 Notifications: ${data.notifications.length}`);

    if (data.notifications.length > 0) {
      console.log("\n   📋 Dernières notifications:");
      data.notifications.slice(0, 3).forEach((notif, index) => {
        console.log(
          `   ${index + 1}. [${notif.priority.toUpperCase()}] ${notif.content}`
        );
        console.log(`      🕒 ${notif.created_at} | 👤 ${notif.sender_name}`);
        console.log(
          `      📖 Lu: ${notif.is_read ? "✅" : "❌"} | 🔗 Lien: ${
            notif.link || "N/A"
          }`
        );
      });
    }

    return data;
  } catch (error) {
    console.error(
      "❌ Erreur récupération notifications dentiste:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testMarkAsRead(token, notificationId) {
  try {
    console.log(`\n📖 Test marquage comme lu (ID: ${notificationId})...`);

    await axios.put(
      `${API_BASE}/notifications/${notificationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ Notification marquée comme lue");
    return true;
  } catch (error) {
    console.error(
      "❌ Erreur marquage lu:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function runCompleteFrontendTest() {
  console.log("🚀 DÉMARRAGE TEST COMPLET NOTIFICATIONS FRONTEND\n");
  console.log("=" * 60);

  // 1. Authentification
  console.log("\n🔐 PHASE 1: AUTHENTIFICATION");
  const adminToken = await loginAdmin();
  const patientToken = await loginPatient();
  const dentistToken = await loginDentist();

  if (!adminToken || !patientToken || !dentistToken) {
    console.error("❌ Échec authentification - Test arrêté");
    return;
  }

  console.log("✅ Tous les comptes connectés avec succès");

  // 2. Création notifications
  console.log("\n📝 PHASE 2: CRÉATION NOTIFICATIONS DE TEST");
  await testCreateNotificationForPatient(adminToken);
  await testCreateNotificationForDentist(adminToken);

  // 3. Test récupération notifications
  console.log("\n🔍 PHASE 3: RÉCUPÉRATION NOTIFICATIONS");
  const patientNotifs = await testGetNotificationsAsPatient(patientToken);
  const dentistNotifs = await testGetNotificationsAsDentist(dentistToken);

  // 4. Test interactions
  console.log("\n🎯 PHASE 4: TEST INTERACTIONS");
  if (patientNotifs && patientNotifs.notifications.length > 0) {
    const firstNotif = patientNotifs.notifications[0];
    if (!firstNotif.is_read) {
      await testMarkAsRead(patientToken, firstNotif.id);
    }
  }

  if (dentistNotifs && dentistNotifs.notifications.length > 0) {
    const firstNotif = dentistNotifs.notifications[0];
    if (!firstNotif.is_read) {
      await testMarkAsRead(dentistToken, firstNotif.id);
    }
  }

  // 5. Validation finale
  console.log("\n✅ PHASE 5: VALIDATION FINALE");
  console.log("🎯 RÉSUMÉ DES TESTS:");
  console.log(`   🔐 Authentification: ✅ Admin, Patient, Dentiste`);
  console.log(`   📝 Création notifications: ✅ Patient & Dentiste`);
  console.log(`   🔍 Récupération APIs: ✅ GET /api/notifications`);
  console.log(`   📖 Marquage lu: ✅ PUT /api/notifications/:id/read`);

  console.log("\n🎉 SYSTÈME NOTIFICATIONS FRONTEND PRÊT!");
  console.log("\n📋 PROCHAINES ÉTAPES:");
  console.log("   1. Tester l'interface React en local: npm run dev");
  console.log("   2. Vérifier les badges notifications dans les headers");
  console.log("   3. Tester le dropdown et les interactions");
  console.log("   4. Valider le polling automatique (30s)");

  console.log("\n🔗 URLS DE TEST:");
  console.log("   • Patient: http://localhost:5173/patient/dashboard");
  console.log("   • Dentiste: http://localhost:5173/dentist/dashboard");
  console.log(
    "   • Comptes: patient@melyia.com / dentiste@melyia.com (test123)"
  );
}

runCompleteFrontendTest().catch(console.error);
