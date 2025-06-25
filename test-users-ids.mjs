// test-users-ids.mjs - Identifier les IDs utilisateurs
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginAdmin() {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: "brice@melyia.com",
    password: "password",
  });
  return response.data.token;
}

async function loginDentist() {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: "dentiste@melyia.com",
    password: "test123",
  });
  return { token: response.data.token, user: response.data.user };
}

async function loginPatient() {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: "patient@melyia.com",
    password: "test123",
  });
  return { token: response.data.token, user: response.data.user };
}

async function testUserIds() {
  console.log("🔍 IDENTIFICATION IDS UTILISATEURS");
  console.log("===================================");

  try {
    // Login admin
    const adminToken = await loginAdmin();

    // Login dentiste et patient
    const dentist = await loginDentist();
    const patient = await loginPatient();

    console.log("✅ IDs utilisateurs identifiés:");
    console.log(
      `   👨‍⚕️ Dentiste (${dentist.user.email}): ID ${dentist.user.id}`
    );
    console.log(`   👥 Patient (${patient.user.email}): ID ${patient.user.id}`);

    // Test création notification pour dentiste avec bon ID
    console.log("\n📝 Test création notification pour dentiste...");
    const notifDentist = await axios.post(
      `${API_BASE}/notifications`,
      {
        user_id: dentist.user.id,
        notification_type: "test_direct",
        content: "🔔 Notification test direct pour dentiste avec bon ID",
        priority: "high",
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("✅ Notification dentiste créée:", notifDentist.data.data);

    // Test création notification pour patient avec bon ID
    console.log("\n📝 Test création notification pour patient...");
    const notifPatient = await axios.post(
      `${API_BASE}/notifications`,
      {
        user_id: patient.user.id,
        notification_type: "test_direct",
        content: "🔔 Notification test direct pour patient avec bon ID",
        priority: "normal",
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("✅ Notification patient créée:", notifPatient.data.data);

    // Test récupération notifications dentiste
    console.log("\n🔍 Test récupération notifications dentiste...");
    const dentistNotifs = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${dentist.token}` },
    });
    console.log("✅ Notifications dentiste:", {
      total: dentistNotifs.data.data.total_count,
      unread: dentistNotifs.data.data.unread_count,
      count: dentistNotifs.data.data.notifications.length,
    });

    // Test récupération notifications patient
    console.log("\n🔍 Test récupération notifications patient...");
    const patientNotifs = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patient.token}` },
    });
    console.log("✅ Notifications patient:", {
      total: patientNotifs.data.data.total_count,
      unread: patientNotifs.data.data.unread_count,
      count: patientNotifs.data.data.notifications.length,
    });

    if (dentistNotifs.data.data.notifications.length > 0) {
      console.log("\n📋 Première notification dentiste:");
      console.log(dentistNotifs.data.data.notifications[0]);
    }

    if (patientNotifs.data.data.notifications.length > 0) {
      console.log("\n📋 Première notification patient:");
      console.log(patientNotifs.data.data.notifications[0]);
    }
  } catch (error) {
    console.error("❌ Erreur:", error.response?.data || error.message);
  }
}

testUserIds();
