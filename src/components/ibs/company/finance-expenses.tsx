'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useTranslation, useArrayTranslation } from '@/hooks/use-translation';
import { CURRENCIES, VAT_RATES } from '@/i18n/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Pencil,
  Trash2,
  Receipt,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ExpenseRecord {
  id: string;
  companyId: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  vatRate: number;
  paymentMethod: string;
  company: { id: string; name: string; currency: string } | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/* ── Animation ──────────────────────────────────────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

/* ── Component ──────────────────────────────────────────────────────────── */

export default function FinanceExpenses() {
  const t = useTranslation();
  const expenseCategories = useArrayTranslation('expenseCategories');
  const currentUser = useAppStore((s) => s.currentUser);
  const currentCompany = useAppStore((s) => s.currentCompany);
  const expensesStore = useAppStore((s) => s.expenses);
  const setData = useAppStore((s) => s.setData);

  const expenses = expensesStore as unknown as ExpenseRecord[];

  const currencyCode = currentCompany?.currency ?? 'EUR';
  const currencySymbol = CURRENCIES[currencyCode] ?? currencyCode;
  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(todayStr());
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState(expenseCategories[0] ?? 'Salary');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Bill');
  const [formVatRate, setFormVatRate] = useState(0);

  // Computed — amount entered is VAT-inclusive (Gross Amount)
  // Formula: Gross = Net + VAT  →  Net = Gross / (1 + rate)  →  VAT = Gross − Net
  const grossAmount = Number(formAmount) || 0;
  const netSubtotal = grossAmount / (1 + formVatRate / 100);
  const extractedVat = grossAmount - netSubtotal;

  // ── Refetch ────────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!currentUser?.companyId) return;
    try {
      const res = await fetch(`/api/expenses?companyId=${currentUser.companyId}`);
      if (res.ok) {
        const data = await res.json();
        setData('expenses', data);
      }
    } catch { /* silent */ }
  }, [currentUser?.companyId, setData]);

  // ── Reset form ────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormDate(todayStr());
    setFormAmount('');
    setFormCategory(expenseCategories[0] ?? 'Salary');
    setFormDescription('');
    setFormPaymentMethod('Bill');
    setFormVatRate(0);
    setEditingId(null);
  }, [expenseCategories]);

  // ── Open add/edit ─────────────────────────────────────────────────────
  const handleOpenAdd = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const handleOpenEdit = useCallback((record: ExpenseRecord) => {
    setEditingId(record.id);
    setFormDate(record.date);
    setFormAmount(String(record.amount));
    setFormCategory(record.category || expenseCategories[0]);
    setFormDescription(record.description ?? '');
    setFormPaymentMethod(record.paymentMethod ?? 'Bill');
    setFormVatRate(Number(record.vatRate) || 0);
    setDialogOpen(true);
  }, [expenseCategories]);

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!currentUser?.companyId) return;
    if (grossAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        companyId: currentUser.companyId,
        date: formDate,
        amount: grossAmount,
        category: formCategory,
        description: formDescription,
        paymentMethod: formPaymentMethod,
        vatRate: formVatRate,
      };

      const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Save failed');
      }

      toast.success(editingId ? 'Expense updated successfully' : 'Expense created successfully');
      setDialogOpen(false);
      resetForm();
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [
    currentUser?.companyId, editingId, grossAmount, formDate, formCategory,
    formDescription, formPaymentMethod, formVatRate, resetForm, refetch,
  ]);

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Expense deleted successfully');
      setDeleteId(null);
      await refetch();
    } catch {
      toast.error('Failed to delete expense');
    }
  }, [deleteId, refetch]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('expenses')}</h1>
          <p className="text-muted-foreground">Manage your company expenses</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" /> {t('addExpense')}
        </Button>
      </motion.div>

      {/* Responsive Table / Cards */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">{t('transactionId')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('description')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('paymentMethod')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                    <TableHead className="text-right">{t('edit')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No expense records yet. Click &quot;{t('addExpense')}&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((exp, idx) => (
                      <TableRow key={exp.id} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                        <TableCell className="font-mono text-xs">
                          {exp.id.substring(0, 8)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{exp.date}</TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            {exp.category || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {exp.description || '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{exp.paymentMethod}</TableCell>
                        <TableCell className="text-right font-semibold text-red-500 whitespace-nowrap">
                          -{fmt(exp.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(exp)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(exp.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List */}
            <div className="sm:hidden">
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No expense records yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-3 space-y-2 hover:bg-muted/30 transition-colors">
                      {/* Top row: transaction ID + category badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {exp.id.substring(0, 12)}
                        </span>
                        <span className="inline-flex shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                          {exp.category || '—'}
                        </span>
                      </div>

                      {/* Middle: description, date, payment method */}
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium truncate">
                          {exp.description || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exp.date}
                          {exp.paymentMethod && (
                            <span className="ml-2">· {exp.paymentMethod}</span>
                          )}
                        </p>
                      </div>

                      {/* Bottom: amount + actions */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-red-500">
                          -{fmt(exp.amount)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => handleOpenEdit(exp)}
                          >
                            <Pencil className="h-3 w-3" />
                            <span>{t('edit')}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(exp.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>{t('delete')}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Add/Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingId ? t('editTransaction') : t('addExpense')}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update expense details below.' : 'Fill in the details to record a new expense.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0">
            {/* Date + Category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expDate">{t('date')}</Label>
                <Input id="expDate" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('category')}</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="expAmount">{t('amount')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  id="expAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-8"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="expDesc">{t('description')}</Label>
              <Textarea
                id="expDesc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            {/* Payment Method + VAT Rate */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('paymentMethod')}</Label>
                <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Card">{t('card')}</SelectItem>
                    <SelectItem value="Bill">{t('bill')}</SelectItem>
                    <SelectItem value="Cash">{t('cash')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('vatRate')}</Label>
                <Select value={String(formVatRate)} onValueChange={(v) => setFormVatRate(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VAT_RATES.map((rate) => (
                      <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Totals preview — amount is VAT-inclusive (Gross) */}
            {grossAmount > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs text-muted-foreground mb-1">Amount entered is the final price paid (VAT included).</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Net Amount (excl. VAT)</span>
                  <span>{fmt(netSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({formVatRate}%)</span>
                  <span>{fmt(extractedVat)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Total (incl. VAT)</span>
                  <span className="text-red-500">{fmt(grossAmount)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || grossAmount <= 0} className="gap-2">
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Receipt className="h-4 w-4" />
              )}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')} Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
