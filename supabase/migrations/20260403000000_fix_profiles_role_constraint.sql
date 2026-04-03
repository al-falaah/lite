-- Fix profiles_role_check constraint to re-include student and teacher roles
-- These were accidentally dropped in 20260123000003_add_research_admin_role.sql

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('director', 'teacher', 'student', 'madrasah_admin', 'blog_admin', 'store_admin', 'research_admin'));
