-- Create a function to reactivate subscription (for testing and future resubscribe feature)

CREATE OR REPLACE FUNCTION public.resubscribe_to_blog(subscriber_email TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
  result_record RECORD;
BEGIN
  -- Update the subscriber to mark as active again
  UPDATE blog_subscribers
  SET is_active = true, updated_at = NOW()
  WHERE email = subscriber_email AND is_active = false
  RETURNING * INTO result_record;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email is already subscribed or not found'
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'message', 'Successfully reactivated subscription',
      'email', result_record.email
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resubscribe_to_blog(TEXT) TO anon, authenticated, public;

COMMENT ON FUNCTION public.resubscribe_to_blog(TEXT) IS 'Allows reactivating a previously unsubscribed email';
