-- =============================================
-- Setup Storage Bucket for Payment Proofs
-- =============================================

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-documents', 'payment-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- =============================================
-- Storage RLS Policies
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payment proofs" ON storage.objects;

-- 1. Allow anyone (anon/authenticated) to upload to payment-proofs folder
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'payment-documents' AND
  (storage.foldername(name))[1] = 'payment-proofs'
);

-- 2. Allow anyone to read payment proofs (needed for viewing uploaded files)
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'payment-documents'
);

-- 3. Only admins can delete payment proofs
CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-documents' AND
  is_admin()
);

-- 4. Only admins can update payment proofs
CREATE POLICY "Admins can update payment proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-documents' AND
  is_admin()
)
WITH CHECK (
  bucket_id = 'payment-documents' AND
  is_admin()
);

-- =============================================
-- SUCCESS
-- =============================================
SELECT '✅ Storage bucket configured!' as message;
