'use client';

import { useAppStore } from '@/store/app-store';
import { translations, type Language, type TranslationKey } from '@/i18n/translations';

/**
 * Convenience hook to get the current translation function.
 * Usage: const t = useTranslation(); t('login')
 */
export function useTranslation() {
  const language = useAppStore((s) => s.language);

  return function t(key: TranslationKey): string {
    return (translations[language] as Record<string, string>)[key] ?? key;
  };
}

/**
 * Returns a raw array translation (e.g. carServicesList, incomeCategories).
 */
export function useArrayTranslation(key: 'carServicesList' | 'incomeCategories' | 'expenseCategories'): string[] {
  const language = useAppStore((s) => s.language);
  const value = translations[language][key];
  return Array.isArray(value) ? value : [];
}

export { type Language, type TranslationKey };
