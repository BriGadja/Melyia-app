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
           VALUES ($1, $2, $3, 'trial', 50)`,
          [
            newUser.id,
            practiceInfo?.practiceName || `Cabinet ${firstName} ${lastName}`,
            practiceInfo?.specializations || ["Dentisterie générale"],
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

    const patientsResult = await pool.query(`
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
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      LEFT JOIN patient_documents pd ON u.id = pd.patient_id
      WHERE u.role = 'patient' AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at, pp.emergency_contact
      ORDER BY u.created_at DESC
    `);

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

        // Insérer en base
        const documentResult = await pool.query(
          `
        INSERT INTO patient_documents
        (patient_id, dentist_id, document_type, title, content, file_path, file_name, file_size, mime_type, processing_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed')
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

    // ✅ OPTIMISATION 2: Documents limités et ciblés
    const documentsQuery = `
      SELECT id, title, content, document_type, file_name, created_at
      FROM patient_documents
      WHERE patient_id = $1 AND processing_status = 'completed'
      ORDER BY created_at DESC
      LIMIT 2
    `;

    const documentsResult = await pool.query(documentsQuery, [patientId]);
    const documents = documentsResult.rows;

    console.log(`📄 [DOCS_FAST] ${documents.length} documents récupérés`);

    // ✅ OPTIMISATION 3: Contexte médical ultra-concis
    const contextPrompt =
      documents.length > 0
        ? documents
            .map((doc) => {
              const content = doc.content ? doc.content.substring(0, 200) : ""; // Réduit de 800 à 200 chars
              return `[${doc.document_type}] ${content}`;
            })
            .join("\n")
        : "Pas de documents récents.";

    // ✅ OPTIMISATION 4: Prompt système ultra-court selon intention
    let systemPrompt = "";
    switch (intent) {
      case "urgence":
        systemPrompt = `Assistant dentaire d'urgence français. Évalue et conseille rapidement.`;
        break;
      default:
        systemPrompt = `Assistant dentaire français. Réponds brièvement et clairement.`;
    }

    // ✅ OPTIMISATION 5: Prompt final ultra-compact
    const fullPrompt = `${systemPrompt}

DOSSIER: ${contextPrompt}

QUESTION: ${message}

Réponds en français, max 150 mots, précis et rassurant.

RÉPONSE:`;

    console.log(
      `🔄 [OLLAMA_FAST] Prompt size: ${fullPrompt.length} chars (vs ${fullPrompt.length} before)`
    );

    // ✅ OPTIMISATION 6: Appel Ollama ultra-optimisé
    try {
      const ollamaResponse = await axios.post(
        "http://127.0.0.1:11434/api/generate",
        {
          model: "llama3.2:3b",
          prompt: fullPrompt,
          stream: false,
          keep_alive: "30m", // 🔑 CRITIQUE : Garde le modèle 30min au lieu de 24h
          options: {
            temperature: 0.2, // Plus déterministe (0.3 → 0.2)
            top_p: 0.8, // Plus focalisé (0.9 → 0.8)
            num_predict: 200, // Limite réponse (400 → 200 tokens)
            num_ctx: 1024, // Contexte réduit (2048 → 1024)
            stop: ["\n\nQUESTION:", "\n\nDOSSIER:", "RÉPONSE:", "\n---"], // Stop tokens pour éviter les répétitions
          },
        },
        {
          timeout: 15000, // 🔑 CRITIQUE : 15s timeout au lieu de 5min
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

      // ✅ OPTIMISATION 8: Réponse structurée minimale
      res.json({
        success: true,
        response: aiResponse,
        metadata: {
          processingTime: `${processingTime}ms`,
          isLocal: true,
          model: "llama3.2:3b",
          architecture: "OLLAMA_FAST_MODE",
          documentsUsed: documents.length,
          intent: intent,
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

      const usersResult = await pool.query(`
      SELECT
        u.id, u.email, u.role, u.first_name, u.last_name, u.created_at,
        CASE
          WHEN u.role = 'dentist' THEN dp.practice_info
          WHEN u.role = 'patient' THEN 'Patient de: ' || COALESCE(dp2.practice_info, 'Non assigné')
          WHEN u.role = 'admin' THEN ap.permissions::text
          ELSE NULL
        END as profile_info
      FROM users u
      LEFT JOIN dentist_profiles dp ON u.id = dp.user_id
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      LEFT JOIN dentist_profiles dp2 ON pp.dentist_id = dp2.user_id
      LEFT JOIN admin_profiles ap ON u.id = ap.user_id
      ORDER BY u.created_at DESC
      LIMIT 100
    `);

      res.json({
        success: true,
        data: usersResult.rows,
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

      const documentsResult = await pool.query(`
      SELECT
        pd.id, pd.file_name, pd.file_path, pd.uploaded_at,
        u_dentist.email as dentist_email,
        u_patient.email as patient_email,
        pd.metadata
      FROM patient_documents pd
      JOIN users u_dentist ON pd.dentist_id = u_dentist.id
      JOIN users u_patient ON pd.patient_id = u_patient.id
      ORDER BY pd.uploaded_at DESC
      LIMIT 50
    `);

      res.json({
        success: true,
        data: documentsResult.rows,
      });
    } catch (error) {
      console.error("❌ [ADMIN] Erreur récupération documents:", error);
      res.status(500).json({ error: "Erreur serveur" });
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
