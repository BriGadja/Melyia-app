#!/usr/bin/env node

/**
 * DEBUG CHATBOT STATUS v36
 * ========================
 * Diagnostic des erreurs d'API du chatbot
 */

import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

async function debugStatus() {
  console.log("🔍 [DEBUG] DIAGNOSTIC CHATBOT v36");
  console.log("=================================");

  try {
    // 1. Test health endpoint
    console.log("\n📊 [TEST] Health endpoint...");
    const healthResponse = await axios.get(`${API_BASE}/health`, { timeout: 10000 });
    console.log("✅ Health:", healthResponse.data.status);
    console.log("📋 Services:", JSON.stringify(healthResponse.data.services, null, 2));

    // 2. Test login
    console.log("\n🔐 [TEST] Login patient...");
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "patient@melyia.com",
      password: "test123"
    });
    
    if (!loginResponse.data.success) {
      throw new Error("Login failed: " + JSON.stringify(loginResponse.data));
    }
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log("✅ Login réussi, userId:", userId);

    // 3. Test chat status
    console.log("\n🤖 [TEST] Chat status...");
    const statusResponse = await axios.get(`${API_BASE}/chat/status`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    console.log("✅ Chat status:", JSON.stringify(statusResponse.data, null, 2));

    // 4. Test warmup
    console.log("\n🔥 [TEST] Chat warmup...");
    const warmupResponse = await axios.post(`${API_BASE}/chat/warmup`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000
    });
    console.log("✅ Warmup:", JSON.stringify(warmupResponse.data, null, 2));

    // 5. Test simple question
    console.log("\n💬 [TEST] Question simple...");
    const chatResponse = await axios.post(`${API_BASE}/chat`, {
      message: "Bonjour, comment allez-vous ?",
      patientId: userId
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000
    });

    console.log("✅ Chat response:");
    console.log("   Success:", chatResponse.data.success);
    if (chatResponse.data.response) {
      console.log("   Response:", chatResponse.data.response.substring(0, 200) + "...");
    }
    if (chatResponse.data.error) {
      console.log("   Error:", chatResponse.data.error);
    }
    console.log("   Metadata:", JSON.stringify(chatResponse.data.metadata, null, 2));

  } catch (error) {
    console.error("\n❌ [ERROR]", error.response?.status, error.response?.statusText);
    console.error("📝 Data:", JSON.stringify(error.response?.data, null, 2));
    console.error("🔧 Message:", error.message);
  }
}

debugStatus(); 