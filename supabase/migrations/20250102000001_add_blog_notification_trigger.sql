-- Create a function to notify subscribers when a blog post is published
CREATE OR REPLACE FUNCTION notify_blog_publish()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  response RECORD;
BEGIN
  -- Only trigger if status changed from 'draft' to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

    -- Get the Edge Function URL from environment
    -- You'll need to set this via Supabase dashboard or CLI
    function_url := current_setting('app.settings.edge_function_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);

    -- If environment variables are not set, use default local development URL
    IF function_url IS NULL THEN
      function_url := 'https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/notify-blog-subscribers';
    END IF;

    -- Call the Edge Function asynchronously using pg_net extension
    -- Note: This requires the pg_net extension to be enabled
    PERFORM
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(service_role_key, '')
        ),
        body := jsonb_build_object(
          'post_id', NEW.id
        )
      );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on blog_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_blog_publish'
  ) THEN
    CREATE TRIGGER trigger_notify_blog_publish
    AFTER INSERT OR UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION notify_blog_publish();
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO postgres, anon, authenticated, service_role;

COMMENT ON FUNCTION notify_blog_publish() IS 'Automatically notifies blog subscribers when a post is published';
