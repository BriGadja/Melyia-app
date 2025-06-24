-- Script pour créer les tables/vues admin manquantes
-- Exécuter dans PostgreSQL : psql -U melyia_user -d melyia_app_dev -f create-admin-tables.sql

-- 1. Vue pour les statistiques admin
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM patient_documents) as total_documents,
    (SELECT COUNT(*) FROM chat_conversations) as total_conversations,
    (SELECT COUNT(*) FROM users WHERE last_login > CURRENT_DATE - INTERVAL '7 days') as active_users;

-- 2. Vérifier que les tables existent
DO $$
BEGIN
    -- Créer la table admin_profiles si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_profiles') THEN
        CREATE TABLE admin_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            permissions JSONB DEFAULT '{"super_admin": true, "manage_users": true, "view_analytics": true, "manage_documents": true}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Créer la table patient_documents si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patient_documents') THEN
        CREATE TABLE patient_documents (
            id SERIAL PRIMARY KEY,
            dentist_id INTEGER REFERENCES users(id),
            patient_id INTEGER REFERENCES users(id),
            file_name VARCHAR(255),
            file_path VARCHAR(500),
            metadata JSONB,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Créer la table chat_conversations si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
        CREATE TABLE chat_conversations (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER REFERENCES users(id),
            dentist_id INTEGER REFERENCES users(id),
            message TEXT,
            response TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Créer la table dentist_profiles si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dentist_profiles') THEN
        CREATE TABLE dentist_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            practice_info VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Créer la table patient_profiles si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patient_profiles') THEN
        CREATE TABLE patient_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            dentist_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
END $$;

-- 3. Insérer des données de test si les tables sont vides
INSERT INTO dentist_profiles (user_id, practice_info)
SELECT u.id, 'Cabinet Dentaire ' || u.first_name || ' ' || u.last_name
FROM users u
WHERE u.role = 'dentist' 
AND NOT EXISTS (SELECT 1 FROM dentist_profiles dp WHERE dp.user_id = u.id);

INSERT INTO patient_profiles (user_id, dentist_id)
SELECT u.id, (SELECT id FROM users WHERE role = 'dentist' LIMIT 1)
FROM users u
WHERE u.role = 'patient' 
AND NOT EXISTS (SELECT 1 FROM patient_profiles pp WHERE pp.user_id = u.id);

INSERT INTO admin_profiles (user_id)
SELECT u.id
FROM users u
WHERE u.role = 'admin' 
AND NOT EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = u.id);

-- 4. Insérer quelques documents de test
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

-- 5. Insérer quelques conversations de test
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

-- 6. Actualiser la vue des statistiques
REFRESH MATERIALIZED VIEW IF EXISTS admin_stats;

-- Afficher les résultats
SELECT 'Tables créées et données de test insérées' as status;
SELECT * FROM admin_stats; 