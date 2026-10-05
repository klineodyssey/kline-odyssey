-- Additive migration: legacy Player Life/game snapshots are preserved.
-- Old wallet sessions never establish Account ownership after this migration.
CREATE TABLE IF NOT EXISTS accounts(account_id TEXT PRIMARY KEY,email_lookup TEXT NOT NULL UNIQUE,email_cipher TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS account_lives(account_id TEXT NOT NULL UNIQUE REFERENCES accounts(account_id),player_id TEXT PRIMARY KEY REFERENCES players(player_id),created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS account_sessions(token_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES accounts(account_id),account_revision INTEGER NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS identity_tokens(token_hash TEXT PRIMARY KEY,purpose TEXT NOT NULL,email_lookup TEXT NOT NULL,email_cipher TEXT NOT NULL,account_id TEXT,browser_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,consumed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS recovery_codes(code_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES accounts(account_id),consumed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS identity_audit(event_id TEXT PRIMARY KEY,account_id TEXT,operation TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS identity_budgets(bucket TEXT PRIMARY KEY,window_start INTEGER NOT NULL,count INTEGER NOT NULL,last_sent INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS identity_guards(guard_id TEXT PRIMARY KEY,token_hash TEXT NOT NULL,now INTEGER NOT NULL);
CREATE TRIGGER IF NOT EXISTS identity_token_guard BEFORE INSERT ON identity_guards BEGIN SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM identity_tokens WHERE token_hash=NEW.token_hash AND consumed=0 AND expires_at>NEW.now) THEN RAISE(ABORT,'IDENTITY_TOKEN_INVALID') END; END;
CREATE TABLE IF NOT EXISTS recovery_guards(guard_id TEXT PRIMARY KEY,code_hash TEXT NOT NULL,account_id TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS recovery_code_guard BEFORE INSERT ON recovery_guards BEGIN SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM recovery_codes WHERE code_hash=NEW.code_hash AND account_id=NEW.account_id AND consumed=0) THEN RAISE(ABORT,'RECOVERY_CODE_INVALID') END; END;
CREATE TABLE IF NOT EXISTS account_guards(guard_id TEXT PRIMARY KEY,account_id TEXT NOT NULL,expected_revision INTEGER NOT NULL);
CREATE TRIGGER IF NOT EXISTS account_revision_guard BEFORE INSERT ON account_guards BEGIN SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM accounts WHERE account_id=NEW.account_id AND revision=NEW.expected_revision) THEN RAISE(ABORT,'ACCOUNT_REVISION_CONFLICT') END; END;
CREATE TABLE IF NOT EXISTS identity_requests(scope TEXT NOT NULL,key TEXT NOT NULL,request_hash TEXT NOT NULL,result TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(scope,key));
CREATE TABLE IF NOT EXISTS identity_outbox(message_id TEXT PRIMARY KEY,payload_cipher TEXT NOT NULL,created_at INTEGER NOT NULL,delivered_at INTEGER);
CREATE TRIGGER IF NOT EXISTS identity_send_throttle BEFORE INSERT ON identity_budgets BEGIN SELECT CASE WHEN EXISTS(SELECT 1 FROM identity_budgets WHERE bucket=NEW.bucket AND (NEW.last_sent-last_sent<60000 OR (NEW.last_sent-window_start<3600000 AND count>=5))) THEN RAISE(ABORT,'IDENTITY_THROTTLED') END; END;
