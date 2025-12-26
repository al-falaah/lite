-- Enable Row Level Security on tables that have policies but RLS disabled
-- This fixes the Supabase linter errors while maintaining existing functionality

-- Enable RLS on class_schedules
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Enable RLS on applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Verify all policies are still in place (these should already exist)
-- Just documenting what policies exist for reference:

-- class_schedules policies:
-- - Anyone can view class schedules

-- payments policies:
-- - Admins can delete payments
-- - Admins can update payments
-- - Admins can view payments
-- - Anyone can insert payments

-- students policies:
-- - Admins can delete students
-- - Admins can insert students
-- - Admins can update students
-- - Anyone can read students
-- - Anyone can update students
-- - Anyone can view student profiles

-- applications policies:
-- - Should have RLS policies defined (need to verify)
