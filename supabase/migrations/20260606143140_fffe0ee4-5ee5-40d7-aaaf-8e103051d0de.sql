
-- 1. orders.assigned_staff_id
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_staff_id uuid;

-- 2. order_notes
CREATE TABLE IF NOT EXISTS public.order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  author_id uuid,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_notes TO authenticated;
GRANT ALL ON public.order_notes TO service_role;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_order_notes_read ON public.order_notes;
CREATE POLICY p_order_notes_read ON public.order_notes FOR SELECT TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS p_order_notes_insert ON public.order_notes;
CREATE POLICY p_order_notes_insert ON public.order_notes FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()) AND author_id = auth.uid());

-- 3. delivery_assignments.qr_expires_at (24h default)
ALTER TABLE public.delivery_assignments
  ADD COLUMN IF NOT EXISTS qr_expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours');

-- 4. Update RLS on orders for per-staff assignment
DROP POLICY IF EXISTS p_orders_owner_read ON public.orders;
CREATE POLICY p_orders_owner_read ON public.orders FOR SELECT TO authenticated
USING (
  profile_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'staff') AND assigned_staff_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.delivery_assignments d WHERE d.order_id = orders.id AND d.agent_id = auth.uid())
);

DROP POLICY IF EXISTS p_orders_staff_update ON public.orders;
CREATE POLICY p_orders_staff_update ON public.orders FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'staff') AND assigned_staff_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.delivery_assignments d WHERE d.order_id = orders.id AND d.agent_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'staff') AND assigned_staff_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.delivery_assignments d WHERE d.order_id = orders.id AND d.agent_id = auth.uid())
);

-- 5. Inventory restore on returned / cancelled-after-paid
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

    -- Decrement on transition INTO paid
    IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
      FOR item IN SELECT product_id, qty FROM public.order_items WHERE order_id = NEW.id LOOP
        UPDATE public.inventory SET stock = GREATEST(stock - item.qty, 0), updated_at = now()
         WHERE product_id = item.product_id;
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'inventory.decremented', 'product', item.product_id::text,
                jsonb_build_object('qty', item.qty, 'order_id', NEW.id));
      END LOOP;
    END IF;

    -- Restore on returned (only if was previously paid/shipping/delivered)
    IF NEW.status = 'returned' AND OLD.status IN ('paid','shipping','delivered') THEN
      FOR item IN SELECT product_id, qty FROM public.order_items WHERE order_id = NEW.id LOOP
        UPDATE public.inventory SET stock = stock + item.qty, updated_at = now()
         WHERE product_id = item.product_id;
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'inventory.restored', 'product', item.product_id::text,
                jsonb_build_object('qty', item.qty, 'order_id', NEW.id, 'reason', 'returned'));
      END LOOP;
    END IF;

    -- Restore on cancelled-after-paid only
    IF NEW.status = 'cancelled' AND OLD.status IN ('paid','shipping') THEN
      FOR item IN SELECT product_id, qty FROM public.order_items WHERE order_id = NEW.id LOOP
        UPDATE public.inventory SET stock = stock + item.qty, updated_at = now()
         WHERE product_id = item.product_id;
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'inventory.restored', 'product', item.product_id::text,
                jsonb_build_object('qty', item.qty, 'order_id', NEW.id, 'reason', 'cancelled_after_paid'));
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- 6. QR confirm function: customer scans agent's QR -> mark delivered
CREATE OR REPLACE FUNCTION public.confirm_delivery_by_qr(_order_id uuid, _token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_assignment public.delivery_assignments%ROWTYPE;
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.profile_id <> auth.uid() THEN RAISE EXCEPTION 'not_your_order'; END IF;

  SELECT * INTO v_assignment FROM public.delivery_assignments WHERE order_id = _order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'no_assignment'; END IF;
  IF v_assignment.qr_token <> _token THEN RAISE EXCEPTION 'invalid_token'; END IF;
  IF v_assignment.completed_at IS NOT NULL THEN RAISE EXCEPTION 'already_completed'; END IF;
  IF now() > v_assignment.qr_expires_at THEN RAISE EXCEPTION 'token_expired'; END IF;

  UPDATE public.delivery_assignments SET completed_at = now() WHERE id = v_assignment.id;
  UPDATE public.orders SET status = 'delivered' WHERE id = _order_id;

  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.confirm_delivery_by_qr(uuid, text) TO authenticated;
