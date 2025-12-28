-- Create a function to handle unsubscribe that bypasses RLS
-- This function can be called by anyone but only updates is_active to false

CREATE OR REPLACE FUNCTION public.unsubscribe_from_blog(subscriber_email TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's privileges, bypassing RLS
AS $$
DECLARE
  updated_count INTEGER;
  result_record RECORD;
BEGIN
  -- Update the subscriber to mark as inactive
  UPDATE blog_subscribers
  SET is_active = false, updated_at = NOW()
  WHERE email = subscriber_email AND is_active = true
  RETURNING * INTO result_record;

  -- Check if any row was updated
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No active subscription found with this email'
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'message', 'Successfully unsubscribed',
      'email', result_record.email
    );
  END IF;
END;
$$;

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.unsubscribe_from_blog(TEXT) TO anon, authenticated, public;

COMMENT ON FUNCTION public.unsubscribe_from_blog(TEXT) IS 'Allows anyone to unsubscribe from blog updates by email, bypassing RLS';
