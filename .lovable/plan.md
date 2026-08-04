# Phase 3 — Customer Service Workspace Architecture

Reorganize the Customer Service interface (today: a single `/staff` page) into a
task-oriented operational workspace with a sidebar and seven centers. No backend,
schema, RLS, permission, or business-rule changes.

## New navigation (sidebar, Arabic-first, RTL)

```text
خدمة العملاء / Customer Service
  1. لوحة العمل        Dashboard          /staff
  2. الطلبات           Orders Center      /staff/orders
  3. طلبات التسجيل     Registration       /staff/registrations
  4. استعادة كلمة المرور Password Resets   /staff/resets
  5. العملاء           Customers          /staff/customers
  6. التنبيهات         Notifications      /staff/notifications
  7. نشاطي             My Activity        /staff/activity
```

Nothing else appears in the sidebar — no products, inventory, brands, roles,
reports, or system settings. Collapsible to an icon rail (shadcn `Sidebar`,
`collapsible="icon"`), with the existing header trigger; mobile uses the
off-canvas drawer. Pending counts render as badges on Orders, Registration and
Password Resets.

## Mapping: current UI → new centers

| Today (in `src/routes/staff.tsx`) | Moves to |
|---|---|
| Hero header + role chip | Dashboard header (shared shell) |
| Unassigned queue ("Claim") | Dashboard "requires attention" + Orders Center → New |
| Assigned orders list + search | Orders Center (tabbed by status) |
| Order detail aside (customer, items, total) | Orders Center detail panel |
| WhatsApp / phone shortcuts | Orders Center detail + Customer Center |
| Status buttons (review / paid / cancel) | Orders Center quick actions |
| Mark Out for Delivery + courier note | Orders Center quick actions |
| Internal note box + notes list | Orders Center detail (notes tab) |
| `RegistrationRequestsPanel` | Registration Center (full page) + Dashboard summary |
| — (reset requests, currently mixed in the same panel) | Password Reset Center |
| — | Customer Center, Notifications, My Activity (new views over existing data) |

## Centers — content

1. **Dashboard** — attention cards (new orders, unassigned, pending
   registrations, pending resets, awaiting-payment), today's workload counts,
   recent personal activity, one-click shortcuts into each queue.
2. **Orders Center** — status tabs (New / Under Review / Awaiting Customer /
   Paid / Out for Delivery / Delivered / Cancelled / Returned), search, list +
   detail panel with customer info, WhatsApp & phone shortcuts, items,
   reservation status, timeline/status history, internal notes, and the existing
   quick actions (claim, review, confirm paid, mark out for delivery, cancel).
3. **Registration Center** — full-page list of registration requests with
   approve / reject / generate OTP / view OTP / mark OTP sent via WhatsApp,
   all through the existing `auth.functions.ts` calls.
4. **Password Reset Center** — the same surface filtered to reset requests.
5. **Customer Center** — search over `adminListCustomers`, profile, phone,
   WhatsApp, addresses, order history, account status, internal notes.
6. **Notifications Center** — one feed derived client-side from existing
   queries (new orders, registration/reset requests, payments, deliveries,
   informational stock warnings); each row deep-links to its task.
7. **My Activity** — the logged-in employee's own audit trail (orders reviewed,
   payments confirmed, registrations approved, OTPs generated, deliveries
   prepared), filtered to their user id.

## Technical notes

- New files: `src/routes/staff.tsx` becomes a layout route rendering
  `StaffSidebar` + `<Outlet />`; leaves `staff.index.tsx`, `staff.orders.tsx`,
  `staff.registrations.tsx`, `staff.resets.tsx`, `staff.customers.tsx`,
  `staff.notifications.tsx`, `staff.activity.tsx`.
- Presentation components under `src/components/staff/*`
  (`StaffSidebar`, `OrderQueue`, `OrderDetailPanel`, `RequestList`, cards).
- Data comes from the existing server functions only: `listStaffOrders`,
  `listUnassignedOrders`, `claimOrder`, `updateOrderStatus`, `markOutForDelivery`,
  `addOrderNote`, `listOrderNotes`, `adminListCustomers`, `adminListAuditLogs`,
  and the registration/reset functions in `auth.functions.ts`.
- Existing staff guard (`useAuth().isStaff`) moves to the layout route so every
  center is gated once; queries keep their `enabled` guards.
- Each leaf gets its own `head()` metadata; branding, tokens, typography, RTL
  and the shadcn component library are unchanged.

## Guarantees

No changes to: database schema, Supabase/server functions, authentication, OTP,
registration, password-reset, RLS, permissions, business rules, inventory or
reservation workflow, order workflow, QR delivery, reports, or the Admin,
Customer and Visitor interfaces.
