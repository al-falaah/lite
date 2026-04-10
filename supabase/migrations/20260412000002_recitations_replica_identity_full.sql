-- Set REPLICA IDENTITY FULL so Supabase Realtime sends all columns on DELETE events
-- (needed for client-side filters like student_id=eq.X to match DELETE events)
ALTER TABLE recitations REPLICA IDENTITY FULL;
