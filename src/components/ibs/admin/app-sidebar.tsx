'use client';

import { useAppStore } from '@/store/app-store';
import { translations } from '@/i18n/translations';
import type { Language } from '@/i18n/translations';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Users,
  ArrowLeftRight,
  FileText,
  LogOut,
  Shield,
} from 'lucide-react';

export default function AppSidebar() {
  const { currentView, setCurrentView, language, logout, currentUser } = useAppStore();
  const t = (key: string) => translations[language as Language]?.[key] || key;
  const isRTL = language === 'AR';

  const menuItems = [
    {
      key: 'adminDashboard',
      label: t('home'),
      icon: LayoutDashboard,
    },
    {
      key: 'adminCompanies',
      label: t('companiesManagement'),
      icon: Building2,
    },
    {
      key: 'adminUsers',
      label: t('usersManagement'),
      icon: Users,
    },
    {
      key: 'adminDataIE',
      label: t('importExportData'),
      icon: ArrowLeftRight,
    },
    {
      key: 'adminLogs',
      label: t('auditLogs'),
      icon: FileText,
    },
  ];

  return (
    <Sidebar collapsible="icon" side={isRTL ? 'right' : 'left'}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-sm">
            IB
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold truncate">IBS Pro</span>
            <span className="text-xs text-muted-foreground truncate">{t('adminDashboard')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            {t('adminDashboard')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={currentView === item.key}
                    onClick={() => setCurrentView(item.key)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="group-data-[collapsible=icon]:p-2!">
              <Shield className="size-4 text-teal-500" />
              <span className="truncate group-data-[collapsible=icon]:hidden">
                {currentUser?.username || 'admin'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip={t('logout')}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
