const { query } = require("../config/db");

const initializeDatabase = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      selected_charity_id BIGINT,
      contribution_percentage NUMERIC(5, 2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS charities (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS selected_charity_id BIGINT
  `);

  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS contribution_percentage NUMERIC(5, 2)
  `);

  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT
  `);

  await query(`
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
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_contribution_percentage_check'
      ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_contribution_percentage_check
        CHECK (
          contribution_percentage IS NULL
          OR (contribution_percentage >= 10 AND contribution_percentage <= 100)
        );
      END IF;
    END $$;
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_selected_charity_id
    ON users(selected_charity_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_charities_name
    ON charities(name)
  `);

  await query(`
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
    )
  `);

  await query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'users_set_updated_at'
      ) THEN
        CREATE TRIGGER users_set_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'charities_set_updated_at'
      ) THEN
        CREATE TRIGGER charities_set_updated_at
        BEFORE UPDATE ON charities
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS scores (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 45),
      score_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_scores_user_id
    ON scores(user_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_scores_user_date
    ON scores(user_id, score_date DESC, created_at DESC)
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'scores_set_updated_at'
      ) THEN
        CREATE TRIGGER scores_set_updated_at
        BEFORE UPDATE ON scores
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);

  await query(`
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
    )
  `);

  await query(`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS provider VARCHAR(20)
  `);

  await query(`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS provider_customer_id TEXT
  `);

  await query(`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT
  `);

  await query(`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS provider_price_id TEXT
  `);

  await query(`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS provider_status VARCHAR(50)
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id
    ON subscriptions(provider_subscription_id)
    WHERE provider_subscription_id IS NOT NULL
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
    ON subscriptions(user_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_latest
    ON subscriptions(user_id, created_at DESC, id DESC)
  `);

  await query(`
    WITH ranked_active_subscriptions AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY user_id
          ORDER BY created_at DESC, id DESC
        ) AS row_num
      FROM subscriptions
      WHERE status = 'active'
    )
    UPDATE subscriptions
    SET status = 'inactive',
        cancelled_at = COALESCE(cancelled_at, NOW()),
        ends_at = LEAST(ends_at, NOW())
    WHERE id IN (
      SELECT id
      FROM ranked_active_subscriptions
      WHERE row_num > 1
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
    ON subscriptions(user_id)
    WHERE status = 'active'
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'subscriptions_set_updated_at'
      ) THEN
        CREATE TRIGGER subscriptions_set_updated_at
        BEFORE UPDATE ON subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);

  await query(`
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
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
    ON payment_transactions(user_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at
    ON payment_transactions(created_at DESC)
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'payment_transactions_set_updated_at'
      ) THEN
        CREATE TRIGGER payment_transactions_set_updated_at
        BEFORE UPDATE ON payment_transactions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS donations (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      charity_id BIGINT NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      status VARCHAR(20) NOT NULL DEFAULT 'completed',
      message TEXT,
      reference VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_donations_user_id
    ON donations(user_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_donations_charity_id
    ON donations(charity_id)
  `);

  await query(`
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
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draws_charity_id
    ON draws(charity_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draws_status
    ON draws(status)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draws_draw_date
    ON draws(draw_date)
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'draws_set_updated_at'
      ) THEN
        CREATE TRIGGER draws_set_updated_at
        BEFORE UPDATE ON draws
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS draw_results (
      id BIGSERIAL PRIMARY KEY,
      draw_numbers INTEGER[] NOT NULL,
      draw_period DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW())::date,
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      triggered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
      published_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
      total_participants INTEGER NOT NULL DEFAULT 0 CHECK (total_participants >= 0),
      total_winners INTEGER NOT NULL DEFAULT 0 CHECK (total_winners >= 0),
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT draw_results_draw_numbers_length_check CHECK (array_length(draw_numbers, 1) = 5)
    )
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS total_subscription_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS prize_pool_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS charity_contribution_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS rollover_in_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS rollover_out_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS payout_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS draw_period DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW())::date
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft'
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ
  `);

  await query(`
    ALTER TABLE draw_results
    ADD COLUMN IF NOT EXISTS published_by BIGINT
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'draw_results_status_check'
      ) THEN
        ALTER TABLE draw_results
        ADD CONSTRAINT draw_results_status_check
        CHECK (status IN ('draft', 'published'));
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'draw_results_published_by_fkey'
      ) THEN
        ALTER TABLE draw_results
        ADD CONSTRAINT draw_results_published_by_fkey
        FOREIGN KEY (published_by)
        REFERENCES users(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await query(`
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
    )
  `);

  await query(`
    ALTER TABLE draw_winners
    ADD COLUMN IF NOT EXISTS prize_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE draw_winners
    ADD COLUMN IF NOT EXISTS proof_image_url TEXT
  `);

  await query(`
    ALTER TABLE draw_winners
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'
  `);

  await query(`
    ALTER TABLE draw_winners
    ADD COLUMN IF NOT EXISTS admin_note TEXT
  `);

  await query(`
    ALTER TABLE draw_winners
    ADD COLUMN IF NOT EXISTS reviewed_by BIGINT
  `);

  await query(`
    ALTER TABLE draw_winners
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'draw_winners_status_check'
      ) THEN
        ALTER TABLE draw_winners
        DROP CONSTRAINT draw_winners_status_check;
      END IF;

      ALTER TABLE draw_winners
      ADD CONSTRAINT draw_winners_status_check
      CHECK (status IN ('pending', 'approved', 'paid', 'rejected'));
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'draw_winners_reviewed_by_fkey'
      ) THEN
        ALTER TABLE draw_winners
        ADD CONSTRAINT draw_winners_reviewed_by_fkey
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draw_results_created_at
    ON draw_results(created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draw_results_period
    ON draw_results(draw_period DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draw_results_status
    ON draw_results(status)
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_draw_results_one_published_per_period
    ON draw_results(draw_period)
    WHERE status = 'published'
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draw_winners_draw_result_id
    ON draw_winners(draw_result_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draw_winners_user_id
    ON draw_winners(user_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_draw_winners_status
    ON draw_winners(status)
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'draw_results_set_updated_at'
      ) THEN
        CREATE TRIGGER draw_results_set_updated_at
        BEFORE UPDATE ON draw_results
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);

  await query(`
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
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_winners_draw_id
    ON winners(draw_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_winners_user_id
    ON winners(user_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_winners_charity_id
    ON winners(charity_id)
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'winners_set_updated_at'
      ) THEN
        CREATE TRIGGER winners_set_updated_at
        BEFORE UPDATE ON winners
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);

  await query(`
    DROP TABLE IF EXISTS winners
  `);

  await query(`
    DROP TABLE IF EXISTS draws
  `);
};

module.exports = {
  initializeDatabase,
};
