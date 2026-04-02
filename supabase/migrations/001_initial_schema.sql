-- Re:Memo 初期スキーマ

CREATE TABLE point_plans (
  id TEXT PRIMARY KEY,
  monthly_points INTEGER NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  ad_reward_enabled BOOLEAN DEFAULT false,
  ad_reward_per_view INTEGER DEFAULT 0,
  ad_max_views_per_day INTEGER DEFAULT 0,
  features JSONB NOT NULL
);

INSERT INTO point_plans VALUES
  ('free',   10,   0,     0,     true,  2, 2, '{"voice_answer":false,"weakness":false,"oral_exam":false,"offline":false,"ad_free":false}'),
  ('lite',   50,   500,   4800,  false, 0, 0, '{"voice_answer":false,"weakness":false,"oral_exam":false,"offline":false,"ad_free":true}'),
  ('pro',    200,  980,   9800,  false, 0, 0, '{"voice_answer":true,"weakness":true,"oral_exam":false,"offline":true,"ad_free":true}'),
  ('master', 500,  1980,  19800, false, 0, 0, '{"voice_answer":true,"weakness":true,"oral_exam":true,"offline":true,"ad_free":true}');

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' REFERENCES point_plans(id),
  point_balance INTEGER NOT NULL DEFAULT 10,
  streak_count INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  notification_time TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('memo', 'youtube', 'pdf', 'recording')),
  source_url TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  raw_text TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_learning_events_user ON learning_events(user_id, created_at DESC);
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_events" ON learning_events FOR ALL USING (auth.uid() = user_id);

CREATE TABLE learning_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_event_id UUID NOT NULL REFERENCES learning_events(id) ON DELETE CASCADE,
  key_point JSONB NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_learning_units_event ON learning_units(learning_event_id);
CREATE INDEX idx_learning_units_source ON learning_units(source_id);
ALTER TABLE learning_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_units" ON learning_units FOR ALL USING (
  EXISTS (SELECT 1 FROM learning_events le WHERE le.id = learning_units.learning_event_id AND le.user_id = auth.uid())
);

CREATE TABLE srs_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_unit_id UUID NOT NULL REFERENCES learning_units(id) ON DELETE CASCADE,
  easiness_factor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, learning_unit_id)
);
CREATE INDEX idx_srs_cards_due ON srs_cards(user_id, next_review_at);
ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_cards" ON srs_cards FOR ALL USING (auth.uid() = user_id);

CREATE TABLE review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  srs_card_id UUID NOT NULL REFERENCES srs_cards(id) ON DELETE CASCADE,
  answer_mode TEXT NOT NULL CHECK (answer_mode IN ('voice', 'text')),
  user_answer TEXT NOT NULL,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  covered_points JSONB DEFAULT '[]',
  missed_points JSONB DEFAULT '[]',
  inaccuracies JSONB DEFAULT '[]',
  feedback_message TEXT,
  follow_up_question TEXT,
  srs_quality INTEGER CHECK (srs_quality BETWEEN 0 AND 5),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  points_consumed INTEGER NOT NULL DEFAULT 0,
  audio_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_review_sessions_user ON review_sessions(user_id, created_at DESC);
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_sessions" ON review_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'monthly_grant', 'ad_reward', 'purchase',
    'consume_memo', 'consume_youtube', 'consume_pdf',
    'consume_text_answer', 'consume_voice_answer',
    'consume_weakness', 'consume_oral_exam', 'consume_recording',
    'expire'
  )),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_transactions" ON point_transactions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE api_cost_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_name TEXT NOT NULL CHECK (api_name IN ('gemini', 'deepgram')),
  input_tokens INTEGER,
  output_tokens INTEGER,
  audio_duration_seconds INTEGER,
  cost_jpy REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_api_cost_logs_date ON api_cost_logs(created_at DESC);
ALTER TABLE api_cost_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_cost_logs" ON api_cost_logs FOR SELECT USING (false);

CREATE OR REPLACE FUNCTION consume_points(
  p_user_id UUID, p_type TEXT, p_points INTEGER, p_metadata JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE v_balance INTEGER;
BEGIN
  SELECT point_balance INTO v_balance FROM user_settings WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_points THEN RETURN FALSE; END IF;
  UPDATE user_settings SET point_balance = point_balance - p_points, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO point_transactions (user_id, type, amount, balance_after, metadata) VALUES (p_user_id, p_type, -p_points, v_balance - p_points, p_metadata);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
