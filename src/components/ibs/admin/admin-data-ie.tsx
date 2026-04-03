'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { translations } from '@/i18n/translations';
import type { Language } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDataIE() {
  const { language, clearAllData, setData } = useAppStore();
  const t = (key: string) => translations[language as Language]?.[key] || key;
  const isRTL = language === 'AR';

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const endpoints = [
        { key: 'companies', url: '/api/companies' },
        { key: 'users', url: '/api/users' },
        { key: 'customers', url: '/api/customers' },
        { key: 'incomes', url: '/api/incomes' },
        { key: 'expenses', url: '/api/expenses' },
        { key: 'bookings', url: '/api/bookings' },
        { key: 'workOrders', url: '/api/work-orders' },
        { key: 'maintenanceCertificates', url: '/api/maintenance-certificates' },
        { key: 'shkLinks', url: '/api/shk-links' },
        { key: 'auditLogs', url: '/api/audit-logs' },
        { key: 'settings', url: '/api/settings' },
      ];

      const exportData: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      await Promise.all(
        endpoints.map(async ({ key, url }) => {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              exportData[key] = Array.isArray(data) ? data : data;
            }
          } catch {
            exportData[key] = [];
          }
        })
      );

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ibs-pro-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file first');
      return;
    }

    setImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      if (!data || typeof data !== 'object') {
        toast.error('Invalid file format');
        return;
      }

      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Data imported successfully');
        // Refresh all data
        clearAllData();
        const refreshEndpoints = [
          { key: 'companies' as const, url: '/api/companies' },
          { key: 'users' as const, url: '/api/users' },
          { key: 'customers' as const, url: '/api/customers' },
          { key: 'auditLogs' as const, url: '/api/audit-logs' },
        ];
        await Promise.all(
          refreshEndpoints.map(async ({ key, url }) => {
            try {
              const r = await fetch(url);
              if (r.ok) {
                const d = await r.json();
                if (Array.isArray(d)) setData(key, d);
              }
            } catch {
              // silent
            }
          })
        );
        setImportFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Import failed');
      }
    } catch {
      toast.error('Invalid JSON file');
    } finally {
      setImporting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
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
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ArrowLeftRight className="size-6 text-teal-500" />
          {t('importExportData')}
        </h1>
        <p className="text-muted-foreground mt-1">
          Export all application data or import from a backup file
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Section */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-teal-500/10">
                  <Download className="size-5 text-teal-600 dark:text-teal-400" />
                </div>
                {t('exportData')}
              </CardTitle>
              <CardDescription>
                Download all application data as a JSON backup file. This includes companies, users, customers, transactions, bookings, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Companies</Badge>
                <Badge variant="secondary">Users</Badge>
                <Badge variant="secondary">Customers</Badge>
                <Badge variant="secondary">Incomes</Badge>
                <Badge variant="secondary">Expenses</Badge>
                <Badge variant="secondary">Bookings</Badge>
                <Badge variant="secondary">Work Orders</Badge>
                <Badge variant="secondary">SHK Links</Badge>
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {exporting ? (
                  <Loader2 className="size-4 me-2 animate-spin" />
                ) : (
                  <Download className="size-4 me-2" />
                )}
                {exporting ? 'Exporting...' : t('exportData')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Import Section */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-amber-500/10">
                  <Upload className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                {t('importData')}
              </CardTitle>
              <CardDescription>
                Import data from a previously exported JSON file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  {t('importWarning')}
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-teal-500/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImportFile(file);
                  }}
                />
                {importFile ? (
                  <div className="space-y-2">
                    <FileJson className="size-8 text-teal-500 mx-auto" />
                    <p className="text-sm font-medium">{importFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImportFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="space-y-2 cursor-pointer"
                  >
                    <Upload className="size-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Click to select a JSON file
                    </p>
                  </button>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || !importFile}
                variant="outline"
                className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              >
                {importing ? (
                  <Loader2 className="size-4 me-2 animate-spin" />
                ) : (
                  <Upload className="size-4 me-2" />
                )}
                {importing ? 'Importing...' : t('importData')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
