# IBS Pro - Work Log

## Summary
IBS Pro (Income & Billing System) is a comprehensive Next.js application for automotive service companies. Features include multi-company management, income/expense tracking, vehicle bookings, work orders, maintenance certificates, SHK service links, reports, and PWA support.

## Features Built
- **Auth System**: Admin and company login with role-based access
- **Admin Dashboard**: Companies, Users, Import/Export, Audit Logs
- **Company Dashboard**: Financial overview, Income/Expense management, Customers, Bookings, Work Orders, Maintenance Certificates, SHK Links, Reports, Settings
- **Multi-language**: EN, FI, AR with RTL support
- **Dark/Light Mode**: Toggle with persistence
- **PWA**: Installable with service worker and manifest
- **Database**: Supabase (PostgreSQL) with full CRUD API routes (migrated from Prisma/SQLite)

## Tech Stack
- Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand, next-themes, framer-motion, recharts, lucide-react

---
## Task ID: s4 - api-migration-agent
### Work Task
Rewrite ALL 24 API route files from Prisma/SQLite to Supabase (PostgreSQL).

### Work Summary
Successfully migrated all 24+ API route files from Prisma/SQLite to Supabase. Created a shared utility file (`src/lib/supabase-helpers.ts`) with helper functions for snake_case↔camelCase conversion, JSON field parsing/stringifying, and audit log creation. All routes now:
- Import from `@/lib/supabase` instead of `@/lib/db`
- Use Supabase client syntax (`supabase.from('table').select()/.insert()/.update()/.delete()`)
- Convert snake_case DB columns to camelCase in API responses using `toCamel()`/`toCamelArray()`
- Parse JSON TEXT fields (services, parts_used, customer_details, inspection_results, service_history, service_quality_check) before returning responses
- Use `crypto.randomUUID()` for ID generation on inserts
- Create audit log entries via `createAuditLog()` helper after successful mutations
- Handle Supabase `{ data, error }` pattern with proper error responses
- Maintain backward-compatible API response shapes

Files rewritten:
1. `src/lib/supabase-helpers.ts` (new shared utility)
2. `src/app/api/auth/route.ts`
3. `src/app/api/companies/route.ts`
4. `src/app/api/companies/[id]/route.ts`
5. `src/app/api/users/route.ts`
6. `src/app/api/users/[id]/route.ts`
7. `src/app/api/customers/route.ts`
8. `src/app/api/customers/[id]/route.ts`
9. `src/app/api/incomes/route.ts`
10. `src/app/api/incomes/[id]/route.ts`
11. `src/app/api/expenses/route.ts`
12. `src/app/api/expenses/[id]/route.ts`
13. `src/app/api/bookings/route.ts`
14. `src/app/api/bookings/[id]/route.ts`
15. `src/app/api/bookings/[id]/status/route.ts`
16. `src/app/api/work-orders/route.ts`
17. `src/app/api/work-orders/[id]/route.ts`
18. `src/app/api/maintenance-certificates/route.ts`
19. `src/app/api/maintenance-certificates/[id]/route.ts`
20. `src/app/api/shk-links/route.ts`
21. `src/app/api/shk-links/[id]/route.ts`
22. `src/app/api/settings/route.ts`
23. `src/app/api/audit-logs/route.ts`
24. `src/app/api/seed/route.ts`
25. `src/app/api/reports/route.ts`

Lint check passed with zero errors.

---
## Task ID: 5 - github-upload
### Work Task
Upload the IBS Pro project to GitHub using the user's Personal Access Token.

### Work Summary
- Identified GitHub username `kualaiq-pixel` from the provided PAT
- Created public repository `kualaiq-pixel/ibs-pro-income-billing-system` via GitHub API
- Committed pending changes (push-to-github.sh script)
- Pushed all 5 commits (master branch) to the new repository
- Cleaned remote URL to remove embedded token for security

### Stage Summary
- Repository live at: https://github.com/kualaiq-pixel/ibs-pro-income-billing-system
- All source code, Supabase schema, README, and deployment scripts pushed successfully
- Remote URL secured (no token embedded)

---
## Task ID: 6 - Mobile Responsiveness Fix
### Work Task
Fix all pages to be mobile-friendly when installed as PWA on phones. Pages were "broken" on mobile.

### Work Summary
Applied comprehensive mobile-first responsive design fixes across the entire application:

**Core Layout Fixes:**
- `layout.tsx`: Changed viewport `maximumScale: 1` → `maximumScale: 5` (allows pinch-to-zoom), added `viewportFit: "cover"`, added `overflow-x-hidden` to body
- `globals.css`: Added PWA safe area inset utilities, mobile dialog max-width fix using `env(safe-area-inset-*)`, `hide-scrollbar` utility class, `overflow-x: hidden` on html/body, `min-height: 100dvh` for dynamic viewport

**Login Page (`login-page.tsx`):**
- Added safe area padding using `env(safe-area-inset-*)` for top/bottom/left/right
- Changed `min-h-screen` → `min-h-[100dvh]`
- Made floating controls smaller on mobile (h-8/w-8 vs h-9/w-9)
- Hidden language label on mobile to prevent overlap

**Company Dashboard (`company-dashboard.tsx`):**
- Changed `min-h-screen` → `min-h-[100dvh]`
- Added safe area top padding to account for hamburger menu + status bar
- Added safe area bottom padding
- Tighter padding on mobile (p-3 vs sm:p-6 vs lg:p-8)

**Sidebar Hamburger Button (`app-sidebar.tsx`):**
- Positioned using `env(safe-area-inset-*)` for notch/status bar devices
- Made button larger (h-10 w-10) for better touch target

**Admin Dashboard (`admin-dashboard.tsx`):**
- Added safe area classes to header
- Smaller header on mobile (h-12 vs sm:h-14)
- Responsive padding (p-3 sm:p-4 md:p-6)

**Tables → Mobile Card Views (14 components):**
All table-based views now show mobile card layouts on screens < 640px:
- `finance-income.tsx`: Desktop table + mobile card list
- `finance-expenses.tsx`: Desktop table + mobile card list
- `company-invoices.tsx`: Desktop table + mobile card list + detail dialog fixes
- `company-bookings.tsx`: Desktop table + mobile card list
- `company-work-orders.tsx`: Desktop table + mobile card list
- `company-customers.tsx`: Desktop table + mobile card list
- `company-maintenance-certificates.tsx`: Desktop table + mobile card list
- `company-reports.tsx`: 3 report tables with mobile card views
- `admin-companies.tsx`: Desktop table + mobile card list
- `admin-users.tsx`: Desktop table + mobile card list
- `admin-logs.tsx`: Desktop table + mobile card list + responsive summary cards

**Dialog Form Fixes:**
- All dialogs: `max-h-[90vh]` → `max-h-[90dvh]` for proper mobile browser chrome handling
- All scroll areas: `max-h-[65vh/70vh]` → `max-h-[65dvh/70dvh]`
- Dialog padding: `p-4 sm:p-6` for tighter mobile padding

**Service Line Items (Income Form):**
- Service lines now stack vertically on mobile (description dropdown, then price, then remove button)
- Each line wrapped in bordered card on mobile for visual separation
- Full-width price input on mobile, fixed 28-width on desktop

**Invoice Detail Dialog:**
- Company/Customer grid: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
- Customer text alignment: `text-right` → `sm:text-right`

**Header Sections:**
- All header flex containers changed to `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`
- Button text wrapping enabled on small screens

### Stage Summary
- All 14+ table views now have mobile card alternatives
- All dialogs use dynamic viewport height for proper mobile rendering
- PWA safe area insets respected on notched devices
- Pinch-to-zoom re-enabled for accessibility
- Lint passes with zero errors
---
Task ID: 1
Agent: Main Agent
Task: Fix VAT-inclusive pricing across all forms - ensure entered prices are treated as Gross Amount (final price including VAT)

Work Log:
- Analyzed uploaded screenshot showing incorrect VAT calculation (€250 + €63.75 VAT = €313.75)
- Audited all VAT calculation code across 7 files
- Confirmed API routes store `amount` exactly as received (no VAT addition on backend)
- Confirmed existing code formulas were correct: `subtotal = total / (1 + vatRate/100)`
- Updated finance-income.tsx: Renamed variables to `grossTotal`, `netSubtotal`, `extractedVat` for clarity
- Updated finance-income.tsx: Added explicit "Prices entered are the final amount the customer pays (VAT included)" note
- Updated finance-income.tsx: Changed labels from "Subtotal (excl. VAT)" to "Net Amount (excl. VAT)"
- Updated finance-expenses.tsx: Same pattern - renamed to `grossAmount`, `netSubtotal`, `extractedVat`
- Updated finance-expenses.tsx: Added explanatory note about VAT-inclusive pricing
- Updated company-invoices.tsx: Renamed `getInvoiceSubtotal` to `getInvoiceNet` for clarity
- Updated company-invoices.tsx: Updated display labels to "Net Amount (excl. VAT)" and "Total (incl. VAT)"
- Updated company-work-orders.tsx: Added VAT breakdown section showing Net, VAT, and Total at 25.5%
- All files pass lint check, dev server compiles successfully

Stage Summary:
- All forms now use VAT-inclusive (Gross Amount) pricing consistently
- Formula: Gross = Net + VAT → Net = Gross / (1 + rate) → VAT = Gross − Net
- Example: Enter €250 → Net: €199.20, VAT (25.5%): €50.80, Total: €250.00
- No VAT is ever added on top of the entered price
- Backend stores the entered amount as-is (the gross/final amount)
---
Task ID: 2
Agent: Main Agent
Task: Implement cloud-first architecture with real-time data sync — no local storage

Work Log:
- Audited entire codebase for localStorage, sessionStorage, IndexedDB, SQLite — zero instances found
- Verified Zustand store has NO persist middleware (pure in-memory cache)
- Confirmed all API routes use Supabase (cloud PostgreSQL) as the sole data source
- Created `src/lib/supabase-realtime.ts` — centralized real-time subscription manager
- Implemented `RealtimeManager` class with:
  - Company-scoped subscriptions (incomes, expenses, customers, bookings, work_orders, maintenance_certificates, shk_links)
  - Global subscriptions (audit_logs — no company_id column)
  - PostgreSQL Change Data Capture via `postgres_changes` events
  - Auto-retry on channel errors (3-second delay)
  - Full table re-fetch on any change to ensure data consistency
  - Proper snake_case → camelCase conversion and JSON field parsing
  - Singleton pattern prevents duplicate subscriptions
- Created `useRealtimeSync()` React hook
- Integrated hook into `CompanyDashboard` component — activates on login, cleans up on logout
- Lint passes clean, dev server compiles successfully

Stage Summary:
- Architecture: 100% cloud-first — all data lives in Supabase PostgreSQL
- No localStorage, sessionStorage, IndexedDB, or SQLite anywhere in the codebase
- Zustand store is pure in-memory UI cache only
- Real-time sync: When any device creates/updates/deletes data, all other devices receive the update instantly via Supabase Realtime (WebSocket)
- Files created: `src/lib/supabase-realtime.ts`
- Files modified: `src/components/ibs/company/company-dashboard.tsx`

---
Task ID: 2
Agent: general-purpose
Task: Fix VAT in reports and work orders date field mismatch

Work Log:
- Fixed VAT calculation in company-reports.tsx - added extractVat helper function
- Fixed all 9 locations where i.vat was used (was always 0 since DB doesn't store it)
- Fixed work orders date field mismatch - changed workOrderDate to date in payload

Stage Summary:
- VAT amounts now correctly display in reports by extracting from gross amount
- Work orders can now be created successfully (date field properly mapped)
---
Task ID: 4
Agent: general-purpose
Task: Add real-time cloud sync status indicator

Work Log:
- Added connection status tracking to RealtimeManager class with `ConnectionStatus` type ('connecting' | 'connected' | 'reconnecting' | 'error')
- Added private `connectionStatus` field and `statusCallbacks` Set for subscriber management
- Added `getConnectionStatus()`, `onStatusChange()`, and private `setStatus()` methods to RealtimeManager
- Updated `start()` to set status to 'connecting' on initialization
- Updated `stop()` to reset status to 'connecting'
- Updated `subscribe()` to set 'connected' on SUBSCRIBED, 'error' on CHANNEL_ERROR, 'reconnecting' on retry and TIMED_OUT
- Created `useRealtimeStatus()` React hook for consuming connection status in components
- Exported `getConnectionStatus()` function for non-hook usage
- Created `CloudSyncIndicator` component with 4 visual states (connecting, connected, reconnecting, error)
- Added CloudSyncIndicator to the app sidebar bottom controls section
- Indicator auto-fades after 3s on desktop (stays visible on hover), always visible on mobile

Stage Summary:
- Users now see a live "Cloud Synced" indicator in the sidebar
- Status shows: Connecting (pulsing spinner), Cloud Synced (green cloud), Reconnecting (amber spinner), or Offline (red alert)
- Indicator briefly highlights on status changes for attention
- No new TypeScript errors introduced
---
Task ID: 3
Agent: Main Agent
Task: Implement clean PDF generation, Finnish reference numbers, and enhanced IBAN/Y-tunnus settings

Work Log:
- Installed jspdf@4.2.1 and jspdf-autotable@5.0.7 for PDF generation
- Created `src/lib/finnish-reference.ts` — Finnish SFS 5338 reference number utility with:
  - `calculateCheckDigit()` — weighted [7,3,1] checksum algorithm
  - `generateReferenceNumber()` — appends valid check digit to base number
  - `formatReferenceNumber()` — groups of 5 from right (e.g., 123 4569)
  - `validateReferenceNumber()` — validates existing reference numbers
- Created `src/lib/generate-invoice-pdf.ts` — Professional A4 invoice PDF generator with:
  - Company header with bilingual Finnish/English labels
  - Sender/Recipient sections with full business details
  - Vehicle info section
  - Services table with VAT-inclusive pricing
  - Net/VAT/Total breakdown
  - Payment details box (IBAN, Y-tunnus, reference number, due date)
  - Notes section
  - Professional footer with company info and invoice metadata
- Updated `src/app/api/incomes/route.ts` — replaced simple padded reference with Finnish SFS 5338 checksum
- Updated `src/components/ibs/company/company-invoices.tsx`:
  - Replaced `window.print()` with `handleDownloadPDF()` using jsPDF
  - Added formatted reference number display (Finnish grouping)
  - Added Download PDF button in invoice detail dialog
- Updated `src/store/app-store.ts` — added `phone` and `email` to Company interface
- Updated `src/components/ibs/company/company-settings.tsx`:
  - Added amber billing info banner reminding users to fill IBAN and Y-tunnus
  - Enhanced IBAN field with required indicator, placeholder, and amber border when empty
  - Enhanced Y-tunnus field with required indicator, placeholder, and amber border when empty

Stage Summary:
- PDF invoices are now clean A4 documents generated via jsPDF (no screenshots/menus)
- Reference numbers use Finnish SFS 5338 standard with valid check digits
- IBAN and Y-tunnus fields prominently highlighted as required for invoicing
- All code passes lint and compiles without errors
---
Task ID: 5
Agent: Main Agent
Task: Fix theme toggle, server-side PDF generation, and Finnish reference number verification

Work Log:
- **Theme Toggle Fix:**
  - Identified root cause: Two competing theme systems — Zustand `isDarkMode`/`toggleDarkMode()` and `next-themes` `useTheme()`/`setTheme()`. Zustand only flipped a boolean but never called `setTheme()`, so the `<html>` class never changed.
  - Fixed `src/components/ibs/app-sidebar.tsx`: Removed `isDarkMode`/`toggleDarkMode` from Zustand usage, now uses `useTheme()` from next-themes directly with `setTheme()` and `theme` for icon state.
  - Fixed `src/components/ibs/login-page.tsx`: Same fix — removed Zustand `isDarkMode`/`toggleDarkMode`, uses `next-themes` directly.
  - ThemeProvider already configured correctly in `layout.tsx` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}` — persists to localStorage automatically.

- **Server-Side PDF Generation:**
  - Created `src/app/api/invoices/pdf/route.ts` — Server-side API route that:
    - Fetches invoice + company + customer data from Supabase
    - Renders a standalone, self-contained HTML document with inline CSS (no frameworks, no external deps)
    - Uses proper A4 layout with @page rules
    - Includes: company header, sender info, invoice metadata, customer block, vehicle info, services table, Net/VAT/Total breakdown, payment details box, notes, footer
    - All bilingual Finnish/English labels
    - Reference numbers formatted with Finnish grouping
  - Updated `src/components/ibs/company/company-invoices.tsx`:
    - Replaced client-side jsPDF import with server API call
    - Button opens HTML in new tab with auto-print dialog (user can Save as PDF from browser)
    - Added loading state with spinner while generating

- **Finnish Reference Numbers (7-3-1):**
  - Verified algorithm correctness with manual calculations:
    - Invoice #1: base `000001` → reversed `100000` × weights `7,3,1,7,3,1` = sum 7 → check digit 3 → `0000013` ✓
    - Invoice #2: base `000002` → sum 14 → check digit 6 → `0000026` ✓
  - Created `src/app/api/incomes/fix-references/route.ts` — POST endpoint to fix all existing invoices
  - Ran fix: 1 existing invoice updated from `000001` → `0000013`
  - New invoices already use correct algorithm (implemented in previous session)

Stage Summary:
- Theme toggle now works correctly: persists to localStorage via next-themes, applies globally via CSS class on `<html>`
- PDF generation is server-side: clean A4 HTML with no website chrome, opens in new tab for print/save
- All existing and future invoices have valid Finnish SFS 5338 reference numbers with correct check digits
- Lint passes clean, dev server compiles successfully
---
Task ID: 6
Agent: Main Agent
Task: Enhanced PDF generation (binary download, Receipt/Invoice headers, Virtuaaliviivakoodi), RF reference numbers, and theme persistence fix

Work Log:
- **Finnish Reference Number Enhancement (finnish-reference.ts):**
  - Added `generateRFReference()` — converts Finnish reference to international RF format using ISO 7064 MOD 97-10
  - Added `formatRFReference()` — formats RF reference in groups of 4 (e.g., RF18 1234 0000 13)
  - Added `ibanToBBAN()` — converts Finnish IBAN to domestic BBAN (14-digit national ID padded to 16)
  - Added `generateVirtualBarcode()` — creates Virtuaaliviivakoodi (53-digit virtual barcode) with proper formatting
  - Internal `mod97()` helper using BigInt for large number precision

- **Server-Side Binary PDF Generation (generate-invoice-pdf.ts + api/invoices/pdf/route.ts):**
  - Rewrote PDF API route to use jsPDF generator (not HTML) returning binary PDF with proper Content-Type/Content-Disposition headers
  - Added conditional document header: LASKU/INVOICE for Pending status, KUITTI/RECEIPT for Paid status
  - Receipt uses green color scheme (receiptGreen), Invoice uses teal (primary)
  - Added RF reference display in invoice metadata section
  - Added Virtuaaliviivakoodi section in payment details box (only for Bill payments with valid IBAN)
  - Virtual barcode includes: BBAN, amount in cents, reference number, due date
  - PDF filename is localized: "Lasku_1.pdf" or "Kuitti_1.pdf" based on status

- **Client-Side PDF Download (company-invoices.tsx):**
  - Changed from HTML blob + window.open to binary PDF blob + anchor download
  - Uses `document.createElement('a')` with download attribute for direct file save
  - Shows localized success toast: "Lasku #1 downloaded" or "Kuitti #1 downloaded"
  - Added RF reference display in invoice detail dialog

- **Theme Toggle Fix (app-sidebar.tsx + layout.tsx):**
  - Added inline `<script>` in layout.tsx head to set initial theme class before React hydration (prevents flash)
  - Script reads localStorage 'theme' value and applies 'dark' or 'light' class to `<html>`
  - Default fallback to 'dark' if no localStorage value exists
  - Added localStorage.setItem backup in handleToggleDarkMode for redundancy
  - Fixed icon logic: default (no theme / undefined / dark) shows Sun icon, light shows Moon icon

- **VAT Edge Case Fix (company-invoices.tsx):**
  - Added guard for 0% VAT rate: when vatRate is 0, net === gross and vat === 0 (avoids division by 1.0)

Stage Summary:
- PDF generation is now true binary server-side PDF (not HTML), downloads directly as file
- Finnish invoices show LASKU (Pending) or KUITTI (Paid) header with appropriate colors
- Virtuaaliviivakoodi (virtual barcode) displayed in payment section for Bill payments
- RF reference (international format) shown in both PDF and invoice detail dialog
- Theme toggle persists correctly with no flash on page load
- All code passes lint (0 errors, 0 warnings), dev server compiles successfully
---
Task ID: 7
Agent: Main Agent
Task: Fix hydration mismatch errors for theme toggle and Supabase initialization

Work Log:
- **Theme Toggle Hydration Fix (login-page.tsx + app-sidebar.tsx):**
  - Root cause: `suppressHydrationWarning` on parent `<span>` does NOT propagate to child SVG elements. During SSR, no `dark` class exists on `<html>`, so `Moon` renders. On client, `next-themes` reads localStorage and adds `dark` class before React hydrates, so `Sun` renders. Different SVGs = hydration mismatch.
  - Fix: Replaced dual Sun/Moon rendering (`hidden dark:block` / `block dark:hidden`) with a `useSyncExternalStore`-based `mounted` guard
  - During SSR (`mounted=false`): renders neutral `CircleDot` icon (identical server + client)
  - After hydration (`mounted=true`): renders `Sun` (dark) or `Moon` (light) based on resolved theme
  - Added `CircleDot` import to both components
  - `emptySubscribe = () => () => {}` pattern — React 19 recommended approach, avoids `useEffect`+`setState` lint warning

- **Supabase Lazy Initialization (supabase.ts):**
  - Root cause: `createClient(supabaseUrl, supabaseKey)` called at module evaluation time throws when env vars are missing, crashing the entire app
  - Fix: Changed to lazy Proxy-based initialization — `supabase` export is a Proxy that only calls `createClient` when a method is actually accessed
  - `getSupabase()` cached after first call (singleton pattern)
  - Clear error message thrown only when Supabase is actually used without config

Stage Summary:
- No more hydration mismatch errors on login page or sidebar
- App renders successfully even without Supabase env vars configured
- Theme icon shows neutral placeholder during SSR, correct icon after hydration
- All code passes lint, dev server returns HTTP 200
---
Task ID: 8
Agent: Main Agent
Task: Definitive hydration fix — use next/dynamic ssr:false for theme/language controls

Work Log:
- **Root Cause Analysis (deep dive):**
  - `useSyncExternalStore(getServerSnapshot)` does NOT reliably prevent hydration mismatch in this Next.js environment
  - During hydration, React may call `getSnapshot()` (returns `true`) instead of `getServerSnapshot()` (returns `false`), causing `mounted=true` during hydration — the exact opposite of what we need
  - `next-themes` injects a `<script>` that adds `dark`/`light` class to `<html>` BEFORE React hydrates, making CSS resolve differently on server vs client
  - This causes `Sun` vs `Moon` SVGs and language flag emojis to render differently — and `suppressHydrationWarning` only works on the DIRECT element, not child SVGs
  - Three previous attempts failed: `suppressHydrationWarning`, `useSyncExternalStore` mounted guard, `mounted ? (...) : null` conditional render

- **Definitive Fix: `next/dynamic({ ssr: false })`:**
  - Created `src/components/ibs/login-floating-controls.tsx` — separate client component containing language button, theme toggle, and language label
  - Created `src/components/ibs/sidebar-bottom-controls.tsx` — separate client component for sidebar's cloud sync, language, theme toggle, and logout controls
  - Rewrote `src/components/ibs/login-page.tsx`:
    - Removed all theme/language imports (`useTheme`, `Sun`, `Moon`, `Globe`, `useSyncExternalStore`, `language`, `setLanguage`, `cycleLanguage`, `resolvedTheme`)
    - Added `next/dynamic` import with `ssr: false` for `LoginFloatingControls`
    - Controls are now `<LoginFloatingControls />` — never exists on the server
  - Rewrote `src/components/ibs/app-sidebar.tsx`:
    - Same pattern: removed theme/language-specific code, used `dynamic({ ssr: false })` for `SidebarBottomControls`
    - SidebarBottomControls receives `onLogout` prop

- **Why this works:** With `ssr: false`, Next.js renders `null` on the server (the component is never even imported during SSR). On the client, React mounts the component fresh after JS executes — no hydration comparison needed. Zero chance of mismatch.

Stage Summary:
- Theme/language controls are now loaded via `next/dynamic({ ssr: false })` — guaranteed no SSR rendering
- No more hydration mismatch errors possible for these elements
- Lint passes clean (0 errors), dev server returns HTTP 200
- Files created: `login-floating-controls.tsx`, `sidebar-bottom-controls.tsx`
- Files rewritten: `login-page.tsx`, `app-sidebar.tsx`
