-- Leaderboard function: returns student names (first + last initial) for competitive display
CREATE OR REPLACE FUNCTION get_drill_leaderboard(p_program TEXT DEFAULT NULL, p_limit INT DEFAULT 50)
RETURNS TABLE(
  student_id UUID,
  display_name TEXT,
  program TEXT,
  total_xp INTEGER,
  current_streak INTEGER,
  best_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    s.total_xp,
    s.current_streak,
    s.best_streak
  FROM student_drill_stats s
  JOIN students st ON st.id = s.student_id
  WHERE (p_program IS NULL OR s.program = p_program)
  ORDER BY s.total_xp DESC
  LIMIT p_limit;
END;
$$;
