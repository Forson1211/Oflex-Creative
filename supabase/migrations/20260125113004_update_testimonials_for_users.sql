-- Allow authenticated users to submit testimonials while keeping admin moderation.
-- We add user_id to link the submission to the user and enable an INSERT policy.

ALTER TABLE public.testimonials
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Helpful index for admin views / auditing
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON public.testimonials (user_id);

-- Policy: authenticated users can submit a testimonial for themselves (stored inactive for moderation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'testimonials'
      AND policyname = 'Users can submit testimonials'
  ) THEN
    CREATE POLICY "Users can submit testimonials"
    ON public.testimonials
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = user_id
      AND is_active = false
      AND btrim(name) <> ''
      AND btrim(role) <> ''
      AND btrim(content) <> ''
      AND char_length(name) <= 100
      AND char_length(role) <= 100
      AND char_length(content) <= 2000
      AND (rating IS NULL OR (rating >= 1 AND rating <= 5))
      AND (avatar_url IS NULL OR char_length(avatar_url) <= 2000)
    );
  END IF;
END $$;

-- Note: existing policies remain:
-- - Anyone can view active testimonials (SELECT)
-- - Admins can manage testimonials (ALL)
