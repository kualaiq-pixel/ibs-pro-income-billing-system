'use client';

import { useState, useCallback } from 'react';
import { useAppStore, type ShkLink } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Link2,
  Copy,
  Check,
  User,
  Lock,
} from 'lucide-react';

/* ── Form Interface ───────────────────────────────────────────────────────── */

interface ShkLinkForm {
  name: string;
  url: string;
  username: string;
  password: string;
}

const emptyForm: ShkLinkForm = {
  name: '',
  url: '',
  username: '',
  password: '',
};

/* ── Copy to Clipboard helper ─────────────────────────────────────────────── */

function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      onClick={handleCopy}
      title={label}
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

/* ── Single Link Card ─────────────────────────────────────────────────────── */

function ShkLinkCard({
  link,
  onEdit,
  onDelete,
}: {
  link: ShkLink;
  onEdit: (link: ShkLink) => void;
  onDelete: (link: ShkLink) => void;
}) {
  const t = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="group transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Link2 className="size-4 text-teal-500 shrink-0" />
                <span className="truncate">{link.name}</span>
              </CardTitle>
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                title={t('openLink')}
              >
                <ExternalLink className="size-3.5 text-blue-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onEdit(link)}
                title={t('edit')}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onDelete(link)}
                title={t('delete')}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* URL */}
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
            <Link2 className="size-3.5 text-muted-foreground shrink-0" />
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline truncate block min-w-0"
            >
              {link.url}
            </a>
          </div>

          {/* Username & Password (if present) */}
          {(link.username || link.password) && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {link.username && (
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <User className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1 min-w-0">{link.username}</span>
                  <CopyButton text={link.username} label={t('copyUsername')} />
                </div>
              )}
              {link.password && (
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1 min-w-0 font-mono">{'•'.repeat(Math.min(link.password.length, 12))}</span>
                  <CopyButton text={link.password} label={t('copyPassword')} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function CompanyShkService() {
  const t = useTranslation();
  const language = useAppStore((s) => s.language);
  const isRTL = language === 'AR';
  const shkLinks = useAppStore((s) => s.shkLinks);
  const setData = useAppStore((s) => s.setData);
  const addDataItem = useAppStore((s) => s.addDataItem);
  const updateDataItem = useAppStore((s) => s.updateDataItem);
  const removeDataItem = useAppStore((s) => s.removeDataItem);
  const currentUser = useAppStore((s) => s.currentUser);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShkLinkForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShkLink | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const cid = currentUser?.companyId;
      const res = await fetch(`/api/shk-links?companyId=${cid}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setData('shkLinks', data);
      }
    } catch { /* silent */ }
  }, [currentUser?.companyId, setData]);

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (link: ShkLink) => {
    setForm({
      name: link.name,
      url: link.url,
      username: link.username ?? '',
      password: link.password ?? '',
    });
    setEditingId(link.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (link: ShkLink) => {
    setDeleteTarget(link);
    setDeleteDialogOpen(true);
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Link name is required');
      return;
    }
    if (!form.url.trim() || !isValidUrl(form.url.trim())) {
      toast.error('A valid URL is required (e.g. https://example.com)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        url: form.url.trim(),
        username: form.username.trim() || null,
        password: form.password.trim() || null,
        companyId: currentUser?.companyId,
      };

      if (editingId) {
        const res = await fetch(`/api/shk-links/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          updateDataItem('shkLinks', editingId, updated);
          toast.success('SHK link updated');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to update');
        }
      } else {
        const res = await fetch('/api/shk-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          addDataItem('shkLinks', created);
          toast.success('SHK link created');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to create');
        }
      }
      setDialogOpen(false);
      fetchLinks();
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shk-links/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        removeDataItem('shkLinks', deleteTarget.id);
        toast.success('SHK link deleted');
        fetchLinks();
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
            <Link2 className="size-6 text-teal-500" />
            {t('manageShkLinks')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('shkService')}</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="size-4 me-2" />
          {t('addShkLink')}
        </Button>
      </motion.div>

      {/* Links Grid */}
      <motion.div variants={itemVariants}>
        {shkLinks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Link2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{t('noShkLinks')}</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Add SHK service links to manage your external service connections.
              </p>
              <Button onClick={handleOpenAdd} className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="size-4 me-2" />
                {t('addShkLink')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shkLinks.map((link) => (
              <ShkLinkCard
                key={link.id}
                link={link}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('editShkLink') : t('addShkLink')}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update SHK link details' : 'Add a new SHK service link'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="linkName">{t('linkName')} *</Label>
              <Input
                id="linkName"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. SHK Autorekisterikeskus"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkUrl">{t('linkUrl')} *</Label>
              <Input
                id="linkUrl"
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://example.com"
              />
              {form.url && !isValidUrl(form.url) && (
                <p className="text-xs text-destructive">Please enter a valid URL (e.g. https://...)</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkUsername">{t('usernameOptional')}</Label>
              <Input
                id="linkUsername"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkPassword">{t('passwordOptional')}</Label>
              <Input
                id="linkPassword"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.name.trim() || !form.url.trim() || !isValidUrl(form.url.trim())}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? '...' : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteShkLink')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteShkLink')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {loading ? '...' : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
