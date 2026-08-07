-- 1. Category images / description
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text;

-- 2. Inventory movements (append-only traceability log)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  source text NOT NULL DEFAULT 'adjustment',
  reference_type text,
  reference_id text,
  note text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_mov_staff_read" ON public.inventory_movements
  FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_inv_mov_product ON public.inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_mov_ref ON public.inventory_movements(reference_type, reference_id);

-- 3. Purchase invoices
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT current_date,
  supplier_name text NOT NULL,
  notes text,
  total_sdg numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_invoices TO authenticated;
GRANT ALL ON public.purchase_invoices TO service_role;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_admin_all" ON public.purchase_invoices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_purchase_invoices_updated BEFORE UPDATE ON public.purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  qty integer NOT NULL CHECK (qty > 0),
  purchase_price_sdg numeric NOT NULL DEFAULT 0,
  selling_price_sdg numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_invoice_items TO authenticated;
GRANT ALL ON public.purchase_invoice_items TO service_role;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pii_admin_all" ON public.purchase_invoice_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_pii_invoice ON public.purchase_invoice_items(invoice_id);

-- 4. Automatic movement logging on every inventory change.
-- The source is taken from a transaction-local setting when the caller
-- declares one; otherwise the change is recorded as a manual adjustment.
CREATE OR REPLACE FUNCTION public.log_inventory_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_delta integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_delta := COALESCE(NEW.stock, 0);
  ELSE
    v_delta := COALESCE(NEW.stock, 0) - COALESCE(OLD.stock, 0);
  END IF;
  IF v_delta = 0 THEN RETURN NEW; END IF;

  INSERT INTO public.inventory_movements
    (product_id, delta, balance_after, source, reference_type, reference_id, actor_id)
  VALUES (
    NEW.product_id, v_delta, COALESCE(NEW.stock, 0),
    COALESCE(NULLIF(current_setting('app.mv_source', true), ''), 'adjustment'),
    NULLIF(current_setting('app.mv_ref_type', true), ''),
    NULLIF(current_setting('app.mv_ref_id', true), ''),
    auth.uid()
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_inventory_movement ON public.inventory;
CREATE TRIGGER trg_log_inventory_movement
AFTER INSERT OR UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.log_inventory_movement();

-- 5. Declare movement sources inside the existing order flows (additive only)
CREATE OR REPLACE FUNCTION public.place_order(_contact_name text, _contact_phone text, _contact_whatsapp text, _address_state text, _address_city text, _address_neighborhood text, _address_street text, _address_notes text, _neighborhood_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_cart uuid;
  v_fee numeric := 3000;
  v_sub numeric := 0;
  v_stock integer;
  v_order public.orders%ROWTYPE;
  item record;
  v_count integer := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = 'customer') THEN
    RAISE EXCEPTION 'not_customer';
  END IF;

  SELECT id INTO v_cart FROM public.carts WHERE profile_id = v_uid;
  IF v_cart IS NULL THEN RAISE EXCEPTION 'cart_empty'; END IF;

  FOR item IN
    SELECT ci.product_id, ci.qty, p.name_en, p.name_ar, p.price_sdg, p.is_active
      FROM public.cart_items ci
      JOIN public.products p ON p.id = ci.product_id
     WHERE ci.cart_id = v_cart
     ORDER BY ci.product_id
  LOOP
    v_count := v_count + 1;
    IF NOT item.is_active THEN RAISE EXCEPTION 'product_unavailable:%', item.name_en; END IF;
    SELECT stock INTO v_stock FROM public.inventory WHERE product_id = item.product_id FOR UPDATE;
    IF v_stock IS NULL OR v_stock < item.qty THEN
      RAISE EXCEPTION 'insufficient_stock:%', item.name_en;
    END IF;
    v_sub := v_sub + (item.price_sdg * item.qty);
  END LOOP;

  IF v_count = 0 THEN RAISE EXCEPTION 'cart_empty'; END IF;

  IF _neighborhood_id IS NOT NULL THEN
    SELECT delivery_fee_sdg INTO v_fee FROM public.neighborhoods
     WHERE id = _neighborhood_id AND is_active;
    IF v_fee IS NULL THEN v_fee := 3000; END IF;
  END IF;

  INSERT INTO public.orders (
    profile_id, subtotal_sdg, delivery_sdg, total_sdg,
    contact_name, contact_phone, contact_whatsapp,
    address_state, address_city, address_neighborhood, address_street, address_notes,
    expires_at
  ) VALUES (
    v_uid, v_sub, v_fee, v_sub + v_fee,
    _contact_name, _contact_phone, _contact_whatsapp,
    _address_state, _address_city, _address_neighborhood, _address_street, _address_notes,
    now() + interval '6 hours'
  ) RETURNING * INTO v_order;

  INSERT INTO public.order_items (order_id, product_id, name_snapshot, qty, price_sdg)
  SELECT v_order.id, ci.product_id, p.name_en, ci.qty, p.price_sdg
    FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id
   WHERE ci.cart_id = v_cart;

  PERFORM set_config('app.mv_source', 'order_reservation', true);
  PERFORM set_config('app.mv_ref_type', 'order', true);
  PERFORM set_config('app.mv_ref_id', v_order.id::text, true);

  FOR item IN SELECT product_id, qty FROM public.cart_items WHERE cart_id = v_cart LOOP
    UPDATE public.inventory SET stock = stock - item.qty, updated_at = now()
     WHERE product_id = item.product_id;
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_uid, 'inventory.reserved', 'product', item.product_id::text,
            jsonb_build_object('qty', item.qty, 'order_id', v_order.id));
  END LOOP;

  PERFORM set_config('app.mv_source', '', true);
  PERFORM set_config('app.mv_ref_type', '', true);
  PERFORM set_config('app.mv_ref_id', '', true);

  DELETE FROM public.cart_items WHERE cart_id = v_cart;

  RETURN to_jsonb(v_order);
END $function$;

CREATE OR REPLACE FUNCTION public.handle_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE item record;
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

    IF NEW.status IN ('cancelled','returned') AND NEW.stock_restored_at IS NULL THEN
      PERFORM set_config('app.mv_source', 'order_restore', true);
      PERFORM set_config('app.mv_ref_type', 'order', true);
      PERFORM set_config('app.mv_ref_id', NEW.id::text, true);
      FOR item IN SELECT product_id, qty FROM public.order_items WHERE order_id = NEW.id LOOP
        UPDATE public.inventory SET stock = stock + item.qty, updated_at = now()
         WHERE product_id = item.product_id;
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'inventory.restored', 'product', item.product_id::text,
                jsonb_build_object('qty', item.qty, 'order_id', NEW.id, 'reason', NEW.status));
      END LOOP;
      PERFORM set_config('app.mv_source', '', true);
      PERFORM set_config('app.mv_ref_type', '', true);
      PERFORM set_config('app.mv_ref_id', '', true);
      UPDATE public.orders SET stock_restored_at = now()
       WHERE id = NEW.id AND stock_restored_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- 6. Purchase invoice approval: the only place stock rises from an invoice
CREATE OR REPLACE FUNCTION public.approve_purchase_invoice(_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inv public.purchase_invoices%ROWTYPE;
  item record;
  v_total numeric := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_inv FROM public.purchase_invoices WHERE id = _invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invoice_not_found'; END IF;
  IF v_inv.status = 'approved' THEN RAISE EXCEPTION 'invoice_already_approved'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.purchase_invoice_items WHERE invoice_id = _invoice_id) THEN
    RAISE EXCEPTION 'invoice_empty';
  END IF;

  PERFORM set_config('app.mv_source', 'purchase_invoice', true);
  PERFORM set_config('app.mv_ref_type', 'purchase_invoice', true);
  PERFORM set_config('app.mv_ref_id', _invoice_id::text, true);

  FOR item IN
    SELECT product_id, qty, purchase_price_sdg, selling_price_sdg
      FROM public.purchase_invoice_items WHERE invoice_id = _invoice_id ORDER BY product_id
  LOOP
    v_total := v_total + (item.qty * COALESCE(item.purchase_price_sdg, 0));

    INSERT INTO public.inventory (product_id, stock, updated_at)
    VALUES (item.product_id, item.qty, now())
    ON CONFLICT (product_id) DO UPDATE
      SET stock = public.inventory.stock + EXCLUDED.stock, updated_at = now();

    IF item.selling_price_sdg IS NOT NULL THEN
      UPDATE public.products SET price_sdg = item.selling_price_sdg
       WHERE id = item.product_id AND price_sdg IS DISTINCT FROM item.selling_price_sdg;
    END IF;
  END LOOP;

  PERFORM set_config('app.mv_source', '', true);
  PERFORM set_config('app.mv_ref_type', '', true);
  PERFORM set_config('app.mv_ref_id', '', true);

  UPDATE public.purchase_invoices
     SET status = 'approved', approved_at = now(), approved_by = auth.uid(), total_sdg = v_total
   WHERE id = _invoice_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'purchase_invoice.approved', 'purchase_invoice', _invoice_id::text,
          jsonb_build_object('number', v_inv.invoice_number, 'total', v_total));

  RETURN jsonb_build_object('ok', true, 'total', v_total);
END $$;

REVOKE EXECUTE ON FUNCTION public.approve_purchase_invoice(uuid) FROM anon;