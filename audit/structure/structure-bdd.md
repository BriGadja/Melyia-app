# 📊 STRUCTURE BASE DE DONNÉES - POSTGRESQL

> **Version** : v26.0 (2025-01-24) - CORRIGÉE  
> **Base** : melyia_dev  
> **Utilisateur** : melyia_user  
> **Extensions** : pgvector (pour embeddings)

---

## 🏗️ TABLES PRINCIPALES

### 📋 **users** (Table centrale)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- 'admin', 'dentist', 'patient'
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 👑 **admin_profiles** (Profils administrateur)

```sql
CREATE TABLE admin_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"super_admin": true, "manage_users": true, "view_analytics": true, "manage_documents": true}',
    access_level VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_admin_user_id UNIQUE(user_id)
);
```

### 🦷 **dentist_profiles** (Profils dentistes)

```sql
CREATE TABLE dentist_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    practice_name VARCHAR(200),
    specializations TEXT[],
    subscription_type VARCHAR(50) DEFAULT 'trial',
    max_patients INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_dentist_user_id UNIQUE(user_id)
);
```

### 🧑‍⚕️ **patient_profiles** (Profils patients)

```sql
CREATE TABLE patient_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dentist_id INTEGER REFERENCES users(id),
    birth_date DATE,
    emergency_contact VARCHAR(200),
    data_processing_consent BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_patient_user_id UNIQUE(user_id)
);
```

### 📄 **patient_documents** (Documents médicaux)

```sql
CREATE TABLE patient_documents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id),
    dentist_id INTEGER REFERENCES users(id),
    document_type VARCHAR(50),
    title VARCHAR(255),
    content TEXT,
    embedding VECTOR(1536), -- Pour pgvector
    metadata JSONB DEFAULT '{}',
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 💬 **chat_conversations** (Conversations IA)

```sql
CREATE TABLE chat_conversations (
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
);
```

### 📝 **waitlist** (Liste d'attente)

```sql
CREATE TABLE waitlist (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    practice_name VARCHAR(200),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📊 VUE ADMINISTRATIVE

### 📈 **admin_stats** (Vue calculée temps réel)

```sql
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
```

---

## 🔍 INDEX DE PERFORMANCE

```sql
-- Index principaux
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX idx_patient_documents_dentist_id ON patient_documents(dentist_id);
CREATE INDEX idx_chat_conversations_patient_id ON chat_conversations(patient_id);
CREATE INDEX idx_chat_conversations_created_at ON chat_conversations(created_at);
CREATE INDEX idx_admin_profiles_user_id ON admin_profiles(user_id);

-- Index spécialisés pour pgvector
CREATE INDEX patient_documents_embedding_idx ON patient_documents USING ivfflat (embedding vector_cosine_ops);
```

---

## 🔗 CONTRAINTES ET RELATIONS

### Contraintes de clés étrangères :

- `admin_profiles.user_id` → `users.id` (CASCADE DELETE)
- `dentist_profiles.user_id` → `users.id` (CASCADE DELETE)
- `patient_profiles.user_id` → `users.id` (CASCADE DELETE)
- `patient_profiles.dentist_id` → `users.id`
- `patient_documents.patient_id` → `users.id`
- `patient_documents.dentist_id` → `users.id`
- `chat_conversations.patient_id` → `users.id`
- `chat_conversations.dentist_id` → `users.id`

### Contraintes d'unicité :

- `users.email` (UNIQUE)
- `admin_profiles.user_id` (UNIQUE)
- `dentist_profiles.user_id` (UNIQUE)
- `patient_profiles.user_id` (UNIQUE)

---

## 🔐 PERMISSIONS

### Utilisateur applicatif : **melyia_user**

```sql
GRANT SELECT ON admin_stats TO melyia_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO melyia_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO melyia_user;
```

---

## 📊 STATISTIQUES TYPES

### Exemple de données de la vue admin_stats :

```
total_users:         15
total_dentists:      3
total_patients:      10
total_admins:        2
total_documents:     45
total_conversations: 127
active_users:        8
disk_usage_mb:       234
last_updated:        2025-01-24 14:30:15
```

---

## 🔄 ÉVOLUTION

### Version 26.0 (2025-01-24) :

- ✅ Vue admin_stats corrigée (9 colonnes)
- ✅ Colonnes manquantes ajoutées partout
- ✅ Index de performance créés
- ✅ Contraintes d'unicité renforcées

### Prochaines évolutions prévues :

- [ ] Extension pgvector optimisée
- [ ] Tables d'audit automatique
- [ ] Partitioning pour chat_conversations
- [ ] Archivage automatique des anciens documents

---

> **📝 Note** : Cette structure est synchronisée avec `server/backend/server.js` v26.0
