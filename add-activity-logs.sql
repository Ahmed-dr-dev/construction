-- ============================================================
-- Migration : activity_logs + champs last_login_at / is_active
-- ============================================================

-- 1. Champs supplémentaires sur users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active       BOOLEAN DEFAULT TRUE;

-- 2. Table activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(50)  NOT NULL,   -- 'login','logout','create','update','delete'
  entity_type VARCHAR(100),            -- 'user','product','sale','client','supplier'…
  entity_id   TEXT,
  details     TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action     ON activity_logs(action);

-- 3. Vérification
SELECT COUNT(*) AS total_logs FROM activity_logs;
SELECT id, email, role, last_login_at, is_active FROM users ORDER BY created_at DESC LIMIT 5;
