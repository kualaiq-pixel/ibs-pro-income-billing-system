'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAppStore, type WorkOrder, type WorkOrderPart, type Booking } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { WORK_ORDER_STATUSES } from '@/i18n/constants';
import { VehicleSelector, CustomerSelector, IndividualCustomerFields } from '@/components/ibs/form-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
  FileDown,
  Award,
  Minus,
} from 'lucide-react';

/* ── Status Badge ─────────────────────────────────────────────────────────── */

function WorkOrderStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Awaiting Parts': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'Ready for Review': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <Badge variant="secondary" className={colorMap[status] ?? ''}>
      {status}
    </Badge>
  );
}

/* ── Part Row ─────────────────────────────────────────────────────────────── */

interface PartRow {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function emptyPartRow(): PartRow {
  return { id: generateId(), name: '', partNumber: '', quantity: 1, unitPrice: 0 };
}

function calcPartTotal(p: PartRow): number {
  return p.quantity * p.unitPrice;
}

/* ── Form Interface ───────────────────────────────────────────────────────── */

interface WorkOrderForm {
  customerMethod: 'booking' | 'existing' | 'individual';
  bookingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerZipCode: string;
  customerCity: string;
  customerCountry: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  workOrderNumber: string;
  workOrderDate: string;
  status: string;
  technician: string;
  estimatedHours: number;
  actualHours: number;
  mileage: string;
  workDescription: string;
  parts: PartRow[];
  laborCost: number;
  recommendations: string;
  nextServiceDue: string;
  serviceGuarantee: string;
  warrantyDetails: string;
  serviceQualityCheck: string;
  technicianNotes: string;
  customerApproval: boolean;
}

const emptyForm: WorkOrderForm = {
  customerMethod: 'booking',
  bookingId: '',
  customerId: '',
  customerName: '',
  customerEmail: '',
  customerAddress: '',
  customerZipCode: '',
  customerCity: '',
  customerCountry: '',
  carMake: '',
  carModel: '',
  licensePlate: '',
  workOrderNumber: '',
  workOrderDate: new Date().toISOString().split('T')[0],
  status: 'Draft',
  technician: '',
  estimatedHours: 0,
  actualHours: 0,
  mileage: '',
  workDescription: '',
  parts: [],
  laborCost: 0,
  recommendations: '',
  nextServiceDue: '',
  serviceGuarantee: '',
  warrantyDetails: '',
  serviceQualityCheck: '',
  technicianNotes: '',
  customerApproval: false,
};

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function CompanyWorkOrders() {
  const t = useTranslation();
  const language = useAppStore((s) => s.language);
  const isRTL = language === 'AR';
  const workOrders = useAppStore((s) => s.workOrders);
  const bookings = useAppStore((s) => s.bookings);
  const customers = useAppStore((s) => s.customers);
  const setData = useAppStore((s) => s.setData);
  const addDataItem = useAppStore((s) => s.addDataItem);
  const updateDataItem = useAppStore((s) => s.updateDataItem);
  const removeDataItem = useAppStore((s) => s.removeDataItem);
  const currentUser = useAppStore((s) => s.currentUser);
  const currency = useAppStore((s) => s.currentCompany?.currency ?? 'EUR');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkOrderForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkOrder | null>(null);

  const fetchWorkOrders = useCallback(async () => {
    try {
      const cid = currentUser?.companyId;
      const res = await fetch(`/api/work-orders?companyId=${cid}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setData('workOrders', data);
      }
    } catch { /* silent */ }
  }, [currentUser?.companyId, setData]);

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.id === form.bookingId);
  }, [bookings, form.bookingId]);

  // Auto-fill from booking
  const handleBookingSelect = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setForm((f) => ({
        ...f,
        bookingId,
        customerName: booking.customerName,
        customerId: booking.customerId ?? '',
        carMake: booking.carMake,
        carModel: booking.carModel,
        licensePlate: booking.licensePlate,
      }));
    }
  };

  const partsCost = useMemo(() => {
    return form.parts.reduce((sum, p) => sum + calcPartTotal(p), 0);
  }, [form.parts]);

  const totalCost = useMemo(() => {
    return partsCost + form.laborCost;
  }, [partsCost, form.laborCost]);

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (wo: WorkOrder) => {
    setForm({
      customerMethod: wo.bookingId ? 'booking' : wo.customerId ? 'existing' : 'individual',
      bookingId: wo.bookingId ?? '',
      customerId: wo.customerId ?? '',
      customerName: wo.customerName,
      customerEmail: '',
      customerAddress: '',
      customerZipCode: '',
      customerCity: '',
      customerCountry: '',
      carMake: wo.carMake,
      carModel: wo.carModel,
      licensePlate: wo.licensePlate,
      workOrderNumber: wo.workOrderDate ? `WO-${wo.workOrderDate.slice(0, 4)}-${String(parseInt(wo.id.slice(0, 6), 36) || 1).padStart(3, '0')}` : '',
      workOrderDate: wo.workOrderDate,
      status: wo.status,
      technician: wo.technician,
      estimatedHours: wo.estimatedHours,
      actualHours: wo.actualHours,
      mileage: wo.mileage ?? '',
      workDescription: wo.workDescription,
      parts: wo.parts.length > 0
        ? wo.parts.map((p) => ({ id: p.id, name: p.name, partNumber: p.partNumber, quantity: p.quantity, unitPrice: p.unitPrice }))
        : [],
      laborCost: wo.laborCost,
      recommendations: wo.recommendations,
      nextServiceDue: wo.nextServiceDue ?? '',
      serviceGuarantee: wo.serviceGuarantee ?? '',
      warrantyDetails: wo.warrantyDetails ?? '',
      serviceQualityCheck: Array.isArray(wo.serviceQualityCheck) ? (wo.serviceQualityCheck as unknown as string[]).join('\n') : (wo.serviceQualityCheck as string ?? ''),
      technicianNotes: wo.technicianNotes ?? '',
      customerApproval: wo.customerApproval,
    });
    setEditingId(wo.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (wo: WorkOrder) => {
    setDeleteTarget(wo);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    const customerName =
      form.customerMethod === 'booking' && selectedBooking
        ? selectedBooking.customerName
        : form.customerMethod === 'existing'
          ? customers.find((c) => c.id === form.customerId)?.name ?? ''
          : form.customerName;

    if (!customerName.trim() || !form.carMake || !form.technician.trim()) {
      toast.error('Please fill in customer, vehicle, and technician fields');
      return;
    }

    setLoading(true);
    try {
      const partsUsed = form.parts.map((p) => ({
        id: p.id,
        name: p.name,
        partNumber: p.partNumber,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        total: calcPartTotal(p),
      }));

      const qualityCheck = form.serviceQualityCheck
        ? form.serviceQualityCheck.split('\n').filter((l) => l.trim())
        : [];

      const payload = {
        customerMethod: form.customerMethod,
        bookingId: form.customerMethod === 'booking' ? form.bookingId : undefined,
        customerId: form.customerMethod === 'existing' ? form.customerId : undefined,
        customerName,
        customerDetails:
          form.customerMethod === 'individual'
            ? JSON.stringify({
                name: form.customerName,
                email: form.customerEmail,
                address: form.customerAddress,
                zipCode: form.customerZipCode,
                city: form.customerCity,
                country: form.customerCountry,
              })
            : undefined,
        carMake: form.carMake,
        carModel: form.carModel,
        licensePlate: form.licensePlate,
        date: form.workOrderDate,
        status: form.status,
        technician: form.technician,
        estimatedHours: form.estimatedHours,
        actualHours: form.actualHours,
        mileage: form.mileage,
        workDescription: form.workDescription,
        partsUsed: JSON.stringify(partsUsed),
        laborCost: form.laborCost,
        partsCost,
        totalCost,
        recommendations: form.recommendations,
        nextServiceDue: form.nextServiceDue,
        serviceGuarantee: form.serviceGuarantee,
        warrantyDetails: form.warrantyDetails,
        serviceQualityCheck: JSON.stringify(qualityCheck),
        technicianNotes: form.technicianNotes,
        customerApproval: form.customerApproval,
        companyId: currentUser?.companyId,
      };

      if (editingId) {
        const res = await fetch(`/api/work-orders/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          updateDataItem('workOrders', editingId, updated);
          toast.success('Work order updated');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to update');
        }
      } else {
        const res = await fetch('/api/work-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          addDataItem('workOrders', created);
          toast.success('Work order created');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to create');
        }
      }
      setDialogOpen(false);
      fetchWorkOrders();
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
      const res = await fetch(`/api/work-orders/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        removeDataItem('workOrders', deleteTarget.id);
        toast.success('Work order deleted');
        fetchWorkOrders();
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

  const updatePart = (partId: string, field: keyof PartRow, value: string | number) => {
    setForm((f) => ({
      ...f,
      parts: f.parts.map((p) => (p.id === partId ? { ...p, [field]: value } : p)),
    }));
  };

  const addPartRow = () => {
    setForm((f) => ({ ...f, parts: [...f.parts, emptyPartRow()] }));
  };

  const removePartRow = (partId: string) => {
    setForm((f) => ({ ...f, parts: f.parts.filter((p) => p.id !== partId) }));
  };

  const fmt = (n: number) => `${n.toFixed(2)} ${currency}`;

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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="size-6 text-teal-500" />
            {t('manageWorkOrders')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('workOrders')}</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto">
          <Plus className="size-4 me-2" />
          {t('addNewWorkOrder')}
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {workOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Wrench className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No work orders yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first work order to get started.
                </p>
                <Button onClick={handleOpenAdd} className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
                  <Plus className="size-4 me-2" />
                  {t('addNewWorkOrder')}
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden sm:block">
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('workOrderId')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">{t('date')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('customer')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">{t('vehicle')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">{t('technician')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('totalCost')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('status')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-end">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workOrders.map((wo, index) => (
                          <TableRow
                            key={wo.id}
                            className="animate-fade-in transition-colors hover:bg-muted/50"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <TableCell className="font-mono text-xs">{wo.workOrderDate}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{wo.workOrderDate}</TableCell>
                            <TableCell className="font-medium">{wo.customerName}</TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                              {wo.carMake} {wo.carModel}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{wo.technician}</TableCell>
                            <TableCell className="font-medium">{fmt(wo.totalCost)}</TableCell>
                            <TableCell>
                              <WorkOrderStatusBadge status={wo.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handleOpenEdit(wo)}
                                  title={t('edit')}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-blue-600"
                                  onClick={() => toast.info('PDF generation coming soon')}
                                  title="Generate PDF"
                                >
                                  <FileDown className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-amber-600"
                                  onClick={() => {
                                    useAppStore.getState().setCurrentView('companyMaintenanceCertificates');
                                  }}
                                  title={t('generateCertificate')}
                                >
                                  <Award className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteClick(wo)}
                                  title={t('delete')}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                {/* Mobile card list view */}
                <div className="sm:hidden divide-y">
                  {workOrders.map((wo) => (
                    <div key={wo.id} className="p-4 space-y-3">
                      {/* Top row: date + status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">{wo.workOrderDate}</span>
                        <WorkOrderStatusBadge status={wo.status} />
                      </div>
                      {/* Customer */}
                      <div>
                        <p className="text-xs text-muted-foreground">{t('customer')}</p>
                        <p className="text-sm font-medium">{wo.customerName}</p>
                      </div>
                      {/* Vehicle */}
                      <div>
                        <p className="text-xs text-muted-foreground">{t('vehicle')}</p>
                        <p className="text-sm font-medium">{wo.carMake} {wo.carModel}</p>
                      </div>
                      {/* Technician */}
                      <div>
                        <p className="text-xs text-muted-foreground">{t('technician')}</p>
                        <p className="text-sm font-medium">{wo.technician}</p>
                      </div>
                      {/* Total cost */}
                      <div>
                        <p className="text-xs text-muted-foreground">{t('totalCost')}</p>
                        <p className="text-sm font-bold text-teal-700 dark:text-teal-300">{fmt(wo.totalCost)}</p>
                      </div>
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => handleOpenEdit(wo)}
                        >
                          <Pencil className="size-3" />
                          {t('edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => toast.info('PDF generation coming soon')}
                        >
                          <FileDown className="size-3" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => {
                            useAppStore.getState().setCurrentView('companyMaintenanceCertificates');
                          }}
                        >
                          <Award className="size-3" />
                          {t('generateCertificate')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(wo)}
                        >
                          <Trash2 className="size-3" />
                          {t('delete')}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90dvh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('editWorkOrder') : t('addNewWorkOrder')}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update work order details' : 'Create a new work order'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70dvh] px-1">
            <div className="grid gap-5 py-4 pr-4">
              {/* Customer Selection Method */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">{t('customer')}</Label>
                <div className="flex flex-wrap gap-2">
                  {(['booking', 'existing', 'individual'] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={form.customerMethod === method ? 'default' : 'outline'}
                      size="sm"
                      className={form.customerMethod === method ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
                      onClick={() => setForm((f) => ({ ...f, customerMethod: method }))}
                    >
                      {method === 'booking' ? 'From Booking' : method === 'existing' ? t('customer') : t('individualCustomer')}
                    </Button>
                  ))}
                </div>

                {form.customerMethod === 'booking' && (
                  <div className="space-y-2">
                    <Label>Select Booking</Label>
                    <Select value={form.bookingId} onValueChange={handleBookingSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a booking..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {bookings
                          .filter((b) => b.status !== 'Cancelled')
                          .map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.customerName} - {b.carMake} {b.carModel} ({b.bookingDate})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.customerMethod === 'existing' && (
                  <CustomerSelector
                    customerId={form.customerId}
                    onCustomerIdChange={(id) => setForm((f) => ({ ...f, customerId: id }))}
                  />
                )}

                {form.customerMethod === 'individual' && (
                  <IndividualCustomerFields
                    name={form.customerName}
                    email={form.customerEmail}
                    address={form.customerAddress}
                    zipCode={form.customerZipCode}
                    city={form.customerCity}
                    country={form.customerCountry}
                    onNameChange={(v) => setForm((f) => ({ ...f, customerName: v }))}
                    onEmailChange={(v) => setForm((f) => ({ ...f, customerEmail: v }))}
                    onAddressChange={(v) => setForm((f) => ({ ...f, customerAddress: v }))}
                    onZipCodeChange={(v) => setForm((f) => ({ ...f, customerZipCode: v }))}
                    onCityChange={(v) => setForm((f) => ({ ...f, customerCity: v }))}
                    onCountryChange={(v) => setForm((f) => ({ ...f, customerCountry: v }))}
                  />
                )}
              </div>

              {/* Vehicle Details */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">{t('vehicleDetails')}</Label>
                <VehicleSelector
                  carMake={form.carMake}
                  carModel={form.carModel}
                  licensePlate={form.licensePlate}
                  onCarMakeChange={(v) => setForm((f) => ({ ...f, carMake: v }))}
                  onCarModelChange={(v) => setForm((f) => ({ ...f, carModel: v }))}
                  onLicensePlateChange={(v) => setForm((f) => ({ ...f, licensePlate: v }))}
                />
              </div>

              <Separator />

              {/* Work Order Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('workOrderId')}</Label>
                  <Input value={form.workOrderNumber} readOnly className="bg-muted cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="woDate">{t('workOrderDate')} *</Label>
                  <Input
                    id="woDate"
                    type="date"
                    value={form.workOrderDate}
                    onChange={(e) => setForm((f) => ({ ...f, workOrderDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Technician & Hours */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="technician">{t('technician')} *</Label>
                  <Input
                    id="technician"
                    value={form.technician}
                    onChange={(e) => setForm((f) => ({ ...f, technician: e.target.value }))}
                    placeholder="Technician name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estHours">{t('estimatedHours')}</Label>
                  <Input
                    id="estHours"
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.estimatedHours || ''}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedHours: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actHours">{t('actualHours')}</Label>
                  <Input
                    id="actHours"
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.actualHours || ''}
                    onChange={(e) => setForm((f) => ({ ...f, actualHours: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">{t('mileage')}</Label>
                  <Input
                    id="mileage"
                    type="text"
                    value={form.mileage}
                    onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))}
                    placeholder="e.g. 150000"
                  />
                </div>
              </div>

              {/* Work Description */}
              <div className="space-y-2">
                <Label htmlFor="workDesc">{t('workDescription')}</Label>
                <Textarea
                  id="workDesc"
                  value={form.workDescription}
                  onChange={(e) => setForm((f) => ({ ...f, workDescription: e.target.value }))}
                  placeholder="Describe the work to be done..."
                  rows={3}
                />
              </div>

              <Separator />

              {/* Parts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">{t('partsUsed')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPartRow} className="gap-1">
                    <Plus className="size-3.5" /> {t('addItem')}
                  </Button>
                </div>

                {form.parts.length > 0 && (
                  <div className="rounded-md border">
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 p-3 bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                      <div className="col-span-3">{t('partName')}</div>
                      <div className="col-span-2">{t('partNumber')}</div>
                      <div className="col-span-1">{t('quantity')}</div>
                      <div className="col-span-2">{t('unitPrice')} (incl. VAT)</div>
                      <div className="col-span-3">{t('lineTotal')}</div>
                      <div className="col-span-1"></div>
                    </div>
                    <div className="divide-y">
                      {form.parts.map((part) => (
                        <div key={part.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 items-end">
                          <div className="sm:col-span-3">
                            <Label className="sm:hidden text-xs">{t('partName')}</Label>
                            <Input
                              value={part.name}
                              onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                              placeholder="Part name"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="sm:hidden text-xs">{t('partNumber')}</Label>
                            <Input
                              value={part.partNumber}
                              onChange={(e) => updatePart(part.id, 'partNumber', e.target.value)}
                              placeholder="#"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <Label className="sm:hidden text-xs">{t('quantity')}</Label>
                            <Input
                              type="number"
                              min={1}
                              value={part.quantity || ''}
                              onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="sm:hidden text-xs">{t('unitPrice')}</Label>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={part.unitPrice || ''}
                              onChange={(e) => updatePart(part.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-3 flex items-center h-8 text-sm font-medium">
                            {fmt(calcPartTotal(part))}
                          </div>
                          <div className="sm:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => removePartRow(part.id)}
                            >
                              <Minus className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {form.parts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">No parts added yet. Click &quot;Add Item&quot; to add parts.</p>
                )}
              </div>

              {/* Cost Summary — prices entered are VAT-inclusive (Gross) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Labor Cost (incl. VAT)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.laborCost || ''}
                    onChange={(e) => setForm((f) => ({ ...f, laborCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parts Cost (incl. VAT)</Label>
                  <Input value={fmt(partsCost)} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Total (incl. VAT)</Label>
                  <Input value={fmt(totalCost)} readOnly className="bg-teal-50 dark:bg-teal-900/20 font-bold text-teal-700 dark:text-teal-300" />
                </div>
              </div>

              {/* VAT Breakdown — extracted from Gross Total at 25.5% */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs text-muted-foreground mb-1">All prices above include VAT. VAT is extracted from the total.</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Net Amount (excl. 25.5% VAT)</span>
                  <span className="font-medium">{fmt(totalCost / 1.255)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">VAT (25.5%)</span>
                  <span className="font-medium">{fmt(totalCost - totalCost / 1.255)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total (incl. VAT)</span>
                  <span className="text-teal-700 dark:text-teal-300">{fmt(totalCost)}</span>
                </div>
              </div>

              <Separator />

              {/* Recommendations */}
              <div className="space-y-2">
                <Label htmlFor="recommendations">{t('recommendations')}</Label>
                <Textarea
                  id="recommendations"
                  value={form.recommendations}
                  onChange={(e) => setForm((f) => ({ ...f, recommendations: e.target.value }))}
                  placeholder="Recommendations for the customer..."
                  rows={2}
                />
              </div>

              {/* Next Service Due & Guarantee */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nextServiceDue">{t('nextServiceDue')}</Label>
                  <Input
                    id="nextServiceDue"
                    type="date"
                    value={form.nextServiceDue}
                    onChange={(e) => setForm((f) => ({ ...f, nextServiceDue: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceGuarantee">{t('serviceGuarantee')}</Label>
                  <Input
                    id="serviceGuarantee"
                    value={form.serviceGuarantee}
                    onChange={(e) => setForm((f) => ({ ...f, serviceGuarantee: e.target.value }))}
                    placeholder="e.g. 12 months / 20000 km"
                  />
                </div>
              </div>

              {/* Warranty Details */}
              <div className="space-y-2">
                <Label htmlFor="warranty">{t('warrantyDetails')}</Label>
                <Textarea
                  id="warranty"
                  value={form.warrantyDetails}
                  onChange={(e) => setForm((f) => ({ ...f, warrantyDetails: e.target.value }))}
                  placeholder="Warranty terms and details..."
                  rows={2}
                />
              </div>

              {/* Service Quality Check */}
              <div className="space-y-2">
                <Label htmlFor="qualityCheck">{t('serviceQualityCheck')}</Label>
                <Textarea
                  id="qualityCheck"
                  value={form.serviceQualityCheck}
                  onChange={(e) => setForm((f) => ({ ...f, serviceQualityCheck: e.target.value }))}
                  placeholder="Enter one check item per line..."
                  rows={3}
                />
              </div>

              {/* Technician Notes */}
              <div className="space-y-2">
                <Label htmlFor="techNotes">{t('technicianNotes')}</Label>
                <Textarea
                  id="techNotes"
                  value={form.technicianNotes}
                  onChange={(e) => setForm((f) => ({ ...f, technicianNotes: e.target.value }))}
                  placeholder="Internal technician notes..."
                  rows={2}
                />
              </div>

              {/* Customer Approval */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="customerApproval"
                  checked={form.customerApproval}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, customerApproval: !!checked }))}
                />
                <Label htmlFor="customerApproval" className="cursor-pointer">{t('customerApproval')}</Label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
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
            <AlertDialogTitle>{t('delete')} Work Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this work order? This action cannot be undone.
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
