'use client';

import { useState, useCallback } from 'react';
import { useAppStore, type MaintenanceCertificate, type InspectionItem } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { MAINTENANCE_TYPES, INSPECTION_RESULTS } from '@/i18n/constants';
import { VehicleSelector, CustomerSelector, IndividualCustomerFields } from '@/components/ibs/form-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Award } from 'lucide-react';

/* ── Status helpers ───────────────────────────────────────────────────────── */

function CertificateStatusBadge({ validUntil }: { validUntil: string }) {
  if (!validUntil) {
    return <Badge variant="secondary">N/A</Badge>;
  }
  const now = new Date();
  const valid = new Date(validUntil);
  const diff = valid.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
        Expired
      </Badge>
    );
  }
  if (days <= 30) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
        Expiring Soon
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      Valid
    </Badge>
  );
}

/* ── Inspection Item Config ───────────────────────────────────────────────── */

interface InspectionFieldConfig {
  key: string;
  labelKey: string;
}

const INSPECTION_FIELDS: InspectionFieldConfig[] = [
  { key: 'vehicleInspection', labelKey: 'vehicleInspection' },
  { key: 'safetyChecks', labelKey: 'safetyChecks' },
  { key: 'fluidLevels', labelKey: 'fluidLevels' },
  { key: 'tireCondition', labelKey: 'tireCondition' },
  { key: 'brakeCondition', labelKey: 'brakeCondition' },
  { key: 'batteryCondition', labelKey: 'batteryCondition' },
  { key: 'filterCondition', labelKey: 'filterCondition' },
  { key: 'overallAssessment', labelKey: 'overallAssessment' },
];

/* ── Form Interface ───────────────────────────────────────────────────────── */

interface MaintenanceCertForm {
  customerMethod: 'workOrder' | 'existing' | 'individual';
  workOrderId: string;
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
  certificateNumber: string;
  maintenanceDate: string;
  validUntil: string;
  maintenanceType: string;
  nextMaintenanceDate: string;
  maintenanceInterval: string;
  technicianName: string;
  inspectionResults: Record<string, string>;
  technicianNotes: string;
  recommendations: string;
  serviceHistory: string;
  additionalRemarks: string;
}

const emptyInspectionResults: Record<string, string> = {};
INSPECTION_FIELDS.forEach((f) => {
  emptyInspectionResults[f.key] = '';
});

const emptyForm: MaintenanceCertForm = {
  customerMethod: 'workOrder',
  workOrderId: '',
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
  certificateNumber: '',
  maintenanceDate: new Date().toISOString().split('T')[0],
  validUntil: '',
  maintenanceType: 'Regular Maintenance',
  nextMaintenanceDate: '',
  maintenanceInterval: '',
  technicianName: '',
  inspectionResults: { ...emptyInspectionResults },
  technicianNotes: '',
  recommendations: '',
  serviceHistory: '',
  additionalRemarks: '',
};

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function CompanyMaintenanceCertificates() {
  const t = useTranslation();
  const language = useAppStore((s) => s.language);
  const isRTL = language === 'AR';
  const certificates = useAppStore((s) => s.maintenanceCertificates);
  const workOrders = useAppStore((s) => s.workOrders);
  const customers = useAppStore((s) => s.customers);
  const setData = useAppStore((s) => s.setData);
  const addDataItem = useAppStore((s) => s.addDataItem);
  const updateDataItem = useAppStore((s) => s.updateDataItem);
  const removeDataItem = useAppStore((s) => s.removeDataItem);
  const currentUser = useAppStore((s) => s.currentUser);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MaintenanceCertForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceCertificate | null>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      const cid = currentUser?.companyId;
      const res = await fetch(`/api/maintenance-certificates?companyId=${cid}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setData('maintenanceCertificates', data);
      }
    } catch { /* silent */ }
  }, [currentUser?.companyId, setData]);

  const selectedWorkOrder = workOrders.find((wo) => wo.id === form.workOrderId);

  const handleWorkOrderSelect = (woId: string) => {
    const wo = workOrders.find((w) => w.id === woId);
    if (wo) {
      setForm((f) => ({
        ...f,
        workOrderId: woId,
        customerName: wo.customerName,
        customerId: wo.customerId ?? '',
        carMake: wo.carMake,
        carModel: wo.carModel,
        licensePlate: wo.licensePlate,
        technicianName: wo.technician,
      }));
    }
  };

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (cert: MaintenanceCertificate) => {
    const inspResults: Record<string, string> = { ...emptyInspectionResults };
    if (Array.isArray(cert.inspectionItems)) {
      cert.inspectionItems.forEach((item: InspectionItem) => {
        inspResults[item.name] = item.result;
      });
    }

    setForm({
      customerMethod: cert.workOrderId ? 'workOrder' : cert.customerId ? 'existing' : 'individual',
      workOrderId: cert.workOrderId ?? '',
      customerId: cert.customerId ?? '',
      customerName: cert.customerName,
      customerEmail: '',
      customerAddress: '',
      customerZipCode: '',
      customerCity: '',
      customerCountry: '',
      carMake: cert.carMake,
      carModel: cert.carModel,
      licensePlate: cert.licensePlate,
      certificateNumber: cert.certificateNumber,
      maintenanceDate: cert.maintenanceDate,
      validUntil: cert.validUntil,
      maintenanceType: cert.maintenanceType,
      nextMaintenanceDate: cert.nextMaintenanceDate,
      maintenanceInterval: cert.maintenanceInterval,
      technicianName: cert.technicianName,
      inspectionResults: inspResults,
      technicianNotes: cert.technicianNotes,
      recommendations: cert.recommendations ?? '',
      serviceHistory: Array.isArray(cert.servicePerformed) ? (cert.servicePerformed as unknown as string[]).join('\n') : (cert.servicePerformed as string ?? ''),
      additionalRemarks: cert.additionalRemarks ?? '',
    });
    setEditingId(cert.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (cert: MaintenanceCertificate) => {
    setDeleteTarget(cert);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    const customerName =
      form.customerMethod === 'workOrder' && selectedWorkOrder
        ? selectedWorkOrder.customerName
        : form.customerMethod === 'existing'
          ? customers.find((c) => c.id === form.customerId)?.name ?? ''
          : form.customerName;

    if (!customerName.trim() || !form.carMake || !form.maintenanceDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const inspectionItems = INSPECTION_FIELDS.map((field) => ({
        id: field.key,
        name: field.key,
        result: form.inspectionResults[field.key] ?? '',
        notes: '',
      }));

      const serviceHistoryArr = form.serviceHistory
        ? form.serviceHistory.split('\n').filter((l) => l.trim())
        : [];

      const payload = {
        customerMethod: form.customerMethod,
        workOrderId: form.customerMethod === 'workOrder' ? form.workOrderId : undefined,
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
        maintenanceDate: form.maintenanceDate,
        validUntil: form.validUntil,
        maintenanceType: form.maintenanceType,
        nextMaintenanceDate: form.nextMaintenanceDate,
        maintenanceInterval: form.maintenanceInterval,
        technicianName: form.technicianName,
        inspectionResults: JSON.stringify(inspectionItems),
        technicianNotes: form.technicianNotes,
        recommendations: form.recommendations,
        serviceHistory: JSON.stringify(serviceHistoryArr),
        additionalRemarks: form.additionalRemarks,
        companyId: currentUser?.companyId,
      };

      if (editingId) {
        const res = await fetch(`/api/maintenance-certificates/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          updateDataItem('maintenanceCertificates', editingId, updated);
          toast.success('Certificate updated');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to update');
        }
      } else {
        const res = await fetch('/api/maintenance-certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          addDataItem('maintenanceCertificates', created);
          toast.success('Certificate created');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to create');
        }
      }
      setDialogOpen(false);
      fetchCertificates();
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
      const res = await fetch(`/api/maintenance-certificates/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        removeDataItem('maintenanceCertificates', deleteTarget.id);
        toast.success('Certificate deleted');
        fetchCertificates();
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
            <Award className="size-6 text-teal-500" />
            {t('manageMaintenanceCertificates')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('maintenanceCertificates')}</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="size-4 me-2" />
          {t('addNewMaintenanceCertificate')}
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Award className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No certificates yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first maintenance certificate.
                </p>
                <Button onClick={handleOpenAdd} className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
                  <Plus className="size-4 me-2" />
                  {t('addNewMaintenanceCertificate')}
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('maintenanceCertificateId')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">{t('inspectionDate')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('vehicle')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">{t('maintenanceType')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('validUntil')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('status')}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-end">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {certificates.map((cert, index) => (
                          <TableRow
                            key={cert.id}
                            className="animate-fade-in transition-colors hover:bg-muted/50"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <TableCell className="font-mono text-xs">{cert.certificateNumber}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{cert.maintenanceDate}</TableCell>
                            <TableCell className="font-medium">
                              {cert.carMake} {cert.carModel}
                              <span className="text-xs text-muted-foreground block">{cert.licensePlate}</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="outline" className="text-xs">{cert.maintenanceType}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{cert.validUntil || '-'}</TableCell>
                            <TableCell>
                              <CertificateStatusBadge validUntil={cert.validUntil} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handleOpenEdit(cert)}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteClick(cert)}
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
                <div className="sm:hidden divide-y">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{cert.carMake} {cert.carModel}</p>
                          <p className="text-xs text-muted-foreground font-mono">{cert.certificateNumber}</p>
                        </div>
                        <CertificateStatusBadge validUntil={cert.validUntil} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">Date:</span> {cert.maintenanceDate}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Type:</span>
                          <Badge variant="outline" className="text-xs ml-1">{cert.maintenanceType}</Badge>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Plate:</span> {cert.licensePlate}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Valid until:</span> {cert.validUntil || '-'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => handleOpenEdit(cert)}
                        >
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(cert)}
                        >
                          <Trash2 className="size-3.5" /> Delete
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
              {editingId ? t('editMaintenanceCertificate') : t('addNewMaintenanceCertificate')}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update certificate details' : 'Create a new maintenance certificate'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70dvh] px-1">
            <div className="grid gap-5 py-4 pr-4">
              {/* Customer Selection Method */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">{t('customer')}</Label>
                <div className="flex flex-wrap gap-2">
                  {(['workOrder', 'existing', 'individual'] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={form.customerMethod === method ? 'default' : 'outline'}
                      size="sm"
                      className={form.customerMethod === method ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
                      onClick={() => setForm((f) => ({ ...f, customerMethod: method }))}
                    >
                      {method === 'workOrder' ? 'From Work Order' : method === 'existing' ? t('customer') : t('individualCustomer')}
                    </Button>
                  ))}
                </div>

                {form.customerMethod === 'workOrder' && (
                  <div className="space-y-2">
                    <Label>Select Work Order</Label>
                    <Select value={form.workOrderId} onValueChange={handleWorkOrderSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a work order..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {workOrders
                          .filter((wo) => wo.status === 'Completed')
                          .map((wo) => (
                            <SelectItem key={wo.id} value={wo.id}>
                              {wo.customerName} - {wo.carMake} {wo.carModel} ({wo.workOrderDate})
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

              {/* Certificate Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>{t('maintenanceCertificateId')}</Label>
                  <Input
                    value={form.certificateNumber || 'Auto-generated'}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    disabled={!!editingId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certDate">{t('maintenanceDate')} *</Label>
                  <Input
                    id="certDate"
                    type="date"
                    value={form.maintenanceDate}
                    onChange={(e) => setForm((f) => ({ ...f, maintenanceDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">{t('validUntil')}</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('maintenanceType')}</Label>
                  <Select value={form.maintenanceType} onValueChange={(v) => setForm((f) => ({ ...f, maintenanceType: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_TYPES.map((mt) => (
                        <SelectItem key={mt} value={mt}>{mt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Next Maintenance & Interval */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="nextMaintDate">{t('nextMaintenanceDate')}</Label>
                  <Input
                    id="nextMaintDate"
                    type="date"
                    value={form.nextMaintenanceDate}
                    onChange={(e) => setForm((f) => ({ ...f, nextMaintenanceDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintInterval">{t('maintenanceInterval')}</Label>
                  <Input
                    id="maintInterval"
                    value={form.maintenanceInterval}
                    onChange={(e) => setForm((f) => ({ ...f, maintenanceInterval: e.target.value }))}
                    placeholder="e.g. 15000 km / 12 months"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certTechnician">{t('certifiedTechnician')}</Label>
                  <Input
                    id="certTechnician"
                    value={form.technicianName}
                    onChange={(e) => setForm((f) => ({ ...f, technicianName: e.target.value }))}
                    placeholder="Technician name"
                  />
                </div>
              </div>

              <Separator />

              {/* Inspection Results */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">{t('inspectionResults')}</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {INSPECTION_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{t(field.labelKey as 'vehicleInspection')}</Label>
                      <Select
                        value={form.inspectionResults[field.key] ?? ''}
                        onValueChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            inspectionResults: { ...f.inspectionResults, [field.key]: v },
                          }))
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="-- Select --" />
                        </SelectTrigger>
                        <SelectContent>
                          {INSPECTION_RESULTS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Technician Notes */}
              <div className="space-y-2">
                <Label htmlFor="certTechNotes">{t('technicianNotes')}</Label>
                <Textarea
                  id="certTechNotes"
                  value={form.technicianNotes}
                  onChange={(e) => setForm((f) => ({ ...f, technicianNotes: e.target.value }))}
                  placeholder="Technician observations..."
                  rows={3}
                />
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <Label htmlFor="certRecomm">{t('recommendations')}</Label>
                <Textarea
                  id="certRecomm"
                  value={form.recommendations}
                  onChange={(e) => setForm((f) => ({ ...f, recommendations: e.target.value }))}
                  placeholder="Recommendations..."
                  rows={2}
                />
              </div>

              {/* Service History */}
              <div className="space-y-2">
                <Label htmlFor="svcHistory">{t('serviceHistory')}</Label>
                <Textarea
                  id="svcHistory"
                  value={form.serviceHistory}
                  onChange={(e) => setForm((f) => ({ ...f, serviceHistory: e.target.value }))}
                  placeholder="Enter one service item per line..."
                  rows={3}
                />
              </div>

              {/* Additional Remarks */}
              <div className="space-y-2">
                <Label htmlFor="certRemarks">{t('additionalRemarks')}</Label>
                <Textarea
                  id="certRemarks"
                  value={form.additionalRemarks}
                  onChange={(e) => setForm((f) => ({ ...f, additionalRemarks: e.target.value }))}
                  placeholder="Any additional remarks..."
                  rows={2}
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
            <AlertDialogTitle>{t('delete')} Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this certificate? This action cannot be undone.
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
