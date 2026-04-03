'use client';

import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { useTranslation, useArrayTranslation } from '@/hooks/use-translation';
import { CAR_MAKES, CAR_MODELS } from '@/i18n/car-data';

/* ── VehicleSelector ─────────────────────────────────────────────────────── */

interface VehicleSelectorProps {
  carMake: string;
  carModel: string;
  licensePlate: string;
  onCarMakeChange: (value: string) => void;
  onCarModelChange: (value: string) => void;
  onLicensePlateChange: (value: string) => void;
  className?: string;
}

export function VehicleSelector({
  carMake,
  carModel,
  licensePlate,
  onCarMakeChange,
  onCarModelChange,
  onLicensePlateChange,
  className,
}: VehicleSelectorProps) {
  const t = useTranslation();

  const availableModels = useMemo(() => {
    if (!carMake) return [];
    return CAR_MODELS[carMake] ?? [];
  }, [carMake]);

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${className ?? ''}`}>
      {/* Car Make */}
      <div className="space-y-2">
        <Label htmlFor="carMake">{t('carMake')}</Label>
        <Select value={carMake} onValueChange={(v) => { onCarMakeChange(v); onCarModelChange(''); }}>
          <SelectTrigger id="carMake">
            <SelectValue placeholder={t('carMake')} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {CAR_MAKES.map((make) => (
              <SelectItem key={make} value={make}>{make}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Car Model */}
      <div className="space-y-2">
        <Label htmlFor="carModel">{t('carModel')}</Label>
        <Select
          value={carModel}
          onValueChange={onCarModelChange}
          disabled={!carMake}
        >
          <SelectTrigger id="carModel">
            <SelectValue placeholder={t('carModel')} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {availableModels.map((model) => (
              <SelectItem key={model} value={model}>{model}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* License Plate */}
      <div className="space-y-2">
        <Label htmlFor="licensePlate">{t('licensePlate')}</Label>
        <Input
          id="licensePlate"
          value={licensePlate}
          onChange={(e) => onLicensePlateChange(e.target.value)}
          placeholder="ABC-123"
        />
      </div>
    </div>
  );
}

/* ── CustomerSelector ────────────────────────────────────────────────────── */

interface CustomerSelectorProps {
  customerId: string;
  onCustomerIdChange: (id: string) => void;
  className?: string;
}

export function CustomerSelector({
  customerId,
  onCustomerIdChange,
  className,
}: CustomerSelectorProps) {
  const t = useTranslation();
  const customers = useAppStore((s) => s.customers);

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label>{t('customerName')}</Label>
      <Select value={customerId} onValueChange={onCustomerIdChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectService').replace('service', 'customer')} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── IndividualCustomerFields ─────────────────────────────────────────────── */

interface IndividualCustomerFieldsProps {
  name: string;
  email: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onZipCodeChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  className?: string;
}

export function IndividualCustomerFields({
  name,
  email,
  address,
  zipCode,
  city,
  country,
  onNameChange,
  onEmailChange,
  onAddressChange,
  onZipCodeChange,
  onCityChange,
  onCountryChange,
  className,
}: IndividualCustomerFieldsProps) {
  const t = useTranslation();

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className ?? ''}`}>
      <div className="space-y-2">
        <Label htmlFor="indName">{t('customerName')}</Label>
        <Input
          id="indName"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('customerName')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="indEmail">{t('customerEmail')}</Label>
        <Input
          id="indEmail"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={t('customerEmail')}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="indAddress">{t('customerAddress')}</Label>
        <Input
          id="indAddress"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t('customerAddress')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="indZip">{t('zipCode')}</Label>
        <Input
          id="indZip"
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          placeholder={t('zipCode')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="indCity">{t('city')}</Label>
        <Input
          id="indCity"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder={t('city')}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="indCountry">{t('country')}</Label>
        <Input
          id="indCountry"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          placeholder={t('country')}
        />
      </div>
    </div>
  );
}

/* ── ServiceSelector ─────────────────────────────────────────────────────── */

interface ServiceSelectorProps {
  serviceType: string;
  onServiceTypeChange: (value: string) => void;
  className?: string;
}

export function ServiceSelector({
  serviceType,
  onServiceTypeChange,
  className,
}: ServiceSelectorProps) {
  const t = useTranslation();
  const serviceOptions = useArrayTranslation('carServicesList');
  const [customService, setCustomService] = useState('');
  const isOther = serviceType === 'Other' || serviceType === 'Muu työ' || serviceType === 'أخرى';

  const handleServiceChange = (value: string) => {
    onServiceTypeChange(value);
    if (value !== 'Other' && value !== 'Muu työ' && value !== 'أخرى') {
      setCustomService('');
    }
  };

  const handleCustomChange = (value: string) => {
    setCustomService(value);
    onServiceTypeChange(value);
  };

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label>{t('serviceType')}</Label>
      <Select value={isOther ? 'Other' : serviceType} onValueChange={handleServiceChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectService')} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {serviceOptions.map((svc) => (
            <SelectItem key={svc} value={svc}>{svc}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isOther && (
        <Input
          value={customService}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder={t('otherSpecify')}
          className="mt-2"
          autoFocus
        />
      )}
    </div>
  );
}
