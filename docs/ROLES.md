# Metacare Beauty — Role Permission Matrix

Roles live in `public.user_roles` (one user can hold multiple roles).
Default role on signup: `customer`.

> **Delivery agents are no longer users of the system.** Customer Service
> coordinates every delivery manually via WhatsApp with an external courier.
> The courier does not sign in, has no dashboard, and has no permissions.

| Capability | Customer | Staff (CS) | Admin |
|---|:---:|:---:|:---:|
| Browse catalog | ✓ | ✓ | ✓ |
| See prices | ✓ (logged in) | ✓ | ✓ |
| Manage own cart / wishlist | ✓ | ✓ | ✓ |
| Place orders | ✓ | ✓ | ✓ |
| View own orders | ✓ | ✓ | ✓ |
| View own profile / addresses | ✓ | ✓ | ✓ |
| View all orders | — | ✓ | ✓ |
| Update order status (new → review → paid → shipping → delivered) | — | ✓ | ✓ |
| Confirm payment (status → paid) — triggers stock decrement | — | ✓ | ✓ |
| Mark order Out for Delivery (creates QR + optional courier note) | — | ✓ | ✓ |
| Cancel / refund order | — | ✓ | ✓ |
| Confirm delivery via QR (from own order page) | ✓ (own order) | ✓ | ✓ |
| Read audit logs | — | ✓ | ✓ |
| Manage products / brands / categories | — | — | ✓ |
| Adjust inventory | — | — | ✓ |
| Grant / revoke roles | — | — | ✓ |
| Manage geography (states, cities, neighborhoods) | — | — | ✓ |

## Role lifecycle

- **Customer** — granted automatically by the `handle_new_user` trigger on signup.
- **Staff / Admin** — granted by an admin via `adminSetUserRole` (writes to `user_roles` and `audit_logs`).
- Revocation = `DELETE FROM user_roles WHERE user_id = ... AND role = ...` (admin only).

## Delivery workflow (manual, no courier accounts)

1. Customer places an order → status `new`.
2. Staff reviews → `review`.
3. Customer pays via WhatsApp coordination → staff confirms → `paid` (inventory decrements).
4. Staff arranges a courier off-platform via WhatsApp, then hits **Mark Out for Delivery**
   → order status → `shipping`, a `delivery_assignments` row is created with a fresh QR token
   (agent_id remains NULL; an optional free-text courier note is stored on the order).
5. Courier delivers; the customer opens their order page and scans / enters the QR
   token to confirm receipt → status → `delivered`.

## Operational rules wired into the schema

1. **Inventory is decremented only when an order's status moves to `paid`** — never at checkout.
2. **Delivery assignments are created by staff via `markOutForDelivery`** — never automatic, and no longer reference a delivery-agent user.
3. **All status changes, inventory edits, product edits, delivery assignments and admin role grants are written to `audit_logs`** automatically by triggers (or explicitly inside admin server functions).
