Driftspartner OS classic-script modules

Load these files in the exact order used by driftspartner-property-os.html. They intentionally share global functions/state until a later refactor converts them to explicit ES module imports.

00-core-state.js - state, seedless production defaults and utility data
10-app-shell.js - application shell, navigation and base rendering
20-supabase-core.js - Supabase client and property hydration
21-admin-users-customers.js - users, board and customer/property creation
22-production-workflows.js - active workflow helpers without presentation/test numbers
23-auth-session-access.js - auth, session, magic link and access
24-storage-suppliers.js - UUID and supplier helpers
25-documents-storage.js - document upload/archive and offer upload
26-deviations-workorders-base.js - base deviations and work orders
27-rfq-contracts-caseflow.js - RFQ, offer evaluation, board approval and contracts
28-supabase-write-check.js - Supabase property/write checks
29-mail-base-deviation.js - base email helpers and deviation email action
30-friendly-ids.js - friendly case labels and technical ID helpers
31-case-overrides-hydration.js - case overrides and hydration wrapper
32-shell-layout-production.js - production sidebar/topbar layout without presentation data
33-mail-economy-workorder.js - production email UI, work order override and economy page
34-production-doc-guards.js - document category and production guards
30-admin-production.js - production readiness/admin views
40-v1-data-dashboard.js - V1 data helpers and dashboard summary
41-property-buildings-fdv.js - property, buildings and FDV folder UI
42-v1-cases-notifications-projects.js - V1 cases, notifications and projects
43-build-order-page.js - build order roadmap/checks
44-live-dashboard-actions.js - live dashboard actions and rendering
45-live-hydration-extended.js - extended live Supabase hydration
46-email-storage-offer-strict.js - strict email/storage/offer wrappers
47-full-system-check.js - full system check and live write readiness
50-live-fdv-documents.js - live FDV and document storage UI
51-live-economy-projects.js - live economy, reports and projects
52-live-suppliers-offers-mail.js - suppliers, offers and production email recipients
53-production-crud-users.js - delete actions, users and access management
54-subscriptions.js - subscription plans and pricing
60-dashboard-live-rendering.js - strict live dashboard rendering
61-public-sales-page.js - public landing/sales page
62-dashboard-live-only-hydration.js - no-test dashboard hydration and login guards
63-fdv-deviation-production-actions.js - FDV deletion and deviation categories
64-projects-leases.js - projects and lease agreements
90-production-strict.js - final production safety overrides
48-launch-readiness.js - launch readiness checklist for customer go-live
92-sellable-mvp.js - sellable MVP checklist and go-to-market readiness plan
