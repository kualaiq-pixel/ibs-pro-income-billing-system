'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { translations } from '@/i18n/translations';
import type { Language } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyForm {
  name: string;
  code: string;
  vat: string;
  vatId: string;
  accountNumber: string;
}

const emptyForm: CompanyForm = {
  name: '',
  code: '',
  vat: '',
  vatId: '',
  accountNumber: '',
};

export default function AdminCompanies() {
  const { companies, users, language, setData, removeDataItem, addDataItem, updateDataItem } = useAppStore();
  const t = (key: string) => translations[language as Language]?.[key] || key;
  const isRTL = language === 'AR';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; userCount: number } | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setData('companies', data);
        }
      }
    } catch {
      // silent
    }
  }, [setData]);

  useEffect(() => {
    if (companies.length === 0) {
      fetchCompanies();
    }
  }, [companies.length, fetchCompanies]);

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (company: { id: string; name: string; code: string; vat?: string; vatId?: string; accountNumber?: string }) => {
    setForm({
      name: company.name,
      code: company.code,
      vat: company.vat || '',
      vatId: company.vatId || '',
      accountNumber: company.accountNumber || '',
    });
    setEditingId(company.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (company: { id: string; name: string }) => {
    const userCount = users.filter((u) => u.companyId === company.id).length;
    setDeleteTarget({ id: company.id, name: company.name, userCount });
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and Code are required');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/companies/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = await res.json();
          updateDataItem('companies', editingId, updated);
          toast.success(t('companyName') + ' updated');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to update');
        }
      } else {
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = await res.json();
          addDataItem('companies', created);
          toast.success(t('companyName') + ' created');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to create');
        }
      }
      setDialogOpen(false);
      fetchCompanies();
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.userCount > 0) {
      toast.error(`Cannot delete: ${deleteTarget.userCount} user(s) assigned to this company`);
      setDeleteDialogOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        removeDataItem('companies', deleteTarget.id);
        toast.success(t('companyName') + ' deleted');
        fetchCompanies();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      dir={isRTL ? 'rtl' : 'ltr'}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="size-6 text-teal-500" />
            {t('manageCompanies')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('companiesManagement')}</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="size-4 me-2" />
          {t('addCompany')}
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {companies.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No companies found
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('companyName')}</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="hidden md:table-cell">{t('vatId')}</TableHead>
                        <TableHead className="hidden lg:table-cell">{t('accountNumber')}</TableHead>
                        <TableHead className="text-end">{t('role')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company, index) => {
                        const userCount = users.filter((u) => u.companyId === company.id).length;
                        return (
                          <motion.tr
                            key={company.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-muted/50 border-b transition-colors"
                          >
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{company.code}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {company.vat || '-'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground font-mono text-xs">
                              {company.accountNumber || '-'}
                            </TableCell>
                            <TableCell className="text-end">
                              <div className="flex items-center justify-end gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {userCount} {t('usersManagement').toLowerCase()}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(company)}
                                  className="size-8"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(company)}
                                  className="size-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y">
                  {companies.map((company) => {
                    const userCount = users.filter((u) => u.companyId === company.id).length;
                    return (
                      <div key={company.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{company.name}</p>
                            <Badge variant="outline" className="mt-1">{company.code}</Badge>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {userCount} users
                          </Badge>
                        </div>
                        {(company.vat || company.accountNumber) && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {company.vat && <p>VAT: {company.vat}</p>}
                            {company.accountNumber && <p className="font-mono">Account: {company.accountNumber}</p>}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => handleOpenEdit(company)}
                          >
                            <Pencil className="size-3.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(company)}
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('editCompany') : t('addCompany')}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update company information' : 'Add a new company to the system'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('companyName')} *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. DC001"
                disabled={!!editingId}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vat">VAT</Label>
                <Input
                  id="vat"
                  value={form.vat}
                  onChange={(e) => setForm({ ...form, vat: e.target.value })}
                  placeholder="e.g. FI12345678"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vatId">{t('vatId')}</Label>
                <Input
                  id="vatId"
                  value={form.vatId}
                  onChange={(e) => setForm({ ...form, vatId: e.target.value })}
                  placeholder="e.g. FI12345678"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountNumber">{t('accountNumber')}</Label>
              <Input
                id="accountNumber"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="e.g. FI12 3456 7890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.name.trim() || !form.code.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? '...' : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.userCount > 0 ? (
                <span className="text-destructive font-medium">
                  Cannot delete &quot;{deleteTarget.name}&quot;. There are {deleteTarget.userCount} user(s) assigned to this company. Please reassign or remove users first.
                </span>
              ) : (
                <>Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            {deleteTarget && deleteTarget.userCount === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {loading ? '...' : t('delete')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
