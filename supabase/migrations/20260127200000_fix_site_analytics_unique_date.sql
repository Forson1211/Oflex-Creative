-- Add unique constraint to site_analytics(date) to fix the ON CONFLICT error
-- This error happens because the update_daily_analytics function uses ON CONFLICT (date)
-- but the column doesn't have a unique constraint.

DO $$
BEGIN
    -- First, remove any potential duplicate dates to prevent constraint failure
    DELETE FROM public.site_analytics
    WHERE id NOT IN (
        SELECT id
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY date ORDER BY created_at DESC) as rn
            FROM public.site_analytics
        ) as ranked
        WHERE rn = 1
    );

    -- Now add the unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'site_analytics_date_key'
    ) THEN
        ALTER TABLE public.site_analytics ADD CONSTRAINT site_analytics_date_key UNIQUE (date);
    END IF;
END $$;
