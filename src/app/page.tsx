'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { LoginPage } from '@/components/ibs/login-page';
import { Skeleton } from '@/components/ui/skeleton';
import AdminDashboard from '@/components/ibs/admin/admin-dashboard';
import CompanyDashboard from '@/components/ibs/company/company-dashboard';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
} from 'lucide-react';

/* ── Placeholder View Component ──────────────────────────────────────────── */

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function HomePage() {
  const {
    currentUser,
    currentView,
    isAuthenticated,
    setData,
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Initial data fetch for company users
  const fetchInitialData = useCallback(async () => {
    if (!currentUser || currentUser.role === 'Admin') return;

    setIsLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const companyId = currentUser.companyId;

      if (!companyId) {
        setDataLoaded(true);
        return;
      }

      const [
        companiesRes,
        usersRes,
        customersRes,
        incomesRes,
        expensesRes,
        bookingsRes,
        workOrdersRes,
        mcRes,
        shkRes,
      ] = await Promise.all([
        fetch('/api/companies', { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/users?companyId=${companyId}`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/customers?companyId=${companyId}`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/incomes?companyId=${companyId}`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/expenses?companyId=${companyId}`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/bookings?companyId=${companyId}`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/work-orders?companyId=${companyId}`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/maintenance-certificates?companyId=${companyId}`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`/api/shk-links?companyId=${companyId}`, { headers }).then((r) => r.json()).catch(() => null),
      ]);

      if (companiesRes) setData('companies', companiesRes);
      if (usersRes) setData('users', usersRes);
      if (customersRes) setData('customers', customersRes);
      if (incomesRes) setData('incomes', incomesRes);
      if (expensesRes) setData('expenses', expensesRes);
      if (bookingsRes) setData('bookings', bookingsRes);
      if (workOrdersRes) setData('workOrders', workOrdersRes);
      if (mcRes) setData('maintenanceCertificates', mcRes);
      if (shkRes) setData('shkLinks', shkRes);

      setDataLoaded(true);
    } catch {
      setDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, setData]);

  useEffect(() => {
    if (isAuthenticated && currentUser && !dataLoaded && currentUser.role !== 'Admin') {
      fetchInitialData();
    }
    // Admin dashboard fetches its own data
    if (isAuthenticated && currentUser && currentUser.role === 'Admin') {
      setDataLoaded(true);
    }
  }, [isAuthenticated, currentUser, dataLoaded, fetchInitialData]);

  // Reset data loaded when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setDataLoaded(false);
    }
  }, [isAuthenticated]);

  // ── Not authenticated → Login ────────────────────────────────────────────
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'Admin';

  // ── Admin Dashboard (uses existing components) ───────────────────────────
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // ── Company Dashboard ────────────────────────────────────────────────────
  return <CompanyDashboard />;
}
