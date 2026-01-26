
-- Seed data for site analytics for the last 7 days
INSERT INTO public.site_analytics (date, page_views, unique_visitors, orders_count, revenue, new_users)
VALUES 
  (CURRENT_DATE - INTERVAL '6 days', 150, 45, 2, 199.98, 5),
  (CURRENT_DATE - INTERVAL '5 days', 230, 68, 4, 450.50, 8),
  (CURRENT_DATE - INTERVAL '4 days', 180, 52, 3, 299.97, 3),
  (CURRENT_DATE - INTERVAL '3 days', 310, 89, 7, 850.00, 12),
  (CURRENT_DATE - INTERVAL '2 days', 280, 75, 5, 540.20, 6),
  (CURRENT_DATE - INTERVAL '1 day', 420, 110, 8, 980.00, 15),
  (CURRENT_DATE, 120, 35, 1, 99.99, 4)
ON CONFLICT (date) DO UPDATE SET
  page_views = EXCLUDED.page_views,
  unique_visitors = EXCLUDED.unique_visitors,
  orders_count = EXCLUDED.orders_count,
  revenue = EXCLUDED.revenue,
  new_users = EXCLUDED.new_users;
