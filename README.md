# IBS Pro - Income & Billing System

<p align="center">
  <img src="public/icons/icon.svg" alt="IBS Pro" width="80" height="80" />
</p>

<h1 align="center">IBS Pro</h1>
<p align="center">
  <strong>Professional Income & Billing System for Automotive Service Companies</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn/ui-latest-black" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/PWA-Ready-purple" alt="PWA" />
</p>

---

## ✨ Features

### 🏢 Multi-Company Management
- Create and manage multiple companies
- Role-based access control (Admin, Manager, Accountant, Staff, Viewer)
- Per-company data isolation

### 💰 Financial Management
- **Income tracking** with dynamic service lines, VAT calculation, customer selection
- **Expense tracking** with category-based organization
- **Invoice management** with status tracking (Pending/Paid)
- **Financial reports** with charts and export options

### 🔧 Automotive Service Operations
- **Vehicle Bookings** — Schedule service appointments with vehicle details
- **Work Orders** — Track parts, labor, costs, and technician assignments
- **Maintenance Certificates** — Generate inspection certificates with 8-point checks
- **66 car makes** and 200+ models in the database

### 🔗 SHK Service Links
- Store external service links with credentials
- Copy-to-clipboard for usernames and passwords
- Card-based layout for easy access

### 🌐 Multi-Language Support
- English 🇬🇧
- Finnish 🇫🇮
- Arabic 🇸🇦 (with RTL support)

### 📱 PWA Ready
- Installable on mobile and desktop
- Service worker with offline caching
- Standalone app experience

### 📊 Reports & Analytics
- Full Financial Report
- VAT/Tax Report
- Sales Analysis
- Booking Report
- Work Order Report
- Export to PDF, CSV, JSON

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ibs-pro-income-billing-system.git
cd ibs-pro-income-billing-system
bun install
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in the SQL Editor
3. Copy your project URL and API keys

### 3. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 4. Seed the database
```bash
bun run dev
# Then visit: http://localhost:3000/api/seed
```

### 5. Start development
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Login Credentials

| Role | Username | Password | Company Code |
|------|----------|----------|-------------|
| **Admin** | `admin` | `admin123` | — |
| **Manager** | `manager` | `password` | `DC001` |
| **Accountant** | `accountant` | `password` | `DC001` |
| **Viewer** | `viewer` | `pass` | `IS002` |

---

## 📱 Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variables from your `.env.local`
4. Deploy!

The PWA manifest and service worker are already configured — the app will be installable on mobile devices automatically.

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 4** | Styling |
| **shadcn/ui** | UI component library |
| **Supabase** | PostgreSQL database + auth |
| **Zustand** | Client state management |
| **next-themes** | Dark/Light mode |
| **framer-motion** | Animations |
| **recharts** | Charts and graphs |
| **lucide-react** | Icons |
| **sonner** | Toast notifications |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes (Supabase)
│   │   ├── auth/
│   │   ├── companies/
│   │   ├── users/
│   │   ├── customers/
│   │   ├── incomes/
│   │   ├── expenses/
│   │   ├── bookings/
│   │   ├── work-orders/
│   │   ├── maintenance-certificates/
│   │   ├── shk-links/
│   │   ├── settings/
│   │   ├── audit-logs/
│   │   ├── reports/
│   │   └── seed/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ibs/
│   │   ├── admin/         # Admin dashboard views
│   │   ├── company/       # Company dashboard views
│   │   ├── login-page.tsx
│   │   ├── app-sidebar.tsx
│   │   └── ...            # Shared components
│   └── ui/               # shadcn/ui components
├── hooks/
├── i18n/                 # Translations, car data, constants
├── lib/                  # Supabase client, helpers
└── store/                # Zustand store
public/
├── manifest.json         # PWA manifest
├── sw.js                 # Service worker
└── icons/                # App icons
```

---

## 📄 License

MIT License — feel free to use this project for your business.

---

<p align="center">
  Built with ❤️ for automotive service companies
</p>
