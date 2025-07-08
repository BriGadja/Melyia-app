// test-admin-upload-documents.mjs - ✅ EXTENSION .mjs OBLIGATOIRE
import axios from "axios";
import fs from "fs";
import path from "path";

const API_BASE = "https://app-dev.melyia.com/api";

async function loginAdmin() {
  try {
    console.log("🔐 Connexion admin...");
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: "brice@melyia.com",
      password: "password",
    });

    if (response.data.success) {
      console.log("✅ Connexion réussie !");
      return response.data.token;
    }
    throw new Error("Login failed");
  } catch (error) {
    console.error("❌ Login error:", error.response?.data || error.message);
    return null;
  }
}

async function testGeneralDocumentUpload(token) {
  console.log("\n📚 Test Upload Documents Généraux...");

  try {
    // Créer un fichier de test simple
    const testContent = `# Document de Test - Base de Connaissances

## Protocole de Test

Ce document sert à tester l'upload de documents généraux dans la base de connaissances.

### Informations
- Date: ${new Date().toISOString()}
- Type: Document de test
- Catégorie: Protocole

### Contenu
Ce document contient des informations de test pour valider le système d'upload.
`;

    // Créer le fichier temporaire
    const tempFile = "temp-test-protocole.txt";
    fs.writeFileSync(tempFile, testContent);

    // Préparer le FormData
    const formData = new FormData();
    formData.append(
      "documents",
      new Blob([testContent], { type: "text/plain" }),
      tempFile
    );
    formData.append("category", "protocole");
    formData.append("title", "Document de Test - Protocole");
    formData.append(
      "description",
      "Document de test pour valider l'upload de documents généraux"
    );

    console.log("📤 Upload en cours...");
    const response = await axios.post(
      `${API_BASE}/admin/documents/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Upload réussi !");
    console.log("📊 Réponse:", response.data);

    // Nettoyer le fichier temporaire
    fs.unlinkSync(tempFile);

    return true;
  } catch (error) {
    console.error(
      "❌ Erreur upload documents généraux:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function testPersonalDocumentUpload(token) {
  console.log("\n👤 Test Upload Documents Personnels...");

  try {
    // D'abord, récupérer la liste des patients
    console.log("📋 Récupération des patients...");
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (
      !patientsResponse.data.success ||
      patientsResponse.data.patients.length === 0
    ) {
      console.log("⚠️  Aucun patient trouvé, création d'un patient de test...");
      // Créer un patient de test si nécessaire
      const patientData = {
        firstName: "Test",
        lastName: "Patient Upload",
        email: "test-upload@melyia.com",
        phone: "0123456789",
        emergencyContact: "Emergency Contact",
      };

      const createResponse = await axios.post(
        `${API_BASE}/patients`,
        patientData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (createResponse.data.success) {
        console.log("✅ Patient de test créé !");
      }
    }

    // Récupérer à nouveau la liste des patients
    const updatedPatientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const patients = updatedPatientsResponse.data.patients;
    console.log(`📋 ${patients.length} patient(s) trouvé(s)`);

    if (patients.length === 0) {
      console.log("⚠️  Impossible de tester l'upload personnel sans patients");
      return false;
    }

    // Utiliser le premier patient
    const firstPatient = patients[0];
    console.log(
      `👤 Patient sélectionné: ${firstPatient.firstName} ${firstPatient.lastName}`
    );

    // Créer un document de test pour le patient
    const testContent = `# Document Personnel - ${firstPatient.firstName} ${
      firstPatient.lastName
    }

## Informations Patient
- Nom: ${firstPatient.firstName} ${firstPatient.lastName}
- Email: ${firstPatient.email}
- Téléphone: ${firstPatient.phone}

## Document de Test
Ce document sert à tester l'upload de documents personnels.

### Détails
- Date: ${new Date().toISOString()}
- Type: Note d'opération
- Statut: Test

### Contenu
Ce document contient des informations de test pour valider le système d'upload personnel.
`;

    // Préparer le FormData
    const formData = new FormData();
    formData.append(
      "documents",
      new Blob([testContent], { type: "text/plain" }),
      "test-note-operation.txt"
    );
    formData.append("type", "note_operation");
    formData.append("patientId", firstPatient.id.toString());
    formData.append(
      "title",
      `Document Test - ${firstPatient.firstName} ${firstPatient.lastName}`
    );

    console.log("📤 Upload en cours...");
    const response = await axios.post(
      `${API_BASE}/documents/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Upload réussi !");
    console.log("📊 Réponse:", response.data);

    return true;
  } catch (error) {
    console.error(
      "❌ Erreur upload documents personnels:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function testAdminAPIsAccess(token) {
  console.log("\n🔧 Test Accès APIs Admin...");

  try {
    // Tester l'accès aux stats admin
    const statsResponse = await axios.get(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Accès aux stats admin OK");
    console.log("📊 Stats:", {
      users: statsResponse.data.users || 0,
      documents: statsResponse.data.documents || 0,
      conversations: statsResponse.data.conversations || 0,
    });

    // Tester l'accès aux documents admin
    const documentsResponse = await axios.get(`${API_BASE}/admin/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Accès aux documents admin OK");
    console.log("📄 Documents:", documentsResponse.data.documents?.length || 0);

    return true;
  } catch (error) {
    console.error(
      "❌ Erreur accès APIs admin:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function runTests() {
  console.log("🎯 =================================");
  console.log("🎯 TEST ADMIN UPLOAD DOCUMENTS v35.0");
  console.log("🎯 =================================\n");

  const token = await loginAdmin();
  if (!token) {
    console.log("❌ Impossible de continuer sans token");
    return;
  }

  const results = {
    adminAccess: await testAdminAPIsAccess(token),
    generalUpload: await testGeneralDocumentUpload(token),
    personalUpload: await testPersonalDocumentUpload(token),
  };

  console.log("\n🎯 =================================");
  console.log("🎯 RÉSULTATS DES TESTS");
  console.log("🎯 =================================");

  console.log(
    `🔧 Accès APIs Admin: ${results.adminAccess ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `📚 Upload Documents Généraux: ${
      results.generalUpload ? "✅ PASS" : "❌ FAIL"
    }`
  );
  console.log(
    `👤 Upload Documents Personnels: ${
      results.personalUpload ? "✅ PASS" : "❌ FAIL"
    }`
  );

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;

  console.log(`\n🎯 Score Global: ${passedTests}/${totalTests} tests réussis`);

  if (passedTests === totalTests) {
    console.log(
      "🎉 TOUS LES TESTS SONT PASSÉS ! Interface Admin Upload opérationnelle !"
    );
  } else {
    console.log(
      "⚠️  Certains tests ont échoué, vérifiez les erreurs ci-dessus."
    );
  }
}

runTests().catch(console.error);
