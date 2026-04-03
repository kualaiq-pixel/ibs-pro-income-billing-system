'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './app-sidebar';
import AdminHome from './admin-home';
import AdminCompanies from './admin-companies';
import AdminUsers from './admin-users';
import AdminDataIE from './admin-data-ie';
import AdminLogs from './admin-logs';
import { Separator } from '@/components/ui/separator';

function fetchAllData() {
  const endpoints = [
    { key: 'companies' as const, url: '/api/companies' },
    { key: 'users' as const, url: '/api/users' },
    { key: 'customers' as const, url: '/api/customers' },
    { key: 'auditLogs' as const, url: '/api/audit-logs' },
  ];

  endpoints.forEach(({ key, url }) => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          useAppStore.getState().setData(key, data);
        }
      })
      .catch(() => {
        // silently fail on initial load
      });
  });
}

export default function AdminDashboard() {
  const { currentView, language } = useAppStore();
  const isRTL = language === 'AR';

  useEffect(() => {
    fetchAllData();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'adminDashboard':
        return <AdminHome />;
      case 'adminCompanies':
        return <AdminCompanies />;
      case 'adminUsers':
        return <AdminUsers />;
      case 'adminDataIE':
        return <AdminDataIE />;
      case 'adminLogs':
        return <AdminLogs />;
      default:
        return <AdminHome />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset dir={isRTL ? 'rtl' : 'ltr'}>
        <header className="flex h-12 sm:h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4 safe-area-top">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {renderView()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
