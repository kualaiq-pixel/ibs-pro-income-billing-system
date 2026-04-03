'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { useAppStore, type Language } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Globe, LogOut } from 'lucide-react';
import { CloudSyncIndicator } from '@/components/ibs/cloud-sync-indicator';

const LANGUAGES: { code: Language; flag: string }[] = [
  { code: 'EN', flag: '🇬🇧' },
  { code: 'FI', flag: '🇫🇮' },
  { code: 'AR', flag: '🇸🇦' },
];

// Stable references for useSyncExternalStore
const _emptySubscribe = () => () => {};
const _true = () => true;
const _false = () => false;

interface SidebarBottomControlsProps {
  onLogout: () => void;
}

/**
 * Bottom controls for the sidebar (cloud sync, language, theme toggle, logout).
 * Uses useSyncExternalStore to detect client mount.
 */
export function SidebarBottomControls({ onLogout }: SidebarBottomControlsProps) {
  const mounted = useSyncExternalStore(_emptySubscribe, _true, _false);

  const t = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useAppStore();

  const cycleLanguage = useCallback(() => {
    const idx = LANGUAGES.findIndex((l) => l.code === language);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLanguage(next.code);
  }, [language, setLanguage]);

  const handleToggleDarkMode = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch { /* silent */ }
  }, [theme, setTheme]);

  if (!mounted) return null;

  return (
    <div className="p-3 space-y-1 shrink-0">
      <div className="flex items-center gap-1 px-1 mb-2">
        <CloudSyncIndicator />
        <button
          onClick={cycleLanguage}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title={t('currentLanguage')}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{LANGUAGES.find((l) => l.code === language)?.flag}</span>
          <span className="hidden sm:inline">
            {LANGUAGES.find((l) => l.code === language)?.code}
          </span>
        </button>

        <button
          onClick={handleToggleDarkMode}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </span>
        </button>
      </div>

      <Button
        variant="ghost"
        onClick={onLogout}
        className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 px-3"
      >
        <LogOut className="h-4 w-4" />
        <span>{t('logout')}</span>
      </Button>
    </div>
  );
}
