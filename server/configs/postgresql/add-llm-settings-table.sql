-- ===================================
-- TABLE CONFIGURATION LLM SETTINGS
-- ===================================
-- Création de la table pour stocker les paramètres globaux du modèle IA
-- Correspondant aux valeurs actuelles hardcodées dans server.js

CREATE TABLE IF NOT EXISTS llm_settings (
  id SERIAL PRIMARY KEY,
  system_prompt TEXT DEFAULT 'Assistant dentiste.',
  system_prompt_urgence TEXT DEFAULT 'Assistant dentiste. Urgence.',
  temperature DOUBLE PRECISION DEFAULT 0.1,
  top_p DOUBLE PRECISION DEFAULT 0.5,
  max_tokens INTEGER DEFAULT 50,
  num_ctx INTEGER DEFAULT 256,
  stop_sequences TEXT[] DEFAULT ARRAY['\n', '.', '!', '?'],
  keep_alive_minutes INTEGER DEFAULT 30,
  timeout_seconds INTEGER DEFAULT 45,
  model_name VARCHAR DEFAULT 'llama3.2:3b',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insérer une ligne par défaut avec les valeurs actuelles de production
INSERT INTO llm_settings (
  system_prompt,
  system_prompt_urgence,
  temperature,
  top_p,
  max_tokens,
  num_ctx,
  stop_sequences,
  keep_alive_minutes,
  timeout_seconds,
  model_name
) 
SELECT 
  'Assistant dentiste.',
  'Assistant dentiste. Urgence.',
  0.1,
  0.5,
  50,
  256,
  ARRAY['\n', '.', '!', '?'],
  30,
  45,
  'llama3.2:3b'
WHERE NOT EXISTS (SELECT 1 FROM llm_settings);

-- Accorder les permissions à l'utilisateur melyia_user
GRANT SELECT, UPDATE ON llm_settings TO melyia_user;
GRANT USAGE, SELECT ON SEQUENCE llm_settings_id_seq TO melyia_user;

-- Vérification
SELECT * FROM llm_settings; 