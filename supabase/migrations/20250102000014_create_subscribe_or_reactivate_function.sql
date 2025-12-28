-- Create a smart subscribe function that handles both new subscriptions and reactivations

CREATE OR REPLACE FUNCTION public.subscribe_to_blog(
  subscriber_email TEXT,
  subscriber_name TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_record RECORD;
  is_new_subscription BOOLEAN := false;
BEGIN
  -- Try to reactivate existing inactive subscription
  UPDATE blog_subscribers
  SET
    is_active = true,
    full_name = COALESCE(subscriber_name, full_name),
    updated_at = NOW()
  WHERE email = subscriber_email AND is_active = false
  RETURNING * INTO result_record;

  -- If no inactive subscription was found, try to insert new one
  IF NOT FOUND THEN
    is_new_subscription := true;
    BEGIN
      INSERT INTO blog_subscribers (email, full_name, is_active)
      VALUES (subscriber_email, subscriber_name, true)
      RETURNING * INTO result_record;
    EXCEPTION
      WHEN unique_violation THEN
        -- Email already exists and is active
        RETURN json_build_object(
          'success', false,
          'message', 'You are already subscribed to blog updates',
          'already_subscribed', true
        );
    END;
  END IF;

  -- Success
  RETURN json_build_object(
    'success', true,
    'message', CASE
      WHEN is_new_subscription THEN 'Successfully subscribed to blog updates!'
      ELSE 'Welcome back! Your subscription has been reactivated.'
    END,
    'email', result_record.email,
    'is_new', is_new_subscription
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.subscribe_to_blog(TEXT, TEXT) TO anon, authenticated, public;

COMMENT ON FUNCTION public.subscribe_to_blog(TEXT, TEXT) IS 'Handles both new subscriptions and reactivating unsubscribed emails';
