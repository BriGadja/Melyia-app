// ✅ TEST SIMPLE : DÉMONSTRATION WARM-UP CHATBOT
import axios from "axios";

const API_BASE = "https://app-dev.melyia.com/api";

console.log("🔥 DÉMONSTRATION WARM-UP CHATBOT v24");
console.log("=====================================\n");

// 1. Login admin
console.log("1️⃣ Login admin...");
try {
  const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
    email: "brice@melyia.com",
    password: "password",
  });

  const token = loginResponse.data.token;
  console.log("✅ Login réussi !\n");

  // 2. Status initial
  console.log("2️⃣ Vérification status initial...");
  const initialStatus = await axios.get(`${API_BASE}/chat/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`📊 Status: ${initialStatus.data.status}`);
  console.log(`🚦 Prêt: ${initialStatus.data.isReady ? "OUI" : "NON"}`);
  console.log(`💬 Message: ${initialStatus.data.message}\n`);

  // 3. Warm-up si nécessaire
  if (!initialStatus.data.isReady) {
    console.log("3️⃣ Démarrage warm-up...");
    const startTime = Date.now();

    const warmupResponse = await axios.post(
      `${API_BASE}/chat/warmup`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      }
    );

    const warmupTime = Date.now() - startTime;
    console.log(`🔥 Warm-up terminé en ${warmupTime}ms`);
    console.log(`⚡ Instant: ${warmupResponse.data.isInstant ? "OUI" : "NON"}`);
    console.log(`💬 ${warmupResponse.data.message}\n`);
  } else {
    console.log("3️⃣ ✅ Chatbot déjà prêt - Aucun warm-up nécessaire\n");
  }

  // 4. Status final
  console.log("4️⃣ Vérification status final...");
  const finalStatus = await axios.get(`${API_BASE}/chat/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`📊 Status: ${finalStatus.data.status}`);
  console.log(`🚦 Prêt: ${finalStatus.data.isReady ? "OUI" : "NON"}`);
  console.log(`💬 Message: ${finalStatus.data.message}\n`);

  // 5. Résumé
  console.log("🎯 RÉSUMÉ:");
  console.log("==========");
  if (finalStatus.data.isReady) {
    console.log("✅ SUCCÈS: Chatbot prêt pour utilisation !");
    console.log(
      "💡 Les patients peuvent maintenant utiliser le chat sans timeout"
    );
    console.log("⚡ Le warm-up automatique élimine les délais d'attente");
  } else {
    console.log("❌ PROBLÈME: Chatbot non prêt");
  }
} catch (error) {
  console.error("❌ Erreur:", error.message);
  if (error.response) {
    console.error("📊 Status:", error.response.status);
    console.error("💬 Réponse:", error.response.data);
  }
}
