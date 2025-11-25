-- =============================================
-- Allow NULL for installments_per_year
-- =============================================
-- With Stripe integration, we don't use installments anymore.
-- This allows the column to be NULL for Stripe-based students.

-- Drop the NOT NULL constraint and the CHECK constraint
ALTER TABLE students
ALTER COLUMN installments_per_year DROP NOT NULL;

-- Drop the old check constraint if it exists
ALTER TABLE students
DROP CONSTRAINT IF EXISTS students_installments_per_year_check;

-- Add a new check constraint that allows NULL or values between 1 and 5
ALTER TABLE students
ADD CONSTRAINT students_installments_per_year_check
CHECK (installments_per_year IS NULL OR (installments_per_year BETWEEN 1 AND 5));

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ installments_per_year can now be NULL for Stripe students!' as message;
