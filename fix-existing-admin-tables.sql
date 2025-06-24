-- Script de correction des tables admin existantes
-- À exécuter sur le serveur PostgreSQL

-- 1. Voir la structure actuelle des tables
\echo '=== STRUCTURE ACTUELLE ==='
\d admin_stats;
\d admin_profiles;

-- 2. Ajouter les colonnes manquantes à admin_stats
\echo '=== AJOUT COLONNES admin_stats ==='
ALTER TABLE admin_stats ADD COLUMN IF NOT EXISTS total_dentists INTEGER DEFAULT 0;
ALTER TABLE admin_stats ADD COLUMN IF NOT EXISTS total_patients INTEGER DEFAULT 0;
ALTER TABLE admin_stats ADD COLUMN IF NOT EXISTS total_admins INTEGER DEFAULT 0;
ALTER TABLE admin_stats ADD COLUMN IF NOT EXISTS total_documents INTEGER DEFAULT 0;
ALTER TABLE admin_stats ADD COLUMN IF NOT EXISTS total_conversations INTEGER DEFAULT 0;
ALTER TABLE admin_stats ADD COLUMN IF NOT EXISTS active_sessions INTEGER DEFAULT 0;
ALTER TABLE admin_stats ADD COLUMN IF NOT EXISTS disk_usage_mb INTEGER DEFAULT 0;

-- 3. Ajouter les colonnes manquantes à admin_profiles  
\echo '=== AJOUT COLONNES admin_profiles ==='
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'standard';
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Mettre à jour les statistiques avec les vraies données
\echo '=== MISE À JOUR STATISTIQUES ==='
UPDATE admin_stats SET 
  total_users = (SELECT COUNT(*) FROM users WHERE is_active = true),
  total_dentists = (SELECT COUNT(*) FROM users WHERE role = 'dentist' AND is_active = true),
  total_patients = (SELECT COUNT(*) FROM users WHERE role = 'patient' AND is_active = true),
  total_admins = (SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true),
  total_documents = COALESCE((SELECT COUNT(*) FROM patient_documents), 0),
  total_conversations = COALESCE((SELECT COUNT(*) FROM chat_conversations), 0),
  active_sessions = 1,
  disk_usage_mb = 50,
  last_updated = CURRENT_TIMESTAMP;

-- 5. Créer profil admin pour brice@melyia.com s'il n'existe pas
\echo '=== CRÉATION PROFIL ADMIN ==='
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

-- 6. Vérifications finales
\echo '=== VÉRIFICATION FINALE ==='
SELECT 'admin_profiles' as table_name, COUNT(*) as row_count FROM admin_profiles
UNION ALL
SELECT 'admin_stats' as table_name, COUNT(*) as row_count FROM admin_stats;

\echo '=== STATISTIQUES ACTUELLES ==='
SELECT total_users, total_dentists, total_patients, total_admins, total_documents, total_conversations FROM admin_stats LIMIT 1;

\echo '=== PROFILS ADMIN ==='
SELECT 
  u.email, 
  ap.access_level, 
  ap.permissions->'super_admin' as is_super_admin
FROM admin_profiles ap
JOIN users u ON ap.user_id = u.id; 