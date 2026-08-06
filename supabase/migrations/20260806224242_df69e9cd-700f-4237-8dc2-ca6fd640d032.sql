ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS stock_restored_at timestamptz;

-- Payment no longer decrements stock (reserved at creation). Restore exactly once.
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
      FOR item IN SELECT product_id, qty FROM public.order_items WHERE order_id = NEW.id LOOP
        UPDATE public.inventory SET stock = stock + item.qty, updated_at = now()
         WHERE product_id = item.product_id;
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'inventory.restored', 'product', item.product_id::text,
                jsonb_build_object('qty', item.qty, 'order_id', NEW.id, 'reason', NEW.status));
      END LOOP;
      UPDATE public.orders SET stock_restored_at = now()
       WHERE id = NEW.id AND stock_restored_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- Atomic checkout: reserve stock + create order in one transaction.
CREATE OR REPLACE FUNCTION public.place_order(
  _contact_name text,
  _contact_phone text,
  _contact_whatsapp text,
  _address_state text,
  _address_city text,
  _address_neighborhood text,
  _address_street text,
  _address_notes text,
  _neighborhood_id uuid
) RETURNS jsonb
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

  -- Lock every affected inventory row in a deterministic order, verify, and total up.
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

  -- Reserve now: decrement immediately at order creation.
  FOR item IN SELECT product_id, qty FROM public.cart_items WHERE cart_id = v_cart LOOP
    UPDATE public.inventory SET stock = stock - item.qty, updated_at = now()
     WHERE product_id = item.product_id;
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_uid, 'inventory.reserved', 'product', item.product_id::text,
            jsonb_build_object('qty', item.qty, 'order_id', v_order.id));
  END LOOP;

  DELETE FROM public.cart_items WHERE cart_id = v_cart;

  RETURN to_jsonb(v_order);
END $function$;

REVOKE ALL ON FUNCTION public.place_order(text,text,text,text,text,text,text,text,uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,text,text,text,text,text,uuid) TO authenticated, service_role;

-- Auto-cancel unpaid orders past their 6-hour window (trigger restores stock).
CREATE OR REPLACE FUNCTION public.expire_stale_orders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE n integer;
BEGIN
  WITH upd AS (
    UPDATE public.orders SET status = 'cancelled'
     WHERE status IN ('new','review')
       AND expires_at IS NOT NULL
       AND expires_at < now()
    RETURNING 1
  ) SELECT count(*) INTO n FROM upd;
  RETURN n;
END $function$;

REVOKE ALL ON FUNCTION public.expire_stale_orders() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_orders() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('expire-stale-orders');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule('expire-stale-orders', '*/5 * * * *', $$SELECT public.expire_stale_orders();$$);

CREATE INDEX IF NOT EXISTS idx_orders_expiry ON public.orders (status, expires_at);