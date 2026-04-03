'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { AppSidebar } from '@/components/ibs/app-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRealtimeSync } from '@/lib/supabase-realtime';
import CompanyHome from './company-home';
import FinanceIncome from './finance-income';
import FinanceExpenses from './finance-expenses';
import CompanyInvoices from './company-invoices';
import CompanyCustomers from './company-customers';
import CompanyBookings from './company-bookings';
import CompanyWorkOrders from './company-work-orders';
import CompanyMaintenanceCertificates from './company-maintenance-certificates';
import CompanyShkService from './company-shk-service';
import CompanyReports from './company-reports';
import CompanySettings from './company-settings';
import { PlaceholderView } from '@/components/ibs/empty-state';

export default function CompanyDashboard() {
  const currentView = useAppStore((s) => s.currentView);
  const isMobile = useIsMobile();

  // Enable real-time sync with cloud database — all data changes
  // are pushed from Supabase instantly, keeping every device in sync.
  useRealtimeSync();

  const renderView = () => {
    switch (currentView) {
      case 'companyDashboard':
        return <CompanyHome />;
      case 'financeIncome':
        return <FinanceIncome />;
      case 'financeExpenses':
        return <FinanceExpenses />;
      case 'companyInvoices':
        return <CompanyInvoices />;
      case 'companyBookings':
        return <CompanyBookings />;
      case 'companyWorkOrders':
        return <CompanyWorkOrders />;
      case 'companyMaintenanceCertificates':
        return <CompanyMaintenanceCertificates />;
      case 'companyShkService':
        return <CompanyShkService />;
      case 'companyCustomers':
        return <CompanyCustomers />;
      case 'companyReports':
        return <CompanyReports />;
      case 'companySettings':
        return <CompanySettings />;
      default:
        return <CompanyHome />;
    }
  };

  return (
    <div className="flex min-h-[100dvh] overflow-hidden">
      <AppSidebar />
      <main className={`flex-1 overflow-y-auto transition-all ${isMobile ? 'ml-0' : 'ml-64'}`}>
        <div className={`p-3 pt-[max(3rem,calc(env(safe-area-inset-top)+2.5rem))] sm:p-6 sm:pt-6 lg:p-8 ${isMobile ? 'pb-[max(1rem,env(safe-area-inset-bottom))]' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
