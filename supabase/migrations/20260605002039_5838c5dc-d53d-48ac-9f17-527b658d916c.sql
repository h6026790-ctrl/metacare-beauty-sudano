
-- =========================================================
-- METACARE BEAUTY — Phase 2 Schema
-- =========================================================

-- Enums
CREATE TYPE public.app_role AS ENUM ('admin','staff','agent','customer');
CREATE TYPE public.order_status AS ENUM ('new','review','paid','shipping','delivered','cancelled','returned');

-- ---------- Geography ----------
CREATE TABLE public.states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.states TO anon, authenticated;
GRANT ALL ON public.states TO service_role;

CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;

CREATE TABLE public.neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  delivery_fee_sdg numeric(12,2) NOT NULL DEFAULT 3000,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.neighborhoods TO anon, authenticated;
GRANT ALL ON public.neighborhoods TO service_role;

-- ---------- Catalog ----------
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  tagline_ar text,
  tagline_en text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT ALL ON public.brands TO service_role;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  price_sdg numeric(12,2) NOT NULL,
  compare_at_sdg numeric(12,2),
  image_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;

CREATE TABLE public.inventory (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  stock int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventory TO anon, authenticated;
GRANT ALL ON public.inventory TO service_role;

-- ---------- Identity & roles ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff'))
$$;

-- Addresses
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  state_id uuid NOT NULL REFERENCES public.states(id),
  city_id uuid NOT NULL REFERENCES public.cities(id),
  neighborhood_id uuid REFERENCES public.neighborhoods(id),
  street text NOT NULL,
  notes text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;

-- ---------- Cart & wishlist ----------
CREATE TABLE public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;

CREATE TABLE public.cart_items (
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qty int NOT NULL CHECK (qty > 0),
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cart_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;

CREATE TABLE public.wishlists (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;

-- ---------- Orders ----------
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'new',
  subtotal_sdg numeric(12,2) NOT NULL DEFAULT 0,
  delivery_sdg numeric(12,2) NOT NULL DEFAULT 0,
  total_sdg numeric(12,2) NOT NULL DEFAULT 0,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_whatsapp text NOT NULL,
  address_state text NOT NULL,
  address_city text NOT NULL,
  address_neighborhood text,
  address_street text NOT NULL,
  address_notes text,
  cutoff_bucket date NOT NULL DEFAULT current_date,
  placed_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  name_snapshot text NOT NULL,
  qty int NOT NULL CHECK (qty > 0),
  price_sdg numeric(12,2) NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;

CREATE TABLE public.delivery_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  qr_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.delivery_assignments TO authenticated;
GRANT ALL ON public.delivery_assignments TO service_role;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL,
  template text NOT NULL,
  payload jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- ---------- Audit logs ----------
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- =========================================================
-- TRIGGERS
-- =========================================================

-- updated_at touch
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- New user → profile + customer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.phone, '')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Order number generator: MCyymmdd-#### (seq within day)
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  d text := to_char(now(),'YYMMDD');
  n int;
BEGIN
  IF NEW.number IS NULL THEN
    SELECT COUNT(*)+1 INTO n FROM public.orders WHERE cutoff_bucket = current_date;
    NEW.number := 'MC' || d || '-' || lpad(n::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_set_order_number BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- Log status history + decrement inventory ONLY when entering 'paid'
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, status, actor_id)
    VALUES (NEW.id, NEW.status, auth.uid());
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'order.created', 'order', NEW.id::text,
            jsonb_build_object('status', NEW.status, 'total', NEW.total_sdg));
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, status, actor_id)
    VALUES (NEW.id, NEW.status, auth.uid());

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'order.status_changed', 'order', NEW.id::text,
            jsonb_build_object('from', OLD.status, 'to', NEW.status));

    -- Inventory decrement only on transition INTO 'paid'
    IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
      FOR item IN SELECT product_id, qty FROM public.order_items WHERE order_id = NEW.id LOOP
        UPDATE public.inventory
           SET stock = GREATEST(stock - item.qty, 0), updated_at = now()
         WHERE product_id = item.product_id;
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'inventory.decremented', 'product', item.product_id::text,
                jsonb_build_object('qty', item.qty, 'order_id', NEW.id));
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_order_status_insert AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_change();
CREATE TRIGGER trg_order_status_update AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_change();

-- Audit product edits
CREATE OR REPLACE FUNCTION public.audit_product_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(),
          CASE TG_OP WHEN 'INSERT' THEN 'product.created' WHEN 'UPDATE' THEN 'product.updated' ELSE 'product.deleted' END,
          'product',
          COALESCE(NEW.id, OLD.id)::text,
          jsonb_build_object('slug', COALESCE(NEW.slug, OLD.slug)));
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_audit_product
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.audit_product_change();

-- Audit inventory edits (any manual change)
CREATE OR REPLACE FUNCTION public.audit_inventory_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stock = OLD.stock THEN RETURN NEW; END IF;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'inventory.changed', 'product', NEW.product_id::text,
          jsonb_build_object('from', OLD.stock, 'to', NEW.stock));
  RETURN NEW;
END $$;

CREATE TRIGGER trg_audit_inventory
  AFTER UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.audit_inventory_change();

-- Audit delivery assignments
CREATE OR REPLACE FUNCTION public.audit_delivery_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(),
          CASE TG_OP WHEN 'INSERT' THEN 'delivery.assigned' ELSE 'delivery.updated' END,
          'delivery_assignment', NEW.id::text,
          jsonb_build_object('order_id', NEW.order_id, 'agent_id', NEW.agent_id, 'completed_at', NEW.completed_at));
  RETURN NEW;
END $$;

CREATE TRIGGER trg_audit_delivery
  AFTER INSERT OR UPDATE ON public.delivery_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_delivery_assignment();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public catalog & geography: everyone reads active rows; admin writes
CREATE POLICY p_states_read ON public.states FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_states_admin ON public.states FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY p_cities_read ON public.cities FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_cities_admin ON public.cities FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY p_neigh_read ON public.neighborhoods FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_neigh_admin ON public.neighborhoods FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY p_brands_read ON public.brands FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_brands_admin ON public.brands FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY p_categories_read ON public.categories FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_categories_admin ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY p_products_read ON public.products FOR SELECT USING (is_active OR public.is_staff_or_admin(auth.uid()));
CREATE POLICY p_products_admin ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY p_pimages_read ON public.product_images FOR SELECT USING (true);
CREATE POLICY p_pimages_admin ON public.product_images FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY p_inventory_read ON public.inventory FOR SELECT USING (true);
CREATE POLICY p_inventory_admin ON public.inventory FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE POLICY p_profiles_self_read ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff_or_admin(auth.uid()));
CREATE POLICY p_profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY p_profiles_admin ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- User roles: self read; admin writes
CREATE POLICY p_roles_self_read ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY p_roles_admin ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Addresses
CREATE POLICY p_addr_owner ON public.addresses FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY p_addr_staff_read ON public.addresses FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));

-- Carts & items
CREATE POLICY p_carts_owner ON public.carts FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY p_cart_items_owner ON public.cart_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.profile_id = auth.uid()));

-- Wishlists
CREATE POLICY p_wishlist_owner ON public.wishlists FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Orders
CREATE POLICY p_orders_owner_read ON public.orders FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_staff_or_admin(auth.uid())
         OR EXISTS (SELECT 1 FROM public.delivery_assignments d WHERE d.order_id = orders.id AND d.agent_id = auth.uid()));
CREATE POLICY p_orders_owner_insert ON public.orders FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY p_orders_staff_update ON public.orders FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin(auth.uid())
         OR EXISTS (SELECT 1 FROM public.delivery_assignments d WHERE d.order_id = orders.id AND d.agent_id = auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid())
         OR EXISTS (SELECT 1 FROM public.delivery_assignments d WHERE d.order_id = orders.id AND d.agent_id = auth.uid()));

-- Order items
CREATE POLICY p_order_items_read ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
                  AND (o.profile_id = auth.uid() OR public.is_staff_or_admin(auth.uid())
                       OR EXISTS (SELECT 1 FROM public.delivery_assignments d WHERE d.order_id = o.id AND d.agent_id = auth.uid()))));
CREATE POLICY p_order_items_insert ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = auth.uid()));

-- Order status history
CREATE POLICY p_osh_read ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
                  AND (o.profile_id = auth.uid() OR public.is_staff_or_admin(auth.uid())
                       OR EXISTS (SELECT 1 FROM public.delivery_assignments d WHERE d.order_id = o.id AND d.agent_id = auth.uid()))));

-- Delivery assignments
CREATE POLICY p_da_read ON public.delivery_assignments FOR SELECT TO authenticated
  USING (agent_id = auth.uid() OR public.is_staff_or_admin(auth.uid())
         OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = auth.uid()));
CREATE POLICY p_da_staff_write ON public.delivery_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE POLICY p_da_update ON public.delivery_assignments FOR UPDATE TO authenticated
  USING (agent_id = auth.uid() OR public.is_staff_or_admin(auth.uid()))
  WITH CHECK (agent_id = auth.uid() OR public.is_staff_or_admin(auth.uid()));

-- Notifications
CREATE POLICY p_notif_owner ON public.notifications FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_staff_or_admin(auth.uid()));

-- Audit logs: read for staff/admin only; writes via triggers (service_role)
CREATE POLICY p_audit_read ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));

-- =========================================================
-- SEED — Gezira / Wad Madani + sample neighborhoods
-- =========================================================
INSERT INTO public.states (name_ar, name_en, sort_order) VALUES ('الجزيرة','Gezira',1);

INSERT INTO public.cities (state_id, name_ar, name_en, sort_order)
SELECT id, 'ود مدني','Wad Madani',1 FROM public.states WHERE name_en='Gezira';

INSERT INTO public.neighborhoods (city_id, name_ar, name_en, delivery_fee_sdg, sort_order)
SELECT c.id, n.ar, n.en, 3000, n.s
FROM public.cities c,
LATERAL (VALUES
  ('الحي الأول','First District',1),
  ('الحي الثاني','Second District',2),
  ('حي الثورة','Thawra District',3),
  ('حي الجامعة','University District',4),
  ('حي الموردة','Mawrada District',5),
  ('الشهداء','Shuhada District',6)
) AS n(ar,en,s)
WHERE c.name_en='Wad Madani';

-- Categories
INSERT INTO public.categories (slug, name_ar, name_en, icon, sort_order) VALUES
  ('skincare','العناية بالبشرة','Skincare','sparkles',1),
  ('makeup','المكياج','Makeup','palette',2),
  ('fragrance','العطور','Fragrance','flower',3),
  ('bodycare','العناية بالجسم','Body Care','heart',4);
