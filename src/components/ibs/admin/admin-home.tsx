'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { translations } from '@/i18n/translations';
import type { Language } from '@/i18n/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, UserCheck, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminHome() {
  const { companies, users, customers, auditLogs, language, setData } = useAppStore();
  const t = (key: string) => translations[language as Language]?.[key] || key;
  const isRTL = language === 'AR';

  useEffect(() => {
    if (auditLogs.length === 0) {
      fetch('/api/audit-logs?limit=5')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setData('auditLogs', data);
          }
        })
        .catch(() => {});
    }
  }, [auditLogs.length, setData]);

  const recentLogs = auditLogs.slice(0, 5);

  const stats = [
    {
      title: t('companiesManagement'),
      value: companies.length,
      icon: Building2,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-500/10',
      textColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: t('usersManagement'),
      value: users.length,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: t('customers'),
      value: customers.length,
      icon: UserCheck,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-600 dark:text-cyan-400',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
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
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('adminDashboard')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('home')}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                    <stat.icon className={`size-6 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Audit Logs */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-5 text-teal-500" />
                {t('auditLogs')}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {recentLogs.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm leading-relaxed break-words">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium">{log.user}</span>
                        <span>
                          {new Date(log.timestamp).toLocaleString(
                            language === 'AR' ? 'ar-SA' : language === 'FI' ? 'fi-FI' : 'en-US'
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
