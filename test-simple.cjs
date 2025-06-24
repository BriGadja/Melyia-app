console.log("🔍 Test simple démarré...");

const axios = require("axios");

async function testSimple() {
  try {
    console.log("🌐 Test connectivité serveur...");
    const response = await axios.get("http://localhost:8083/");
    console.log("✅ Serveur OK:", response.status);
    console.log("📊 Données:", response.data);

    console.log("🔐 Test login admin...");
    const loginResponse = await axios.post(
      "http://localhost:8083/api/auth/login",
      {
        email: "brice@melyia.com",
        password: "password",
      }
    );
    console.log("✅ Login OK:", loginResponse.status);
    console.log("🎫 Token reçu:", !!loginResponse.data.token);
  } catch (error) {
    console.log("❌ Erreur:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }
  }
}

testSimple();
