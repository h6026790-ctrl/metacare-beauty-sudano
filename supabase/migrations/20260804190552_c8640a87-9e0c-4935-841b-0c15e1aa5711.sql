-- Public catalogue + geography: readable by visitors and signed-in users
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT SELECT ON public.inventory TO anon, authenticated;
GRANT SELECT ON public.states TO anon, authenticated;
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT SELECT ON public.neighborhoods TO anon, authenticated;

-- Catalogue management by admins happens through the same tables (RLS gates it)
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.states TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.neighborhoods TO authenticated;

-- Customer-owned data
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

-- Staff / operational tables (RLS restricts to staff & admin)
GRANT SELECT, INSERT, UPDATE ON public.delivery_assignments TO authenticated;
GRANT SELECT, INSERT ON public.order_notes TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT, UPDATE ON public.registration_requests TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Server-side / internal processes
GRANT ALL ON public.products, public.brands, public.categories, public.product_images,
  public.inventory, public.states, public.cities, public.neighborhoods,
  public.carts, public.cart_items, public.wishlists, public.addresses,
  public.orders, public.order_items, public.order_status_history,
  public.notifications, public.profiles, public.delivery_assignments,
  public.order_notes, public.audit_logs, public.registration_requests,
  public.user_roles TO service_role;