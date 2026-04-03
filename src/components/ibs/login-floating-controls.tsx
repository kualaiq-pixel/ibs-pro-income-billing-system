'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { useAppStore, type Language } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Globe } from 'lucide-react';

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: 'EN', flag: '🇬🇧', label: 'English' },
  { code: 'FI', flag: '🇫🇮', label: 'Suomi' },
  { code: 'AR', flag: '🇸🇦', label: 'العربية' },
];

// Stable references — useSyncExternalStore requires these to be stable
// across renders to avoid infinite re-subscriptions.
const _emptySubscribe = () => () => {};
const _true = () => true;
const _false = () => false;

/**
 * Floating controls for the login page (language + theme toggle).
 * Uses useSyncExternalStore to detect client mount:
 * - Server SSR: getServerSnapshot → false → render null
 * - Hydration: getServerSnapshot → false → render null (matches server)
 * - Post-hydration: getSnapshot → true → re-render with controls
 */
export function LoginFloatingControls() {
  const mounted = useSyncExternalStore(_emptySubscribe, _true, _false);

  const t = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useAppStore();

  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';

  const cycleLanguage = useCallback(() => {
    const idx = LANGUAGES.findIndex((l) => l.code === language);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLanguage(next.code);
  }, [language, setLanguage]);

  if (!mounted) return null;

  return (
    <>
      {/* Floating controls */}
      <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] flex items-center gap-1.5 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={cycleLanguage}
          className="h-8 w-8 rounded-full sm:h-9 sm:w-9"
          title={t('currentLanguage')}
        >
          <span className="text-sm sm:text-base">
            {LANGUAGES.find((l) => l.code === language)?.flag}
          </span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 rounded-full sm:h-9 sm:w-9"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
            {resolvedTheme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </span>
        </Button>
      </div>

      {/* Language label */}
      <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] z-50 hidden sm:block">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-full">
          <Globe className="h-3 w-3" />
          {LANGUAGES.find((l) => l.code === language)?.label}
        </div>
      </div>
    </>
  );
}
