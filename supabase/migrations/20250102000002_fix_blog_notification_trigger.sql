-- Update the notification function to use anon key instead of service role
-- Edge Functions handle authorization internally
CREATE OR REPLACE FUNCTION notify_blog_publish()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  anon_key TEXT;
BEGIN
  -- Only trigger if status changed from 'draft' to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

    -- Use the production Edge Function URL
    function_url := 'https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/notify-blog-subscribers';

    -- Get anon key from Supabase settings
    -- The Edge Function will use its own service role key for internal operations
    anon_key := current_setting('app.settings.anon_key', true);

    -- Call the Edge Function asynchronously using pg_net extension
    PERFORM
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', coalesce(anon_key, ''),
          'Authorization', 'Bearer ' || coalesce(anon_key, '')
        ),
        body := jsonb_build_object(
          'post_id', NEW.id
        )
      );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_blog_publish() IS 'Automatically notifies blog subscribers when a post is published';
