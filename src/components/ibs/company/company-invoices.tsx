'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { CURRENCIES } from '@/i18n/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Landmark,
  Download,
  Loader2,
} from 'lucide-react';
import { formatReferenceNumber, generateRFReference, formatRFReference } from '@/lib/finnish-reference';

/* ── Types ──────────────────────────────────────────────────────────────── */

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
  company: { id: string; name: string; currency: string; vat: string; vatId: string; accountNumber: string; address: string; zipCode: string; city: string; country: string; phone?: string; email?: string } | null;
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

export default function CompanyInvoices() {
  const t = useTranslation();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentCompany = useAppStore((s) => s.currentCompany);
  const incomesStore = useAppStore((s) => s.incomes);
  const setData = useAppStore((s) => s.setData);

  const incomes = incomesStore as unknown as IncomeRecord[];

  const currencyCode = currentCompany?.currency ?? 'EUR';
  const currencySymbol = CURRENCIES[currencyCode] ?? currencyCode;
  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<IncomeRecord | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'All') return incomes;
    return incomes.filter((inc) => inc.status === statusFilter);
  }, [incomes, statusFilter]);

  // Counts
  const allCount = incomes.length;
  const pendingCount = incomes.filter((i) => i.status === 'Pending').length;
  const paidCount = incomes.filter((i) => i.status === 'Paid').length;

  // ── Refetch ────────────────────────────────────────────────────────────
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
        toast.success(`Invoice status changed to ${newStatus}`);
        await refetch();
        // Update selected invoice if viewing
        if (selectedInvoice?.id === record.id) {
          setSelectedInvoice((prev) => prev ? { ...prev, status: newStatus } : null);
        }
      } catch {
        toast.error('Failed to update status');
      } finally {
        setTogglingStatus(null);
      }
    },
    [refetch, selectedInvoice]
  );

  // ── Customer name helper ──────────────────────────────────────────────
  const getCustomerName = useCallback((record: IncomeRecord) => {
    if (record.customer?.name) return record.customer.name;
    if (record.customerDetails?.name) return record.customerDetails.name;
    return 'Walk-in Customer';
  }, []);

  const getCustomerEmail = useCallback((record: IncomeRecord) => {
    if (record.customer?.name && record.customerDetails?.email) return record.customerDetails.email;
    if (record.customerDetails?.email) return record.customerDetails.email;
    return '';
  }, []);

  const getCustomerAddress = useCallback((record: IncomeRecord) => {
    if (record.customerDetails?.address) return record.customerDetails.address;
    return '';
  }, []);

  // ── Download PDF (server-side binary PDF) ─────────────────────────
  const handleDownloadPDF = useCallback(
    async (record: IncomeRecord) => {
      setPdfLoading(record.id);
      try {
        // Fetch server-generated binary PDF
        const res = await fetch(`/api/invoices/pdf?id=${record.id}`);
        if (!res.ok) throw new Error('Failed to generate PDF');

        const blob = await res.blob();

        // Trigger file download
        const prefix = record.status === 'Paid' ? 'Kuitti' : 'Lasku';
        const filename = `${prefix}_${record.invoiceNumber}.pdf`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`${prefix} #${record.invoiceNumber} downloaded`);
      } catch (err) {
        console.error('PDF generation error:', err);
        toast.error('Failed to generate PDF');
      } finally {
        setPdfLoading(null);
      }
    },
    []
  );

  // ── [Removed duplicate helpers below] ─────────────────────────────────

  // ── Invoice VAT extraction (prices stored are VAT-inclusive / Gross) ────
  // Formula: Net = Gross / (1 + rate),  VAT = Gross − Net
  // Note: If vatRate is 0, net === gross (no VAT extraction needed)
  const getInvoiceNet = useCallback((record: IncomeRecord) => {
    const vatRate = Number(record.vatRate) || 0;
    if (vatRate === 0) return record.amount;
    return record.amount / (1 + vatRate / 100);
  }, []);

  const getInvoiceVat = useCallback((record: IncomeRecord) => {
    const vatRate = Number(record.vatRate) || 0;
    if (vatRate === 0) return 0;
    return record.amount - getInvoiceNet(record);
  }, [getInvoiceNet]);

  // ── Empty state (shared between desktop & mobile) ─────────────────────
  const emptyMessage = statusFilter === 'All'
    ? 'No invoices yet. Income records will appear here as invoices.'
    : `No ${statusFilter.toLowerCase()} invoices found.`;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('invoices')}</h1>
          <p className="text-muted-foreground">View and manage all invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All ({allCount})</SelectItem>
              <SelectItem value="Pending">Pending ({pendingCount})</SelectItem>
              <SelectItem value="Paid">Paid ({paidCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* ── Desktop Table (hidden on mobile) ──────────────────────────────── */}
      <motion.div variants={item} className="hidden sm:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t('invoiceId')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('customerName')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('description')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((inv, idx) => (
                      <TableRow key={inv.id} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                        <TableCell className="font-mono text-xs font-medium">#{inv.invoiceNumber}</TableCell>
                        <TableCell className="whitespace-nowrap">{inv.date}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{getCustomerName(inv)}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {inv.description || inv.category}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              inv.status === 'Paid'
                                ? 'border-emerald-500/30 text-emerald-500'
                                : 'border-amber-500/30 text-amber-500'
                            }
                          >
                            {inv.status === 'Paid' ? (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            ) : (
                              <Clock className="mr-1 h-3 w-3" />
                            )}
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          {fmt(inv.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setSelectedInvoice(inv)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleToggleStatus(inv)}
                              disabled={togglingStatus === inv.id}
                              title={inv.status === 'Paid' ? 'Mark as Pending' : 'Mark as Paid'}
                            >
                              {inv.status === 'Paid' ? (
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Mobile Card List (visible only on mobile) ─────────────────────── */}
      <motion.div variants={item} className="sm:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((inv) => (
            <Card key={inv.id} className="overflow-hidden">
              <CardContent className="p-3 space-y-2">
                {/* Top row: Invoice number + Status badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium">#{inv.invoiceNumber}</span>
                  <Badge
                    variant="outline"
                    className={
                      inv.status === 'Paid'
                        ? 'border-emerald-500/30 text-emerald-500'
                        : 'border-amber-500/30 text-amber-500'
                    }
                  >
                    {inv.status === 'Paid' ? (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    ) : (
                      <Clock className="mr-1 h-3 w-3" />
                    )}
                    {inv.status}
                  </Badge>
                </div>

                {/* Middle: Customer name (truncated) + Date */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate min-w-0">{getCustomerName(inv)}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{inv.date}</span>
                </div>

                {/* Bottom: Amount (right-aligned) + Action buttons */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold whitespace-nowrap">{fmt(inv.amount)}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleToggleStatus(inv)}
                      disabled={togglingStatus === inv.id}
                      title={inv.status === 'Paid' ? 'Mark as Pending' : 'Mark as Paid'}
                    >
                      {inv.status === 'Paid' ? (
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

      {/* ── Invoice Detail Dialog ────────────────────────────────────────── */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #{selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              Invoice detail view
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 print:m-0 print:p-0">
              {/* Company & Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-semibold text-base">{selectedInvoice.company?.name ?? 'Company'}</p>
                  {selectedInvoice.company?.address && <p className="text-muted-foreground">{selectedInvoice.company.address}</p>}
                  {selectedInvoice.company?.vatId && <p className="text-muted-foreground">VAT: {selectedInvoice.company.vatId}</p>}
                  {selectedInvoice.company?.accountNumber && <p className="text-muted-foreground">IBAN: {selectedInvoice.company.accountNumber}</p>}
                </div>
                <div className="sm:text-right">
                  <p className="font-semibold">{getCustomerName(selectedInvoice)}</p>
                  {getCustomerEmail(selectedInvoice) && (
                    <p className="text-muted-foreground">{getCustomerEmail(selectedInvoice)}</p>
                  )}
                  {getCustomerAddress(selectedInvoice) && (
                    <p className="text-muted-foreground">{getCustomerAddress(selectedInvoice)}</p>
                  )}
                </div>
              </div>

              {/* Invoice meta */}
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Date:</span> {selectedInvoice.date}</p>
                  <p><span className="text-muted-foreground">Reference:</span> {selectedInvoice.referenceNumber ? formatReferenceNumber(selectedInvoice.referenceNumber) : '—'}</p>
                  {selectedInvoice.referenceNumber && (() => {
                    const rf = generateRFReference(selectedInvoice.referenceNumber);
                    return rf ? <p className="text-xs text-muted-foreground">RF: {formatRFReference(rf)}</p> : null;
                  })()}
                  <p><span className="text-muted-foreground">Payment:</span> {selectedInvoice.paymentMethod}</p>
                </div>
                <Badge
                  className={
                    selectedInvoice.status === 'Paid'
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  }
                >
                  {selectedInvoice.status === 'Paid' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                  {selectedInvoice.status}
                </Badge>
              </div>

              {/* Vehicle info */}
              {(selectedInvoice.carMake || selectedInvoice.licensePlate) && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="text-muted-foreground text-xs font-medium mb-1">Vehicle</p>
                  <p>
                    {[selectedInvoice.carMake, selectedInvoice.carModel].filter(Boolean).join(' ')}
                    {selectedInvoice.licensePlate ? ` — ${selectedInvoice.licensePlate}` : ''}
                  </p>
                </div>
              )}

              {/* Services / Line items */}
              <div>
                <p className="text-sm font-semibold mb-2">Services</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-right p-3 font-medium w-28">Price (incl. VAT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(selectedInvoice.services) ? selectedInvoice.services : []).map((svc, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-3">{svc.description || '—'}</td>
                          <td className="p-3 text-right">{fmt(svc.price)}</td>
                        </tr>
                      ))}
                      {(!selectedInvoice.services || selectedInvoice.services.length === 0) && (
                        <tr>
                          <td colSpan={2} className="p-3 text-center text-muted-foreground">No service items</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Description */}
              {selectedInvoice.description && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedInvoice.description}</p>
                </div>
              )}

              <Separator />

              {/* Totals — Gross Amount = Net + VAT (prices are VAT-inclusive) */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Amount (excl. VAT)</span>
                  <span>{fmt(getInvoiceNet(selectedInvoice))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({selectedInvoice.vatRate}%)</span>
                  <span>{fmt(getInvoiceVat(selectedInvoice))}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total (incl. VAT)</span>
                  <span className="text-emerald-500">{fmt(selectedInvoice.amount)}</span>
                </div>
              </div>

              {/* Bill Payment Details */}
              {selectedInvoice.paymentMethod === 'Bill' && (
                <div className="rounded-lg border-2 border-dashed border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Maksutiedot / Payment Details</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Saaja / Receiver:</span>
                      <p className="font-medium">{selectedInvoice.company?.name ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">IBAN:</span>
                      <p className="font-mono font-medium">{selectedInvoice.company?.accountNumber || 'Ei määritetty / Not set'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Viitenumero / Reference:</span>
                      <p className="font-mono font-medium">{selectedInvoice.referenceNumber ? formatReferenceNumber(selectedInvoice.referenceNumber) : '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Eräpäivä / Due Date:</span>
                      <p className="font-medium">14 päivää / 14 days</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Y-tunnus / Business ID:</span>
                      <p className="font-mono font-medium">{selectedInvoice.company?.vatId || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">ALV % / VAT Rate:</span>
                      <p className="font-medium">{selectedInvoice.vatRate}%</p>
                    </div>
                  </div>
                  {selectedInvoice.company?.address && (
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">Osoite / Address:</span>
                      <p>{selectedInvoice.company.address}{selectedInvoice.company.zipCode ? `, ${selectedInvoice.company.zipCode}` : ''}{selectedInvoice.company.city ? ` ${selectedInvoice.company.city}` : ''}{selectedInvoice.company.country ? `, ${selectedInvoice.company.country}` : ''}</p>
                    </div>
                  )}
                  {selectedInvoice.company?.phone && (
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">Puhelin / Phone:</span>
                      <p>{selectedInvoice.company.phone}</p>
                    </div>
                  )}
                  {selectedInvoice.company?.email && (
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">Sähköposti / Email:</span>
                      <p>{selectedInvoice.company.email}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  className="gap-2"
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  disabled={pdfLoading === selectedInvoice.id}
                >
                  {pdfLoading === selectedInvoice.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {pdfLoading === selectedInvoice.id ? 'Generating…' : 'Download PDF'}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleToggleStatus(selectedInvoice)}
                  disabled={togglingStatus === selectedInvoice.id}
                >
                  {selectedInvoice.status === 'Paid' ? (
                    <>
                      <Clock className="h-4 w-4" /> Mark as Pending
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Mark as Paid
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
