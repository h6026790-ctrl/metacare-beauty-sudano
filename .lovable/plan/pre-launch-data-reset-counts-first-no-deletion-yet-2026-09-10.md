# Pre-launch data reset — counts first, no deletion yet

Nothing has been deleted. Below are the exact current row counts. Confirm them and I will run the reset.

## Rows that would be deleted

| Area | Rows now |
|---|---|
| cart_items | 0 |
| wishlists | 2 |
| order_notes | 15 |
| order_status_history | 29 |
| delivery_assignments | 6 |
| order_items | 12 |
| orders | 7 |
| registration_requests | 1 |
| profile_change_requests | 2 |
| order_number_counters | 4 (reset to empty) |
| auth_rate_limits | 2 (reset to empty) |
| audit_logs (last) | 197 |

## Customer accounts that would be removed (4)

| Name | Phone | Orders |
|---|---|---|
| منولر محمدعلي | +249111804001 | 0 |
| ملاذ منور | +249910737439 | 0 |
| مهند عميل | +249916217777 | 7 |
| محمد مصطفى | +249909072506 | 0 |

Each removal also clears that customer's linked rows: 4 carts, 1 address, their `user_roles` rows, their `profiles` row, and their sign-in account.

## Accounts kept (untouched)

- System Administrator (+249912345678) — admin
- موظف خدمة عملاء (+249123456789) — staff

The admin's own cart row is left alone.

## Kept and not touched

products, inventory, inventory movement records, purchase invoices, product-images files, states/cities/neighborhoods and delivery fees, brands, categories, site_settings.

## How the reset will run

1. Temporarily disable the three audit triggers (`audit_product_change`, `audit_inventory_change`, `audit_delivery_assignment`) plus the order-status history trigger, so nothing new is written while deleting.
2. In one single transaction, delete in the order you listed: cart_items and wishlists → order notes/history/delivery assignments/order items/orders → registration_requests → profile_change_requests → customer addresses, carts, user_roles, profiles → empty order_number_counters and auth_rate_limits → finally audit_logs.
3. Re-enable the triggers inside the same transaction. If any step fails, the whole thing rolls back and nothing changes.
4. Delete the four customer sign-in accounts through the secure admin API (auth accounts live outside the transaction, so they are removed as the final step after the transaction commits).
5. Verify afterwards: admin and staff can still sign in, all kept reference data is unchanged, audit_logs is empty with zero new rows.

Reply to confirm and I will execute it.
