'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Income, type Expense, type Booking, type WorkOrder } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { CURRENCIES } from '@/i18n/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Helper: extract VAT from gross amount ──────────────────────────── */

function extractVat(amount: number, vatRate: number): number {
  if (!amount || !vatRate) return 0;
  return amount - (amount / (1 + vatRate / 100));
}

/* ── Types ─────────────────────────────────────────────────────────────── */

type ReportType = 'financial' | 'vat' | 'sales' | 'bookings' | 'workorders';

/* ── Constants ─────────────────────────────────────────────────────────── */

const REPORT_TYPES: Array<{ type: ReportType; label: string }> = [
  { type: 'financial', label: 'Full Financial Report' },
  { type: 'vat', label: 'VAT/Tax Report' },
  { type: 'sales', label: 'Sales Analysis' },
  { type: 'bookings', label: 'Booking Report' },
  { type: 'workorders', label: 'Work Order Report' },
];

const CHART_COLORS = [
  'hsl(160, 60%, 45%)',
  'hsl(180, 60%, 45%)',
  'hsl(200, 60%, 45%)',
  'hsl(140, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(340, 60%, 55%)',
  'hsl(270, 60%, 55%)',
  'hsl(60, 70%, 45%)',
  'hsl(100, 50%, 40%)',
  'hsl(220, 60%, 55%)',
];

const BAR_CHART_CONFIG = {
  income: { label: 'Income', color: 'hsl(160, 60%, 45%)' },
  expenses: { label: 'Expenses', color: 'hsl(340, 60%, 55%)' },
  profit: { label: 'Profit', color: 'hsl(180, 60%, 45%)' },
} as const;

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

/* ── Helper: format currency ───────────────────────────────────────────── */

function useCurrency() {
  const currentCompany = useAppStore((s) => s.currentCompany);
  const currencyCode = currentCompany?.currency ?? 'EUR';
  const currencySymbol = CURRENCIES[currencyCode] ?? currencyCode;
  const fmt = useCallback(
    (n: number) => `${n.toFixed(2)} ${currencySymbol}`,
    [currencySymbol]
  );
  return { currencyCode, currencySymbol, fmt };
}

/* ── Report Section: Full Financial Report ─────────────────────────────── */

function FinancialReport({
  incomes,
  expenses,
  startDate,
  endDate,
  fmt,
}: {
  incomes: Income[];
  expenses: Expense[];
  startDate: string;
  endDate: string;
  fmt: (n: number) => string;
}) {
  const t = useTranslation();

  const filteredIncomes = useMemo(
    () => incomes.filter((i) => i.date >= startDate && i.date <= endDate),
    [incomes, startDate, endDate]
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.date >= startDate && e.date <= endDate),
    [expenses, startDate, endDate]
  );

  const totalIncome = useMemo(
    () => filteredIncomes.reduce((s, i) => s + (i.amount || 0), 0),
    [filteredIncomes]
  );
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0),
    [filteredExpenses]
  );
  const netProfit = totalIncome - totalExpenses;
  const totalVAT = useMemo(
    () => filteredIncomes.reduce((s, i) => s + extractVat(i.amount, i.vatRate), 0),
    [filteredIncomes]
  );

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach((i) => {
      const cat = i.category || 'Other';
      map[cat] = (map[cat] || 0) + (i.amount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [filteredIncomes]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {};
    filteredIncomes.forEach((i) => {
      const m = i.date.substring(0, 7);
      if (!months[m]) months[m] = { income: 0, expenses: 0 };
      months[m].income += i.amount || 0;
    });
    filteredExpenses.forEach((e) => {
      const m = e.date.substring(0, 7);
      if (!months[m]) months[m] = { income: 0, expenses: 0 };
      months[m].expenses += e.amount || 0;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        profit: Math.round((data.income - data.expenses) * 100) / 100,
      }));
  }, [filteredIncomes, filteredExpenses]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('totalIncome')}</p>
                  <p className="text-lg font-bold text-emerald-500">{fmt(totalIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('totalExpenses')}</p>
                  <p className="text-lg font-bold text-red-500">{fmt(totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                  <DollarSign className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Profit</p>
                  <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-teal-500' : 'text-red-500'}`}>
                    {fmt(netProfit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('vat')} Collected</p>
                  <p className="text-lg font-bold text-amber-500">{fmt(totalVAT)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income Breakdown Pie */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Income Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeByCategory.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No income data</p>
              ) : (
                <ChartContainer config={{ income: { label: 'Income', color: 'hsl(160, 60%, 45%)' } }} className="mx-auto aspect-square max-h-[280px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={incomeByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={40}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {incomeByCategory.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
              <ScrollArea className="max-h-32 mt-2">
                <div className="space-y-1">
                  {incomeByCategory.map((cat) => (
                    <div key={cat.name} className="flex justify-between text-xs px-2 py-1 rounded hover:bg-muted/50">
                      <span className="truncate">{cat.name}</span>
                      <span className="font-medium shrink-0 ml-2">{fmt(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense Breakdown Pie */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expense Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No expense data</p>
              ) : (
                <ChartContainer config={{ expenses: { label: 'Expenses', color: 'hsl(340, 60%, 55%)' } }} className="mx-auto aspect-square max-h-[280px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={40}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {expenseByCategory.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
              <ScrollArea className="max-h-32 mt-2">
                <div className="space-y-1">
                  {expenseByCategory.map((cat) => (
                    <div key={cat.name} className="flex justify-between text-xs px-2 py-1 rounded hover:bg-muted/50">
                      <span className="truncate">{cat.name}</span>
                      <span className="font-medium shrink-0 ml-2">{fmt(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Trend Bar Chart */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No monthly data</p>
            ) : (
              <ChartContainer config={BAR_CHART_CONFIG} className="aspect-[4/2] max-h-[320px]">
                <BarChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="income" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(340, 60%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ── Report Section: VAT/Tax Report ────────────────────────────────────── */

function VATReport({
  incomes,
  startDate,
  endDate,
  fmt,
}: {
  incomes: Income[];
  startDate: string;
  endDate: string;
  fmt: (n: number) => string;
}) {
  const filteredIncomes = useMemo(
    () => incomes.filter((i) => i.date >= startDate && i.date <= endDate),
    [incomes, startDate, endDate]
  );

  const vatByRate = useMemo(() => {
    const map: Record<string, { rate: number; totalAmount: number; totalVAT: number; count: number }> = {};
    filteredIncomes.forEach((i) => {
      const key = `${i.vatRate}%`;
      if (!map[key]) map[key] = { rate: i.vatRate, totalAmount: 0, totalVAT: 0, count: 0 };
      map[key].totalAmount += i.amount || 0;
      map[key].totalVAT += extractVat(i.amount, i.vatRate);
      map[key].count += 1;
    });
    return Object.values(map);
  }, [filteredIncomes]);

  const totalVATCollected = useMemo(
    () => filteredIncomes.reduce((s, i) => s + extractVat(i.amount, i.vatRate), 0),
    [filteredIncomes]
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* VAT Summary by Rate */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vatByRate.map((group) => (
          <motion.div key={group.rate} variants={item}>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">VAT Rate: {group.rate}%</p>
                <p className="text-lg font-bold text-amber-500">{fmt(group.totalVAT)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {group.count} transactions — Total: {fmt(group.totalAmount)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total VAT Collected</p>
              <p className="text-lg font-bold text-teal-500">{fmt(totalVATCollected)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredIncomes.length} transactions total
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transaction Table */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VAT Breakdown by Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredIncomes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No transactions in period</p>
            ) : (
              <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Invoice #</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs text-right">VAT Rate</TableHead>
                      <TableHead className="text-xs text-right">VAT Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncomes.map((inc) => (
                      <TableRow key={inc.id}>
                        <TableCell className="text-xs font-mono">{inc.invoiceId}</TableCell>
                        <TableCell className="text-xs">{inc.date}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{inc.description || inc.category}</TableCell>
                        <TableCell className="text-xs text-right">{fmt(inc.amount)}</TableCell>
                        <TableCell className="text-xs text-right">{inc.vatRate}%</TableCell>
                        <TableCell className="text-xs text-right font-medium text-amber-500">{fmt(extractVat(inc.amount, inc.vatRate))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden max-h-96 overflow-y-auto divide-y">
                {filteredIncomes.map((inc) => (
                  <div key={inc.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-medium">{inc.invoiceId}</span>
                      <span className="text-xs text-muted-foreground">{inc.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{inc.description || inc.category}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>{fmt(inc.amount)} ({inc.vatRate}%)</span>
                      <span className="font-medium text-amber-500">VAT: {fmt(extractVat(inc.amount, inc.vatRate))}</span>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ── Report Section: Sales Analysis ────────────────────────────────────── */

function SalesReport({
  incomes,
  startDate,
  endDate,
  fmt,
}: {
  incomes: Income[];
  startDate: string;
  endDate: string;
  fmt: (n: number) => string;
}) {
  const filteredIncomes = useMemo(
    () => incomes.filter((i) => i.date >= startDate && i.date <= endDate),
    [incomes, startDate, endDate]
  );

  const topServices = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach((i) => {
      try {
        const services: Array<{ description?: string; price?: number }> =
          typeof i.items === 'string' ? JSON.parse(i.items) : (i.items || []);
        if (Array.isArray(services) && services.length > 0) {
          services.forEach((s) => {
            const name = s.description || 'Unknown Service';
            map[name] = (map[name] || 0) + (s.price || s.total || 0);
          });
        } else {
          const cat = i.category || 'Other';
          map[cat] = (map[cat] || 0) + (i.amount || 0);
        }
      } catch {
        const cat = i.category || 'Other';
        map[cat] = (map[cat] || 0) + (i.amount || 0);
      }
    });
    return Object.entries(map)
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredIncomes]);

  const customerSpending = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach((i) => {
      const name = i.customerName || (i.customerId ? 'Customer' : 'Walk-in');
      map[name] = (map[name] || 0) + (i.amount || 0);
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredIncomes]);

  const paymentDist = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredIncomes.forEach((i) => {
      const method = i.paymentMethod || 'Unknown';
      if (!map[method]) map[method] = { count: 0, total: 0 };
      map[method].count += 1;
      map[method].total += i.amount || 0;
    });
    return Object.entries(map)
      .map(([method, data]) => ({ method, ...data, total: Math.round(data.total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredIncomes]);

  const totalRevenue = useMemo(
    () => filteredIncomes.reduce((s, i) => s + (i.amount || 0), 0),
    [filteredIncomes]
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Revenue (Period)</p>
            <p className="text-2xl font-bold text-emerald-500">{fmt(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredIncomes.length} transactions — {customerSpending.length} customers
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Services */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Services by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {topServices.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
              ) : (
                <ChartContainer config={{ revenue: { label: 'Revenue', color: 'hsl(160, 60%, 45%)' } }} className="aspect-[4/2] max-h-[250px]">
                  <BarChart data={topServices} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(160, 60%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method Distribution */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payment Method Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentDist.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-3">
                  {paymentDist.map((pm) => (
                    <div key={pm.method} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{pm.method}</span>
                        <span>{fmt(pm.total)} ({pm.count})</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${totalRevenue > 0 ? (pm.total / totalRevenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Customer Spending Table */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer Spending Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {customerSpending.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No customer data</p>
            ) : (
              <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
              <ScrollArea className="max-h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs text-right">Total Spent</TableHead>
                      <TableHead className="text-xs text-right">% of Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerSpending.slice(0, 20).map((c, idx) => (
                      <TableRow key={c.name}>
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-medium">{c.name}</TableCell>
                        <TableCell className="text-xs text-right">{fmt(c.total)}</TableCell>
                        <TableCell className="text-xs text-right">
                          {totalRevenue > 0 ? ((c.total / totalRevenue) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden max-h-72 overflow-y-auto divide-y">
                {customerSpending.slice(0, 20).map((c, idx) => (
                  <div key={c.name} className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">#{idx + 1}</p>
                      <p className="text-sm font-medium truncate">{c.name}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-medium">{fmt(c.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalRevenue > 0 ? ((c.total / totalRevenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ── Report Section: Booking Report ────────────────────────────────────── */

function BookingReport({
  bookings,
  startDate,
  endDate,
}: {
  bookings: Booking[];
  startDate: string;
  endDate: string;
}) {
  const filteredBookings = useMemo(
    () => bookings.filter((b) => b.bookingDate >= startDate && b.bookingDate <= endDate),
    [bookings, startDate, endDate]
  );

  const bookingsByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      const s = b.status || 'Unknown';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredBookings]);

  const bookingsByService = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      const s = b.serviceType || 'Unknown';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredBookings]);

  const upcomingBookings = useMemo(
    () => filteredBookings
      .filter((b) => b.status === 'Scheduled' && b.bookingDate >= new Date().toISOString().split('T')[0])
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate)),
    [filteredBookings]
  );

  const statusColors: Record<string, string> = {
    Scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    'In Progress': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    Completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    Cancelled: 'bg-red-500/10 text-red-500 border-red-500/30',
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Status summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{filteredBookings.length}</p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>
        </motion.div>
        {bookingsByStatus.slice(0, 3).map(([status, count]) => (
          <motion.div key={status} variants={item}>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <Badge variant="outline" className={statusColors[status] || ''}>{status}</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bookings by Service Type */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bookings by Service Type</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsByService.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
              ) : (
                <ChartContainer config={{ count: { label: 'Bookings', color: 'hsl(160, 60%, 45%)' } }} className="aspect-[4/2] max-h-[280px]">
                  <BarChart data={bookingsByService} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(160, 60%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Bookings */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No upcoming bookings</p>
              ) : (
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {upcomingBookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{b.customerName || 'Customer'}</p>
                          <p className="text-xs text-muted-foreground">{b.serviceType} — {b.carMake} {b.carModel}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-medium">{b.bookingDate}</p>
                          <p className="text-xs text-muted-foreground">{b.bookingTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Report Section: Work Order Report ─────────────────────────────────── */

function WorkOrderReport({
  workOrders,
  startDate,
  endDate,
  fmt,
}: {
  workOrders: WorkOrder[];
  startDate: string;
  endDate: string;
  fmt: (n: number) => string;
}) {
  const filtered = useMemo(
    () => workOrders.filter((w) => w.workOrderDate >= startDate && w.workOrderDate <= endDate),
    [workOrders, startDate, endDate]
  );

  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((w) => {
      const s = w.status || 'Unknown';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const totalRevenue = useMemo(
    () => filtered.reduce((s, w) => s + (w.totalCost || 0), 0),
    [filtered]
  );
  const totalPartsCost = useMemo(
    () => filtered.reduce((s, w) => s + (w.partsCost || 0), 0),
    [filtered]
  );
  const totalLaborCost = useMemo(
    () => filtered.reduce((s, w) => s + (w.laborCost || 0), 0),
    [filtered]
  );

  const techProductivity = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; hours: number }> = {};
    filtered.forEach((w) => {
      const tech = w.technician || 'Unassigned';
      if (!map[tech]) map[tech] = { count: 0, revenue: 0, hours: 0 };
      map[tech].count += 1;
      map[tech].revenue += w.totalCost || 0;
      map[tech].hours += w.actualHours || 0;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const statusColors: Record<string, string> = {
    Draft: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
    'In Progress': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    'Awaiting Parts': 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    'Ready for Review': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    Completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    Cancelled: 'bg-red-500/10 text-red-500 border-red-500/30',
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Total Work Orders</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold text-emerald-500">{fmt(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Parts: {fmt(totalPartsCost)} | Labor: {fmt(totalLaborCost)}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{techProductivity.length}</p>
              <p className="text-xs text-muted-foreground">Technicians Active</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Status Breakdown</p>
              <div className="flex flex-wrap gap-1">
                {ordersByStatus.map(([status, count]) => (
                  <Badge key={status} variant="outline" className={statusColors[status] || ''}>
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Technician Productivity */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Technician Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            {techProductivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No work order data</p>
            ) : (
              <>
                <ChartContainer
                  config={{
                    revenue: { label: 'Revenue', color: 'hsl(160, 60%, 45%)' },
                    count: { label: 'Orders', color: 'hsl(180, 60%, 45%)' },
                  }}
                  className="aspect-[4/2] max-h-[280px]"
                >
                  <BarChart data={techProductivity} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ChartContainer>
                {/* Desktop Table */}
                <div className="hidden sm:block">
                <ScrollArea className="max-h-48 mt-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Technician</TableHead>
                        <TableHead className="text-xs text-right">Orders</TableHead>
                        <TableHead className="text-xs text-right">Hours</TableHead>
                        <TableHead className="text-xs text-right">Revenue</TableHead>
                        <TableHead className="text-xs text-right">Avg/Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {techProductivity.map((tp) => (
                        <TableRow key={tp.name}>
                          <TableCell className="text-xs font-medium">{tp.name}</TableCell>
                          <TableCell className="text-xs text-right">{tp.count}</TableCell>
                          <TableCell className="text-xs text-right">{tp.hours.toFixed(1)}h</TableCell>
                          <TableCell className="text-xs text-right">{fmt(tp.revenue)}</TableCell>
                          <TableCell className="text-xs text-right">{fmt(tp.count > 0 ? tp.revenue / tp.count : 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                </div>
                {/* Mobile Cards */}
                <div className="sm:hidden mt-3 divide-y">
                  {techProductivity.map((tp) => (
                    <div key={tp.name} className="p-3 space-y-1">
                      <p className="font-medium text-sm">{tp.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{tp.count} orders</span>
                        <span>{tp.hours.toFixed(1)}h</span>
                        <span className="font-medium text-foreground">{fmt(tp.revenue)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Avg: {fmt(tp.count > 0 ? tp.revenue / tp.count : 0)}/order</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Reports Component ────────────────────────────────────────────── */

export default function CompanyReports() {
  const t = useTranslation();
  const { fmt } = useCurrency();
  const incomes = useAppStore((s) => s.incomes) as Income[];
  const expenses = useAppStore((s) => s.expenses) as Expense[];
  const bookings = useAppStore((s) => s.bookings) as Booking[];
  const workOrders = useAppStore((s) => s.workOrders) as WorkOrder[];

  const today = new Date().toISOString().split('T')[0];
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [reportType, setReportType] = useState<ReportType>('financial');
  const [startDate, setStartDate] = useState(threeMonthsAgo);
  const [endDate, setEndDate] = useState(today);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerated(true);
    toast.success('Report generated successfully');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const header = 'Type,Date,Description,Category,Amount,VAT Rate,VAT,Total\n';
    const incomeRows = incomes
      .filter((i) => i.date >= startDate && i.date <= endDate)
      .map(
        (i) =>
          `Income,"${i.date}","${(i.description || i.category).replace(/"/g, '""')}","${i.category}",${i.amount},${i.vatRate},${extractVat(i.amount, i.vatRate)},${i.total || i.amount}`
      )
      .join('\n');
    const expenseRows = expenses
      .filter((e) => e.date >= startDate && e.date <= endDate)
      .map(
        (e) =>
          `Expense,"${e.date}","${(e.description || e.category).replace(/"/g, '""')}","${e.category}",${e.amount},${e.vatRate},${extractVat(e.amount, e.vatRate)},${e.amount}`
      )
      .join('\n');
    const csv = header + incomeRows + '\n' + expenseRows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${reportType}_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleExportJSON = () => {
    const data = {
      reportType,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      incomes: incomes
        .filter((i) => i.date >= startDate && i.date <= endDate)
        .map((i) => ({
          invoiceId: i.invoiceId,
          date: i.date,
          description: i.description,
          category: i.category,
          amount: i.amount,
          vatRate: i.vatRate,
          vat: extractVat(i.amount, i.vatRate),
          total: i.total,
          paymentMethod: i.paymentMethod,
        })),
      expenses: expenses
        .filter((e) => e.date >= startDate && e.date <= endDate)
        .map((e) => ({
          date: e.date,
          description: e.description,
          category: e.category,
          amount: e.amount,
          vatRate: e.vatRate,
          vat: extractVat(e.amount, e.vatRate),
          paymentMethod: e.paymentMethod,
        })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${reportType}_${startDate}_${endDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">{t('reports')}</h1>
        <p className="text-muted-foreground">Generate and analyze business reports</p>
      </motion.div>

      {/* Report Configuration */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs">{t('reportType')}</Label>
                <Select value={reportType} onValueChange={(v) => { setReportType(v as ReportType); setGenerated(false); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((rt) => (
                      <SelectItem key={rt.type} value={rt.type}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">&nbsp;</Label>
                <Button onClick={handleGenerate} className="w-full gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t('generateReport')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Buttons */}
      {generated && (
        <motion.div variants={item} className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <FileDown className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportJSON}>
            <FileText className="h-3.5 w-3.5" />
            Export JSON
          </Button>
        </motion.div>
      )}

      {/* Report Display */}
      {generated ? (
        <div id="report-content">
          {reportType === 'financial' && (
            <FinancialReport incomes={incomes} expenses={expenses} startDate={startDate} endDate={endDate} fmt={fmt} />
          )}
          {reportType === 'vat' && (
            <VATReport incomes={incomes} startDate={startDate} endDate={endDate} fmt={fmt} />
          )}
          {reportType === 'sales' && (
            <SalesReport incomes={incomes} startDate={startDate} endDate={endDate} fmt={fmt} />
          )}
          {reportType === 'bookings' && (
            <BookingReport bookings={bookings} startDate={startDate} endDate={endDate} />
          )}
          {reportType === 'workorders' && (
            <WorkOrderReport workOrders={workOrders} startDate={startDate} endDate={endDate} fmt={fmt} />
          )}
        </div>
      ) : (
        <motion.div variants={item}>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No Report Generated</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Select a report type, date range, and click &quot;Generate Report&quot; to see your data analysis.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
