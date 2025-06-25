const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { execSync } = require("child_process");

const app = express();
const PORT = 8083;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const WEBHOOK_TOKEN =
  process.env.WEBHOOK_TOKEN ||
  "2bce1774a17bf4a01b21798780481413a9872b27c457b7c778e7c157125a6410";

// Configuration PostgreSQL
const pool = new Pool({
  user: "melyia_user",
  host: "localhost",
  port: 5432,
  password: "QOZ9QyJd4YiufyzMj0eq7GgHV0sBrlSX",
  database: "melyia_dev",
});

// Test connexion PostgreSQL au démarrage
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Erreur connexion PostgreSQL:", err);
  } else {
    console.log("✅ PostgreSQL connecté:", res.rows[0].now);
  }
});

// Configuration CORS étendue
app.use(
  cors({
    origin: [
      "https://app-dev.melyia.com",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Webhook-Token"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token d'accès requis" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token invalide" });
    }
    req.user = user;
    next();
  });
};

// Middleware validation webhook
const validateWebhook = (req, res, next) => {
  const token = req.headers["x-webhook-token"];
  if (token !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: "Token webhook invalide" });
  }
  next();
};

// ✅ CORRECTION CRITIQUE : Créer répertoire temporaire pour webhook
const tmpDir = "/tmp/melyia-uploads";
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true, mode: 0o755 });
  console.log("✅ Répertoire temporaire créé:", tmpDir);
}

// Configuration Multer pour documents médicaux
const documentsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "/var/www/melyia/documents";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000000);
    const ext = path.extname(file.originalname);
    cb(null, `documents-${timestamp}-${randomNum}${ext}`);
  },
});

const documentsUpload = multer({
  storage: documentsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"), false);
    }
  },
});

// ✅ CORRECTION WEBHOOK MULTER : Configuration flexible et robuste
const webStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Assurer que le répertoire existe
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    // Préserver le nom original pour le déploiement
    cb(null, file.originalname);
  },
});

// ✅ CORRECTION : Configuration Multer plus permissive pour webhook
const webUpload = multer({
  storage: webStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 20, // Max 20 fichiers
  },
  fileFilter: (req, file, cb) => {
    // ✅ CORRECTION : Accepter tous les types de fichiers web
    const allowedExtensions = [
      ".html",
      ".css",
      ".js",
      ".json",
      ".png",
      ".jpg",
      ".jpeg",
      ".svg",
      ".ico",
      ".woff",
      ".woff2",
      ".ttf",
    ];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      console.log(
        `⚠️ Type de fichier rejeté: ${file.originalname} (${fileExt})`
      );
      cb(new Error(`Type de fichier non autorisé: ${fileExt}`), false);
    }
  },
});

// ================================
// 🔄 FONCTION GÉNÉRATION EMBEDDINGS OPENAI
// ================================

async function generateEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API OpenAI manquante (OPENAI_API_KEY)");
  }

  try {
    console.log(
      `🧠 [EMBEDDING] Génération pour: "${text.substring(0, 50)}..."`
    );

    // Appel API OpenAI embeddings
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        input: text,
        model: "text-embedding-ada-002",
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30s timeout pour l'API OpenAI
      }
    );

    // Extraire le vecteur (1536 dimensions)
    const vector = response.data.data[0].embedding;

    console.log(`✅ [EMBEDDING] Vecteur généré: ${vector.length} dimensions`);

    return vector;
  } catch (error) {
    console.error(
      "❌ [EMBEDDING] Erreur génération:",
      error.response?.data || error.message
    );
    throw new Error(
      `Erreur génération embedding: ${
        error.response?.data?.error?.message || error.message
      }`
    );
  }
}

// FONCTION KEEP-ALIVE OLLAMA ULTRA-OPTIMISÉE
async function ensureOllamaReady() {
  try {
    console.log("⚡ Vérification état Ollama (mode rapide)...");

    // ✅ OPTIMISATION : Requête de warm-up ultra-légère
    const keepAliveResponse = await axios.post(
      "http://127.0.0.1:11434/api/generate",
      {
        model: "llama3.2:3b",
        prompt: "OK", // Prompt minimal
        stream: false,
        keep_alive: "30m", // OPTIMISÉ : 30min au lieu de 24h pour éviter la surcharge mémoire
        options: {
          num_predict: 1, // 1 seul token en réponse
          temperature: 0.1, // Déterministe
          num_ctx: 512, // Contexte minimal
        },
      },
      {
        timeout: 3000, // Timeout réduit à 3s
      }
    );

    console.log("⚡ Ollama ready (mode rapide) - Modèle chargé et optimisé");
    return true;
  } catch (error) {
    console.log("⚠️ Ollama warming up:", error.message);
    return false;
  }
}

// ✅ Initialisation avec retry intelligent
async function initOllamaWithRetry() {
  for (let i = 0; i < 3; i++) {
    const success = await ensureOllamaReady();
    if (success) break;
    console.log(`🔄 Retry Ollama init ${i + 1}/3...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// Initialisation optimisée au démarrage
initOllamaWithRetry();

// ✅ Keep-alive plus fréquent mais plus léger (toutes les 15 minutes)
setInterval(ensureOllamaReady, 15 * 60 * 1000);

// ================================
// ROUTES AUTHENTICATION
// ================================

// Route santé étendue
app.get("/api/health", async (req, res) => {
  try {
    // Test PostgreSQL
    const dbTest = await pool.query("SELECT NOW()");

    // Test Ollama
    const ollamaTest = await axios.get("http://127.0.0.1:11434/api/version", {
      timeout: 3000,
    });

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        ollama: "connected",
        ollamaVersion: ollamaTest.data?.version || "unknown",
      },
      routes: [
        "/api/auth/login",
        "/api/auth/register",
        "/api/patients",
        "/api/documents/upload",
        "/api/chat",
        "/api/admin/stats",
        "/api/admin/users",
        "/api/admin/documents",
        "/api/admin/conversations",
        "/hooks/deploy",
      ],
      architecture: "DIRECT_OLLAMA_KEEPALIVE",
      version: "v23.0.0-PERENNE",
    });
  } catch (error) {
    res.status(503).json({
      status: "DEGRADED",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Route login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    const userResult = await pool.query(
      "SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Compte désactivé",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Mise à jour last_login
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`✅ Connexion réussie: ${user.email} (${user.role})`);

    // ✅ AJOUT : Redirection spéciale pour admin
    let redirectUrl;
    if (user.role === "admin") {
      redirectUrl = "/admin/dashboard";
    } else if (user.role === "dentist") {
      redirectUrl = "/dentist/dashboard";
    } else {
      redirectUrl = "/patient/dashboard";
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      redirectUrl,
    });
  } catch (error) {
    console.error("❌ Erreur login:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Route de vérification du token
app.post("/api/auth/verify", authenticateToken, async (req, res) => {
  try {
    // Le middleware authenticateToken a déjà validé le token
    // Récupérer les infos utilisateur depuis la base
    const userResult = await pool.query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
        CASE 
          WHEN u.role = 'admin' THEN ap.permissions::text
          ELSE NULL 
        END as permissions
      FROM users u
      LEFT JOIN admin_profiles ap ON u.id = ap.user_id
      WHERE u.id = $1`,
      [req.user.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou compte désactivé",
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        permissions: user.permissions ? JSON.parse(user.permissions) : null,
      },
    });
  } catch (error) {
    console.error("❌ Erreur vérification token:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Route register
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      role,
      practiceInfo,
      phone,
    } = req.body;

    // Validations
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    if (!["dentist", "patient", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide",
      });
    }

    // Vérifier si email existe
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cette adresse email est déjà utilisée",
      });
    }

    // Hachage password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Transaction pour créer utilisateur + profil
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Créer utilisateur
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true, true)
         RETURNING id, email, first_name, last_name, role`,
        [
          email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          phone || null,
          role,
        ]
      );

      const newUser = userResult.rows[0];

      // Créer profil selon rôle
      if (role === "dentist") {
        await client.query(
          `INSERT INTO dentist_profiles (user_id, practice_name, specializations, subscription_type, max_patients)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            newUser.id,
            practiceInfo?.practiceName || `Cabinet ${firstName} ${lastName}`,
            practiceInfo?.specializations || ["Dentisterie générale"],
            practiceInfo?.subscriptionType || "trial",
            practiceInfo?.maxPatients || 50,
          ]
        );
      } else if (role === "patient") {
        await client.query(
          `INSERT INTO patient_profiles (user_id, emergency_contact, data_processing_consent)
           VALUES ($1, $2, true)`,
          [newUser.id, phone || null]
        );
      } else if (role === "admin") {
        // ✅ AJOUT : Création profil admin
        await client.query(
          `INSERT INTO admin_profiles (user_id, permissions)
           VALUES ($1, $2)`,
          [
            newUser.id,
            JSON.stringify({
              super_admin: true,
              manage_users: true,
              view_analytics: true,
              manage_documents: true,
            }),
          ]
        );
      }

      await client.query("COMMIT");

      // Générer token pour connexion automatique
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log(`✅ Inscription réussie: ${newUser.email} (${newUser.role})`);

      // ✅ AJOUT : Redirection selon rôle
      let redirectUrl;
      if (role === "admin") {
        redirectUrl = "/admin/dashboard";
      } else if (role === "dentist") {
        redirectUrl = "/dentist/dashboard";
      } else {
        redirectUrl = "/patient/dashboard";
      }

      res.status(201).json({
        success: true,
        message: "Compte créé avec succès",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
        },
        redirectUrl,
      });
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Erreur inscription:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du compte",
    });
  }
});

// ================================
// ROUTES PATIENTS ET DOCUMENTS
// ================================

// Route liste patients (pour dentistes)
app.get("/api/patients", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "dentist") {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux dentistes",
      });
    }

    const patientsResult = await pool.query(
      `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.created_at,
        pp.emergency_contact,
        COUNT(pd.id) as documents_count
      FROM users u
      INNER JOIN patient_profiles pp ON u.id = pp.user_id
      LEFT JOIN patient_documents pd ON u.id = pd.patient_id
      WHERE u.role = 'patient' AND u.is_active = true AND pp.dentist_id = $1
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at, pp.emergency_contact
      ORDER BY u.created_at DESC
    `,
      [req.user.userId]
    );

    console.log(
      `📋 Liste patients demandée par dentiste ${req.user.userId}: ${patientsResult.rows.length} patients`
    );

    res.json({
      success: true,
      patients: patientsResult.rows.map((patient) => ({
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        emergencyContact: patient.emergency_contact,
        documentsCount: parseInt(patient.documents_count) || 0,
        registrationDate: patient.created_at,
      })),
    });
  } catch (error) {
    console.error("❌ Erreur récupération patients:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des patients",
    });
  }
});

// Route création patient (pour dentistes)
app.post("/api/patients", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "dentist") {
      return res.status(403).json({
        success: false,
        message: "Accès interdit",
      });
    }

    const { email, firstName, lastName, phone } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Informations incomplètes",
      });
    }

    // Vérifier si l'email est déjà utilisé
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (userCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email déjà utilisé",
      });
    }

    // Créer le nouvel utilisateur patient (mot de passe temporaire généré)
    const tempPwd = Math.random().toString(36).slice(-8); // génère un pwd aléatoire
    const hash = await bcrypt.hash(tempPwd, 10);

    const userResult = await pool.query(
      `INSERT INTO users(email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
       VALUES($1, $2, $3, $4, $5, 'patient', true, false) RETURNING id`,
      [email, hash, firstName, lastName, phone || null]
    );
    const newPatientId = userResult.rows[0].id;

    // Créer le profil patient en liant le dentiste courant
    await pool.query(
      `INSERT INTO patient_profiles(user_id, dentist_id) VALUES($1, $2)`,
      [newPatientId, req.user.userId]
    );

    console.log(
      `👤 Nouveau patient créé: userID=${newPatientId} par dentiste=${req.user.userId}`
    );

    return res.json({
      success: true,
      patientId: newPatientId,
      message: "Patient créé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur création patient:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du patient",
    });
  }
});

// Route upload documents
app.post(
  "/api/documents/upload",
  authenticateToken,
  documentsUpload.array("documents", 10),
  async (req, res) => {
    try {
      if (req.user.role !== "dentist") {
        return res.status(403).json({
          success: false,
          message: "Seuls les dentistes peuvent uploader des documents",
        });
      }

      const { patientId, type, title } = req.body;

      if (!patientId || !type || !req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Patient, type et fichiers requis",
        });
      }

      // Vérifier que le patient existe
      const patientCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'patient'",
        [patientId]
      );

      if (patientCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient non trouvé",
        });
      }

      // Vérifier que le patient est bien un de ceux du dentiste connecté
      const profileCheck = await pool.query(
        "SELECT dentist_id FROM patient_profiles WHERE user_id = $1",
        [patientId]
      );
      const dentistId = profileCheck.rows[0]?.dentist_id;
      if (!dentistId || dentistId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Ce patient n'est pas rattaché à votre cabinet",
        });
      }

      const uploadedDocuments = [];

      // Traiter chaque fichier
      for (const file of req.files) {
        console.log(
          `📤 Upload document: ${file.originalname} (${file.size} bytes)`
        );

        // Lire le contenu selon le type
        let content = "";

        if (file.mimetype === "text/plain") {
          content = fs.readFileSync(file.path, "utf8");
        } else if (file.mimetype === "application/pdf") {
          content = `[PDF] ${file.originalname} - Contenu à extraire`;
        } else if (
          file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          content = `[DOCX] ${file.originalname} - Contenu à extraire`;
        } else {
          content = `[${file.mimetype}] ${file.originalname}`;
        }

        // ✅ ÉTAPE 2 : Génération embedding pour contenu textuel
        let embeddingVector = null;
        if (
          content &&
          !content.includes("Contenu à extraire") &&
          content.trim().length > 10
        ) {
          try {
            console.log(
              `🧠 [UPLOAD] Génération embedding pour: ${file.originalname}`
            );
            embeddingVector = await generateEmbedding(content);
            console.log(
              `✅ [UPLOAD] Embedding généré: ${embeddingVector.length} dimensions`
            );
          } catch (embedError) {
            console.error(
              `❌ [UPLOAD] Erreur embedding pour ${file.originalname}:`,
              embedError.message
            );
            // Continuer sans embedding en cas d'erreur
          }
        }

        // Insérer en base avec embedding
        const embeddingSQL = embeddingVector
          ? `'[${embeddingVector.join(",")}]'::vector`
          : "NULL";

        const documentResult = await pool.query(
          `
        INSERT INTO patient_documents
        (patient_id, dentist_id, document_type, title, content, file_path, file_name, file_size, mime_type, embedding, processing_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${embeddingSQL}, 'completed')
        RETURNING id
      `,
          [
            patientId,
            req.user.userId,
            type,
            title || file.originalname,
            content,
            file.path,
            file.originalname,
            file.size,
            file.mimetype,
          ]
        );

        uploadedDocuments.push({
          id: documentResult.rows[0].id,
          filename: file.originalname,
          size: file.size,
          type: type,
          hasEmbedding: embeddingVector !== null,
          embeddingDimensions: embeddingVector ? embeddingVector.length : 0,
        });
      }

      console.log(
        `✅ ${uploadedDocuments.length} documents uploadés pour patient ${patientId}`
      );

      res.json({
        success: true,
        message: `${uploadedDocuments.length} document(s) uploadé(s) avec succès`,
        documents: uploadedDocuments,
      });
    } catch (error) {
      console.error("❌ Erreur upload documents:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'upload des documents",
      });
    }
  }
);

// ================================
// ROUTE CHAT OLLAMA ULTRA-OPTIMISÉE v2
// ================================

app.post("/api/chat", authenticateToken, async (req, res) => {
  try {
    const { message, patientId } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(
      `🚀 [CHAT_FAST] User: ${userId} (${userRole}), Patient: ${patientId}, Message: "${message.substring(
        0,
        50
      )}..."`
    );

    if (!message || !patientId) {
      return res.status(400).json({
        success: false,
        error: "Paramètres manquants (message, patientId requis)",
      });
    }

    const startTime = Date.now();

    // Vérifier accès patient
    if (userRole === "patient" && parseInt(patientId) !== userId) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé à ce patient",
      });
    }

    // ✅ OPTIMISATION 1: Classification intention simplifiée
    const messageLower = message.toLowerCase();
    let intent = "general";
    let isUrgent = false;

    if (
      messageLower.includes("urgent") ||
      messageLower.includes("douleur") ||
      messageLower.includes("mal")
    ) {
      intent = "urgence";
      isUrgent = true;
    }

    console.log(`⚡ [INTENT_FAST] Intent: ${intent}, Urgent: ${isUrgent}`);

    // ✅ ÉTAPE 3: Recherche vectorielle intelligente pour documents pertinents
    let documents = [];
    try {
      // Génération embedding de la question pour recherche vectorielle
      console.log(
        `🧠 [RAG] Génération embedding question: "${message.substring(
          0,
          50
        )}..."`
      );
      const questionEmbedding = await generateEmbedding(message);

      // Recherche vectorielle avec similarité cosinale (pgvector)
      const vectorSearchQuery = `
        SELECT id, title, content, document_type, file_name, created_at,
               (embedding <-> '[${questionEmbedding.join(
                 ","
               )}]'::vector) AS distance
        FROM patient_documents
        WHERE patient_id = $1 AND dentist_id = $2 AND embedding IS NOT NULL AND processing_status = 'completed'
        ORDER BY distance ASC
        LIMIT 3
      `;

      const vectorResult = await pool.query(vectorSearchQuery, [
        patientId,
        userId,
      ]);

      // Filtrer par seuil de pertinence (distance < 0.8 = documents pertinents)
      const relevantDocs = vectorResult.rows.filter(
        (doc) => doc.distance < 0.8
      );
      documents = relevantDocs;

      console.log(
        `🔍 [RAG] ${documents.length} documents pertinents trouvés par recherche vectorielle (seuil: 0.8)`
      );

      // Fallback vers recherche classique si pas de documents pertinents
      if (documents.length === 0) {
        console.log(`📄 [RAG] Fallback vers récupération classique`);
        const fallbackQuery = `
          SELECT id, title, content, document_type, file_name, created_at
          FROM patient_documents
          WHERE patient_id = $1 AND dentist_id = $2 AND processing_status = 'completed'
          ORDER BY created_at DESC
          LIMIT 2
        `;
        const fallbackResult = await pool.query(fallbackQuery, [
          patientId,
          userId,
        ]);
        documents = fallbackResult.rows;
      }
    } catch (vectorError) {
      console.error(
        "❌ [RAG] Erreur recherche vectorielle:",
        vectorError.message
      );

      // Fallback complet vers récupération classique en cas d'erreur
      const fallbackQuery = `
        SELECT id, title, content, document_type, file_name, created_at
        FROM patient_documents
        WHERE patient_id = $1 AND dentist_id = $2 AND processing_status = 'completed'
        ORDER BY created_at DESC
        LIMIT 2
      `;
      const fallbackResult = await pool.query(fallbackQuery, [
        patientId,
        userId,
      ]);
      documents = fallbackResult.rows;
      console.log(
        `📄 [RAG] Fallback utilisé: ${documents.length} documents récupérés`
      );
    }

    console.log(
      `📄 [DOCS_RAG] ${documents.length} documents finaux pour contexte`
    );

    // ✅ ÉTAPE 3: Contexte médical enrichi par recherche vectorielle
    const contextPrompt =
      documents.length > 0
        ? documents
            .map((doc, index) => {
              const content = doc.content ? doc.content.substring(0, 300) : ""; // Augmenté pour documents pertinents
              const relevance = doc.distance
                ? ` (pertinence: ${(1 - doc.distance).toFixed(2)})`
                : "";
              return `[${doc.document_type}] ${
                doc.title || doc.file_name
              }${relevance}: ${content}`;
            })
            .join("\n")
        : "Aucun document pertinent trouvé dans le dossier patient.";

    // ✅ OPTIMISATION 4: Récupération configuration LLM complète (une seule requête)
    const llmConfigResult = await pool.query(
      "SELECT * FROM llm_settings LIMIT 1"
    );
    const llmConfig = llmConfigResult.rows[0];

    if (!llmConfig) {
      console.error("❌ [CHAT_ERROR] Configuration LLM non trouvée");
      return res.status(500).json({
        success: false,
        error: "Configuration IA non disponible",
        retry: false,
      });
    }

    console.log(
      `🤖 [LLM_CONFIG] Using dynamic config - Temp: ${llmConfig.temperature}, MaxTokens: ${llmConfig.max_tokens}, Model: ${llmConfig.model_name}`
    );

    // ✅ OPTIMISATION 5: Prompt système dynamique selon intention
    let systemPrompt = "";
    switch (intent) {
      case "urgence":
        systemPrompt =
          llmConfig.system_prompt_urgence ||
          `Assistant dentaire d'urgence français. Évalue et conseille rapidement.`;
        break;
      default:
        systemPrompt =
          llmConfig.system_prompt ||
          `Assistant dentaire français. Réponds brièvement et clairement.`;
    }

    console.log(
      `📝 [PROMPT_CONFIG] Using ${intent} prompt: ${systemPrompt.substring(
        0,
        50
      )}...`
    );

    // ✅ OPTIMISATION 6: Prompt final ultra-compact
    const fullPrompt = `${systemPrompt}

DOSSIER: ${contextPrompt}

QUESTION: ${message}

Réponds en français, max 150 mots, précis et rassurant.

RÉPONSE:`;

    console.log(
      `🔄 [OLLAMA_FAST] Prompt size: ${fullPrompt.length} chars (dynamic config loaded)`
    );

    // ✅ OPTIMISATION 7: Appel Ollama avec paramètres dynamiques
    try {
      const ollamaResponse = await axios.post(
        "http://127.0.0.1:11434/api/generate",
        {
          model: llmConfig.model_name || "llama3.2:3b",
          prompt: fullPrompt,
          stream: false,
          keep_alive: `${llmConfig.keep_alive_minutes || 30}m`,
          options: {
            temperature: llmConfig.temperature || 0.2,
            top_p: llmConfig.top_p || 0.8,
            num_predict: llmConfig.max_tokens || 200,
            num_ctx: llmConfig.num_ctx || 1024,
            stop: llmConfig.stop_sequences || [
              "\n\nQUESTION:",
              "\n\nDOSSIER:",
              "RÉPONSE:",
              "\n---",
            ],
          },
        },
        {
          timeout: (llmConfig.timeout_seconds || 15) * 1000, // Conversion en millisecondes
        }
      );

      const processingTime = Date.now() - startTime;
      const aiResponse = ollamaResponse.data.response.trim();

      console.log(
        `⚡ [SUCCESS_FAST] Response in ${processingTime}ms: ${aiResponse.substring(
          0,
          50
        )}...`
      );

      // ✅ OPTIMISATION 7: Sauvegarde asynchrone (non-bloquante)
      setImmediate(async () => {
        try {
          await pool.query(
            `
              INSERT INTO chat_conversations
              (patient_id, dentist_id, message, response, context_documents, confidence_score, response_time_ms)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
              patientId,
              userRole === "dentist" ? userId : null,
              message,
              aiResponse,
              documents.map((d) => d.id),
              0.9,
              processingTime,
            ]
          );
        } catch (saveError) {
          console.error("⚠️ Erreur sauvegarde async:", saveError.message);
        }
      });

      // ✅ OPTIMISATION 8: Réponse structurée minimale avec config dynamique
      res.json({
        success: true,
        response: aiResponse,
        metadata: {
          processingTime: `${processingTime}ms`,
          isLocal: true,
          model: llmConfig.model_name || "llama3.2:3b",
          architecture: "OLLAMA_DYNAMIC_CONFIG",
          documentsUsed: documents.length,
          intent: intent,
          configUsed: {
            temperature: llmConfig.temperature,
            maxTokens: llmConfig.max_tokens,
            keepAlive: `${llmConfig.keep_alive_minutes}m`,
            timeout: `${llmConfig.timeout_seconds}s`,
          },
        },
      });
    } catch (ollamaError) {
      const processingTime = Date.now() - startTime;
      console.error(
        `❌ [OLLAMA_ERROR_FAST] After ${processingTime}ms:`,
        ollamaError.message
      );

      // Réponse d'erreur rapide selon le type d'erreur
      if (ollamaError.code === "ECONNREFUSED") {
        return res.status(503).json({
          success: false,
          error: "Service IA indisponible",
          retry: true,
        });
      } else if (
        ollamaError.code === "ECONNABORTED" ||
        processingTime > 10000
      ) {
        return res.status(504).json({
          success: false,
          error: "Temps de traitement dépassé (>10s)",
          details: "Modèle IA en cours d'optimisation",
          retry: true,
          retryAfter: 10,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: "Erreur lors du traitement IA",
          retry: false,
        });
      }
    }
  } catch (error) {
    console.error("❌ [CHAT_GENERAL_ERROR_FAST]", error.message);

    res.status(500).json({
      success: false,
      error: "Erreur lors du traitement de la demande",
      isLocal: true,
    });
  }
});

// ===================================
// ROUTES CHATBOT SUPPORT (v30.1)
// ===================================

// Route: Warm-up chatbot (initialisé par le frontend)
app.post("/api/chat/warmup", authenticateToken, async (req, res) => {
  try {
    console.log(`🔥 [WARMUP] Demande warm-up par user: ${req.user.userId}`);
    const startTime = Date.now();

    // Vérifier état Ollama
    const statusResponse = await axios.get(
      "http://127.0.0.1:11434/api/version",
      {
        timeout: 3000,
      }
    );

    if (statusResponse.status === 200) {
      // Ollama accessible, faire un warm-up léger
      try {
        await axios.post(
          "http://127.0.0.1:11434/api/generate",
          {
            model: "llama3.2:3b",
            prompt: "OK",
            stream: false,
            keep_alive: "30m",
            options: {
              num_predict: 1,
              temperature: 0.1,
              num_ctx: 256,
            },
          },
          { timeout: 15000 }
        );

        const warmupTime = Date.now() - startTime;
        console.log(`✅ [WARMUP] Réussi en ${warmupTime}ms`);

        res.json({
          success: true,
          status: "ready",
          warmupTime,
          isInstant: warmupTime < 2000,
          message:
            warmupTime < 2000
              ? "Chatbot prêt instantanément !"
              : `Chatbot initialisé en ${Math.round(warmupTime / 1000)}s`,
          userId: req.user.userId,
          timestamp: new Date().toISOString(),
        });
      } catch (ollamaError) {
        console.log(`⚠️ [WARMUP] Ollama warming: ${ollamaError.message}`);

        res.json({
          success: true,
          status: "warming",
          warmupTime: Date.now() - startTime,
          isInstant: false,
          message: "Le modèle IA se prépare... Cela peut prendre 30 secondes.",
          userId: req.user.userId,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      throw new Error("Ollama non accessible");
    }
  } catch (error) {
    console.error(`❌ [WARMUP] Erreur: ${error.message}`);

    res.status(503).json({
      success: false,
      status: "error",
      isInstant: false,
      message: "Service IA temporairement indisponible",
      error: error.message,
      userId: req.user.userId,
      timestamp: new Date().toISOString(),
    });
  }
});

// Route: Status chatbot (vérification état temps réel)
app.get("/api/chat/status", authenticateToken, async (req, res) => {
  try {
    console.log(
      `📊 [STATUS] Vérification état chatbot par: ${req.user.userId}`
    );

    // Test rapide Ollama
    const statusResponse = await axios.get(
      "http://127.0.0.1:11434/api/version",
      {
        timeout: 2000,
      }
    );

    // Test génération rapide pour vérifier si le modèle est chaud
    const testResponse = await axios.post(
      "http://127.0.0.1:11434/api/generate",
      {
        model: "llama3.2:3b",
        prompt: "Test",
        stream: false,
        options: { num_predict: 1 },
      },
      { timeout: 3000 }
    );

    const isWarm = testResponse.data && testResponse.data.response;

    res.json({
      success: true,
      status: isWarm ? "warm" : "cold",
      isReady: isWarm,
      message: isWarm
        ? "Chatbot prêt - Réponses rapides"
        : "Chatbot en veille - Nécessite warm-up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ [STATUS] Erreur: ${error.message}`);

    res.json({
      success: false,
      status: "error",
      isReady: false,
      message: "Service IA indisponible",
      timestamp: new Date().toISOString(),
    });
  }
});

// ================================
// 🚀 ROUTES NOTIFICATIONS V33
// ================================

// Route: Demander un rendez-vous (patient)
app.post(
  "/api/patients/request-appointment",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "patient") {
        return res
          .status(403)
          .json({ success: false, message: "Réservé aux patients" });
      }

      // Identifier le dentiste du patient
      const profileRes = await pool.query(
        "SELECT dentist_id FROM patient_profiles WHERE user_id = $1",
        [req.user.userId]
      );

      const dentistId = profileRes.rows[0]?.dentist_id;
      if (!dentistId) {
        return res
          .status(400)
          .json({ success: false, message: "Aucun dentiste associé" });
      }

      // Récupérer nom du patient pour le message
      const userRes = await pool.query(
        "SELECT first_name, last_name FROM users WHERE id = $1",
        [req.user.userId]
      );
      const { first_name, last_name } = userRes.rows[0];
      const contentMsg = `📅 Demande de rendez-vous de ${first_name} ${last_name}`;

      // Insérer la notification en base
      await pool.query(
        `INSERT INTO notifications(user_id, sender_id, notification_type, content, is_read)
       VALUES($1, $2, $3, $4, false)`,
        [dentistId, req.user.userId, "appointment_request", contentMsg]
      );

      console.log(
        `🔔 Notification RDV créée pour dentiste=${dentistId} par patient=${req.user.userId}`
      );

      return res.json({
        success: true,
        message: "Demande de rendez-vous envoyée",
      });
    } catch (error) {
      console.error("❌ Erreur demande RDV:", error);
      res
        .status(500)
        .json({ success: false, message: "Erreur serveur demande RDV" });
    }
  }
);

// Route: Notifications (données réelles de la base)
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(
      `🔔 [NOTIFICATIONS] Récupération pour user: ${userId} (${userRole})`
    );

    // Récupérer les notifications réelles de la base de données
    const notificationsResult = await pool.query(
      `
      SELECT 
        n.id,
        n.notification_type,
        n.content,
        n.link,
        n.priority,
        n.is_read,
        n.read_at,
        n.created_at,
        n.updated_at,
        s.first_name as sender_first_name,
        s.last_name as sender_last_name
      FROM notifications n
      LEFT JOIN users s ON n.sender_id = s.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `,
      [userId]
    );

    // Formater les notifications pour le frontend
    const notifications = notificationsResult.rows.map((notif) => ({
      id: notif.id,
      type: notif.notification_type,
      title: getNotificationTitle(notif.notification_type),
      message: notif.content,
      read: notif.is_read,
      created_at: notif.created_at,
      priority: notif.priority || "info",
      link: notif.link,
      sender_name:
        notif.sender_first_name && notif.sender_last_name
          ? `${notif.sender_first_name} ${notif.sender_last_name}`
          : null,
    }));

    console.log(
      `✅ [NOTIFICATIONS] ${notifications.length} notifications récupérées pour user ${userId}`
    );

    res.json({
      success: true,
      notifications,
      count: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error(`❌ [NOTIFICATIONS] Erreur: ${error.message}`);

    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des notifications",
      notifications: [],
    });
  }
});

// Fonction helper pour les titres des notifications
function getNotificationTitle(type) {
  switch (type) {
    case "appointment_request":
      return "Demande de rendez-vous";
    case "appointment_confirmed":
      return "Rendez-vous confirmé";
    case "appointment_cancelled":
      return "Rendez-vous annulé";
    case "system":
      return "Notification système";
    default:
      return "Notification";
  }
}

// ===================================
// ROUTES ADMIN SUPER-ADMIN (v23)
// ===================================

// Middleware pour vérifier le rôle admin
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }

  next();
}

// Route: Statistiques globales
app.get(
  "/api/admin/stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(
        "📊 [ADMIN] Récupération des statistiques globales par:",
        req.user.email
      );

      const statsResult = await pool.query("SELECT * FROM admin_stats");
      const stats = statsResult.rows[0];

      // Statistiques supplémentaires temps réel
      const recentActivity = await pool.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as conversations
      FROM chat_conversations
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

      res.json({
        success: true,
        data: {
          ...stats,
          recent_activity: recentActivity.rows,
          last_updated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur récupération stats:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// Route: Liste des utilisateurs
app.get(
  "/api/admin/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(
        "👥 [ADMIN] Récupération liste utilisateurs par:",
        req.user.email
      );

      // ✅ CORRECTION : Utiliser les vraies colonnes des tables
      const usersResult = await pool.query(`
        SELECT
          u.id,
          u.email,
          u.role,
          u.first_name,
          u.last_name,
          u.created_at,
          u.is_active,
          u.last_login
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT 100
      `);

      console.log(
        `✅ [ADMIN] ${usersResult.rows.length} utilisateurs récupérés`
      );

      res.json({
        success: true,
        data: usersResult.rows.map((user) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at,
          isActive: user.is_active,
          lastLogin: user.last_login,
          // Ajout d'informations basiques selon le rôle
          displayName: `${user.first_name} ${user.last_name} (${user.role})`,
        })),
        total: usersResult.rows.length,
        message: "Utilisateurs récupérés avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur récupération utilisateurs:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// Route: Gestion d'un utilisateur (suppression)
app.delete(
  "/api/admin/users/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(
        `🗑️ [ADMIN] Suppression utilisateur ID: ${userId} par:`,
        req.user.email
      );

      // Vérifier que l'utilisateur existe et n'est pas admin
      const userCheck = await pool.query(
        "SELECT role, email FROM users WHERE id = $1",
        [userId]
      );
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      if (userCheck.rows[0].role === "admin") {
        return res
          .status(403)
          .json({ error: "Impossible de supprimer un administrateur" });
      }

      // Suppression (CASCADE supprimera les profils liés)
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);

      console.log(
        `✅ [ADMIN] Utilisateur ${userCheck.rows[0].email} supprimé par ${req.user.email}`
      );

      res.json({
        success: true,
        message: "Utilisateur supprimé avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur suppression utilisateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// Route: Liste des documents globale
app.get(
  "/api/admin/documents",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(
        "📄 [ADMIN] Récupération documents globaux par:",
        req.user.email
      );

      // ✅ CORRECTION : Utiliser created_at et requête sécurisée
      const documentsResult = await pool.query(`
      SELECT
        pd.id, 
        pd.file_name, 
        pd.file_path, 
        pd.created_at,
        pd.document_type,
        pd.file_size,
        u_dentist.email as dentist_email,
        u_patient.email as patient_email,
        CONCAT(u_patient.first_name, ' ', u_patient.last_name) as patient_name
      FROM patient_documents pd
      LEFT JOIN users u_dentist ON pd.dentist_id = u_dentist.id
      LEFT JOIN users u_patient ON pd.patient_id = u_patient.id
      WHERE pd.processing_status = 'completed'
      ORDER BY pd.created_at DESC
      LIMIT 50
    `);

      console.log(
        `✅ [ADMIN] ${documentsResult.rows.length} documents récupérés`
      );

      res.json({
        success: true,
        data: documentsResult.rows.map((doc) => ({
          id: doc.id,
          fileName: doc.file_name,
          filePath: doc.file_path,
          createdAt: doc.created_at,
          documentType: doc.document_type,
          fileSize: doc.file_size,
          dentistEmail: doc.dentist_email,
          patientEmail: doc.patient_email,
          patientName: doc.patient_name,
        })),
        total: documentsResult.rows.length,
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur récupération documents:", error);
      res.status(500).json({
        error: "Erreur serveur",
        details: error.message,
      });
    }
  }
);

// Route: Conversations récentes (monitoring IA)
app.get(
  "/api/admin/conversations",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(
        "💬 [ADMIN] Récupération conversations récentes par:",
        req.user.email
      );

      const conversationsResult = await pool.query(`
      SELECT
        cc.id, cc.message, cc.response, cc.created_at,
        u_patient.email as patient_email,
        u_dentist.email as dentist_email,
        LENGTH(cc.response) as response_length
      FROM chat_conversations cc
      JOIN users u_patient ON cc.patient_id = u_patient.id
      LEFT JOIN users u_dentist ON cc.dentist_id = u_dentist.id
      ORDER BY cc.created_at DESC
      LIMIT 20
    `);

      res.json({
        success: true,
        data: conversationsResult.rows,
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur récupération conversations:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// ================================
// 🤖 ROUTES LLM CONFIGURATION (v30)
// ================================

// Route: Récupérer la configuration LLM actuelle
app.get(
  "/api/admin/llm-config",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(
        "🤖 [ADMIN] Récupération configuration LLM par:",
        req.user.email
      );

      const configResult = await pool.query(
        "SELECT * FROM llm_settings LIMIT 1"
      );

      if (configResult.rows.length === 0) {
        return res.status(404).json({
          error: "Configuration LLM non trouvée",
          message: "Aucune configuration LLM n'existe en base de données",
        });
      }

      const config = configResult.rows[0];

      console.log(
        `✅ [ADMIN] Configuration LLM récupérée - Model: ${config.model_name}, Temp: ${config.temperature}`
      );

      res.json({
        success: true,
        data: {
          id: config.id,
          systemPrompt: config.system_prompt,
          systemPromptUrgence: config.system_prompt_urgence,
          temperature: config.temperature,
          topP: config.top_p,
          maxTokens: config.max_tokens,
          numCtx: config.num_ctx,
          stopSequences: config.stop_sequences,
          keepAliveMinutes: config.keep_alive_minutes,
          timeoutSeconds: config.timeout_seconds,
          modelName: config.model_name,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        },
        message: "Configuration LLM récupérée avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur récupération config LLM:", error);
      res.status(500).json({
        error: "Erreur serveur",
        details: error.message,
      });
    }
  }
);

// Route: Mettre à jour la configuration LLM
app.put(
  "/api/admin/llm-config",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(
        "🤖 [ADMIN] Mise à jour configuration LLM par:",
        req.user.email
      );

      const {
        systemPrompt,
        systemPromptUrgence,
        temperature,
        topP,
        maxTokens,
        numCtx,
        stopSequences,
        keepAliveMinutes,
        timeoutSeconds,
        modelName,
      } = req.body;

      // Validation des données
      const validationErrors = [];

      if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        validationErrors.push("La température doit être entre 0 et 2");
      }

      if (topP !== undefined && (topP < 0 || topP > 1)) {
        validationErrors.push("Le top_p doit être entre 0 et 1");
      }

      if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 4096)) {
        validationErrors.push("Le max_tokens doit être entre 1 et 4096");
      }

      if (numCtx !== undefined && (numCtx < 128 || numCtx > 32768)) {
        validationErrors.push("Le num_ctx doit être entre 128 et 32768");
      }

      if (
        keepAliveMinutes !== undefined &&
        (keepAliveMinutes < 1 || keepAliveMinutes > 1440)
      ) {
        validationErrors.push(
          "Le keep_alive_minutes doit être entre 1 et 1440 (24h)"
        );
      }

      if (
        timeoutSeconds !== undefined &&
        (timeoutSeconds < 5 || timeoutSeconds > 300)
      ) {
        validationErrors.push("Le timeout_seconds doit être entre 5 et 300");
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Données invalides",
          details: validationErrors,
        });
      }

      // Construire la requête de mise à jour dynamiquement
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (systemPrompt !== undefined) {
        updateFields.push(`system_prompt = $${paramIndex++}`);
        updateValues.push(systemPrompt);
      }

      if (systemPromptUrgence !== undefined) {
        updateFields.push(`system_prompt_urgence = $${paramIndex++}`);
        updateValues.push(systemPromptUrgence);
      }

      if (temperature !== undefined) {
        updateFields.push(`temperature = $${paramIndex++}`);
        updateValues.push(temperature);
      }

      if (topP !== undefined) {
        updateFields.push(`top_p = $${paramIndex++}`);
        updateValues.push(topP);
      }

      if (maxTokens !== undefined) {
        updateFields.push(`max_tokens = $${paramIndex++}`);
        updateValues.push(maxTokens);
      }

      if (numCtx !== undefined) {
        updateFields.push(`num_ctx = $${paramIndex++}`);
        updateValues.push(numCtx);
      }

      if (stopSequences !== undefined) {
        updateFields.push(`stop_sequences = $${paramIndex++}`);
        updateValues.push(stopSequences);
      }

      if (keepAliveMinutes !== undefined) {
        updateFields.push(`keep_alive_minutes = $${paramIndex++}`);
        updateValues.push(keepAliveMinutes);
      }

      if (timeoutSeconds !== undefined) {
        updateFields.push(`timeout_seconds = $${paramIndex++}`);
        updateValues.push(timeoutSeconds);
      }

      if (modelName !== undefined) {
        updateFields.push(`model_name = $${paramIndex++}`);
        updateValues.push(modelName);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: "Aucune donnée à mettre à jour",
          message: "Vous devez fournir au moins un champ à modifier",
        });
      }

      // Ajouter updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const updateQuery = `
        UPDATE llm_settings 
        SET ${updateFields.join(", ")}
        WHERE id = (SELECT id FROM llm_settings LIMIT 1)
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, updateValues);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          error: "Configuration LLM non trouvée",
          message: "Aucune configuration LLM n'existe en base de données",
        });
      }

      const updatedConfig = updateResult.rows[0];

      console.log(
        `✅ [ADMIN] Configuration LLM mise à jour - ${updateFields.length} champs modifiés`
      );

      res.json({
        success: true,
        data: {
          id: updatedConfig.id,
          systemPrompt: updatedConfig.system_prompt,
          systemPromptUrgence: updatedConfig.system_prompt_urgence,
          temperature: updatedConfig.temperature,
          topP: updatedConfig.top_p,
          maxTokens: updatedConfig.max_tokens,
          numCtx: updatedConfig.num_ctx,
          stopSequences: updatedConfig.stop_sequences,
          keepAliveMinutes: updatedConfig.keep_alive_minutes,
          timeoutSeconds: updatedConfig.timeout_seconds,
          modelName: updatedConfig.model_name,
          createdAt: updatedConfig.created_at,
          updatedAt: updatedConfig.updated_at,
        },
        message: "Configuration LLM mise à jour avec succès",
        updatedFields: updateFields.length - 1, // -1 pour exclure updated_at
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur mise à jour config LLM:", error);
      res.status(500).json({
        error: "Erreur serveur",
        details: error.message,
      });
    }
  }
);

// ================================
// 🏗️ ENDPOINT TEMPORAIRE: INITIALISATION TABLES ADMIN
// ================================
app.post(
  "/api/admin/init-tables",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      console.log(
        "🏗️ [ADMIN] Initialisation tables admin par:",
        req.user.email
      );

      // 1. Créer les tables manquantes
      const createTablesQueries = [
        // Table dentist_profiles
        `CREATE TABLE IF NOT EXISTS dentist_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        practice_name VARCHAR(200),
        specializations TEXT[],
        subscription_type VARCHAR(50) DEFAULT 'trial',
        max_patients INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

        // Table patient_profiles
        `CREATE TABLE IF NOT EXISTS patient_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        dentist_id INTEGER REFERENCES users(id),
        birth_date DATE,
        emergency_contact VARCHAR(200),
        data_processing_consent BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

        // Table admin_profiles
        `CREATE TABLE IF NOT EXISTS admin_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        permissions JSONB DEFAULT '{"super_admin": true, "manage_users": true, "view_analytics": true, "manage_documents": true}',
        access_level VARCHAR(50) DEFAULT 'standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

        // Table patient_documents
        `CREATE TABLE IF NOT EXISTS patient_documents (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        dentist_id INTEGER REFERENCES users(id),
        document_type VARCHAR(50),
        title VARCHAR(255),
        content TEXT,
        embedding VECTOR(1536),
        metadata JSONB DEFAULT '{}',
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        file_size INTEGER,
        mime_type VARCHAR(100),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processing_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

        // Table chat_conversations
        `CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        dentist_id INTEGER REFERENCES users(id),
        session_id VARCHAR(255),
        message TEXT,
        response TEXT,
        context_documents INTEGER[],
        confidence_score DOUBLE PRECISION,
        response_time_ms INTEGER,
        feedback_rating INTEGER,
        feedback_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      ];

      // Créer les tables
      for (const query of createTablesQueries) {
        await pool.query(query);
      }

      // 2. Créer la vue admin_stats
      await pool.query(`
      CREATE OR REPLACE VIEW admin_stats AS
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'dentist') as total_dentists,
        (SELECT COUNT(*) FROM users WHERE role = 'patient') as total_patients,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM patient_documents) as total_documents,
        (SELECT COUNT(*) FROM chat_conversations) as total_conversations,
        (SELECT COUNT(*) FROM users WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as active_users,
        (SELECT COALESCE(SUM(file_size), 0)::integer / (1024 * 1024) FROM patient_documents) as disk_usage_mb,
        NOW() as last_updated;
    `);

      // 3. Insérer les profils manquants

      // Profils admin
      await pool.query(`
      INSERT INTO admin_profiles (user_id)
      SELECT u.id
      FROM users u
      WHERE u.role = 'admin' 
      AND NOT EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = u.id);
    `);

      // Profils dentistes
      await pool.query(`
      INSERT INTO dentist_profiles (user_id, practice_name)
      SELECT u.id, 'Cabinet Dentaire ' || u.first_name || ' ' || u.last_name
      FROM users u
      WHERE u.role = 'dentist' 
      AND NOT EXISTS (SELECT 1 FROM dentist_profiles dp WHERE dp.user_id = u.id);
    `);

      // Profils patients
      await pool.query(`
      INSERT INTO patient_profiles (user_id, dentist_id)
      SELECT u.id, (SELECT id FROM users WHERE role = 'dentist' LIMIT 1)
      FROM users u
      WHERE u.role = 'patient' 
      AND NOT EXISTS (SELECT 1 FROM patient_profiles pp WHERE pp.user_id = u.id);
    `);

      // 4. Insérer des données de test

      // Documents de test
      await pool.query(`
      INSERT INTO patient_documents (patient_id, dentist_id, document_type, title, file_name, file_path, file_size, processing_status, metadata)
      SELECT 
        p.id as patient_id,
        d.id as dentist_id,
        'radiographie' as document_type,
        'Radiographie ' || p.first_name as title,
        'Radiographie_' || p.first_name || '_' || EXTRACT(epoch FROM NOW())::int || '.pdf' as file_name,
        '/uploads/docs/radiographie_' || p.id || '.pdf' as file_path,
        2356789 as file_size,
        'completed' as processing_status,
        '{"type": "radiographie", "size": "2.3MB", "format": "PDF"}'::jsonb as metadata
      FROM users d
      CROSS JOIN users p
      WHERE d.role = 'dentist' AND p.role = 'patient'
      AND NOT EXISTS (SELECT 1 FROM patient_documents pd WHERE pd.patient_id = p.id)
      LIMIT 5;
    `);

      // Conversations de test
      await pool.query(`
      INSERT INTO chat_conversations (patient_id, dentist_id, message, response)
      SELECT 
        p.id as patient_id,
        d.id as dentist_id,
        'Bonjour, j''ai une douleur dentaire depuis quelques jours. Que puis-je faire ?',
        'Je comprends votre inconfort. La douleur dentaire peut avoir plusieurs causes. Je vous recommande de prendre rendez-vous rapidement pour un examen. En attendant, vous pouvez prendre un antalgique et éviter les aliments trop chauds ou froids.'
      FROM users p
      CROSS JOIN users d
      WHERE p.role = 'patient' AND d.role = 'dentist'
      AND NOT EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.patient_id = p.id)
      LIMIT 3;
    `);

      // 5. Vérifier les stats finales
      const statsResult = await pool.query("SELECT * FROM admin_stats");
      const stats = statsResult.rows[0];

      console.log("✅ [ADMIN] Tables initialisées avec succès:", stats);

      res.json({
        success: true,
        message: "Tables admin créées et initialisées avec succès",
        stats,
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur initialisation tables:", error);
      res.status(500).json({
        error: "Erreur lors de l'initialisation des tables",
        details: error.message,
      });
    }
  }
);

// ================================
// ✅ WEBHOOK DÉPLOIEMENT PÉRENNE v23 - SOLUTION FINALE
// ================================

app.post("/hooks/deploy", validateWebhook, webUpload.any(), (req, res) => {
  try {
    console.log("🚀 [WEBHOOK] Déploiement webhook reçu");
    console.log(
      "📁 [WEBHOOK] Fichiers reçus:",
      req.files ? req.files.length : 0
    );

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier reçu",
      });
    }

    const uploadedFiles = [];
    const deployPath = "/var/www/melyia/app-dev/public";

    // ✅ SOLUTION PÉRENNE : Créer la structure complète
    const assetsPath = path.join(deployPath, "assets");
    if (!fs.existsSync(deployPath)) {
      fs.mkdirSync(deployPath, { recursive: true });
      console.log(`✅ [WEBHOOK] Répertoire créé: ${deployPath}`);
    }
    if (!fs.existsSync(assetsPath)) {
      fs.mkdirSync(assetsPath, { recursive: true });
      console.log(`✅ [WEBHOOK] Répertoire assets créé: ${assetsPath}`);
    }

    // Traiter chaque fichier avec logique intelligente
    for (const file of req.files) {
      try {
        const sourcePath = file.path;
        let targetPath;

        // ✅ LOGIQUE INTELLIGENTE : Déploiement selon le type de fichier
        if (file.originalname === "index.html") {
          // index.html à la racine
          targetPath = path.join(deployPath, file.originalname);
        } else if (file.originalname.includes("assets/")) {
          // Fichier avec chemin assets/ → dans assets/
          const fileName = path.basename(file.originalname);
          targetPath = path.join(assetsPath, fileName);
        } else if (
          file.originalname.endsWith(".js") ||
          file.originalname.endsWith(".css")
        ) {
          // Fichiers JS/CSS → dans assets/
          targetPath = path.join(assetsPath, file.originalname);
        } else {
          // Autres fichiers → racine
          targetPath = path.join(deployPath, file.originalname);
        }

        // Créer les sous-répertoires si nécessaire
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copier le fichier
        fs.copyFileSync(sourcePath, targetPath);

        // Nettoyer le fichier temporaire
        fs.unlinkSync(sourcePath);

        uploadedFiles.push({
          filename: file.originalname,
          size: file.size,
          deployed: targetPath,
          type: file.originalname.endsWith(".js")
            ? "javascript"
            : file.originalname.endsWith(".css")
            ? "stylesheet"
            : file.originalname === "index.html"
            ? "html"
            : "asset",
        });

        console.log(
          `✅ [WEBHOOK] Fichier déployé: ${file.originalname} → ${targetPath}`
        );
      } catch (fileError) {
        console.error(
          `❌ [WEBHOOK] Erreur fichier ${file.originalname}:`,
          fileError.message
        );
      }
    }

    // ✅ VÉRIFICATION POST-DÉPLOIEMENT
    const indexPath = path.join(deployPath, "index.html");
    const assetsCount = fs.readdirSync(assetsPath).length;

    console.log(`✅ [WEBHOOK] Déploiement terminé:`);
    console.log(`   - ${uploadedFiles.length} fichiers déployés`);
    console.log(`   - index.html: ${fs.existsSync(indexPath) ? "✅" : "❌"}`);
    console.log(`   - Assets: ${assetsCount} fichiers dans /assets/`);

    // ✅ PERMISSIONS AUTOMATIQUES (optionnel)
    try {
      execSync(`chown -R ubuntu:www-data ${deployPath}`, { timeout: 5000 });
      execSync(`chmod -R 755 ${deployPath}`, { timeout: 5000 });
      console.log(`✅ [WEBHOOK] Permissions corrigées: ${deployPath}`);
    } catch (permError) {
      console.warn(
        `⚠️ [WEBHOOK] Permissions non modifiées:`,
        permError.message
      );
    }

    res.json({
      success: true,
      message: "Application déployée avec succès - Structure automatique",
      files: uploadedFiles,
      structure: {
        deployPath: deployPath,
        assetsPath: assetsPath,
        indexHtml: fs.existsSync(indexPath),
        assetsCount: assetsCount,
      },
      timestamp: new Date().toISOString(),
      webhook_version: "v23.0.0-PERENNE",
    });
  } catch (error) {
    console.error("❌ [WEBHOOK] Erreur déploiement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du déploiement",
      error: error.message,
    });
  }
});

// ================================
// GESTION ERREURS GLOBALES
// ================================

// Gestion erreurs Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error(`❌ [MULTER] Error:`, error);

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "Fichier trop volumineux (max 50MB pour déploiement, 10MB pour documents)",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Format de requête invalide",
      });
    }
  }

  if (error.message.includes("Type de fichier non autorisé")) {
    return res.status(400).json({
      success: false,
      message:
        "Type de fichier non autorisé. Formats acceptés: PDF, DOCX, TXT, JPG, PNG pour documents | HTML, CSS, JS pour déploiement",
    });
  }

  console.error("❌ Erreur middleware:", error);
  res.status(500).json({
    success: false,
    message: "Erreur serveur",
  });
});

// Route 404
app.use(function (req, res) {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
    availableRoutes: [
      "GET /api/health",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/patients",
      "POST /api/documents/upload",
      "POST /api/chat",
      "GET /api/admin/stats",
      "GET /api/admin/users",
      "GET /api/admin/documents",
      "GET /api/admin/conversations",
      "POST /hooks/deploy",
    ],
  });
});

// ================================
// DÉMARRAGE SERVEUR
// ================================

app.listen(PORT, () => {
  console.log(
    "╔══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║               🦷 SERVEUR MELYIA CHATBOT v23 🤖               ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝"
  );
  console.log("");
  console.log("🚀 Serveur démarré sur le port " + PORT);
  console.log("📅 " + new Date().toLocaleString("fr-FR"));
  console.log("");
  console.log("🔗 ROUTES DISPONIBLES:");
  console.log("   GET  /api/health              - État des services");
  console.log("   POST /api/auth/login          - Connexion utilisateur");
  console.log("   POST /api/auth/register       - Inscription utilisateur");
  console.log("   GET  /api/patients            - Liste patients (dentistes)");
  console.log("   POST /api/documents/upload    - Upload documents médicaux");
  console.log("   POST /api/chat                - Chat IA local avec Ollama");
  console.log("   GET  /api/admin/stats         - Statistiques admin");
  console.log("   GET  /api/admin/users         - Gestion utilisateurs admin");
  console.log("   POST /hooks/deploy            - Webhook déploiement PÉRENNE");
  console.log("");
  console.log("🏗️ ARCHITECTURE:");
  console.log("   Frontend → Backend → Ollama Local → PostgreSQL");
  console.log("   Keep-alive: 24h pour performances optimales");
  console.log("");
  console.log("🔒 SÉCURITÉ:");
  console.log("   ✅ JWT Authentication");
  console.log("   ✅ CORS Multi-origines");
  console.log("   ✅ 100% Local (HDS Compliant)");
  console.log("   ✅ Upload sécurisé documents");
  console.log("   ✅ Admin Dashboard avec super-admin");
  console.log("");
  console.log("🤖 OLLAMA:");
  console.log("   Model: llama3.2:3b");
  console.log("   URL: http://127.0.0.1:11434");
  console.log("   Keep-alive: Activé (24h)");
  console.log("");
  console.log("📊 BASE DE DONNÉES:");
  console.log("   PostgreSQL: melyia_dev");
  console.log("   User: melyia_user");
  console.log("   pgvector: Ready pour embeddings");
  console.log("   Admin tables: admin_profiles, admin_stats");
  console.log("");
  console.log("🔧 AMÉLIORATIONS v23 PÉRENNES:");
  console.log("   ✅ Webhook intelligent: assets/ automatique");
  console.log("   ✅ Structure déploiement optimisée");
  console.log("   ✅ Gestion fichiers par type automatique");
  console.log("   ✅ Vérifications post-déploiement");
  console.log("   ✅ Plus de copie manuelle nécessaire");
  console.log("");
  console.log(
    "════════════════════════════════════════════════════════════════"
  );
  console.log("🎯 SOLUTION PÉRENNE : DÉPLOIEMENT AUTOMATIQUE INTELLIGENT!");
  console.log(
    "════════════════════════════════════════════════════════════════"
  );
});

console.log("✅ Routes Admin v23 + Webhook Pérenne configurés");
