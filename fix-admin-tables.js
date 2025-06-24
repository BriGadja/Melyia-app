// Script à exécuter sur le serveur pour créer les tables admin manquantes
// Commande: node fix-admin-tables.js

const { Pool } = require("pg");

const pool = new Pool({
  user: "melyia_user",
  host: "localhost", // localhost car nous sommes sur le serveur
  database: "melyia_app_dev",
  password: "JhdE#@zs7&Kmc8!q",
  port: 5432,
});

async function createAdminTables() {
  console.log("🏗️ Création des tables admin manquantes...");

  try {
    // 1. Créer les tables manquantes
    console.log("📋 Création des tables...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS dentist_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        practice_info VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS patient_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        dentist_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        permissions JSONB DEFAULT '{"super_admin": true, "manage_users": true, "view_analytics": true, "manage_documents": true}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS patient_documents (
        id SERIAL PRIMARY KEY,
        dentist_id INTEGER REFERENCES users(id),
        patient_id INTEGER REFERENCES users(id),
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        metadata JSONB,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        dentist_id INTEGER REFERENCES users(id),
        message TEXT,
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Tables créées");

    // 2. Créer la vue admin_stats
    console.log("📊 Création de la vue admin_stats...");
    await pool.query(`
      CREATE OR REPLACE VIEW admin_stats AS
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM patient_documents) as total_documents,
        (SELECT COUNT(*) FROM chat_conversations) as total_conversations,
        (SELECT COUNT(*) FROM users WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as active_users;
    `);

    console.log("✅ Vue créée");

    // 3. Insérer les profils manquants
    console.log("👤 Création des profils utilisateurs...");

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
      INSERT INTO dentist_profiles (user_id, practice_info)
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

    console.log("✅ Profils créés");

    // 4. Insérer des données de test
    console.log("📄 Ajout de données de test...");

    // Documents de test
    await pool.query(`
      INSERT INTO patient_documents (dentist_id, patient_id, file_name, file_path, metadata)
      SELECT 
        d.id as dentist_id,
        p.id as patient_id,
        'Radiographie_' || p.first_name || '_' || EXTRACT(epoch FROM NOW())::int || '.pdf',
        '/uploads/docs/radiographie_' || p.id || '.pdf',
        '{"type": "radiographie", "size": "2.3MB", "format": "PDF"}'::jsonb
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

    console.log("✅ Données de test ajoutées");

    // 5. Vérifier les statistiques
    console.log("📈 Vérification des statistiques...");
    const stats = await pool.query("SELECT * FROM admin_stats");
    console.log("📊 Statistiques finales:", stats.rows[0]);

    console.log("🎉 Toutes les tables admin ont été créées avec succès !");
    console.log("💡 Redémarrez le serveur backend avec: pm2 restart auth-dev");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

createAdminTables();
