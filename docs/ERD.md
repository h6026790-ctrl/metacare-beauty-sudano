# Metacare Beauty — Entity Relationship Diagram

```mermaid
erDiagram
  auth_users ||--|| profiles : "1:1"
  auth_users ||--o{ user_roles : "has"
  profiles ||--o{ addresses : "has"
  profiles ||--|| carts : "owns"
  profiles ||--o{ wishlists : "saves"
  profiles ||--o{ orders : "places"

  states ||--o{ cities : "contains"
  cities ||--o{ neighborhoods : "contains"
  states ||--o{ addresses : "located in"
  cities ||--o{ addresses : "located in"
  neighborhoods ||--o{ addresses : "located in"

  brands ||--o{ products : "makes"
  categories ||--o{ products : "groups"
  products ||--|| inventory : "stock"
  products ||--o{ product_images : "gallery"

  carts ||--o{ cart_items : "contains"
  products ||--o{ cart_items : ""
  products ||--o{ wishlists : ""

  orders ||--o{ order_items : "contains"
  orders ||--o{ order_status_history : "timeline"
  orders ||--|| delivery_assignments : "0..1"
  products ||--o{ order_items : ""

  profiles ||--o{ notifications : "receives"
  auth_users ||--o{ audit_logs : "performed by"
```

## Cardinality notes

- Every authenticated user has exactly one `profiles` row (auto-created via trigger) and exactly one `customer` role row in `user_roles`. Additional roles (`staff`, `admin`) can be granted by an admin.
- A `cart` is unique per `profile`. Items are deleted as a set when an order is placed.
- An `order` has zero or one `delivery_assignments` — created only when staff marks the order Out for Delivery. `delivery_assignments.agent_id` is nullable and no longer references a user (couriers are external, not system users).
- `order_status_history` is append-only and written by trigger on every status change.
- `audit_logs` is append-only; readable by staff/admin only.
