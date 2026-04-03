'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { CURRENCIES, DEFAULT_SERVICE_OPTIONS } from '@/i18n/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Wrench,
  Tags,
  Trash2,
  Plus,
  Save,
  AlertTriangle,
  Settings,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Animation variants ─────────────────────────────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/* ── Default categories from translations ───────────────────────────────── */

const DEFAULT_INCOME_CATEGORIES = ['Service', 'Product Sales', 'Subscription', 'Other'];
const DEFAULT_EXPENSE_CATEGORIES = ['Salary', 'Rent', 'Utilities', 'Supplies', 'Marketing', 'Other'];

/* ── Types ─────────────────────────────────────────────────────────────── */

interface AppSettingsData {
  id?: string;
  services?: string[];
  incomeCategories?: string[];
  expenseCategories?: string[];
}

/* ── Main Settings Component ───────────────────────────────────────────── */

export default function CompanySettings() {
  const t = useTranslation();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentCompany = useAppStore((s) => s.currentCompany);
  const updateDataItem = useAppStore((s) => s.updateDataItem);

  // Only Manager can access settings
  if (currentUser?.role !== 'Manager') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          Only users with Manager role can access company settings.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">{t('systemSettings')}</h1>
        <p className="text-muted-foreground">Manage your company configuration and preferences</p>
      </motion.div>

      {/* Sections */}
      <CompanyDetailsSection />
      <ServicesSection />
      <CategoriesSection />
      <DangerZoneSection />
    </motion.div>
  );
}

/* ── Section 1: Company Details ────────────────────────────────────────── */

function CompanyDetailsSection() {
  const t = useTranslation();
  const currentCompany = useAppStore((s) => s.currentCompany);
  const updateDataItem = useAppStore((s) => s.updateDataItem);

  const [form, setForm] = useState({
    name: '',
    businessId: '',
    vat: '',
    vatId: '',
    accountNumber: '',
    address: '',
    zipCode: '',
    city: '',
    country: '',
    currency: 'EUR',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (currentCompany) {
      setForm({
        name: currentCompany.name || '',
        businessId: currentCompany.businessId || '',
        vat: currentCompany.vat || '',
        vatId: currentCompany.vatId || '',
        accountNumber: currentCompany.accountNumber || '',
        address: currentCompany.address || '',
        zipCode: currentCompany.zipCode || '',
        city: currentCompany.city || '',
        country: currentCompany.country || '',
        currency: currentCompany.currency || 'EUR',
        phone: currentCompany.phone || '',
        email: currentCompany.email || '',
      });
      setCode(currentCompany.code || '');
    }
  }, [currentCompany]);

  const handleSave = async () => {
    if (!currentCompany?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/companies/${currentCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      const updated = await res.json();
      updateDataItem('companies', currentCompany.id, updated);
      toast.success('Company details saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-teal-500" />
            Company Details
          </CardTitle>
          <CardDescription>Update your company information. IBAN and Y-tunnus are required for invoicing.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Billing info banner */}
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              💡 For bill payment invoices to be valid, make sure IBAN and Y-tunnus are filled in below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">{t('companyName')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('businessId')} (Code)</Label>
              <Input value={code} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400">Y-tunnus (Business ID) *</Label>
              <Input
                value={form.vatId}
                onChange={(e) => setForm((f) => ({ ...f, vatId: e.target.value }))}
                placeholder="e.g. FI12345678"
                className={!form.vatId ? 'border-amber-500/50' : ''}
              />
              <p className="text-[10px] text-muted-foreground">Finnish business identity code (e.g. FI1234567-8)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Puhelinnumero (Phone)</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. +358 40 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sähköposti (Email)</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="info@company.fi"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">VAT (%)</Label>
              <Input
                value={form.vat}
                onChange={(e) => setForm((f) => ({ ...f, vat: e.target.value }))}
                placeholder="e.g. 25.5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400">IBAN (Bank Account) *</Label>
              <Input
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                placeholder="e.g. FI12 3456 7890 1234 56"
                className={!form.accountNumber ? 'border-amber-500/50' : ''}
              />
              <p className="text-[10px] text-muted-foreground">Required for Bill payment invoices</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('currency')}</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([code, symbol]) => (
                    <SelectItem key={code} value={code}>
                      {code} ({symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs">{t('customerAddress')}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('zipCode')}</Label>
              <Input
                value={form.zipCode}
                onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                placeholder="Zip Code"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('city')}</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('country')}</Label>
              <Input
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Country"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Section 2: Services Management ────────────────────────────────────── */

function ServicesSection() {
  const t = useTranslation();
  const [services, setServices] = useState<string[]>([...DEFAULT_SERVICE_OPTIONS]);
  const [newService, setNewService] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load services from settings API
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data: AppSettingsData = await res.json();
          if (data.services && Array.isArray(data.services) && data.services.length > 0) {
            setServices(data.services);
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleAddService = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Service already exists');
      return;
    }
    setServices((prev) => [...prev, trimmed]);
    setNewService('');
  };

  const handleRemoveService = (index: number) => {
    const svc = services[index];
    // Cannot delete the last "Other work" option
    if (svc === '* Other work *' && services.filter((s) => s === '* Other work *').length <= 1) {
      toast.error('Cannot delete the last "Other work" option');
      return;
    }
    if (services.length <= 1) {
      toast.error('Must have at least one service');
      return;
    }
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get current settings first
      const res = await fetch('/api/settings');
      const currentSettings: AppSettingsData = await res.json();
      const updatedSettings = { ...currentSettings, services };
      const putRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (!putRes.ok) throw new Error('Failed to save');
      toast.success('Services saved successfully');
    } catch {
      toast.error('Failed to save services');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-teal-500" />
            {t('manageServices')}
          </CardTitle>
          <CardDescription>Manage available service types</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add new service */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder={t('addNewService')}
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
            />
            <Button variant="outline" size="sm" onClick={handleAddService} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t('add')}
            </Button>
          </div>

          {/* Services list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="space-y-1">
                {services.map((service, idx) => (
                  <div
                    key={`${service}-${idx}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{idx + 1}</span>
                      <span className="text-sm truncate">{service}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                      onClick={() => handleRemoveService(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{services.length} services</p>
            <Button onClick={handleSave} disabled={saving || loading} size="sm" className="gap-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {t('save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Section 3: Categories Management ──────────────────────────────────── */

function CategoriesSection() {
  const t = useTranslation();
  const [incomeCategories, setIncomeCategories] = useState<string[]>([...DEFAULT_INCOME_CATEGORIES]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([...DEFAULT_EXPENSE_CATEGORIES]);
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load categories from settings API
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data: AppSettingsData = await res.json();
          if (data.incomeCategories && Array.isArray(data.incomeCategories) && data.incomeCategories.length > 0) {
            setIncomeCategories(data.incomeCategories);
          }
          if (data.expenseCategories && Array.isArray(data.expenseCategories) && data.expenseCategories.length > 0) {
            setExpenseCategories(data.expenseCategories);
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const addCategory = useCallback(
    (type: 'income' | 'expense', name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const list = type === 'income' ? incomeCategories : expenseCategories;
      if (list.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        toast.error('Category already exists');
        return;
      }
      if (type === 'income') {
        setIncomeCategories((prev) => [...prev, trimmed]);
        setNewIncomeCat('');
      } else {
        setExpenseCategories((prev) => [...prev, trimmed]);
        setNewExpenseCat('');
      }
    },
    [incomeCategories, expenseCategories]
  );

  const removeCategory = useCallback(
    (type: 'income' | 'expense', index: number) => {
      const list = type === 'income' ? incomeCategories : expenseCategories;
      if (list.length <= 1) {
        toast.error('Must have at least one category');
        return;
      }
      if (type === 'income') {
        setIncomeCategories((prev) => prev.filter((_, i) => i !== index));
      } else {
        setExpenseCategories((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [incomeCategories, expenseCategories]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings');
      const currentSettings: AppSettingsData = await res.json();
      const updatedSettings = {
        ...currentSettings,
        incomeCategories,
        expenseCategories,
      };
      const putRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (!putRes.ok) throw new Error('Failed to save');
      toast.success('Categories saved successfully');
    } catch {
      toast.error('Failed to save categories');
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryList = (
    categories: string[],
    type: 'income' | 'expense',
    newValue: string,
    setNewValue: (v: string) => void,
    colorClass: string
  ) => (
    <div className="space-y-3">
      {/* Add new */}
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={t('addNewCategory')}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && addCategory(type, newValue)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => addCategory(type, newValue)}
          className="gap-1.5 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('add')}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="max-h-60">
          <div className="space-y-1">
            {categories.map((cat, idx) => (
              <div
                key={`${cat}-${idx}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colorClass}`}>
                    {type === 'income' ? '+' : '-'}
                  </Badge>
                  <span className="text-sm truncate">{cat}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                  onClick={() => removeCategory(type, idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      <p className="text-xs text-muted-foreground">{categories.length} categories</p>
    </div>
  );

  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="h-4 w-4 text-teal-500" />
            {t('manageCategories')}
          </CardTitle>
          <CardDescription>Manage income and expense categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Income Categories */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t('incomeCategoriesTitle')}
              </h3>
              {renderCategoryList(
                incomeCategories,
                'income',
                newIncomeCat,
                setNewIncomeCat,
                'border-emerald-500/30 text-emerald-500'
              )}
            </div>

            <Separator orientation="vertical" className="hidden lg:block h-auto" />
            <Separator className="lg:hidden" />

            {/* Expense Categories */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {t('expenseCategoriesTitle')}
              </h3>
              {renderCategoryList(
                expenseCategories,
                'expense',
                newExpenseCat,
                setNewExpenseCat,
                'border-red-500/30 text-red-500'
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading} size="sm" className="gap-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {t('save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Section 4: Danger Zone ────────────────────────────────────────────── */

function DangerZoneSection() {
  const t = useTranslation();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentCompany = useAppStore((s) => s.currentCompany);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const logout = useAppStore((s) => s.logout);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!currentCompany?.id) return;
    setResetting(true);
    try {
      const companyId = currentCompany.id;
      // Delete all company-related data via API
      const endpoints = [
        `/api/incomes?companyId=${companyId}`,
        `/api/expenses?companyId=${companyId}`,
        `/api/bookings?companyId=${companyId}`,
        `/api/work-orders?companyId=${companyId}`,
        `/api/maintenance-certificates?companyId=${companyId}`,
        `/api/shk-links?companyId=${companyId}`,
        `/api/customers?companyId=${companyId}`,
      ];

      // Fetch all data IDs first
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const item of data) {
              const entity = endpoint.split('?')[0];
              await fetch(`${entity}/${item.id}`, { method: 'DELETE' }).catch(() => {});
            }
          }
        }
      }

      clearAllData();
      toast.success('Company data has been reset');
      // Logout after a short delay
      setTimeout(() => logout(), 1500);
    } catch {
      toast.error('Failed to reset company data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <motion.div variants={item}>
      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-500">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions that affect your company data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-red-500/30 p-4">
            <div>
              <p className="text-sm font-medium">Reset All Company Data</p>
              <p className="text-xs text-muted-foreground">
                This will permanently delete all incomes, expenses, bookings, work orders, customers, and other data for this company.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2 shrink-0" disabled={resetting}>
                  {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Reset Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all company data including
                    incomes, expenses, bookings, work orders, maintenance certificates, SHK links, and customers.
                    You will be logged out after the reset.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-red-500 hover:bg-red-600">
                    Yes, reset all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
