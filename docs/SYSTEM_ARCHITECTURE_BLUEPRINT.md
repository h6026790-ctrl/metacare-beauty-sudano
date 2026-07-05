# Metacare Beauty — System Architecture & User Experience Blueprint

> **Status:** Official architectural reference (Phase 0).
> **Scope:** Documentation only. No code, database, routes, or UI are changed by this document.
> **Authority:** Every future phase (Visitor, Customer, Customer Service, Administrator) MUST comply with this blueprint. When any future work conflicts with this document, this document wins until it is explicitly amended.

---

## 1. Overall System Vision

Metacare Beauty is **not** a cosmetics website. It is a **complete business operating platform** for a cosmetics company serving Sudan (currently Wad Madani, architected to scale to all states).

The platform supports the full lifecycle of the business:

- The **customer journey** — from first visit, through registration, browsing, ordering, payment, delivery, and post-sale support.
- The **operational journey** — how Customer Service processes work each day.
- The **management journey** — how the Administrator supervises the whole company.

The platform is organized around **business operations**, not database tables or technical modules. Users interact with tasks, workflows, and outcomes — never with schemas.

The experience is **Arabic-first, RTL by default**, mobile-first where it matters (Visitor, Customer, Customer Service), and desktop-first where it matters (Administrator).

---

## 2. User Architecture

The platform recognizes **exactly four user types**. No other user type exists. Every screen, route, and permission in the system MUST be attributable to one of these four.

| # | User Type         | Authenticated? | Primary Device        | Primary Purpose                              |
|---|-------------------|----------------|-----------------------|----------------------------------------------|
| 1 | Visitor           | No             | Mobile                | Explore and decide to register                |
| 2 | Customer          | Yes            | Mobile                | Shop and manage personal account              |
| 3 | Customer Service  | Yes (staff)    | Mobile / tablet       | Process daily operational work                |
| 4 | Administrator     | Yes (admin)    | Desktop               | Supervise the company                         |

Delivery couriers are **not** users of the system. They are coordinated off-platform by Customer Service (see `docs/ROLES.md`).

Each user type has its own **interface**, its own **navigation**, its own **vocabulary**, and its own **mental model**. Interfaces are strictly separated: no interface exposes features that belong to another user type.

---

## 3. Responsibilities of Each User Type

### 3.1 Visitor

**Definition.** A Visitor is any person who has not yet created an account, or who has created an account but has not signed in.

**Purpose.** Explore the store, understand the brand, and decide whether to register.

**The Visitor must be able to:**

- Browse the home page, product catalog, categories, brands, and offers.
- Open any product detail page and see the product photography, description, and specifications.
- Search the catalog.
- Read pages that establish trust (brand story, contact information, delivery area).
- Start the registration flow.

**The Visitor must never be able to:**

- See prices, totals, or discounts (prices are login-gated by design).
- Add items to a persistent cart, place an order, or reach checkout.
- Access `/account`, `/admin`, `/staff`, or any operational surface.
- See any staff-facing terminology (order queue, audit log, inventory, etc.).

**Primary question the interface answers:** *"Why should I buy from Metacare?"*

### 3.2 Customer

**Definition.** A registered user whose account has been **activated** by Customer Service (see `docs/ROLES.md` and the auth flow in `src/routes/auth.tsx`).

**Purpose.** Shop, order, track deliveries, and manage a personal account.

**The Customer must be able to:**

- Do everything the Visitor can do.
- See prices and totals.
- Add items to cart and wishlist.
- Place orders (Wad Madani delivery area in Phase 1).
- Track their orders, view order history, and confirm delivery via QR on their own order page.
- Manage profile, addresses, WhatsApp number, and password.

**The Customer must never see:**

- Other customers' data.
- Inventory numbers, stock levels, cost prices, or margins.
- The order queue, audit logs, reports, or any admin/staff control.
- Terminology like "assigned to", "OOD", "cutoff bucket", etc.

**Primary question the interface answers:** *"What do I want to buy, and what is happening with my order?"*

### 3.3 Customer Service (Staff)

**Definition.** An internal operational user with the `staff` role (or `admin`, which is a superset).

**Purpose.** Process the day's work: review new orders, confirm payments, coordinate couriers, respond to customers, activate new customer accounts.

**The Customer Service interface is a workspace, not a database.** It is organized around **tasks that require attention right now**, not around tables to be edited.

**Customer Service must be able to:**

- See a prioritized queue of orders that need action, grouped by lifecycle state (`new → review → paid → shipping → delivered`, plus `cancelled` / `returned`).
- Open any order, contact the customer via WhatsApp deep-link, confirm payment, mark Out for Delivery (which mints the QR), and record notes.
- Approve or reject pending customer registration requests.
- See their own recent activity.

**Customer Service must never be able to:**

- Create, edit, or archive products, brands, or categories.
- Adjust inventory manually.
- Grant or revoke roles.
- Access company-wide financial reports.
- Change system configuration.

**Primary question the interface answers:** *"What requires my attention right now?"*

### 3.4 Administrator

**Definition.** A user with the `admin` role. Admin is a superset of staff — an admin can do everything Customer Service can do, plus company management.

**Purpose.** Supervise, configure, and monitor the entire company. The Administrator interface is the **Company's Operating System**.

**The Administrator interface is organized into operational centers**, not into a flat list of CRUD screens. Each operational center corresponds to a real business function.

**Operational centers under the Administrator interface:**

1. **Activity** — the real-time operational timeline of the company. Aggregates important events from every operational area, including new orders, order status changes, registration requests, registration approvals, password reset requests, inventory reservations, inventory adjustments, low stock alerts, warehouse transfers, product updates, product archives, role changes, user activations, user deactivations, system warnings, and backup completions. This is the company's operational pulse.
2. **Overview** — company-wide KPIs (revenue, orders, customers, low stock).
3. **Orders** — full order history and lifecycle oversight.
4. **Inventory** — stock levels, low-stock alerts, manual adjustments, and reservation tracking. Architected to support future expansion to multiple warehouses, warehouse creation and management, warehouse transfers, warehouse-level inventory, reservation tracking, inventory audit history, and stock movement history without architectural redesign.
5. **Catalog** — products, brands, categories (create, edit, archive/restore; products are soft-deleted, never destroyed).
6. **Customers** — customer directory and registration requests.
7. **Team** — Customer Service and Administrator accounts, role grants.
8. **Reports** — sales, operational, and audit reporting. Evolving into a Business Intelligence Center with future capabilities for executive dashboards, KPI monitoring, sales analytics, customer analytics, inventory analytics, operational performance, trend analysis, export center, scheduled reports, and business insights.
9. **System** — the operational configuration center of the company. Includes company information, business identity, phone numbers, WhatsApp numbers, address, business hours, delivery areas, system settings, operational settings, maintenance mode, backup and restore, system health, system diagnostics, notifications configuration, audit configuration, and future integrations.

**Customer Service is responsible for daily operational processing.** Administrators have full operational permissions and can perform every operational task when necessary. However, their primary responsibility is supervising, configuring, and monitoring the company. The Administrator's interface is optimized for **visibility, control, and configuration**.

**Primary question the interface answers:** *"What is happening across the company today?"*

---

## 4. Relationship Between Interfaces

The four interfaces are **parts of the same platform**, but they are **completely independent** from a user-experience standpoint.

Rules governing the relationship:

- **Consistent design language.** All four interfaces share the same brand, typography, color system, iconography, spacing scale, and component library.
- **Consistent terminology.** An "order" is called an "order" everywhere. A "customer" is called a "customer" everywhere. Terminology never shifts between interfaces.
- **Strict feature separation.** No interface exposes controls that belong to another interface. The Customer never sees "assign to staff". Customer Service never sees "grant admin role". The Administrator never sees "add to my cart".
- **Role-based routing.** After sign-in, the user is routed to their home interface based on role — Administrator → `/admin`, Customer Service → `/staff`, Customer → `/account`. Visitors have no post-sign-in home.
- **Shared identity.** All four interfaces authenticate against the same identity store (`auth.users` + `user_roles`). A single person can hold multiple roles; role precedence for routing is `admin > staff > customer`.
- **Shared business rules.** Order lifecycle, inventory decrement on `paid`, QR delivery confirmation, soft-delete of products, and audit logging are enforced at the database layer and behave identically no matter which interface triggers them.

---

## 5. Design Philosophy

The system asks a **different question** for each user, and every interface is designed to answer its own question as fast as possible.

| User             | Question the interface must answer                          |
|------------------|-------------------------------------------------------------|
| Visitor          | *"Why should I buy from Metacare?"*                         |
| Customer         | *"What do I want to buy, and what is happening with my order?"* |
| Customer Service | *"What requires my attention right now?"*                   |
| Administrator    | *"What is happening across the company today?"*             |

Design consequences that follow from these questions:

- **Visitor** — hero, social proof, curated product rows, low friction to browse, single obvious CTA to register.
- **Customer** — short paths from home → product → cart → checkout → order tracking; no operational language anywhere.
- **Customer Service** — a task queue by default, master–detail layout, one-tap actions (WhatsApp, confirm payment, OOD).
- **Administrator** — dashboard-first, operational centers grouped in a persistent sidebar, dense information layout tuned for desktop.

Cross-cutting design rules:

- **Arabic-first, RTL by default.** English is a secondary toggle.
- **Prices are login-gated** at the component level (`<PricePill />`), consistently across the whole platform.
- **No generic AI aesthetics** — no purple/indigo-on-white template look. The design commits to the Metacare medical-blue → cyan → soft-white palette with Tajawal / Instrument Serif / Inter typography.
- **Semantic design tokens only** — colors, gradients, and shadows are tokens in `src/styles.css`; components never hardcode hex or `text-white` / `bg-black` utilities.

---

## 6. Navigation Philosophy

Navigation is **minimal, predictable, and role-appropriate**.

- **Visitor & Customer** — a single top header with the primary catalog nav (Home, Shop, Categories, Brands, Offers), a search field, and account/cart/wishlist icons. Mobile uses a slide-in sheet.
- **Customer Service** — a task-centric layout: a queue on one side, a detail pane on the other. Global chrome is kept out of the way. Navigation between operational views is flat, not deep.
- **Administrator** — a **persistent left sidebar** listing operational centers of the Company's Operating System (Activity, Overview, Orders, Inventory, Catalog, Customers, Team, Reports, System). The sidebar is the map of the business. Each center is one click away; no more than one level of sub-navigation inside a center.
- **No hidden features.** Every capability a user is allowed to use is reachable from that user's primary navigation. No feature lives only behind a URL.
- **No cross-role navigation.** The Customer interface never links to `/admin`. The Administrator interface never links to `/account` as a customer surface.
- **URL hierarchy mirrors interfaces.** `/` and `/products/*` etc. for public + customer; `/account/*` for customer-only; `/staff/*` for Customer Service; `/admin/*` for Administrator.

---

## 7. Operational Philosophy

The platform is organized around **business operations**, not technical modules.

Operational areas (each belongs to specific interfaces):

| Operational Area     | Visitor | Customer | Customer Service | Administrator |
|----------------------|:-------:|:--------:|:----------------:|:-------------:|
| Catalog browsing     |   ✓     |    ✓     |        ✓         |       ✓       |
| Cart & checkout      |         |    ✓     |                  |               |
| Personal orders      |         |    ✓     |                  |               |
| Order operations     |         |          |        ✓         |       ✓       |
| Inventory            |         |          |                  |       ✓       |
| Products / Brands / Categories |   |          |                  |       ✓       |
| Customer support     |         |          |        ✓         |       ✓       |
| Customers directory  |         |          |                  |       ✓       |
| Registration approvals |       |          |        ✓         |       ✓       |
| Team & roles         |         |          |                  |       ✓       |
| Reports              |         |          |                  |       ✓       |
| Activity timeline    |         |          |                  |       ✓       |
| System configuration |         |          |                  |       ✓       |

Operational rules preserved from existing implementation (unchanged by this blueprint):

- Order lifecycle: `new → review → paid → shipping → delivered`, terminal `cancelled` / `returned`.
- Inventory reservation workflow:
  - When an order is created, inventory is **reserved**.
  - While the order is under review, the reservation is **maintained**.
  - When the order reaches `paid`, the reservation is **converted into a sale** and inventory is **decremented**.
  - Cancelled and archived orders **release** their reservations.
  - Returned orders **restore** inventory.
- Delivery assignments are created **only** when staff marks an order Out for Delivery; couriers are external.
- Delivery is confirmed by the customer scanning the QR on their own order page.
- Products are **soft-deleted** (`is_active = false`), never physically removed.
- All status changes, inventory edits, product edits, delivery assignments, and role grants are written to `audit_logs` automatically.
- Roles live in `public.user_roles`, checked via the `has_role(uid, role)` SECURITY DEFINER function. Roles are **never** stored on the profile.

---

## 8. High-Level User Journey

### 8.1 Visitor journey

1. Lands on the home page (Arabic, RTL).
2. Browses categories, brands, offers, or searches.
3. Opens a product; sees imagery and description; is invited to sign in to see the price.
4. Chooses to register → enters full name, phone, WhatsApp, address, password.
5. Sees a confirmation that the registration request has been submitted for review.

### 8.2 Customer journey

1. Customer Service activates the account.
2. Customer signs in with phone + password → routed to `/account`.
3. Browses catalog with prices visible; adds items to cart or wishlist.
4. Checks out (Wad Madani); receives order number and payment instructions.
5. Coordinates payment with Customer Service via WhatsApp; sees the order move through `review → paid → shipping`.
6. On delivery, scans the QR on their own order page to confirm receipt → status `delivered`.
7. Can reorder from history, manage addresses, and reset password.

### 8.3 Customer Service journey

1. Signs in with phone + password → routed to `/staff`.
2. Sees the day's queue of orders needing action, plus pending registration requests.
3. Opens an order, contacts the customer via WhatsApp, confirms payment (inventory decrements automatically), then marks Out for Delivery (QR is minted).
4. Reviews and approves/rejects new customer registration requests.
5. Ends the day with an empty or triaged queue.

### 8.4 Administrator journey

1. Signs in with phone + password → routed to `/admin`.
2. Lands on **Overview** — sees today's KPIs (revenue, orders, customers, low stock).
3. Navigates via the sidebar into any operational center as needed:
   - Reviews order flow in **Orders**.
   - Restocks in **Inventory**.
   - Publishes or archives products in **Catalog**.
   - Grants a staff role in **Team**.
   - Pulls a monthly report in **Reports**.
   - Updates delivery zones or company information in **System**.
4. Uses the platform to **supervise**, not to perform Customer Service work.

---

## 9. Architectural Principles

Every future phase and every future change MUST comply with the following principles.

### 9.1 Product principles

1. **Business-first.** The system is organized around business operations, not tables or technical modules.
2. **Arabic-first, RTL by default.** English is a secondary toggle. Layouts, icons, and copy assume RTL.
3. **Mobile-first for customer-facing surfaces.** Desktop-first for the Administrator surface. Customer Service is fluid across mobile and tablet.
4. **Minimal navigation.** Every user reaches the thing they need in as few taps or clicks as possible.
5. **High operational efficiency.** Staff and admin surfaces are optimized for throughput, not decoration.

### 9.2 Experience principles

6. **Strict interface separation.** No interface exposes controls belonging to another user type.
7. **Consistent design language.** One brand, one typography system, one color system, one component library across all four interfaces.
8. **Reuse existing components.** New UI is composed from existing primitives before new ones are introduced.
9. **No generic AI aesthetics.** The Metacare palette, typography, and tone are non-negotiable defaults.
10. **Prices are login-gated** everywhere, at the component level.

### 9.3 Engineering principles

11. **File-based routing under `src/routes/`.** No `src/pages/`. Root layout stays `src/routes/__root.tsx`.
12. **TanStack Query + `createServerFn`** for data access. No `useEffect` + `fetch` for initial reads.
13. **Semantic design tokens only.** No hardcoded colors or `text-white` / `bg-black` in components.
14. **Every public-schema table has explicit `GRANT`s and RLS policies.** RLS is enabled by default.
15. **Server-only modules are named `*.server.ts`** and never imported by client code.

### 9.4 Security & governance principles

16. **Roles live in `public.user_roles`** and are checked via `has_role()`. Roles are never stored on profiles.
17. **Preserve RLS.** No change is allowed to bypass Row Level Security.
18. **Preserve permissions.** The permission matrix in `docs/ROLES.md` is the source of truth.
19. **Preserve audit logging.** Every mutating admin/staff action must remain auditable.
20. **Preserve business rules.** Inventory decrement on `paid`, QR-only delivery confirmation, soft-delete of products, manual courier coordination — all remain as specified.

### 9.5 Change-management principle

21. **This blueprint governs future phases.** Any implementation that conflicts with this document is a bug against the document. Either the implementation changes, or the document is explicitly amended first — never silently.

---

## 10. Phased Implementation Roadmap

This blueprint is the input to four subsequent phases. Each phase implements exactly one interface and must comply with this document.

- **Phase 1 — Visitor Experience.** Public catalog, brand story, trust surface, registration entry point.
- **Phase 2 — Customer Workspace.** Cart, checkout, order tracking, personal account management.
- **Phase 3 — Customer Service Workspace.** Task queue, order operations, registration approvals, WhatsApp coordination.
- **Phase 4 — Administrator Workspace.** Operational centers (Overview, Orders, Inventory, Catalog, Customers, Team, Reports, System) organized under a persistent sidebar.

Each phase is a UI/UX and navigation phase. Backend logic, database schema, RLS, permissions, and business rules are already implemented and must be preserved.

---

*End of blueprint.*
