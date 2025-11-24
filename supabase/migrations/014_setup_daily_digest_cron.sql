-- =============================================
-- Setup Daily Digest Cron Jobs
-- =============================================
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant access to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Clear any existing digest jobs
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname LIKE 'daily-digest-%';

-- Morning Digest: 8 AM NZDT (7 PM UTC previous day)
-- Runs at 7 PM UTC (19:00) which is 8 AM next day in NZ (UTC+13 during DST)
SELECT cron.schedule(
  'daily-digest-morning',
  '0 19 * * *', -- Every day at 7 PM UTC = 8 AM NZDT
  $$
  SELECT
    net.http_post(
      url:='https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body:=jsonb_build_object('type', 'morning')
    ) as request_id;
  $$
);

-- Evening Digest: 6 PM NZDT (5 AM UTC same day)
-- Runs at 5 AM UTC which is 6 PM same day in NZ (UTC+13 during DST)
SELECT cron.schedule(
  'daily-digest-evening',
  '0 5 * * *', -- Every day at 5 AM UTC = 6 PM NZDT
  $$
  SELECT
    net.http_post(
      url:='https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body:=jsonb_build_object('type', 'evening')
    ) as request_id;
  $$
);

-- Verify the cron jobs are scheduled
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname LIKE 'daily-digest-%';

-- =============================================
-- NOTES
-- =============================================
-- The digest will automatically check for new applications and payments
-- from the last 12 hours and only send an email if there's activity.
--
-- To manually trigger the digest (for testing):
-- SELECT net.http_post(
--   url:='https://rkcdamqaptapsrhejdzm.supabase.co/functions/v1/send-daily-digest',
--   headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
-- );
--
-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Daily digest cron jobs scheduled!' as message;
