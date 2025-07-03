-- MIGRATION SYSTÈME FICHIERS MELYIA v34.0
-- Transformation : Documents personnels + Documents généraux
-- Date: 2025-01-24
-- Auteur: Assistant IA + Méthodologie Micro-Incréments

-- ========================================
-- ÉTAPE 1 : SAUVEGARDE DE SÉCURITÉ
-- ========================================

-- Créer une sauvegarde de la table actuelle
CREATE TABLE patient_documents_backup_v33 AS 
SELECT * FROM patient_documents;

-- Vérifier la sauvegarde
SELECT COUNT(*) as backup_count FROM patient_documents_backup_v33;

-- ========================================
-- ÉTAPE 2 : CRÉATION TABLE DOCUMENTS GÉNÉRAUX
-- ========================================

CREATE TABLE general_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    content TEXT,
    embedding VECTOR(1536), -- Compatible OpenAI embeddings
    document_type VARCHAR(100) NOT NULL, -- 'terminology', 'protocol', 'guide', 'regulation'
    category VARCHAR(100) NOT NULL,      -- 'endodontie', 'orthodontie', 'implantologie', etc.
    uploaded_by INTEGER REFERENCES users(id),
    processing_status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contraintes pour documents généraux
ALTER TABLE general_documents 
ADD CONSTRAINT check_document_type 
CHECK (document_type IN ('terminology', 'protocol', 'guide', 'regulation'));

ALTER TABLE general_documents 
ADD CONSTRAINT check_category 
CHECK (category IN ('endodontie', 'orthodontie', 'implantologie', 'parodontologie', 'chirurgie', 'generale'));

ALTER TABLE general_documents 
ADD CONSTRAINT check_processing_status 
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Index pour performance recherche vectorielle
CREATE INDEX idx_general_documents_embedding_cosine 
ON general_documents USING ivfflat (embedding vector_cosine_ops) 
WITH (lists=100);

-- Index pour recherche par type et catégorie
CREATE INDEX idx_general_documents_type ON general_documents(document_type);
CREATE INDEX idx_general_documents_category ON general_documents(category);
CREATE INDEX idx_general_documents_status ON general_documents(processing_status);
CREATE INDEX idx_general_documents_uploaded_by ON general_documents(uploaded_by);

-- ========================================
-- ÉTAPE 3 : RENOMMAGE TABLE DOCUMENTS PERSONNELS
-- ========================================

-- Renommer la table existante
ALTER TABLE patient_documents RENAME TO personal_documents;

-- Renommer les contraintes et index pour cohérence
ALTER INDEX patient_documents_pkey RENAME TO personal_documents_pkey;
ALTER INDEX idx_patient_documents_embedding_cosine RENAME TO idx_personal_documents_embedding_cosine;
ALTER INDEX idx_patient_docs_patient_id RENAME TO idx_personal_docs_patient_id;
ALTER INDEX idx_patient_docs_dentist_id RENAME TO idx_personal_docs_dentist_id;
ALTER INDEX idx_patient_docs_type RENAME TO idx_personal_docs_type;
ALTER INDEX idx_patient_docs_status RENAME TO idx_personal_docs_status;

-- Renommer les contraintes de clés étrangères
ALTER TABLE personal_documents RENAME CONSTRAINT patient_documents_patient_id_fkey TO personal_documents_patient_id_fkey;
ALTER TABLE personal_documents RENAME CONSTRAINT patient_documents_dentist_id_fkey TO personal_documents_dentist_id_fkey;

-- ========================================
-- ÉTAPE 4 : DONNÉES INITIALES DOCUMENTS GÉNÉRAUX
-- ========================================

-- Insérer quelques documents généraux de base
INSERT INTO general_documents (title, file_name, file_path, file_type, file_size, content, document_type, category, uploaded_by, processing_status)
VALUES 
('Définitions terminologie endodontique', 'terminologie-endodontie.txt', '/var/www/melyia/documents/general/terminology/terminologie-endodontie.txt', 'text/plain', 2048, 
'TERMINOLOGIE ENDODONTIQUE

Endodontie : Branche de la dentisterie qui traite les affections de la pulpe dentaire et des tissus périapicaux.

Pulpe dentaire : Tissu conjonctif richement vascularisé et innervé situé au centre de la dent.

Traitement endodontique : Procédure visant à éliminer la pulpe infectée ou nécrosée et à obstruer hermétiquement le système canalaire.

Canal radiculaire : Espace anatomique situé à l''intérieur de la racine dentaire contenant la pulpe.

Obturation canalaire : Comblement tridimensionnel et étanche du système canalaire après désinfection.

Apex : Extrémité de la racine dentaire.

Périapex : Région entourant l''apex de la racine dentaire.

Lésion périapicale : Inflammation chronique des tissus périapicaux consécutive à une infection endodontique.',
'terminology', 'endodontie', 1, 'completed'),

('Protocole traitement canalaire standard', 'protocole-traitement-canalaire.txt', '/var/www/melyia/documents/general/protocols/protocole-traitement-canalaire.txt', 'text/plain', 3072,
'PROTOCOLE TRAITEMENT CANALAIRE STANDARD

1. DIAGNOSTIC
   - Examen clinique complet
   - Tests de vitalité pulpaire
   - Radiographie préopératoire
   - Évaluation des symptômes

2. PRÉPARATION OPÉRATOIRE
   - Anesthésie locale si nécessaire
   - Isolation sous digue
   - Désinfection du champ opératoire
   - Cavité d''accès conservative

3. EXPLORATION CANALAIRE
   - Localisation des orifices canalaires
   - Cathétérisme des canaux
   - Radiographie de travail
   - Détermination de la longueur de travail

4. PRÉPARATION CANALAIRE
   - Désinfection chimique (hypochlorite de sodium)
   - Mise en forme mécanique
   - Irrigation abondante et régulière
   - Séchage des canaux

5. OBTURATION
   - Obturation à la gutta-percha et ciment
   - Contrôle radiographique
   - Reconstitution coronaire provisoire

6. SUIVI
   - Contrôle à 3 mois, 6 mois et 1 an
   - Surveillance de la guérison périapicale',
'protocol', 'endodontie', 1, 'completed'),

('Guide gestion urgences dentaires', 'guide-urgences-dentaires.txt', '/var/www/melyia/documents/general/guides/guide-urgences-dentaires.txt', 'text/plain', 2560,
'GUIDE GESTION URGENCES DENTAIRES

PULPITE AIGUË
- Symptômes : Douleur intense, pulsatile, exacerbée par le froid/chaud
- Traitement : Anesthésie, trépanation pulpaire, prescription antalgiques
- Suivi : Traitement endodontique différé

ABCÈS APICAL AIGU
- Symptômes : Douleur à la percussion, tuméfaction, fièvre possible
- Traitement : Drainage, antibiothérapie si signes généraux
- Suivi : Traitement endodontique ou extraction

PÉRICORONARITE
- Symptômes : Douleur, inflammation gingivale, trismus
- Traitement : Irrigation, antiseptiques locaux, antibiothérapie
- Suivi : Surveillance évolution, extraction dent de sagesse si récidives

TRAUMATISME DENTAIRE
- Évaluation : Vitalité pulpaire, mobilité, fracture
- Traitement : Contention si nécessaire, surveillance vitalité
- Suivi : Contrôles réguliers, traitement endodontique si nécrose

ALVÉOLITE
- Symptômes : Douleur intense post-extractionnelle
- Traitement : Curetage alvéole, pansement alvéolaire
- Suivi : Renouvellement pansement jusqu''à cicatrisation',
'guide', 'generale', 1, 'completed');

-- ========================================
-- ÉTAPE 5 : MISE À JOUR VUES ET TRIGGERS
-- ========================================

-- Créer une vue unifiée pour les statistiques admin
CREATE OR REPLACE VIEW documents_statistics AS
SELECT 
    'general' as document_level,
    COUNT(*) as total_documents,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size
FROM general_documents 
WHERE processing_status = 'completed'
UNION ALL
SELECT 
    'personal' as document_level,
    COUNT(*) as total_documents,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size
FROM personal_documents 
WHERE processing_status = 'completed';

-- Trigger pour mise à jour timestamp
CREATE OR REPLACE FUNCTION update_general_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_general_documents_updated_at
    BEFORE UPDATE ON general_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_general_documents_timestamp();

-- ========================================
-- ÉTAPE 6 : VÉRIFICATIONS FINALES
-- ========================================

-- Vérifier que la migration s'est bien passée
SELECT 'personal_documents' as table_name, COUNT(*) as count FROM personal_documents
UNION ALL
SELECT 'general_documents' as table_name, COUNT(*) as count FROM general_documents
UNION ALL
SELECT 'backup_v33' as table_name, COUNT(*) as count FROM patient_documents_backup_v33;

-- Vérifier les index créés
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('general_documents', 'personal_documents')
ORDER BY tablename, indexname;

-- Afficher le résumé de la migration
SELECT 
    'Migration v34.0 terminée' as status,
    NOW() as timestamp,
    'Système 2 niveaux opérationnel' as result; 