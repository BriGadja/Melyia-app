// test-auth-debug.mjs - Diagnostic authentification
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function testAuth() {
  console.log("🔍 DIAGNOSTIC AUTHENTIFICATION");
  console.log("===============================");

  try {
    // Test 1: Login dentiste
    console.log("\n🔐 Test login dentiste...");
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "dentiste@melyia.com",
      password: "test123",
    });

    console.log("✅ Login réussi:", {
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.token,
      tokenLength: loginResponse.data.token?.length || 0,
      user: loginResponse.data.user,
    });

    const token = loginResponse.data.token;

    // Test 2: Vérification token
    console.log("\n🎫 Test vérification token...");
    const verifyResponse = await axios.post(
      `${API_BASE}/auth/verify`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ Token valide:", {
      success: verifyResponse.data.success,
      user: verifyResponse.data.user,
    });

    // Test 3: Test endpoint notifications
    console.log("\n🔔 Test GET notifications avec token...");
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Notifications récupérées:", {
      success: notificationsResponse.data.success,
      totalCount: notificationsResponse.data.data?.total_count,
      unreadCount: notificationsResponse.data.data?.unread_count,
      notifications: notificationsResponse.data.data?.notifications?.length,
    });

    // Test 4: Headers et format
    console.log("\n📋 Debug Headers:");
    console.log("Authorization Header:", `Bearer ${token.substring(0, 20)}...`);
    console.log("Token format valid:", token.split(".").length === 3);
  } catch (error) {
    console.error("❌ Erreur:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
  }
}

async function testLocalStorageAuth() {
  console.log("\n🏪 SIMULATION LOCALSTORAGE");
  console.log("===========================");

  try {
    // Login pour obtenir token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "dentiste@melyia.com",
      password: "test123",
    });

    const token = loginResponse.data.token;
    console.log("🎫 Token obtenu:", token.substring(0, 20) + "...");

    // Simulation de ce que fait le frontend
    console.log("\n🔄 Simulation appel frontend...");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    console.log("📤 Headers envoyés:", {
      "Content-Type": headers["Content-Type"],
      Authorization: headers["Authorization"].substring(0, 30) + "...",
    });

    const response = await axios.get(`${API_BASE}/notifications`, { headers });

    console.log("✅ Réponse frontend simulation:", {
      status: response.status,
      success: response.data.success,
      data: response.data.data,
    });
  } catch (error) {
    console.error("❌ Erreur simulation frontend:", {
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

console.log("🚀 DÉMARRAGE DIAGNOSTIC COMPLET\n");
await testAuth();
await testLocalStorageAuth();
