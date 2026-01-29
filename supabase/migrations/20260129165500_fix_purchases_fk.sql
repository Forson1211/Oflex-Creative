-- Ensure purchases constraint has ON DELETE CASCADE
DO $$
BEGIN
    -- Drop the constraint if it exists to ensure we can recreate it with CASCADE
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'purchases_order_id_fkey'
        AND table_name = 'purchases'
    ) THEN
        ALTER TABLE public.purchases DROP CONSTRAINT purchases_order_id_fkey;
    END IF;
END $$;

ALTER TABLE public.purchases
ADD CONSTRAINT purchases_order_id_fkey
FOREIGN KEY (order_id)
REFERENCES public.orders(id)
ON DELETE CASCADE;
