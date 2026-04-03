'use client';

import { useState, useCallback } from 'react';
import { useAppStore, type Booking } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { BOOKING_STATUSES } from '@/i18n/constants';
import { VehicleSelector, CustomerSelector, IndividualCustomerFields, ServiceSelector } from '@/components/ibs/form-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, CalendarDays, Play, CheckCircle } from 'lucide-react';

/* ── Status Badge ─────────────────────────────────────────────────────────── */

function BookingStatusBadge({ status }: { status: string }) {
  const t = useTranslation();
  const colorMap: Record<string, string> = {
    Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  const statusKey = (status.replace(/\s+/g, '').charAt(0).toLowerCase() + status.replace(/\s+/g, '').slice(1)) as 'scheduled' | 'inProgress' | 'completed' | 'cancelled';
  const label = t(statusKey);

  return (
    <Badge variant="secondary" className={colorMap[status] ?? ''}>
      {label}
    </Badge>
  );
}

/* ── Form Interface ───────────────────────────────────────────────────────── */

interface BookingForm {
  customerMethod: 'existing' | 'individual';
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
  bookingDate: string;
  bookingTime: string;
  serviceType: string;
  notes: string;
  status: string;
}

const emptyForm: BookingForm = {
  customerMethod: 'existing',
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
  bookingDate: '',
  bookingTime: '',
  serviceType: '',
  notes: '',
  status: 'Scheduled',
};

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function CompanyBookings() {
  const t = useTranslation();
  const language = useAppStore((s) => s.language);
  const isRTL = language === 'AR';
  const bookings = useAppStore((s) => s.bookings);
  const setData = useAppStore((s) => s.setData);
  const addDataItem = useAppStore((s) => s.addDataItem);
  const updateDataItem = useAppStore((s) => s.updateDataItem);
  const removeDataItem = useAppStore((s) => s.removeDataItem);
  const currentUser = useAppStore((s) => s.currentUser);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const cid = currentUser?.companyId;
      const res = await fetch(`/api/bookings?companyId=${cid}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setData('bookings', data);
      }
    } catch { /* silent */ }
  }, [currentUser?.companyId, setData]);

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (booking: Booking) => {
    setForm({
      customerMethod: booking.customerId ? 'existing' : 'individual',
      customerId: booking.customerId ?? '',
      customerName: booking.customerName,
      customerEmail: '',
      customerAddress: '',
      customerZipCode: '',
      customerCity: '',
      customerCountry: '',
      carMake: booking.carMake,
      carModel: booking.carModel,
      licensePlate: booking.licensePlate,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      serviceType: booking.serviceType,
      notes: booking.notes,
      status: booking.status,
    });
    setEditingId(booking.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (booking: Booking) => {
    setDeleteTarget(booking);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    const customerName =
      form.customerMethod === 'existing'
        ? useAppStore.getState().customers.find((c) => c.id === form.customerId)?.name ?? ''
        : form.customerName;

    if (!customerName.trim() || !form.carMake || !form.bookingDate || !form.serviceType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerMethod: form.customerMethod,
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
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime,
        serviceType: form.serviceType,
        notes: form.notes,
        status: form.status,
        companyId: currentUser?.companyId,
      };

      if (editingId) {
        const res = await fetch(`/api/bookings/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          updateDataItem('bookings', editingId, updated);
          toast.success('Booking updated');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to update booking');
        }
      } else {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          addDataItem('bookings', created);
          toast.success('Booking created');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to create booking');
        }
      }
      setDialogOpen(false);
      fetchBookings();
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
      const res = await fetch(`/api/bookings/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        removeDataItem('bookings', deleteTarget.id);
        toast.success('Booking deleted');
        fetchBookings();
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

  const handleStatusUpdate = async (booking: Booking, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        updateDataItem('bookings', booking.id, updated);
        toast.success(`Status updated to ${newStatus}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error');
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
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="size-6 text-teal-500 shrink-0" />
            {t('manageBookings')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('bookings')}</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-700 text-white whitespace-normal text-center shrink-0">
          <Plus className="size-4 me-2" />
          {t('addNewBooking')}
        </Button>
      </motion.div>

      {/* Bookings List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <CalendarDays className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No bookings yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first booking to get started.
                </p>
                <Button onClick={handleOpenAdd} className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
                  <Plus className="size-4 me-2" />
                  {t('addNewBooking')}
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block">
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('customer')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">{t('vehicle')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">{t('serviceType')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('date')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('status')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-end">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking, index) => (
                          <TableRow
                            key={booking.id}
                            className="animate-fade-in transition-colors hover:bg-muted/50"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {booking.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="font-medium">{booking.customerName}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {booking.carMake} {booking.carModel} <span className="text-xs">({booking.licensePlate})</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="outline" className="text-xs">{booking.serviceType}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {booking.bookingDate}
                              {booking.bookingTime && <span className="text-muted-foreground ml-1">{booking.bookingTime}</span>}
                            </TableCell>
                            <TableCell>
                              <BookingStatusBadge status={booking.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                {booking.status === 'Scheduled' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-yellow-600 hover:text-yellow-700"
                                    onClick={() => handleStatusUpdate(booking, 'In Progress')}
                                    title="Start"
                                  >
                                    <Play className="size-3.5" />
                                  </Button>
                                )}
                                {booking.status === 'In Progress' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-emerald-600 hover:text-emerald-700"
                                    onClick={() => handleStatusUpdate(booking, 'Completed')}
                                    title="Complete"
                                  >
                                    <CheckCircle className="size-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handleOpenEdit(booking)}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteClick(booking)}
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

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-border">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-4 space-y-3">
                      {/* Top row: status + date/time */}
                      <div className="flex items-center justify-between gap-2">
                        <BookingStatusBadge status={booking.status} />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {booking.bookingDate}
                          {booking.bookingTime && (
                            <span className="ms-1">{booking.bookingTime}</span>
                          )}
                        </span>
                      </div>

                      {/* Customer name */}
                      <div>
                        <p className="text-sm font-medium">{booking.customerName}</p>
                      </div>

                      {/* Vehicle info */}
                      <div className="text-sm text-muted-foreground">
                        {booking.carMake} {booking.carModel}
                        <span className="ms-1 text-xs">— {booking.licensePlate}</span>
                      </div>

                      {/* Service type badge */}
                      <div>
                        <Badge variant="outline" className="text-xs">{booking.serviceType}</Badge>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {booking.status === 'Scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400 h-8"
                            onClick={() => handleStatusUpdate(booking, 'In Progress')}
                          >
                            <Play className="size-3.5 me-1" />
                            {t('start') || 'Start'}
                          </Button>
                        )}
                        {booking.status === 'In Progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:border-emerald-400 h-8"
                            onClick={() => handleStatusUpdate(booking, 'Completed')}
                          >
                            <CheckCircle className="size-3.5 me-1" />
                            {t('complete') || 'Complete'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleOpenEdit(booking)}
                        >
                          <Pencil className="size-3.5 me-1" />
                          {t('edit') || 'Edit'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 h-8"
                          onClick={() => handleDeleteClick(booking)}
                        >
                          <Trash2 className="size-3.5 me-1" />
                          {t('delete') || 'Delete'}
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
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('editBooking') : t('addNewBooking')}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update booking details' : 'Create a new service booking'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65dvh] px-1">
            <div className="grid gap-5 py-4 pr-4">
              {/* Customer Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">{t('customer')}</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={form.customerMethod === 'existing' ? 'default' : 'outline'}
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={() => setForm((f) => ({ ...f, customerMethod: 'existing' }))}
                  >
                    {t('customer')}
                  </Button>
                  <Button
                    type="button"
                    variant={form.customerMethod === 'individual' ? 'default' : 'outline'}
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={() => setForm((f) => ({ ...f, customerMethod: 'individual', customerId: '' }))}
                  >
                    {t('individualCustomer')}
                  </Button>
                </div>
                {form.customerMethod === 'existing' ? (
                  <CustomerSelector
                    customerId={form.customerId}
                    onCustomerIdChange={(id) => setForm((f) => ({ ...f, customerId: id }))}
                  />
                ) : (
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

              {/* Date & Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bookingDate">{t('bookingDate')} *</Label>
                  <Input
                    id="bookingDate"
                    type="date"
                    value={form.bookingDate}
                    onChange={(e) => setForm((f) => ({ ...f, bookingDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingTime">{t('bookingTime')}</Label>
                  <Input
                    id="bookingTime"
                    type="time"
                    value={form.bookingTime}
                    onChange={(e) => setForm((f) => ({ ...f, bookingTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Service Type */}
              <ServiceSelector
                serviceType={form.serviceType}
                onServiceTypeChange={(v) => setForm((f) => ({ ...f, serviceType: v }))}
              />

              {/* Status (only when editing) */}
              {editingId && (
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOKING_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('notes')}</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
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
            <AlertDialogTitle>{t('delete')} Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the booking for &quot;{deleteTarget?.customerName}&quot;? This action cannot be undone.
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
