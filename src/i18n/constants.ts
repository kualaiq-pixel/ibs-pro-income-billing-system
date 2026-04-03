// ── Roles ──────────────────────────────────────────────────────────────────
export const ROLES = ['Admin', 'Manager', 'Accountant', 'Staff', 'Viewer'] as const;

// ── VAT Rates (percentage) ────────────────────────────────────────────────
export const VAT_RATES = [0, 10, 14, 25.5] as const;

// ── Payment Methods ───────────────────────────────────────────────────────
export const PAYMENT_METHODS = ['Card', 'Bill', 'Cash'] as const;

// ── Currencies (code → symbol) ────────────────────────────────────────────
export const CURRENCIES: Record<string, string> = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  SEK: "kr",
  NZD: "NZ$",
  MXN: "$",
  SGD: "S$",
  HKD: "HK$",
  NOK: "kr",
  KRW: "₩",
  TRY: "₺",
  RUB: "₽",
  INR: "₹",
  BRL: "R$",
  ZAR: "R",
  AED: "د.إ",
  SAR: "ر.س",
  QAR: "ر.ق",
  OMR: "ر.ع.",
  KWD: "د.ك",
  BHD: ".د.ب",
  IQD: "ع.د",
};

// ── Booking Statuses ──────────────────────────────────────────────────────
export const BOOKING_STATUSES = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

// ── Work Order Statuses ───────────────────────────────────────────────────
export const WORK_ORDER_STATUSES = [
  "Draft",
  "In Progress",
  "Awaiting Parts",
  "Ready for Review",
  "Completed",
  "Cancelled",
] as const;

// ── Maintenance Types ─────────────────────────────────────────────────────
export const MAINTENANCE_TYPES = [
  "Regular Maintenance",
  "Major Service",
  "Pre-Purchase Inspection",
  "Safety Inspection",
  "Emission Test",
  "Warranty Service",
  "Recall Service",
  "Custom Maintenance",
] as const;

// ── Inspection Results ────────────────────────────────────────────────────
export const INSPECTION_RESULTS = [
  "Passed",
  "Failed",
  "Attention Required",
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Replace",
  "Monitor",
  "Immediate Attention",
] as const;

// ── Default Service Options ───────────────────────────────────────────────
export const DEFAULT_SERVICE_OPTIONS = [
  "Battery",
  "Towing service",
  "Maintenance",
  "Air conditioning",
  "Timing belt",
  "Brakes",
  "Suspension and shock absorbers",
  "Inspection",
  "Inspection service",
  "Inspection repair",
  "Body and damage repair",
  "Clutch",
  "Bearings and axles",
  "Accessories",
  "Block heater",
  "Painting work",
  "Engine",
  "Motorcycle maintenance",
  "Four-wheel alignment",
  "Steering",
  "Oil change",
  "Optimization and chipping",
  "Exhaust system",
  "Bicycle maintenance",
  "Cleaning and maintenance services",
  "Tires",
  "Rust repair",
  "Rust protection",
  "Electrical work",
  "Windshield and glasses",
  "Transmission",
  "Lights",
  "Rims",
  "Towbar",
  "Troubleshooting",
  "Error code reading",
  "* Other work *",
] as const;

// ── TypeScript derived types ──────────────────────────────────────────────
export type Role = (typeof ROLES)[number];
export type VatRate = (typeof VAT_RATES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];
export type ServiceOption = (typeof DEFAULT_SERVICE_OPTIONS)[number];
