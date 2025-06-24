-- ========================================
-- SCRIPT DE CORRECTION STRUCTURE ADMIN
-- Corrige les incohérences entre server.js et PostgreSQL
-- ========================================

-- 1. Corriger la vue admin_stats (CRITIQUE)
DROP VIEW IF EXISTS admin_stats;
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

-- 2. Ajouter colonnes manquantes à admin_profiles
ALTER TABLE admin_profiles 
ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Ajouter colonnes manquantes à dentist_profiles
ALTER TABLE dentist_profiles 
ADD COLUMN IF NOT EXISTS practice_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS specializations TEXT[],
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS max_patients INTEGER DEFAULT 50;

-- 4. Ajouter colonnes manquantes à patient_profiles
ALTER TABLE patient_profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(200),
ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT true;

-- 5. Ajouter colonnes manquantes à patient_documents
ALTER TABLE patient_documents 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 6. Ajouter colonnes manquantes à chat_conversations
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS context_documents INTEGER[],
ADD COLUMN IF NOT EXISTS confidence_score DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS feedback_rating INTEGER,
ADD COLUMN IF NOT EXISTS feedback_comment TEXT;

-- 7. Corriger les index pour les performances
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_dentist_id ON patient_documents(dentist_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_patient_id ON chat_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON chat_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);

-- 8. Mettre à jour les contraintes
ALTER TABLE admin_profiles ADD CONSTRAINT IF NOT EXISTS unique_admin_user_id UNIQUE(user_id);
ALTER TABLE dentist_profiles ADD CONSTRAINT IF NOT EXISTS unique_dentist_user_id UNIQUE(user_id);
ALTER TABLE patient_profiles ADD CONSTRAINT IF NOT EXISTS unique_patient_user_id UNIQUE(user_id);

-- 9. Migrer les données existantes (si nécessaire)
UPDATE patient_documents SET processing_status = 'completed' WHERE processing_status IS NULL;
UPDATE patient_documents SET upload_date = created_at WHERE upload_date IS NULL;
UPDATE admin_profiles SET access_level = 'admin' WHERE access_level IS NULL AND permissions::text LIKE '%super_admin%';

-- 10. Accorder les permissions à melyia_user
GRANT SELECT ON admin_stats TO melyia_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO melyia_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO melyia_user;

-- Fin du script
SELECT 'STRUCTURE ADMIN CORRIGÉE AVEC SUCCÈS' as status; 