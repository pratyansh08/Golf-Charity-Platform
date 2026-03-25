CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_customer_id TEXT,
  selected_charity_id BIGINT,
  contribution_percentage NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_contribution_percentage_check
    CHECK (
      contribution_percentage IS NULL
      OR (contribution_percentage >= 10 AND contribution_percentage <= 100)
    )
);

CREATE TABLE IF NOT EXISTS charities (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_selected_charity_id_fkey'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_selected_charity_id_fkey
    FOREIGN KEY (selected_charity_id)
    REFERENCES charities(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS draws (
  id BIGSERIAL PRIMARY KEY,
  charity_id BIGINT NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  draw_date DATE NOT NULL,
  entry_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
  prize_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prize_amount >= 0),
  max_entries_per_user INTEGER CHECK (max_entries_per_user IS NULL OR max_entries_per_user > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'open', 'closed', 'completed', 'cancelled')),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  provider VARCHAR(20),
  provider_customer_id TEXT,
  provider_subscription_id TEXT UNIQUE,
  provider_price_id TEXT,
  provider_status VARCHAR(50),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  transaction_type VARCHAR(40) NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'mock',
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  reference VARCHAR(120) NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  charity_id BIGINT NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  message TEXT,
  reference VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS draw_results (
  id BIGSERIAL PRIMARY KEY,
  draw_numbers INTEGER[] NOT NULL,
  draw_period DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW())::date,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  triggered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  published_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  total_participants INTEGER NOT NULL DEFAULT 0 CHECK (total_participants >= 0),
  total_winners INTEGER NOT NULL DEFAULT 0 CHECK (total_winners >= 0),
  total_subscription_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_subscription_revenue >= 0),
  prize_pool_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prize_pool_amount >= 0),
  charity_contribution_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (charity_contribution_amount >= 0),
  rollover_in_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (rollover_in_amount >= 0),
  rollover_out_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (rollover_out_amount >= 0),
  payout_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT draw_results_draw_numbers_length_check CHECK (array_length(draw_numbers, 1) = 5)
);

CREATE TABLE IF NOT EXISTS draw_winners (
  id BIGSERIAL PRIMARY KEY,
  draw_result_id BIGINT NOT NULL REFERENCES draw_results(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_count INTEGER NOT NULL CHECK (match_count IN (3, 4, 5)),
  matched_numbers INTEGER[] NOT NULL,
  proof_image_url TEXT,
  prize_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prize_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  admin_note TEXT,
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT draw_winners_unique_user_per_draw UNIQUE (draw_result_id, user_id)
);

CREATE TABLE IF NOT EXISTS winners (
  id BIGSERIAL PRIMARY KEY,
  draw_id BIGINT NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_id BIGINT REFERENCES scores(id) ON DELETE SET NULL,
  charity_id BIGINT NOT NULL REFERENCES charities(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 1 CHECK (position > 0),
  prize_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prize_amount >= 0),
  announced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT winners_draw_position_unique UNIQUE (draw_id, position),
  CONSTRAINT winners_draw_user_unique UNIQUE (draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_selected_charity_id ON users(selected_charity_id);
CREATE INDEX IF NOT EXISTS idx_charities_name ON charities(name);
CREATE INDEX IF NOT EXISTS idx_draws_charity_id ON draws(charity_id);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_draws_draw_date ON draws(draw_date);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores(user_id, score_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_latest ON subscriptions(user_id, created_at DESC, id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
ON subscriptions(user_id)
WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id
ON subscriptions(provider_subscription_id)
WHERE provider_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_charity_id ON donations(charity_id);
CREATE INDEX IF NOT EXISTS idx_draw_results_created_at ON draw_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_draw_results_period ON draw_results(draw_period DESC);
CREATE INDEX IF NOT EXISTS idx_draw_results_status ON draw_results(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_draw_results_one_published_per_period
ON draw_results(draw_period)
WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_draw_winners_draw_result_id ON draw_winners(draw_result_id);
CREATE INDEX IF NOT EXISTS idx_draw_winners_user_id ON draw_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_draw_winners_status ON draw_winners(status);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_charity_id ON winners(charity_id);

INSERT INTO charities (name, description)
SELECT seed_data.name, seed_data.description
FROM (
  VALUES
    ('First Tee Youth Development', 'Supports youth golf development and mentoring programs.'),
    ('Golf For Veterans Foundation', 'Helps veterans access wellness and community through golf.'),
    ('Community Fairways Fund', 'Improves access to local golf programs and public courses.')
) AS seed_data(name, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM charities
);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS charities_set_updated_at ON charities;
CREATE TRIGGER charities_set_updated_at
BEFORE UPDATE ON charities
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS draws_set_updated_at ON draws;
CREATE TRIGGER draws_set_updated_at
BEFORE UPDATE ON draws
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS scores_set_updated_at ON scores;
CREATE TRIGGER scores_set_updated_at
BEFORE UPDATE ON scores
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS payment_transactions_set_updated_at ON payment_transactions;
CREATE TRIGGER payment_transactions_set_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS draw_results_set_updated_at ON draw_results;
CREATE TRIGGER draw_results_set_updated_at
BEFORE UPDATE ON draw_results
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS winners_set_updated_at ON winners;
CREATE TRIGGER winners_set_updated_at
BEFORE UPDATE ON winners
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TABLE IF EXISTS winners;
DROP TABLE IF EXISTS draws;
