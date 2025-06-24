-- Script de correction des tables admin pour Melyia
-- À exécuter sur le serveur PostgreSQL

-- 1. Créer la table admin_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS admin_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{}',
  access_level VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Créer la table admin_stats si elle n'existe pas
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

-- 3. Insérer des données par défaut dans admin_stats (si vide)
INSERT INTO admin_stats (
  total_users, total_dentists, total_patients, total_admins,
  total_documents, total_conversations, active_sessions, disk_usage_mb
) 
SELECT 0, 0, 0, 0, 0, 0, 0, 0 
WHERE NOT EXISTS (SELECT 1 FROM admin_stats);

-- 4. Créer profil admin pour brice@melyia.com
INSERT INTO admin_profiles (user_id, permissions, access_level)
SELECT u.id, 
       '{"super_admin": true, "manage_users": true, "view_analytics": true, "manage_documents": true, "system_admin": true}'::jsonb,
       'super_admin'
FROM users u 
WHERE u.email = 'brice@melyia.com' 
  AND u.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM admin_profiles ap WHERE ap.user_id = u.id
  );

-- 5. Mettre à jour les statistiques avec les vraies données
UPDATE admin_stats SET 
  total_users = (SELECT COUNT(*) FROM users WHERE is_active = true),
  total_dentists = (SELECT COUNT(*) FROM users WHERE role = 'dentist' AND is_active = true),
  total_patients = (SELECT COUNT(*) FROM users WHERE role = 'patient' AND is_active = true),
  total_admins = (SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true),
  total_documents = (SELECT COUNT(*) FROM patient_documents),
  total_conversations = (SELECT COUNT(*) FROM chat_conversations),
  active_sessions = 1,
  disk_usage_mb = 50,
  last_updated = CURRENT_TIMESTAMP
WHERE id = 1;

-- 6. Vérifications
\echo '=== VÉRIFICATION DES TABLES ==='
SELECT 'admin_profiles' as table_name, COUNT(*) as row_count FROM admin_profiles
UNION ALL
SELECT 'admin_stats' as table_name, COUNT(*) as row_count FROM admin_stats;

\echo '=== STATISTIQUES ACTUELLES ==='
SELECT * FROM admin_stats WHERE id = 1;

\echo '=== PROFILS ADMIN ==='
SELECT 
  u.email, 
  ap.access_level, 
  ap.permissions->'super_admin' as is_super_admin
FROM admin_profiles ap
JOIN users u ON ap.user_id = u.id; 