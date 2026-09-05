-- Storage bucket for images uploaded in the rich-text editor (lessons + blog).
-- Public read (images render via plain public URLs in the reader), writes
-- restricted to lesson/blog authors (director / academic_dean) — the same
-- roles gated on ResearchAdmin and /blog/admin.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-images',
  'lesson-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read is served by the bucket's public=true flag (the /object/public/
-- path), so no SELECT policy is needed — matches the payment-documents bucket.

-- Authors (director / academic_dean) may upload.
CREATE POLICY "Authors can upload lesson images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('director', 'academic_dean')
    )
  );

-- Authors may replace an existing image.
CREATE POLICY "Authors can update lesson images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lesson-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('director', 'academic_dean')
    )
  );

-- Authors may delete an image.
CREATE POLICY "Authors can delete lesson images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('director', 'academic_dean')
    )
  );
