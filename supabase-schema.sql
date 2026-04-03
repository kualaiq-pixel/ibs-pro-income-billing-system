-- IBS Pro - Supabase Database Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Drop existing tables
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS shk_links CASCADE;
DROP TABLE IF EXISTS maintenance_certificates CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS incomes CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Companies
CREATE TABLE companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  vat TEXT DEFAULT '',
  vat_id TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  address TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  city TEXT DEFAULT '',
  country TEXT DEFAULT '',
  currency TEXT DEFAULT '€',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Staff',
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incomes
CREATE TABLE incomes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number INTEGER NOT NULL,
  date TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  services TEXT DEFAULT '[]',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  reference_number TEXT DEFAULT '',
  vat_rate DOUBLE PRECISION DEFAULT 25.5,
  payment_method TEXT DEFAULT 'Bill',
  category TEXT DEFAULT 'Service',
  car_make TEXT DEFAULT '',
  car_model TEXT DEFAULT '',
  license_plate TEXT DEFAULT '',
  customer_details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  vat_rate DOUBLE PRECISION DEFAULT 0,
  payment_method TEXT DEFAULT 'Bill',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  car_make TEXT DEFAULT '',
  car_model TEXT DEFAULT '',
  license_plate TEXT DEFAULT '',
  service_type TEXT DEFAULT '',
  booking_date TEXT NOT NULL,
  booking_time TEXT DEFAULT '09:00',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'Scheduled',
  customer_details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE work_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  work_order_number INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'Draft',
  technician TEXT DEFAULT '',
  estimated_hours DOUBLE PRECISION DEFAULT 0,
  actual_hours DOUBLE PRECISION DEFAULT 0,
  work_description TEXT DEFAULT '',
  parts_used TEXT DEFAULT '[]',
  labor_cost DOUBLE PRECISION DEFAULT 0,
  parts_cost DOUBLE PRECISION DEFAULT 0,
  total_cost DOUBLE PRECISION DEFAULT 0,
  recommendations TEXT DEFAULT '',
  customer_approval BOOLEAN DEFAULT FALSE,
  mileage INTEGER DEFAULT 0,
  next_service_due TEXT DEFAULT '',
  service_guarantee TEXT DEFAULT '',
  warranty_details TEXT DEFAULT '',
  service_quality_check TEXT DEFAULT '',
  technician_notes TEXT DEFAULT '',
  car_make TEXT DEFAULT '',
  car_model TEXT DEFAULT '',
  license_plate TEXT DEFAULT '',
  customer_id TEXT,
  customer_details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Certificates
CREATE TABLE maintenance_certificates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_order_id TEXT REFERENCES work_orders(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  issue_date TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  maintenance_type TEXT DEFAULT 'Regular Maintenance',
  next_maintenance_date TEXT DEFAULT '',
  maintenance_interval TEXT DEFAULT '',
  certified_technician TEXT DEFAULT '',
  inspection_results TEXT DEFAULT '{}',
  technician_notes TEXT DEFAULT '',
  recommendations TEXT DEFAULT '',
  service_history TEXT DEFAULT '[]',
  additional_remarks TEXT DEFAULT '',
  car_make TEXT DEFAULT '',
  car_model TEXT DEFAULT '',
  license_plate TEXT DEFAULT '',
  customer_id TEXT,
  customer_details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHK Links
CREATE TABLE shk_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  username TEXT DEFAULT '',
  password TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT DEFAULT 'System',
  description TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- App Settings
CREATE TABLE app_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  settings TEXT DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_incomes_company ON incomes(company_id);
CREATE INDEX idx_invoices_status ON incomes(status);
CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_bookings_company ON bookings(company_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_work_orders_company ON work_orders(company_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_mc_company ON maintenance_certificates(company_id);
CREATE INDEX idx_shk_company ON shk_links(company_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

-- Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shk_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service Role full access)
CREATE POLICY "Service role all on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on incomes" ON incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on work_orders" ON work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on maintenance_certificates" ON maintenance_certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on shk_links" ON shk_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all on app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon read app_settings" ON app_settings FOR SELECT USING (true);
