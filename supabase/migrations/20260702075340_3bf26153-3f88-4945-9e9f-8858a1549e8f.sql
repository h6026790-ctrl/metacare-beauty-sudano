-- Remove Delivery Agent role
-- 1. Drop agent-referring policies on orders + delivery_assignments + related
DROP POLICY IF EXISTS p_orders_owner_read ON public.orders;
DROP POLICY IF EXISTS p_orders_staff_update ON public.orders;
DROP POLICY IF EXISTS p_order_items_read ON public.order_items;
DROP POLICY IF EXISTS p_osh_read ON public.order_status_history;
DROP POLICY IF EXISTS p_da_read ON public.delivery_assignments;
DROP POLICY IF EXISTS p_da_update ON public.delivery_assignments;

-- 2. Remove any user_roles rows for the agent role
DELETE FROM public.user_roles WHERE role = 'agent';

-- 3. Delivery_assignments: agent_id nullable, drop FK
ALTER TABLE public.delivery_assignments
  DROP CONSTRAINT IF EXISTS delivery_assignments_agent_id_fkey;
ALTER TABLE public.delivery_assignments
  ALTER COLUMN agent_id DROP NOT NULL;

-- 4. Drop has_role CASCADE (drops 18 policies referencing it via enum literal)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

-- 5. Swap the app_role enum to remove the 'agent' value
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin','staff','customer');
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
DROP TYPE public.app_role_old;

-- 6. Recreate has_role against the new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 7. Recreate all policies dropped by the CASCADE, agent-free

-- Geography
CREATE POLICY p_states_read ON public.states FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_states_admin ON public.states FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY p_cities_read ON public.cities FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_cities_admin ON public.cities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY p_neigh_read ON public.neighborhoods FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_neigh_admin ON public.neighborhoods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Catalog
CREATE POLICY p_brands_read ON public.brands FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_brands_admin ON public.brands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY p_categories_read ON public.categories FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_categories_admin ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY p_products_admin ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY p_pimages_admin ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY p_inventory_admin ON public.inventory FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles + roles
CREATE POLICY p_profiles_admin ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY p_roles_self_read ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_roles_admin ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Orders (agent-free)
CREATE POLICY p_orders_owner_read ON public.orders FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'staff') AND assigned_staff_id = auth.uid())
  );
CREATE POLICY p_orders_staff_update ON public.orders FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'staff') AND assigned_staff_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'staff') AND assigned_staff_id = auth.uid())
  );

-- Order items + status history
CREATE POLICY p_order_items_read ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (o.profile_id = auth.uid() OR public.is_staff_or_admin(auth.uid()))
  ));
CREATE POLICY p_osh_read ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (o.profile_id = auth.uid() OR public.is_staff_or_admin(auth.uid()))
  ));

-- Delivery assignments (customers see own for QR; staff/admin manage)
CREATE POLICY p_da_read ON public.delivery_assignments FOR SELECT TO authenticated
  USING (
    public.is_staff_or_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = auth.uid())
  );
CREATE POLICY p_da_update ON public.delivery_assignments FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- 8. Refresh audit function so it tolerates NULL agent_id
CREATE OR REPLACE FUNCTION public.audit_delivery_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(),
          CASE TG_OP WHEN 'INSERT' THEN 'delivery.assigned' ELSE 'delivery.updated' END,
          'delivery_assignment', NEW.id::text,
          jsonb_build_object('order_id', NEW.order_id, 'completed_at', NEW.completed_at));
  RETURN NEW;
END $$;