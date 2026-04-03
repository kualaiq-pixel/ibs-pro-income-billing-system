'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { translations } from '@/i18n/translations';
import type { Language } from '@/i18n/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Clock, User, ScrollText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogs() {
  const { auditLogs, language, setData } = useAppStore();
  const t = (key: string) => translations[language as Language]?.[key] || key;
  const isRTL = language === 'AR';
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs?limit=200');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setData('auditLogs', data);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [setData]);

  useEffect(() => {
    if (auditLogs.length === 0) {
      fetchLogs();
    }
  }, [auditLogs.length, fetchLogs]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(
      language === 'AR' ? 'ar-SA' : language === 'FI' ? 'fi-FI' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }
    );
  };

  const getActionColor = (description: string) => {
    const lower = description.toLowerCase();
    if (lower.includes('created')) return 'bg-teal-500';
    if (lower.includes('updated')) return 'bg-amber-500';
    if (lower.includes('deleted')) return 'bg-red-500';
    if (lower.includes('login') || lower.includes('logout')) return 'bg-blue-500';
    if (lower.includes('seed')) return 'bg-purple-500';
    return 'bg-gray-400';
  };

  const visibleLogs = auditLogs.slice(0, visibleCount);
  const hasMore = auditLogs.length > visibleCount;

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
            <ScrollText className="size-6 text-teal-500" />
            {t('auditLogs')}
          </h1>
          <p className="text-muted-foreground mt-1">
            View system activity and audit trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {auditLogs.length} entries
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`size-4 me-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Total Logs', value: auditLogs.length, icon: FileText, color: 'text-teal-500' },
          {
            label: 'Created',
            value: auditLogs.filter((l) => l.description.toLowerCase().includes('created')).length,
            icon: FileText,
            color: 'text-teal-500',
          },
          {
            label: 'Updated',
            value: auditLogs.filter((l) => l.description.toLowerCase().includes('updated')).length,
            icon: FileText,
            color: 'text-amber-500',
          },
          {
            label: 'Deleted',
            value: auditLogs.filter((l) => l.description.toLowerCase().includes('deleted')).length,
            icon: FileText,
            color: 'text-red-500',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`size-4 sm:size-5 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Logs Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {visibleLogs.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {loading ? 'Loading logs...' : 'No audit logs found'}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>{t('timestamp')}</TableHead>
                        <TableHead>{t('user')}</TableHead>
                        <TableHead>{t('action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleLogs.map((log, index) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-muted/50 border-b transition-colors"
                        >
                          <TableCell>
                            <div className={`h-2 w-2 rounded-full ${getActionColor(log.description)}`} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3 shrink-0" />
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <User className="size-3 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm">{log.user}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm break-words">{log.description}</p>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y">
                  {visibleLogs.map((log) => (
                    <div key={log.id} className="p-3 sm:p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${getActionColor(log.description)}`} />
                        <span className="font-medium text-sm truncate">{log.user}</span>
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground break-words pl-4">{log.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setVisibleCount((prev) => prev + 50)}
                >
                  Load More ({auditLogs.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
