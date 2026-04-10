-- Re:Memo transaction type ハードコード修正
--
-- 003_atomic_operations.sql の以下2関数は、引数で受け取った source_type /
-- answer_mode を無視して point_transactions.type を常にハードコード値で
-- INSERT していたため、ポイント履歴が正しく集計できない問題があった。
--
--  * save_learning_event_atomic: 常に 'consume_memo' で記録
--      → YouTube/PDF/録音 由来のポイント消費もメモ扱いになっていた
--  * submit_review_atomic:       常に 'consume_text_answer' で記録
--      → 音声回答のポイント消費もテキスト扱いになる（voice 機能有効化後に破綻）
--
-- 本マイグレーションでは両関数を CREATE OR REPLACE FUNCTION で上書きし、
-- CASE 式で引数に応じた transaction type を選択するよう修正する。
-- 関数シグネチャ（引数の型・順序・デフォルト値）・返り値型・他のロジックは
-- 003 と完全に同一。

CREATE OR REPLACE FUNCTION save_learning_event_atomic(
  p_user_id UUID,
  p_source_type TEXT,
  p_source_url TEXT,
  p_title TEXT,
  p_summary TEXT,
  p_raw_text TEXT,
  p_difficulty INTEGER,
  p_key_points JSONB,
  p_points_to_consume INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_event_id UUID;
  v_unit RECORD;
BEGIN
  -- auth.uid() 検証
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- ポイント残高チェック
  SELECT point_balance INTO v_balance FROM user_settings WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_points_to_consume THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_points');
  END IF;

  -- learning_event 作成
  INSERT INTO learning_events (user_id, source_type, source_url, title, summary, raw_text, difficulty)
  VALUES (p_user_id, p_source_type, p_source_url, p_title, p_summary, p_raw_text, p_difficulty)
  RETURNING id INTO v_event_id;

  -- learning_units + srs_cards 作成
  FOR v_unit IN
    SELECT jsonb_array_elements(p_key_points) AS kp
  LOOP
    WITH inserted_unit AS (
      INSERT INTO learning_units (learning_event_id, key_point)
      VALUES (v_event_id, v_unit.kp)
      RETURNING id
    )
    INSERT INTO srs_cards (user_id, learning_unit_id, easiness_factor, interval, repetitions, next_review_at)
    SELECT p_user_id, inserted_unit.id, 2.5, 0, 0, now()
    FROM inserted_unit;
  END LOOP;

  -- ポイント消費
  UPDATE user_settings SET point_balance = point_balance - p_points_to_consume, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO point_transactions (user_id, type, amount, balance_after, metadata)
  VALUES (
    p_user_id,
    CASE p_source_type
      WHEN 'youtube' THEN 'consume_youtube'
      WHEN 'pdf' THEN 'consume_pdf'
      WHEN 'recording' THEN 'consume_recording'
      ELSE 'consume_memo'
    END,
    -p_points_to_consume,
    v_balance - p_points_to_consume,
    jsonb_build_object('learning_event_id', v_event_id)
  );

  RETURN jsonb_build_object('success', true, 'learning_event_id', v_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_review_atomic(
  p_user_id UUID,
  p_card_id UUID,
  p_answer_mode TEXT,
  p_user_answer TEXT,
  p_score INTEGER,
  p_covered_points JSONB,
  p_missed_points JSONB,
  p_inaccuracies JSONB,
  p_feedback_message TEXT,
  p_follow_up_question TEXT,
  p_srs_quality INTEGER,
  p_xp_earned INTEGER,
  p_points_to_consume INTEGER,
  p_new_ef REAL,
  p_new_interval INTEGER,
  p_new_repetitions INTEGER,
  p_next_review_at TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- auth.uid() 検証
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- ポイント残高チェック
  SELECT point_balance INTO v_balance FROM user_settings WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_points_to_consume THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_points');
  END IF;

  -- SRSカード更新
  UPDATE srs_cards SET
    easiness_factor = p_new_ef,
    interval = p_new_interval,
    repetitions = p_new_repetitions,
    next_review_at = p_next_review_at,
    last_reviewed_at = now()
  WHERE id = p_card_id AND user_id = p_user_id;

  -- review_session 保存
  INSERT INTO review_sessions (
    user_id, srs_card_id, answer_mode, user_answer, score,
    covered_points, missed_points, inaccuracies,
    feedback_message, follow_up_question, srs_quality,
    xp_earned, points_consumed
  ) VALUES (
    p_user_id, p_card_id, p_answer_mode, p_user_answer, p_score,
    p_covered_points, p_missed_points, p_inaccuracies,
    p_feedback_message, p_follow_up_question, p_srs_quality,
    p_xp_earned, p_points_to_consume
  );

  -- ポイント消費
  UPDATE user_settings SET
    point_balance = point_balance - p_points_to_consume,
    total_xp = total_xp + p_xp_earned,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- point_transaction 記録
  INSERT INTO point_transactions (user_id, type, amount, balance_after, metadata)
  VALUES (
    p_user_id,
    CASE p_answer_mode
      WHEN 'voice' THEN 'consume_voice_answer'
      ELSE 'consume_text_answer'
    END,
    -p_points_to_consume,
    v_balance - p_points_to_consume,
    jsonb_build_object('srs_card_id', p_card_id)
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
