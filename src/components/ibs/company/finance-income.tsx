'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useTranslation, useArrayTranslation } from '@/hooks/use-translation';
import { VehicleSelector } from '@/components/ibs/form-helpers';
import { CURRENCIES, DEFAULT_SERVICE_OPTIONS, VAT_RATES } from '@/i18n/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Wallet,
  X,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ServiceLine {
  _uid: string;
  description: string;
  price: number;
}

interface IncomeRecord {
  id: string;
  companyId: string;
  customerId: string | null;
  invoiceNumber: number;
  date: string;
  amount: number;
  services: Array<{ description: string; price: number }>;
  description: string;
  status: string;
  referenceNumber: string;
  vatRate: number;
  paymentMethod: string;
  category: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  customerDetails: Record<string, string> | null;
  customer: { id: string; name: string } | null;
  company: { id: string; name: string; currency: string } | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function genUid() {
  return Math.random().toString(36).substring(2, 10);
}

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

export default function FinanceIncome() {
  const t = useTranslation();
  const incomeCategories = useArrayTranslation('incomeCategories');
  const currentUser = useAppStore((s) => s.currentUser);
  const currentCompany = useAppStore((s) => s.currentCompany);
  const incomesStore = useAppStore((s) => s.incomes);
  const customersStore = useAppStore((s) => s.customers);
  const setData = useAppStore((s) => s.setData);

  const incomes = incomesStore as unknown as IncomeRecord[];
  const customers = customersStore as unknown as Array<{ id: string; name: string }>;

  const currencyCode = currentCompany?.currency ?? 'EUR';
  const currencySymbol = CURRENCIES[currencyCode] ?? currencyCode;
  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(todayStr());
  const [formCategory, setFormCategory] = useState(incomeCategories[0] ?? 'Service');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formIsIndividual, setFormIsIndividual] = useState(false);
  const [formIndName, setFormIndName] = useState('');
  const [formIndEmail, setFormIndEmail] = useState('');
  const [formIndAddress, setFormIndAddress] = useState('');
  const [formCarMake, setFormCarMake] = useState('');
  const [formCarModel, setFormCarModel] = useState('');
  const [formLicensePlate, setFormLicensePlate] = useState('');
  const [formServices, setFormServices] = useState<ServiceLine[]>([
    { _uid: genUid(), description: '', price: 0 },
  ]);
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Bill');
  const [formVatRate, setFormVatRate] = useState(25.5);

  // Computed totals — prices entered are VAT-inclusive (Gross Amount)
  // Formula: Gross = Net + VAT  →  Net = Gross / (1 + rate)  →  VAT = Gross − Net
  const grossTotal = useMemo(() => formServices.reduce((s, l) => s + (Number(l.price) || 0), 0), [formServices]);
  const netSubtotal = useMemo(() => grossTotal / (1 + formVatRate / 100), [grossTotal, formVatRate]);
  const extractedVat = useMemo(() => grossTotal - netSubtotal, [grossTotal, netSubtotal]);

  // ── Refetch helper ────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!currentUser?.companyId) return;
    try {
      const res = await fetch(`/api/incomes?companyId=${currentUser.companyId}`);
      if (res.ok) {
        const data = await res.json();
        setData('incomes', data);
      }
    } catch { /* silent */ }
  }, [currentUser?.companyId, setData]);

  // ── Reset form ────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormDate(todayStr());
    setFormCategory(incomeCategories[0] ?? 'Service');
    setFormCustomerId('');
    setFormIsIndividual(false);
    setFormIndName('');
    setFormIndEmail('');
    setFormIndAddress('');
    setFormCarMake('');
    setFormCarModel('');
    setFormLicensePlate('');
    setFormServices([{ _uid: genUid(), description: '', price: 0 }]);
    setFormDescription('');
    setFormPaymentMethod('Bill');
    setFormVatRate(25.5);
    setEditingId(null);
  }, [incomeCategories]);

  // ── Open dialog for add/edit ──────────────────────────────────────────
  const handleOpenAdd = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const handleOpenEdit = useCallback(
    (record: IncomeRecord) => {
      setEditingId(record.id);
      setFormDate(record.date);
      setFormCategory(record.category);
      setFormCustomerId(record.customerId ?? '');
      setFormIsIndividual(!record.customerId && !!record.customerDetails);
      setFormIndName(record.customerDetails?.name ?? '');
      setFormIndEmail(record.customerDetails?.email ?? '');
      setFormIndAddress(record.customerDetails?.address ?? '');
      setFormCarMake(record.carMake ?? '');
      setFormCarModel(record.carModel ?? '');
      setFormLicensePlate(record.licensePlate ?? '');
      const services = Array.isArray(record.services)
        ? record.services.map((s) => ({ _uid: genUid(), description: s.description ?? '', price: Number(s.price) || 0 }))
        : [];
      setFormServices(services.length > 0 ? services : [{ _uid: genUid(), description: '', price: 0 }]);
      setFormDescription(record.description ?? '');
      setFormPaymentMethod(record.paymentMethod ?? 'Bill');
      setFormVatRate(Number(record.vatRate) || 25.5);
      setDialogOpen(true);
    },
    []
  );

  // ── Service line management ───────────────────────────────────────────
  const addServiceLine = useCallback(() => {
    setFormServices((prev) => [...prev, { _uid: genUid(), description: '', price: 0 }]);
  }, []);

  const updateServiceLine = useCallback((uid: string, field: keyof ServiceLine, value: string | number) => {
    setFormServices((prev) =>
      prev.map((l) => (l._uid === uid ? { ...l, [field]: value } : l))
    );
  }, []);

  const removeServiceLine = useCallback((uid: string) => {
    setFormServices((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((l) => l._uid !== uid);
    });
  }, []);

  // ── Save (create / update) ────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!currentUser?.companyId) return;
    if (grossTotal <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const customerDetails = formIsIndividual
        ? { name: formIndName, email: formIndEmail, address: formIndAddress }
        : null;

      const payload: Record<string, unknown> = {
        companyId: currentUser.companyId,
        date: formDate,
        amount: grossTotal,
        category: formCategory,
        description: formDescription,
        paymentMethod: formPaymentMethod,
        vatRate: formVatRate,
        status: 'Pending',
        customerId: formIsIndividual ? null : formCustomerId || null,
        customerDetails,
        carMake: formCarMake,
        carModel: formCarModel,
        licensePlate: formLicensePlate,
        services: formServices
          .filter((s) => s.description && s.price > 0)
          .map((s) => ({ description: s.description, price: s.price })),
      };

      const url = editingId ? `/api/incomes/${editingId}` : '/api/incomes';
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

      toast.success(editingId ? 'Income updated successfully' : 'Income created successfully');
      setDialogOpen(false);
      resetForm();
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [
    currentUser?.companyId, editingId, netSubtotal, grossTotal, formDate,
    formCategory, formDescription, formPaymentMethod, formVatRate,
    formIsIndividual, formCustomerId, formIndName, formIndEmail, formIndAddress,
    formCarMake, formCarModel, formLicensePlate, formServices,
    resetForm, refetch,
  ]);

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/incomes/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Income deleted successfully');
      setDeleteId(null);
      await refetch();
    } catch {
      toast.error('Failed to delete income');
    }
  }, [deleteId, refetch]);

  // ── Toggle status ─────────────────────────────────────────────────────
  const handleToggleStatus = useCallback(
    async (record: IncomeRecord) => {
      const newStatus = record.status === 'Paid' ? 'Pending' : 'Paid';
      setTogglingStatus(record.id);
      try {
        const res = await fetch(`/api/incomes/${record.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error('Toggle failed');
        toast.success(`Status changed to ${newStatus}`);
        await refetch();
      } catch {
        toast.error('Failed to update status');
      } finally {
        setTogglingStatus(null);
      }
    },
    [refetch]
  );

  // Get customer name
  const getCustomerName = useCallback(
    (record: IncomeRecord) => {
      if (record.customer?.name) return record.customer.name;
      if (record.customerDetails?.name) return record.customerDetails.name;
      return '—';
    },
    []
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('income')}</h1>
          <p className="text-muted-foreground">{t('manageServices')}</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" /> {t('addIncome')}
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t('invoiceId')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('customerName')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('description')}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t('paymentMethod')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('edit')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No income records yet. Click &quot;{t('addIncome')}&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomes.map((inc, idx) => (
                      <TableRow key={inc.id} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                        <TableCell className="font-mono text-xs">#{inc.invoiceNumber}</TableCell>
                        <TableCell className="whitespace-nowrap">{inc.date}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{getCustomerName(inc)}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {inc.description || inc.category}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{inc.paymentMethod}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-500 whitespace-nowrap">
                          {fmt(inc.amount)}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleStatus(inc)}
                            disabled={togglingStatus === inc.id}
                            className="group flex items-center gap-1.5"
                          >
                            {inc.status === 'Paid' ? (
                              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 cursor-pointer gap-1">
                                <Clock className="h-3 w-3" /> Pending
                              </Badge>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(inc)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(inc.id)}
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
              {incomes.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Wallet className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No income records yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {incomes.map((inc) => (
                    <div key={inc.id} className="p-3 space-y-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">#{inc.invoiceNumber}</span>
                        <button
                          onClick={() => handleToggleStatus(inc)}
                          disabled={togglingStatus === inc.id}
                        >
                          {inc.status === 'Paid' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 cursor-pointer gap-1 text-[11px]">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500/30 text-amber-500 cursor-pointer gap-1 text-[11px]">
                              <Clock className="h-2.5 w-2.5" /> Pending
                            </Badge>
                          )}
                        </button>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{getCustomerName(inc)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{inc.date} • {inc.paymentMethod}</p>
                        </div>
                        <p className="text-sm font-semibold text-emerald-500 whitespace-nowrap">{fmt(inc.amount)}</p>
                      </div>
                      <div className="flex items-center justify-end gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => handleOpenEdit(inc)}
                        >
                          <Pencil className="h-3 w-3" /> {t('edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(inc.id)}
                        >
                          <Trash2 className="h-3 w-3" /> {t('delete')}
                        </Button>
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
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingId ? t('editTransaction') : t('addIncome')}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update income details below.' : 'Fill in the details to create a new income record.'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[65dvh] pr-1">
            <div className="space-y-5 py-2">
              {/* Row: Date + Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="incDate">{t('date')}</Label>
                  <Input id="incDate" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('category')}</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {incomeCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Selection */}
              <div className="space-y-3">
                <Label>{t('customerName')}</Label>
                <Select
                  value={formIsIndividual ? '__individual__' : formCustomerId}
                  onValueChange={(v) => {
                    if (v === '__individual__') {
                      setFormIsIndividual(true);
                      setFormCustomerId('');
                    } else {
                      setFormIsIndividual(false);
                      setFormCustomerId(v);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    <SelectItem value="__individual__">{t('addIndividualCustomer')}</SelectItem>
                  </SelectContent>
                </Select>

                {formIsIndividual && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border border-dashed p-3"
                  >
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t('customerName')}</Label>
                      <Input value={formIndName} onChange={(e) => setFormIndName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t('customerEmail')}</Label>
                      <Input type="email" value={formIndEmail} onChange={(e) => setFormIndEmail(e.target.value)} placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">{t('customerAddress')}</Label>
                      <Input value={formIndAddress} onChange={(e) => setFormIndAddress(e.target.value)} placeholder="123 Main St" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Vehicle Details */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('vehicleDetails')}</Label>
                <VehicleSelector
                  carMake={formCarMake}
                  carModel={formCarModel}
                  licensePlate={formLicensePlate}
                  onCarMakeChange={setFormCarMake}
                  onCarModelChange={setFormCarModel}
                  onLicensePlateChange={setFormLicensePlate}
                />
              </div>

              <Separator />

              {/* Service Lines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('services')}</Label>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addServiceLine}>
                    <Plus className="h-3 w-3" /> {t('addItem')}
                  </Button>
                </div>

                <div className="space-y-2">
                  {formServices.map((line) => (
                    <div key={line._uid} className="rounded-lg border p-2.5 space-y-2 sm:p-0 sm:border-0 sm:space-y-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        {/* Description dropdown */}
                        <div className="flex-1">
                          <Select
                            value={
                              DEFAULT_SERVICE_OPTIONS.includes(line.description as typeof DEFAULT_SERVICE_OPTIONS[number])
                                ? line.description
                                : line.description ? '__other__' : ''
                            }
                            onValueChange={(v) => {
                              if (v === '__other__') {
                                updateServiceLine(line._uid, 'description', '');
                              } else {
                                updateServiceLine(line._uid, 'description', v);
                              }
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={t('selectService')} />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {DEFAULT_SERVICE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* Show custom input when description is not in the default list */}
                          {!DEFAULT_SERVICE_OPTIONS.includes(line.description as typeof DEFAULT_SERVICE_OPTIONS[number]) && (
                            <Input
                              className="mt-1.5 h-9"
                              value={line.description}
                              onChange={(e) => updateServiceLine(line._uid, 'description', e.target.value)}
                              placeholder={t('otherSpecify')}
                              autoFocus
                            />
                          )}
                        </div>
                        {/* Price (Gross — incl. VAT) */}
                        <div className="w-full sm:w-28 shrink-0">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {currencySymbol}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-9 pl-8 text-right"
                              value={line.price || ''}
                              onChange={(e) => updateServiceLine(line._uid, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              title="Final price including VAT (Gross Amount)"
                            />
                          </div>
                        </div>
                        {/* Remove */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 shrink-0 self-end text-muted-foreground hover:text-destructive sm:self-center"
                          onClick={() => removeServiceLine(line._uid)}
                          disabled={formServices.length <= 1}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="incDesc">{t('description')}</Label>
                <Textarea
                  id="incDesc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional notes or details..."
                  rows={2}
                />
              </div>

              {/* Row: Payment Method + VAT Rate */}
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

              {/* Totals — Gross Amount = Net + VAT (prices entered are VAT-inclusive) */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-xs text-muted-foreground mb-1">Prices entered are the final amount the customer pays (VAT included).</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Net Amount (excl. VAT)</span>
                  <span className="font-medium">{fmt(netSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({formVatRate}%)</span>
                  <span className="font-medium">{fmt(extractedVat)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold">Total (incl. VAT)</span>
                  <span className="font-bold text-lg text-emerald-500">{fmt(grossTotal)}</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || grossTotal <= 0} className="gap-2">
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Wallet className="h-4 w-4" />
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
            <AlertDialogTitle>{t('delete')} Income</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income record? This action cannot be undone.
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
