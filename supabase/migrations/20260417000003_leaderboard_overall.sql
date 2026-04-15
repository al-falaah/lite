-- Collapse the drill leaderboard so it returns one row per student with XP
-- summed across all programs. The previous version grouped by program which
-- double-counted students enrolled in multiple programs.

-- Return column set changes (dropping `program`), so the function must be dropped first.
DROP FUNCTION IF EXISTS get_drill_leaderboard_period(TEXT, TEXT, INT, INT, INT, INT);

CREATE FUNCTION get_drill_leaderboard_period(
  p_program TEXT DEFAULT NULL,           -- retained for signature compatibility; ignored
  p_period TEXT DEFAULT 'all_time',      -- 'all_time' | 'week' | 'month'
  p_iso_year INT DEFAULT NULL,
  p_iso_week INT DEFAULT NULL,
  p_month INT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  student_id UUID,
  display_name TEXT,
  total_xp BIGINT,
  drills_completed BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
      SUM(s.total_xp)::BIGINT AS total_xp,
      SUM(s.drills_completed)::BIGINT AS drills_completed
    FROM student_drill_stats s
    JOIN students st ON st.id = s.student_id
    GROUP BY s.student_id, st.full_name
    ORDER BY SUM(s.total_xp) DESC
    LIMIT p_limit;

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
      SUM(a.xp_earned)::BIGINT AS total_xp,
      COUNT(*)::BIGINT AS drills_completed
    FROM drill_attempts a
    JOIN students st ON st.id = a.student_id
    WHERE (
      (p_period = 'week'
        AND EXTRACT(ISOYEAR FROM a.completed_at) = p_iso_year
        AND EXTRACT(WEEK FROM a.completed_at) = p_iso_week)
      OR (p_period = 'month'
        AND EXTRACT(YEAR FROM a.completed_at) = p_iso_year
        AND EXTRACT(MONTH FROM a.completed_at) = p_month)
    )
    GROUP BY st.id, st.full_name
    ORDER BY SUM(a.xp_earned) DESC
    LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_drill_leaderboard_period TO authenticated;
