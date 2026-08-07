DROP POLICY IF EXISTS p_orders_owner_read ON public.orders;
CREATE POLICY p_orders_owner_read ON public.orders
FOR SELECT TO authenticated
USING (
  profile_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    public.has_role(auth.uid(), 'staff'::app_role)
    AND (assigned_staff_id = auth.uid() OR assigned_staff_id IS NULL)
  )
);