'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Plus,
  Pencil,
  Trash2,
  UserCircle,
  Search,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface CustomerRecord {
  id: string;
  companyId: string;
  name: string;
  email: string;
  address: string;
  _count?: { incomes: number; bookings: number };
  company: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
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

export default function CompanyCustomers() {
  const t = useTranslation();
  const currentUser = useAppStore((s) => s.currentUser);
  const customersStore = useAppStore((s) => s.customers);
  const setData = useAppStore((s) => s.setData);

  const customers = customersStore as unknown as CustomerRecord[];

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // ── Refetch ────────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!currentUser?.companyId) return;
    try {
      const res = await fetch(`/api/customers?companyId=${currentUser.companyId}`);
      if (res.ok) {
        const data = await res.json();
        setData('customers', data);
      }
    } catch { /* silent */ }
  }, [currentUser?.companyId, setData]);

  // ── Reset form ────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormName('');
    setFormEmail('');
    setFormAddress('');
    setEditingId(null);
  }, []);

  // ── Open add/edit ─────────────────────────────────────────────────────
  const handleOpenAdd = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const handleOpenEdit = useCallback((record: CustomerRecord) => {
    setEditingId(record.id);
    setFormName(record.name);
    setFormEmail(record.email ?? '');
    setFormAddress(record.address ?? '');
    setDialogOpen(true);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!currentUser?.companyId) return;
    if (!formName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        companyId: currentUser.companyId,
        name: formName.trim(),
        email: formEmail.trim(),
        address: formAddress.trim(),
      };

      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
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

      toast.success(editingId ? 'Customer updated successfully' : 'Customer created successfully');
      setDialogOpen(false);
      resetForm();
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [currentUser?.companyId, editingId, formName, formEmail, formAddress, resetForm, refetch]);

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/customers/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Customer deleted successfully');
      setDeleteId(null);
      await refetch();
    } catch {
      toast.error('Failed to delete customer');
    }
  }, [deleteId, refetch]);

  // ── Filtered customers ────────────────────────────────────────────────
  const filteredCustomers = searchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('customers')}</h1>
          <p className="text-muted-foreground">{t('manageCustomers')}</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" /> {t('addCustomer')}
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={item}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {searchQuery
                  ? 'No customers found matching your search.'
                  : 'No customers yet. Click "Add Customer" to create one.'}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('customerName')}</TableHead>
                        <TableHead>{t('customerEmail')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('customerAddress')}</TableHead>
                        <TableHead className="text-center hidden lg:table-cell">Invoices</TableHead>
                        <TableHead className="text-right">{t('edit')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((cust, idx) => (
                        <TableRow key={cust.id} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UserCircle className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{cust.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {cust.email || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                            {cust.address || '—'}
                          </TableCell>
                          <TableCell className="text-center hidden lg:table-cell">
                            <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                              {cust._count?.incomes ?? 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleOpenEdit(cust)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(cust.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y">
                  {filteredCustomers.map((cust) => (
                    <div key={cust.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserCircle className="h-4 w-4" />
                          </div>
                          <span className="font-medium truncate">{cust.name}</span>
                        </div>
                        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium shrink-0">
                          {cust._count?.incomes ?? 0} invoices
                        </span>
                      </div>
                      {cust.email && (
                        <p className="text-sm text-muted-foreground pl-12">{cust.email}</p>
                      )}
                      {cust.address && (
                        <p className="text-sm text-muted-foreground pl-12 truncate">{cust.address}</p>
                      )}
                      <div className="flex items-center gap-2 pl-12">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => handleOpenEdit(cust)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(cust.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Add/Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingId ? t('editCustomer') : t('addCustomer')}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update customer information below.' : 'Fill in the details to add a new customer.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="custName">{t('customerName')} <span className="text-destructive">*</span></Label>
              <Input
                id="custName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Customer name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custEmail">{t('customerEmail')}</Label>
              <Input
                id="custEmail"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custAddr">{t('customerAddress')}</Label>
              <Input
                id="custAddr"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Street, City, Country"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()} className="gap-2">
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <UserCircle className="h-4 w-4" />
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
            <AlertDialogTitle>{t('delete')} {t('customer')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
              Any linked invoices and bookings will remain but will lose their customer reference.
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
