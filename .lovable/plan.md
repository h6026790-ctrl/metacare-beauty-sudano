# Security audit — UI-only protection vs. real server enforcement

Diagnostic only. No code, policies, or data were changed. Findings are ordered by severity.

## Overall result

The great majority of restricted actions are genuinely enforced. Every admin/staff table (products, product images, brands, categories, inventory, purchase invoices, neighborhoods/cities/states, site settings, user roles, order notes, delivery assignments, registration requests, profile change requests) has a database rule requiring the admin or staff role, and every server function that writes re-checks the caller's role on the server. No page in the app writes to the database directly from the browser — all writes go through server functions. So "the button is hidden" is not the only line of defence in those areas.

Three real gaps were found, plus two lower-risk notes.

## 1. Product images storage — asked about specifically

Current policies on the images bucket (exact text):

```text
"Admins manage product images"  ALL  {authenticated}
  USING  (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'))
  CHECK  (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'))

"Signed-in users can read product images"  SELECT  {authenticated}
  USING  (bucket_id = 'product-images')
```

- Upload, replace and delete are correctly restricted to admins at the policy level, not just in the UI. A signed-in customer using the SDK directly cannot write to this bucket.
- The bucket itself is private. Reading is allowed for any signed-in user; visitors see images through a read-only public image endpoint that streams a single file by path and cannot list or write. Worth noting: that endpoint will serve **any** file placed in this bucket to anyone who knows the path, so the bucket should only ever hold public product photos.
- This is the only storage bucket in the project.

## 2. A customer can create an order with any totals and any status (highest severity)

The order-creation rule only checks that the order belongs to the person creating it — nothing about amounts or state:

```text
orders / p_orders_owner_insert  INSERT {authenticated}  CHECK (profile_id = auth.uid())
order_items / p_order_items_insert  INSERT {authenticated}  CHECK (order belongs to auth.uid())
```

Concretely, a customer with a normal session could create an order for themselves with a total of 0, a delivery fee of 0, and even set it straight to the "paid" state, with line items at prices they invented — completely bypassing the proper checkout routine that prices the basket, applies the correct delivery fee, and reserves stock. The order would then appear in the staff queue as a legitimate paid order.

Note that after creation they cannot edit it (updates are admin/assigned-staff only), and no delete is possible.

## 3. A customer can change their own locked name and phone directly

```text
profiles / p_profiles_self_update  UPDATE {authenticated}  USING (id = auth.uid())  CHECK (id = auth.uid())
```

The application deliberately locks name and phone after registration (the profile save function rejects any change, and there is a staff-approved change-request flow with a confirmation code). That lock exists only in the server function; the database still lets the person write to their own row. A customer could rename themselves and change the stored phone/WhatsApp at will, skipping staff approval entirely. Their sign-in number would not change, so the stored phone and the login identity would fall out of sync — which also affects order contact details and the staff-facing customer list.

## 4. A customer can pre-seed their own change request with fields staff should own

```text
profile_change_requests / "Customers create own change requests"  INSERT {authenticated}
  CHECK (profile_id = auth.uid() AND status = 'pending')
```

Only the owner and the "pending" state are checked; every other column is free. A customer could insert a request with an expiry date and other internal fields of their choosing. They cannot approve it (status changes are staff-only) and the confirmation code is written by staff on approval, so this is not directly exploitable today — but it leaves the request record partly under the customer's control.

Related non-security bug found while reading this area: the "cancel my request" path writes to this table as the customer, who has no update permission, so cancelling silently does nothing.

## 5. Lower-risk notes

- Any staff member can create or update a delivery assignment for **any** order, not only orders assigned to them (`p_da_staff_write` / `p_da_update` check the staff role only). Order edits themselves are correctly limited to the assigned staff member or an admin, so this is an inconsistency rather than an escalation.
- One internal trigger helper (`log_inventory_movement`) is still executable by signed-out and signed-in callers. Called outside its trigger it fails immediately, so the practical risk is negligible, but it should not be reachable.
- Two internal tables (`auth_rate_limits`, `order_number_counters`) have protection on with no rules at all, i.e. fully closed to customers and staff. Correct as-is.

## Suggested priority if you decide to act later

1. Order creation (item 2) — the only finding with direct financial impact.
2. Direct profile self-edit (item 3) — defeats the approval workflow you just built.
3. Change-request field control and the silent cancel bug (item 4).
4. Delivery-assignment scoping and the trigger helper permission (item 5).
