-- Run this in your Supabase SQL Editor to enable the "Live Project URL" feature
ALTER TABLE public.featured_projects ADD COLUMN IF NOT EXISTS project_url TEXT;

-- Verify the column was added
COMMENT ON COLUMN public.featured_projects.project_url IS 'External link for Canva, PosterMyWall, or live site embeds';
