'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { translations } from '@/i18n/translations';
import type { Language } from '@/i18n/translations';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Shield, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserForm {
  username: string;
  password: string;
  role: string;
  companyId: string;
}

const ROLES = ['Admin', 'Manager', 'Accountant', 'Staff', 'Viewer'];

const emptyForm: UserForm = {
  username: '',
  password: '',
  role: 'Staff',
  companyId: '',
};

export default function AdminUsers() {
  const { users, companies, currentUser, language, setData, removeDataItem, addDataItem, updateDataItem } = useAppStore();
  const t = (key: string) => translations[language as Language]?.[key] || key;
  const isRTL = language === 'AR';

  const isSuperAdmin = currentUser?.username === 'admin';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; username: string; role: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setData('users', data);
        }
      }
    } catch {
      // silent
    }
  }, [setData]);

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [users.length, fetchUsers]);

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return '-';
    const comp = companies.find((c) => c.id === companyId);
    return comp?.name || '-';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin': return 'default';
      case 'Manager': return 'secondary';
      case 'Accountant': return 'outline';
      case 'Staff': return 'secondary';
      default: return 'outline';
    }
  };

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: { id: string; username: string; role: string; companyId: string | null }) => {
    setForm({
      username: user.username,
      password: '',
      role: user.role,
      companyId: user.companyId || '',
    });
    setEditingId(user.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (user: { id: string; username: string; role: string }) => {
    setDeleteTarget({ id: user.id, username: user.username, role: user.role });
    setDeleteDialogOpen(true);
  };

  const canEditUser = (targetRole: string) => {
    if (!isSuperAdmin) return true; // non-admin users can edit non-admin users
    return true; // super admin can edit anyone
  };

  const canEditRole = (targetRole: string) => {
    if (isSuperAdmin) return true;
    return targetRole !== 'Admin';
  };

  const handleSubmit = async () => {
    if (!form.username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!editingId && !form.password.trim()) {
      toast.error('Password is required');
      return;
    }
    if (!isSuperAdmin && form.role === 'Admin') {
      toast.error('Only the super admin can create/edit Admin users');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        username: form.username,
        role: form.role,
        companyId: form.companyId || null,
      };
      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editingId) {
        const res = await fetch(`/api/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          updateDataItem('users', editingId, updated);
          toast.success(t('editUser') + ' success');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to update');
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, password: form.password }),
        });
        if (res.ok) {
          const created = await res.json();
          addDataItem('users', created);
          toast.success(t('addUser') + ' success');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to create');
        }
      }
      setDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.role === 'Admin' && deleteTarget.username === 'admin') {
      toast.error('Cannot delete the super admin account');
      setDeleteDialogOpen(false);
      return;
    }

    if (deleteTarget.role === 'Admin' && !isSuperAdmin) {
      toast.error('Only the super admin can delete Admin users');
      setDeleteDialogOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        removeDataItem('users', deleteTarget.id);
        toast.success('User deleted');
        fetchUsers();
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
            <Users className="size-6 text-emerald-500" />
            {t('usersManagement')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('addUser')}</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4 me-2" />
          {t('addUser')}
        </Button>
      </motion.div>

      {/* Info Banner for non-super-admin */}
      {!isSuperAdmin && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <ShieldAlert className="size-4 text-amber-500 shrink-0" />
            <span className="text-amber-600 dark:text-amber-400">
              You cannot create or modify Admin users. Only the super admin has this permission.
            </span>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No users found
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('username')}</TableHead>
                        <TableHead>{t('role')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('company')}</TableHead>
                        <TableHead className="text-end">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user, index) => {
                        const isSelf = currentUser?.id === user.id;
                        const isSuperAdminUser = user.username === 'admin' && user.role === 'Admin';
                        return (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-muted/50 border-b transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {isSuperAdminUser ? (
                                  <Shield className="size-4 text-amber-500" />
                                ) : (
                                  <Users className="size-4 text-muted-foreground" />
                                )}
                                {user.username}
                                {isSelf && (
                                  <Badge variant="outline" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(user.role)}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {getCompanyName(user.companyId)}
                            </TableCell>
                            <TableCell className="text-end">
                              <div className="flex items-center justify-end gap-1">
                                {(canEditRole(user.role) || isSuperAdmin) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEdit(user)}
                                    className="size-8"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                )}
                                {!isSelf && !isSuperAdminUser && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(user)}
                                    className="size-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                )}
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
                  {users.map((user) => {
                    const isSelf = currentUser?.id === user.id;
                    const isSuperAdminUser = user.username === 'admin' && user.role === 'Admin';
                    return (
                      <div key={user.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isSuperAdminUser ? (
                              <Shield className="size-4 text-amber-500 shrink-0" />
                            ) : (
                              <Users className="size-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-medium truncate">{user.username}</span>
                            {isSelf && (
                              <Badge variant="outline" className="text-xs shrink-0">You</Badge>
                            )}
                          </div>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="shrink-0">
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">
                          {getCompanyName(user.companyId)}
                        </p>
                        <div className="flex items-center gap-2 pl-6">
                          {(canEditRole(user.role) || isSuperAdmin) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => handleOpenEdit(user)}
                            >
                              <Pencil className="size-3.5" /> Edit
                            </Button>
                          )}
                          {!isSelf && !isSuperAdminUser && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <Trash2 className="size-3.5" /> Delete
                            </Button>
                          )}
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
              {editingId ? t('editUser') : t('addUser')}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update user information' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">{t('username')} *</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {t('password')} {editingId ? '(leave blank to keep)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? 'Leave blank to keep current' : 'Enter password'}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('role')} *</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm({ ...form, role: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                      disabled={role === 'Admin' && !isSuperAdmin}
                    >
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isSuperAdmin && form.role === 'Admin' && (
                <p className="text-xs text-destructive">Only the super admin can set Admin role</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>{t('companyAssignment')}</Label>
              <Select
                value={form.companyId}
                onValueChange={(value) => setForm({ ...form, companyId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select company (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Company --</SelectItem>
                  {companies.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name} ({comp.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.username.trim() || (!editingId && !form.password.trim())}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.role === 'Admin' && deleteTarget?.username !== 'admin' && !isSuperAdmin ? (
                <span className="text-destructive font-medium">
                  Only the super admin can delete Admin users.
                </span>
              ) : deleteTarget?.username === 'admin' ? (
                <span className="text-destructive font-medium">
                  Cannot delete the super admin account.
                </span>
              ) : (
                <>Are you sure you want to delete user &quot;{deleteTarget?.username}&quot;? This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            {deleteTarget &&
              deleteTarget.username !== 'admin' &&
              (isSuperAdmin || deleteTarget.role !== 'Admin') && (
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
