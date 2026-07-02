# Remove Delivery Agent Role — Simplification Plan

Simplify the system so delivery is a manual Customer Service task. Couriers are no longer system users. Keep the QR confirmation feature (to be redesigned later).

## 1. Database migration (single file)

- Drop RLS policies referencing `'agent'` on `orders`, `delivery_assignments`, `order_items`, `order_status_history`, `user_roles`.
- Recreate them without agent branches (staff/admin only for ops; customer sees own).
- Delete any existing `user_roles` rows with `role = 'agent'`.
- Recreate `app_role` enum without `'agent'`:
  - Create `app_role_new AS ENUM ('admin','staff','customer')`.
  - Alter `user_roles.role`, `has_role` param, and default in `handle_new_user` to the new type.
  - Drop old enum, rename new one to `app_role`.
- Keep `delivery_assignments` table intact (QR feature preserved) but:
  - Make `agent_id` nullable (no longer FK-required to a user), or keep FK but allow NULL.
  - New RLS: only staff/admin can INSERT/UPDATE/SELECT; customers can SELECT for own order (for QR display).
- Update `is_staff_or_admin` — already only checks staff/admin, no change needed.

## 2. Server functions (`src/lib/api/ops.functions.ts`)

- Delete: `listMyDeliveries`, `confirmDeliveryQr` remains (customer-facing QR still works via `confirm_delivery_by_qr` DB function — no agent needed).
- Refactor `assignDeliveryAgent` → `markOutForDelivery(orderId, courierNote?)`: sets order status to `shipping` and optionally stores a free-text courier note in `delivery_assignments` (no `agent_id`).
- Delete `listAgents` bucketing of agents; keep only staff/admin listing (or remove entirely if unused elsewhere).
- Update role guards: remove all `.includes("agent")` checks.

## 3. Routes & UI

- Delete `src/routes/delivery.tsx`.
- `src/routes/staff.tsx`: remove agent dropdown/assign UI; replace with a single "Mark Out for Delivery" button + optional courier note field.
- `src/routes/admin.tsx`: remove Agents column from team panel.
- `src/hooks/useAuth.ts`: remove `'agent'` from `AppRole`, remove `isAgent`.
- `src/i18n/dict.ts`: remove agent-only strings (keep generic delivery labels used by staff).
- Remove Delivery nav item from Header/Footer if present.

## 4. Types

- Regenerate `src/integrations/supabase/types.ts` after migration (automatic).
- Update `src/lib/types.ts` / `src/lib/store.ts` / `src/lib/mock-data.ts` to drop agent references.

## 5. QR delivery (preserved)

- Customer's order page continues to show the QR (from `delivery_assignments.qr_token`) once staff marks the order Out for Delivery.
- `confirm_delivery_by_qr` RPC unchanged — customer scans/confirms on their own device to move status → `delivered`. (Redesign later.)

## 6. Docs updates

- `docs/ROLES.md` — 3-role matrix (Customer / Staff / Admin).
- `docs/RLS.md` — remove all agent rows/columns.
- `docs/ERD.md` — remove `auth_users ||--o{ delivery_assignments : "agent"` edge.
- `docs/BLUEPRINT.md` — update roles section + delivery workflow narrative.
- `docs/SCHEMA.md` — note `agent_id` deprecated/nullable.

## 7. Order status flow (unchanged values, clarified ownership)

`new → review → paid → shipping (Out for Delivery) → delivered`. All transitions by Customer Service.

## Deliverables after implementation

1. Updated role matrix (3 roles).
2. Updated ERD.
3. Updated RLS summary.
4. List of removed files/components: `src/routes/delivery.tsx`, `listMyDeliveries`, agent buckets in `listAgents`, agent assignment UI in staff panel, agent column in admin team panel, `isAgent` in `useAuth`, `'agent'` enum value.
5. Confirmation grep showing no remaining `agent` role references in `src/` or migrations.

## Preserved (not touched)

Customer accounts, admin panel structure, CS panel structure, inventory, orders schema (aside from RLS), auth/OTP flow, UI design, branding.
