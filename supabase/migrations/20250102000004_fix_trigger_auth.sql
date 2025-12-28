-- Update trigger to include anon key for authentication
-- This allows the database trigger to call the Edge Function successfully
CREATE OR REPLACE FUNCTION notify_blog_publish()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrY2RhbXFhcHRhcHNyaGVqZHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Njk5NDMsImV4cCI6MjA3ODM0NTk0M30.vcAxSA1u9g4WLpJhf9VVuO-SJ-VXuLQKN5i-usaE0vA';
BEGIN
  -- Only trigger if status changed from 'draft' to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

    -- Call the Edge Function with authentication
    SELECT net.http_post(
      url := 'https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/notify-blog-subscribers',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', anon_key,
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object('post_id', NEW.id)
    ) INTO request_id;

    -- Log the request ID for debugging
    RAISE LOG 'Blog notification triggered for post %, request_id: %', NEW.id, request_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_blog_publish() IS 'Automatically notifies blog subscribers when a post is published';
