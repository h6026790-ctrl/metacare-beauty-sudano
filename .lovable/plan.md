# Phase 4 — Administrator Workspace

Turn the single tabbed `/admin` page into a proper administration workspace with a sidebar and dedicated centers, mirroring the Customer Service workspace already in place.

No backend, database, authentication, or business-logic changes. Presentation and routing only.

## Why

`/admin` today is one 285-line page with eight tabs. Everything an administrator does — orders, catalogue, inventory, team, reports, audit — lives in one scroll, all data loads at once, and no view can be linked to or bookmarked. Customer Service already got its workspace treatment; Admin should match it so both departments feel like the same system.

## Operational philosophy

An administrator does not ask "which tab was that in?" — they arrive with an intent: check the business, fix the catalogue, correct stock, review who did what. Each intent gets its own address and its own screen. The landing screen answers one question: **is anything wrong right now?**

## Structure

`/admin` becomes a guarded layout route (sidebar + `<Outlet />`), with these centers:

| Route | Center | Content |
|---|---|---|
| `/admin` | Overview | KPIs, low-stock alerts, today's orders, quick links |
| `/admin/orders` | Orders | All orders, read-oriented with status and totals |
| `/admin/catalog` | Catalogue | Products, brands, categories; archive / restore |
| `/admin/inventory` | Inventory | Stock levels, adjustment, low-stock focus |
| `/admin/customers` | Customers | Customer directory |
| `/admin/team` | Team | Staff and role listing |
| `/admin/registrations` | Registrations | Existing registration-requests panel |
| `/admin/reports` | Reports | 30-day KPIs, status mix, low stock |
| `/admin/activity` | Activity | Audit log |
| `/admin/system` | System | Company details and configuration surface (read-only for now) |

Arabic-first and RTL are preserved throughout: the sidebar anchors right in Arabic, all labels are bilingual through the existing i18n dictionary, and layout is mobile-first with a collapsible sidebar.

## Technical notes

- New `src/components/admin/AdminSidebar.tsx` modelled on `StaffSidebar.tsx`, with badge counts for low stock and pending registrations.
- New `src/components/admin/useAdminWorkspace.ts` wrapping the existing server functions (`adminListAllOrders`, `adminListProducts`, `adminAdjustStock`, `adminListAuditLogs`, `adminListCustomers`, `adminListBrands`, `listTeam`, `adminReports`, `adminSoftDeleteProduct`, `adminRestoreProduct`) as shared hooks. No new server functions.
- `src/routes/admin.tsx` becomes the layout route: `useAuth` admin guard, `SidebarProvider`, `<Outlet />`.
- Each center becomes its own route file (`admin.index.tsx`, `admin.orders.tsx`, …), reusing the existing tables and controls lifted out of the current page.
- `RegistrationRequestsPanel` is reused unchanged.
- Each route defines its own `head()` with a unique Arabic title, description, and `noindex`.
- Per-center queries stay `enabled` on the admin guard, so a non-admin never fires an unauthorised request — same pattern as the staff workspace.

## Out of scope

Accounts cleanup (seeded admin password, orphan test account) stays untouched, as agreed. No migrations, no RLS edits, no changes to the QR delivery flow or inventory reservation model.
