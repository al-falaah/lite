-- Simplified trigger that calls Edge Function without authentication
-- The Edge Function uses its own service role key for database access
CREATE OR REPLACE FUNCTION notify_blog_publish()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only trigger if status changed from 'draft' to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

    -- Call the Edge Function asynchronously using pg_net extension
    -- No auth needed - the Edge Function handles its own authentication
    SELECT net.http_post(
      url := 'https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/notify-blog-subscribers',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('post_id', NEW.id)
    ) INTO request_id;

    -- Log the request ID for debugging
    RAISE LOG 'Blog notification triggered for post %, request_id: %', NEW.id, request_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_blog_publish() IS 'Automatically notifies blog subscribers when a post is published';
