-- Modifica della tabella social_accounts
ALTER TABLE social_accounts 
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS token TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_published TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Impostazione dei valori predefiniti per account_id se è NULL
UPDATE social_accounts SET account_id = account_name WHERE account_id IS NULL;

-- Imposta la colonna account_id come NOT NULL dopo l'aggiornamento
ALTER TABLE social_accounts ALTER COLUMN account_id SET NOT NULL;

-- Rimuovi le colonne vecchie dopo la migrazione
ALTER TABLE social_accounts 
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token,
DROP COLUMN IF EXISTS token_expiry,
DROP COLUMN IF EXISTS connected;