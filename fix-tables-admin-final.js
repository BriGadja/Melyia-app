const { Pool } = require("pg");

// Configuration PostgreSQL
const pool = new Pool({
  user: "melyia_user",
  host: "localhost",
  database: "melyia_dev",
  password: "QOZ9QyJd4YiufyzMj0eq7GgHV0sBrlSX",
  port: 5432,
});

async function fixAdminTables() {
  const client = await pool.connect();

  try {
    console.log("🔧 [ADMIN_TABLES] Début de la correction des tables admin...");

    // 1. Créer la table admin_profiles si elle n'existe pas
    console.log("📊 [ADMIN_TABLES] Création table admin_profiles...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permissions JSONB NOT NULL DEFAULT '{}',
        access_level VARCHAR(50) DEFAULT 'standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Créer la table admin_stats si elle n'existe pas
    console.log("📊 [ADMIN_TABLES] Création table admin_stats...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_stats (
        id SERIAL PRIMARY KEY,
        total_users INTEGER DEFAULT 0,
        total_dentists INTEGER DEFAULT 0,
        total_patients INTEGER DEFAULT 0,
        total_admins INTEGER DEFAULT 0,
        total_documents INTEGER DEFAULT 0,
        total_conversations INTEGER DEFAULT 0,
        active_sessions INTEGER DEFAULT 0,
        disk_usage_mb INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Insérer des données par défaut dans admin_stats
    console.log("📊 [ADMIN_TABLES] Insertion données admin_stats...");
    const statsCheck = await client.query("SELECT COUNT(*) FROM admin_stats");
    if (parseInt(statsCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO admin_stats (
          total_users, total_dentists, total_patients, total_admins,
          total_documents, total_conversations, active_sessions, disk_usage_mb
        ) VALUES (0, 0, 0, 0, 0, 0, 0, 0);
      `);
    }

    // 4. Créer profil admin pour l'utilisateur brice@melyia.com
    console.log(
      "👤 [ADMIN_TABLES] Création profil admin pour brice@melyia.com..."
    );
    const adminUser = await client.query(
      "SELECT id FROM users WHERE email = $1 AND role = $2",
      ["brice@melyia.com", "admin"]
    );

    if (adminUser.rows.length > 0) {
      const userId = adminUser.rows[0].id;

      // Vérifier si le profil admin existe déjà
      const profileCheck = await client.query(
        "SELECT id FROM admin_profiles WHERE user_id = $1",
        [userId]
      );

      if (profileCheck.rows.length === 0) {
        await client.query(
          `
          INSERT INTO admin_profiles (user_id, permissions, access_level)
          VALUES ($1, $2, $3)
        `,
          [
            userId,
            JSON.stringify({
              super_admin: true,
              manage_users: true,
              view_analytics: true,
              manage_documents: true,
              system_admin: true,
            }),
            "super_admin",
          ]
        );
        console.log(
          "✅ [ADMIN_TABLES] Profil admin créé pour brice@melyia.com"
        );
      } else {
        console.log(
          "ℹ️ [ADMIN_TABLES] Profil admin existe déjà pour brice@melyia.com"
        );
      }
    } else {
      console.log(
        "⚠️ [ADMIN_TABLES] Utilisateur admin brice@melyia.com non trouvé"
      );
    }

    // 5. Mettre à jour les statistiques
    console.log("📊 [ADMIN_TABLES] Mise à jour des statistiques...");
    const userStats = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'dentist') as total_dentists,
        COUNT(*) FILTER (WHERE role = 'patient') as total_patients,
        COUNT(*) FILTER (WHERE role = 'admin') as total_admins
      FROM users WHERE is_active = true
    `);

    const docStats = await client.query(
      "SELECT COUNT(*) as total_documents FROM patient_documents"
    );
    const convStats = await client.query(
      "SELECT COUNT(*) as total_conversations FROM chat_conversations"
    );

    const stats = userStats.rows[0];
    const docCount = docStats.rows[0].total_documents;
    const convCount = convStats.rows[0].total_conversations;

    await client.query(
      `
      UPDATE admin_stats SET 
        total_users = $1,
        total_dentists = $2,
        total_patients = $3,
        total_admins = $4,
        total_documents = $5,
        total_conversations = $6,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = 1
    `,
      [
        parseInt(stats.total_users),
        parseInt(stats.total_dentists),
        parseInt(stats.total_patients),
        parseInt(stats.total_admins),
        parseInt(docCount),
        parseInt(convCount),
      ]
    );

    console.log("✅ [ADMIN_TABLES] Statistiques mises à jour:");
    console.log(`   - Utilisateurs: ${stats.total_users}`);
    console.log(`   - Dentistes: ${stats.total_dentists}`);
    console.log(`   - Patients: ${stats.total_patients}`);
    console.log(`   - Admins: ${stats.total_admins}`);
    console.log(`   - Documents: ${docCount}`);
    console.log(`   - Conversations: ${convCount}`);

    // 6. Vérification finale
    console.log("🔍 [ADMIN_TABLES] Vérification finale...");
    const tables = ["admin_profiles", "admin_stats"];
    for (const table of tables) {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM ${table}
      `);
      console.log(`✅ Table ${table}: ${result.rows[0].count} entrées`);
    }

    console.log("🎉 [ADMIN_TABLES] Correction terminée avec succès !");
  } catch (error) {
    console.error("❌ [ADMIN_TABLES] Erreur:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution
fixAdminTables()
  .then(() => {
    console.log("✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur script:", error);
    process.exit(1);
  });
