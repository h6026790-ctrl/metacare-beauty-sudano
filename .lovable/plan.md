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

## Operational philosophy

The Customer Service Workspace is the company's operational desk. Its purpose is
to help employees process operational work as quickly as possible: review work,
complete work, talk to customers, and move work to the next stage. It is not an
administration, reporting, or configuration interface. Every screen reduces
workload and navigation, and the first question the interface answers is
"What requires my attention right now?"

## Success criteria

A Customer Service employee can:

- Understand today's workload immediately after login.
- Reach every pending task in one click.
- Complete an order end-to-end without leaving the Orders Center.
- Process registration requests without unnecessary navigation.
- Process password reset requests efficiently.
- Contact any customer directly from every operational screen.
- Spend the majority of the workday inside one unified workspace.

## Implementation approach

Reuse the existing backend and existing server functions as-is; the
implementation picks the most appropriate structure. No duplicated business
logic and no parallel implementations — the workspace is a reorganized
presentation layer over capabilities that already exist. The staff guard is
applied once at the workspace level; branding, tokens, typography, RTL and the
existing component library stay unchanged.

## Guarantees

No changes to: database schema, Supabase/server functions, authentication, OTP,
registration, password-reset, RLS, permissions, business rules, inventory or
reservation workflow, order workflow, QR delivery, reports, or the Admin,
Customer and Visitor interfaces.
