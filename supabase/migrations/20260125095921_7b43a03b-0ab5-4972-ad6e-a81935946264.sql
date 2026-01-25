-- Tighten INSERT policy on contact_messages to avoid WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact form"
ON public.contact_messages
FOR INSERT
WITH CHECK (
  -- basic validation to avoid permissive policy lint
  btrim(name) <> ''
  AND btrim(email) <> ''
  AND btrim(subject) <> ''
  AND btrim(message) <> ''
  AND char_length(name) <= 100
  AND char_length(email) <= 255
  AND char_length(subject) <= 200
  AND char_length(message) <= 2000
);