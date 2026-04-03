'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { StatCard } from '@/components/ibs/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CURRENCIES } from '@/i18n/constants';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Wrench,
  Award,
  UserCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

/* ── Types matching API response ────────────────────────────────────────── */

interface TransactionItem {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  type: 'income' | 'expense';
  status?: string;
}

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

/* ── Component ──────────────────────────────────────────────────────────── */

export default function CompanyHome() {
  const t = useTranslation();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentCompany = useAppStore((s) => s.currentCompany);
  const incomes = useAppStore((s) => s.incomes);
  const expenses = useAppStore((s) => s.expenses);
  const bookings = useAppStore((s) => s.bookings);
  const workOrders = useAppStore((s) => s.workOrders);
  const customers = useAppStore((s) => s.customers);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const currencyCode = currentCompany?.currency ?? 'EUR';
  const currencySymbol = CURRENCIES[currencyCode] ?? currencyCode;
  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;

  // Calculate totals
  const totalIncome = useMemo(
    () => (incomes as Array<{ amount: number }>).reduce((sum, i) => sum + (i.amount || 0), 0),
    [incomes]
  );
  const totalExpenses = useMemo(
    () => (expenses as Array<{ amount: number }>).reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );
  const netBalance = totalIncome - totalExpenses;
  const pendingBookings = (bookings as Array<{ status: string }>).filter(
    (b) => b.status === 'Scheduled'
  ).length;
  const activeWorkOrders = (workOrders as Array<{ status: string }>).filter(
    (w) => w.status !== 'Completed' && w.status !== 'Cancelled'
  ).length;

  // Build latest transactions (combined incomes + expenses, sorted by date)
  const latestTransactions = useMemo(() => {
    const incTxns = (incomes as Array<{ id: string; date: string; amount: number; description: string; category: string; paymentMethod: string; status: string }>).map(
      (i) => ({
        id: i.id,
        date: i.date,
        amount: i.amount,
        description: i.description || i.category,
        category: i.category,
        paymentMethod: i.paymentMethod,
        type: 'income' as const,
        status: i.status,
      })
    );
    const expTxns = (expenses as Array<{ id: string; date: string; amount: number; description: string; category: string; paymentMethod: string }>).map(
      (e) => ({
        id: e.id,
        date: e.date,
        amount: e.amount,
        description: e.description || e.category,
        category: e.category,
        paymentMethod: e.paymentMethod,
        type: 'expense' as const,
      })
    );
    return [...incTxns, ...expTxns]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [incomes, expenses]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('welcomeBack')} {currentUser?.username ?? ''}
        </h1>
        <p className="text-muted-foreground">
          {currentCompany?.name ?? ''} — {t('companyDashboard')}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={item}>
          <StatCard
            title={t('netBalance')}
            value={fmt(netBalance)}
            icon={<Wallet className="h-5 w-5" />}
            isNegative={netBalance < 0}
            className="cursor-pointer"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title={t('totalIncome')}
            value={fmt(totalIncome)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title={t('totalExpenses')}
            value={fmt(totalExpenses)}
            icon={<TrendingDown className="h-5 w-5" />}
            isNegative
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title={t('bookings')}
            value={`${pendingBookings} ${t('scheduled').toLowerCase()}`}
            icon={<CalendarDays className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title={t('workOrders')}
            value={`${activeWorkOrders} active`}
            icon={<Wrench className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title={t('customers')}
            value={customers.length}
            icon={<UserCircle className="h-5 w-5" />}
          />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => setCurrentView('financeIncome')}>
                <Plus className="h-3.5 w-3.5" /> {t('addIncome')}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCurrentView('financeExpenses')}>
                <Plus className="h-3.5 w-3.5" /> {t('addExpense')}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCurrentView('companyBookings')}>
                <CalendarDays className="h-3.5 w-3.5" /> {t('addNewBooking')}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCurrentView('companyWorkOrders')}>
                <Wrench className="h-3.5 w-3.5" /> {t('addNewWorkOrder')}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCurrentView('companyMaintenanceCertificates')}>
                <Award className="h-3.5 w-3.5" /> {t('addNewMaintenanceCertificate')}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCurrentView('companyCustomers')}>
                <UserCircle className="h-3.5 w-3.5" /> {t('addCustomer')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Latest Transactions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('latestTransactions')}</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentView('companyInvoices')}>
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {latestTransactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {latestTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.date} • {tx.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {tx.status && (
                        <Badge
                          variant="outline"
                          className={
                            tx.status === 'Paid'
                              ? 'border-emerald-500/30 text-emerald-500'
                              : 'border-amber-500/30 text-amber-500'
                          }
                        >
                          {tx.status}
                        </Badge>
                      )}
                      <p
                        className={`text-sm font-semibold ${
                          tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {fmt(tx.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
