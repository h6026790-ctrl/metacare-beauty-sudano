# Metacare Beauty — Role Permission Matrix

Roles live in `public.user_roles` (one user can hold multiple roles).
Default role on signup: `customer`.

| Capability | Customer | Agent | Staff (CS) | Admin |
|---|:---:|:---:|:---:|:---:|
| Browse catalog | ✓ | ✓ | ✓ | ✓ |
| See prices | ✓ (logged in) | ✓ | ✓ | ✓ |
| Manage own cart / wishlist | ✓ | ✓ | ✓ | ✓ |
| Place orders | ✓ | ✓ | ✓ | ✓ |
| View own orders | ✓ | ✓ | ✓ | ✓ |
| View own profile / addresses | ✓ | ✓ | ✓ | ✓ |
| View all orders | — | — | ✓ | ✓ |
| View assigned deliveries | — | ✓ | ✓ | ✓ |
| Update order status (new → review → paid → shipping) | — | — | ✓ | ✓ |
| Confirm payment (status → paid) — triggers stock decrement | — | — | ✓ | ✓ |
| Cancel / refund order | — | — | ✓ | ✓ |
| **Manually assign a delivery agent** | — | — | ✓ | ✓ |
| Mark assigned delivery as delivered (QR scan) | — | ✓ (own) | ✓ | ✓ |
| Read audit logs | — | — | ✓ | ✓ |
| Manage products / brands / categories | — | — | — | ✓ |
| Adjust inventory | — | — | — | ✓ |
| Grant / revoke roles | — | — | — | ✓ |
| Manage geography (states, cities, neighborhoods) | — | — | — | ✓ |

## Role lifecycle

- **Customer** — granted automatically by the `handle_new_user` trigger on signup.
- **Agent / Staff / Admin** — granted by an admin via `adminSetUserRole` (writes to `user_roles` and `audit_logs`).
- Revocation = `DELETE FROM user_roles WHERE user_id = ... AND role = ...` (admin only).

## Operational rules wired into the schema

1. **Inventory is decremented only when an order's status moves to `paid`** — never at checkout. Implemented by the `handle_order_status_change` trigger.
2. **Delivery assignments are created manually by staff** after payment confirmation. There is no automatic insertion into `delivery_assignments` during checkout.
3. **All status changes, inventory edits, product edits, delivery assignments and admin role grants are written to `audit_logs`** automatically by triggers (or explicitly inside admin server functions).
