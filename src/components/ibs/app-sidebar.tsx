'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DollarSign,
  LogOut,
  Menu,
  Home,
  Building2,
  Users,
  FileDown,
  ClipboardList,
  Wallet,
  Receipt,
  FileText,
  CalendarDays,
  Wrench,
  Award,
  Link,
  UserCircle,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarBottomControls } from './sidebar-bottom-controls';

/* ── Menu Item Types ─────────────────────────────────────────────────────── */

interface MenuItem {
  key: string;
  labelKey: string;
  icon: LucideIcon;
}

const ADMIN_MENU: MenuItem[] = [
  { key: 'adminDashboard', labelKey: 'home', icon: Home },
  { key: 'adminCompanies', labelKey: 'companiesManagement', icon: Building2 },
  { key: 'adminUsers', labelKey: 'usersManagement', icon: Users },
  { key: 'adminDataIE', labelKey: 'importExportData', icon: FileDown },
  { key: 'adminLogs', labelKey: 'auditLogs', icon: ClipboardList },
];

const COMPANY_MENU: MenuItem[] = [
  { key: 'companyDashboard', labelKey: 'home', icon: Home },
  { key: 'financeIncome', labelKey: 'income', icon: Wallet },
  { key: 'financeExpenses', labelKey: 'expenses', icon: Receipt },
  { key: 'companyInvoices', labelKey: 'invoices', icon: FileText },
  { key: 'companyBookings', labelKey: 'bookings', icon: CalendarDays },
  { key: 'companyWorkOrders', labelKey: 'workOrders', icon: Wrench },
  { key: 'companyMaintenanceCertificates', labelKey: 'maintenanceCertificates', icon: Award },
  { key: 'companyShkService', labelKey: 'shkService', icon: Link },
  { key: 'companyCustomers', labelKey: 'customers', icon: UserCircle },
  { key: 'companyReports', labelKey: 'reports', icon: BarChart3 },
  { key: 'companySettings', labelKey: 'systemSettings', icon: Settings },
];

/* ── Sidebar Content ─────────────────────────────────────────────────────── */

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const t = useTranslation();
  const isMobile = useIsMobile();
  const {
    currentUser,
    currentCompany,
    currentView,
    setCurrentView,
    logout,
  } = useAppStore();

  const isAdmin = currentUser?.role === 'Admin';
  const menuItems = isAdmin ? ADMIN_MENU : COMPANY_MENU;

  // Hide settings for non-Manager company users
  const visibleItems = isAdmin
    ? menuItems
    : menuItems.filter((item) => {
        if (item.key === 'companySettings' && currentUser?.role !== 'Manager') return false;
        return true;
      });

  const handleNavigate = useCallback(
    (key: string) => {
      setCurrentView(key);
      if (onClose) onClose();
    },
    [setCurrentView, onClose]
  );

  const handleLogout = useCallback(() => {
    logout();
    if (onClose) onClose();
  }, [logout, onClose]);

  const initials = currentUser?.username
    ? currentUser.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-4 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <DollarSign className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold tracking-tight">IBS Pro</h2>
          <p className="text-[10px] text-sidebar-foreground/50 truncate">
            {currentCompany?.name ?? (isAdmin ? 'System Admin' : '')}
          </p>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* User info */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{currentUser?.username}</p>
            <div className="flex items-center gap-1">
              {isAdmin ? (
                <Shield className="h-3 w-3 text-primary" />
              ) : (
                <Building2 className="h-3 w-3 text-primary" />
              )}
              <p className="text-[11px] text-sidebar-foreground/60 truncate">
                {currentUser?.role}
                {currentCompany ? ` • ${currentCompany.name}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-sidebar-foreground/70'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                <span className="truncate">{t(item.labelKey as Parameters<typeof t>[0])}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="opacity-50" />

      {/* Bottom controls — returns null during SSR/hydration */}
      <SidebarBottomControls onLogout={handleLogout} />
    </div>
  );
}

/* ── AppSidebar (Desktop + Mobile) ──────────────────────────────────────── */

export function AppSidebar() {
  const t = useTranslation();
  const isMobile = useIsMobile();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAppStore();

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] z-40 h-10 w-10 rounded-lg shadow-sm border border-border/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('help')}</SheetTitle>
          </SheetHeader>
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div className="fixed inset-y-0 left-0 z-30 w-64 border-r border-sidebar-border bg-sidebar">
      <SidebarContent />
    </div>
  );
}
