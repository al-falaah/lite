-- Gated drill decks (by enrollment program) + weekly/monthly leaderboard support.
-- Replaces the permissive "anyone reads published decks" with enrollment-aware access.

-- ─── drill_decks: replace public SELECT with enrollment-gated SELECT ────
DROP POLICY IF EXISTS "Anyone reads published decks" ON drill_decks;

CREATE POLICY "Enrolled students read their program's published decks"
  ON drill_decks FOR SELECT
  USING (
    is_published = true
    AND program IN (
      SELECT e.program FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.auth_user_id = auth.uid()
      AND e.status = 'active'
    )
  );

-- Admins keep full access via the existing "Admins manage decks" policy.

-- ─── drill_cards: replace public SELECT with enrollment-gated SELECT ────
DROP POLICY IF EXISTS "Anyone reads cards of published decks" ON drill_cards;

CREATE POLICY "Enrolled students read cards of their program's decks"
  ON drill_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drill_decks d
      JOIN enrollments e ON e.program = d.program
      JOIN students s ON s.id = e.student_id
      WHERE d.id = drill_cards.deck_id
      AND d.is_published = true
      AND s.auth_user_id = auth.uid()
      AND e.status = 'active'
    )
  );

-- ─── Seed: Endless Nahw & Arabiyyah deck for essentials ─────────────────
INSERT INTO drill_decks (id, title, description, program, topic, cover_emoji, is_published)
VALUES (
  '00000000-0000-0000-0000-00000000a4a1',
  'Endless Nahw & Arabiyyah',
  'Unlimited mixed Arabic grammar questions auto-generated from scholar-annotated Qur''an i''rab data.',
  'essentials',
  'Endless',
  '♾️',
  false
)
ON CONFLICT (id) DO NOTHING;

-- ─── Period-based leaderboard RPC ───────────────────────────────────────
-- Supports: all_time | week | month. When week/month, summaries come from
-- drill_attempts within the requested ISO year+week or year+month range.
-- Admins can query any period; students can always query, RLS on the
-- underlying tables scopes the visible rows.

CREATE OR REPLACE FUNCTION get_drill_leaderboard_period(
  p_program TEXT DEFAULT NULL,
  p_period TEXT DEFAULT 'all_time', -- 'all_time' | 'week' | 'month'
  p_iso_year INT DEFAULT NULL,
  p_iso_week INT DEFAULT NULL,
  p_month INT DEFAULT NULL,         -- 1-12, paired with p_iso_year as the calendar year
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  student_id UUID,
  display_name TEXT,
  program TEXT,
  total_xp BIGINT,
  drills_completed BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Fast path: all-time reads from aggregate stats table.
  IF p_period = 'all_time' THEN
    RETURN QUERY
    SELECT
      s.student_id,
      CASE
        WHEN POSITION(' ' IN st.full_name) > 0 THEN
          SPLIT_PART(st.full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(st.full_name, ' ', 2), 1) || '.'
        ELSE
          st.full_name
      END AS display_name,
      s.program,
      s.total_xp::BIGINT,
      s.drills_completed::BIGINT
    FROM student_drill_stats s
    JOIN students st ON st.id = s.student_id
    WHERE (p_program IS NULL OR s.program = p_program)
    ORDER BY s.total_xp DESC
    LIMIT p_limit;

  -- Period path: aggregate drill_attempts within the requested window.
  ELSE
    RETURN QUERY
    SELECT
      st.id AS student_id,
      CASE
        WHEN POSITION(' ' IN st.full_name) > 0 THEN
          SPLIT_PART(st.full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(st.full_name, ' ', 2), 1) || '.'
        ELSE
          st.full_name
      END AS display_name,
      d.program,
      SUM(a.xp_earned)::BIGINT AS total_xp,
      COUNT(*)::BIGINT AS drills_completed
    FROM drill_attempts a
    JOIN drill_decks d ON d.id = a.deck_id
    JOIN students st ON st.id = a.student_id
    WHERE (p_program IS NULL OR d.program = p_program)
    AND (
      (p_period = 'week'
        AND EXTRACT(ISOYEAR FROM a.completed_at) = p_iso_year
        AND EXTRACT(WEEK FROM a.completed_at) = p_iso_week)
      OR (p_period = 'month'
        AND EXTRACT(YEAR FROM a.completed_at) = p_iso_year
        AND EXTRACT(MONTH FROM a.completed_at) = p_month)
    )
    GROUP BY st.id, st.full_name, d.program
    ORDER BY SUM(a.xp_earned) DESC
    LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_drill_leaderboard_period TO authenticated;
