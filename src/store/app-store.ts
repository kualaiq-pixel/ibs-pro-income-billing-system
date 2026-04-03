import { create } from 'zustand';
import type { Language } from '@/i18n/translations';

// ── Data Types ──────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  code: string;
  vat: string;
  vatId: string;
  accountNumber: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  currency: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
  companyId: string | null;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  invoiceId: string;
  customerId: string | null;
  customerName: string | null;
  accountNumber: string;
  referenceNumber: string;
  paymentMethod: string;
  vatRate: number;
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
  companyId: string;
  items: TransactionLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  invoiceId: string;
  vendor: string | null;
  accountNumber: string;
  referenceNumber: string;
  paymentMethod: string;
  vatRate: number;
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
  companyId: string;
  items: TransactionLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  serviceType: string;
  bookingDate: string;
  bookingTime: string;
  notes: string;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderPart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface WorkOrder {
  id: string;
  bookingId: string | null;
  customerId: string;
  customerName: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  workOrderDate: string;
  status: string;
  technician: string;
  estimatedHours: number;
  actualHours: number;
  laborCost: number;
  parts: WorkOrderPart[];
  partsCost: number;
  totalCost: number;
  workDescription: string;
  recommendations: string;
  customerApproval: boolean;
  customerSignature: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceCertificate {
  id: string;
  customerId: string;
  customerName: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  certificateNumber: string;
  maintenanceType: string;
  maintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceInterval: string;
  mileage: string;
  technicianName: string;
  inspectionItems: InspectionItem[];
  overallAssessment: string;
  servicePerformed: string;
  nextServiceDue: string;
  serviceGuarantee: string;
  warrantyDetails: string;
  allChecksPassed: boolean;
  technicianNotes: string;
  validUntil: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionItem {
  id: string;
  name: string;
  result: string;
  notes: string;
}

export interface ShkLink {
  id: string;
  name: string;
  url: string;
  username: string | null;
  password: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  username: string;
  details: string;
  timestamp: string;
  companyId: string | null;
}

// ── Editing types ───────────────────────────────────────────────────────────

export type EditingType =
  | 'company'
  | 'user'
  | 'transaction'
  | 'customer'
  | 'booking'
  | 'workOrder'
  | 'maintenance'
  | 'shkLink';

// ── Data cache types ───────────────────────────────────────────────────────

export type DataType =
  | 'companies'
  | 'users'
  | 'customers'
  | 'incomes'
  | 'expenses'
  | 'bookings'
  | 'workOrders'
  | 'maintenanceCertificates'
  | 'shkLinks'
  | 'auditLogs';

// ── Current User type ──────────────────────────────────────────────────────

export interface CurrentUser {
  id: string;
  username: string;
  role: string;
  companyId: string | null;
}

// ── Store State ────────────────────────────────────────────────────────────

interface AppState {
  // Auth & Navigation
  currentView: string;
  currentUser: CurrentUser | null;
  currentCompany: Company | null;
  isAuthenticated: boolean;

  // Editing state
  editingCompanyId: string | null;
  editingUserId: string | null;
  editingTransactionId: string | null;
  editingCustomerId: string | null;
  editingBookingId: string | null;
  editingWorkOrderId: string | null;
  editingMaintenanceId: string | null;
  editingShkLinkId: string | null;
  transactionType: 'income' | 'expense';

  // UI State
  language: Language;
  isDarkMode: boolean;
  sidebarOpen: boolean;

  // Data Cache
  companies: Company[];
  users: User[];
  customers: Customer[];
  incomes: Income[];
  expenses: Expense[];
  bookings: Booking[];
  workOrders: WorkOrder[];
  maintenanceCertificates: MaintenanceCertificate[];
  shkLinks: ShkLink[];
  auditLogs: AuditLog[];

  // Actions
  setCurrentView: (view: string) => void;
  login: (user: CurrentUser, company?: Company | null) => void;
  logout: () => void;
  setEditing: (type: EditingType, id: string | null) => void;
  setTransactionType: (type: 'income' | 'expense') => void;
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setData: (type: DataType, data: unknown[]) => void;
  updateDataItem: (type: DataType, id: string, updates: Partial<unknown>) => void;
  addDataItem: (type: DataType, item: unknown) => void;
  removeDataItem: (type: DataType, id: string) => void;
  clearAllData: () => void;
}

// ── Helper: get the data array from store by type ──────────────────────────

function getDataArray(state: AppState, type: DataType): unknown[] {
  switch (type) {
    case 'companies': return state.companies;
    case 'users': return state.users;
    case 'customers': return state.customers;
    case 'incomes': return state.incomes;
    case 'expenses': return state.expenses;
    case 'bookings': return state.bookings;
    case 'workOrders': return state.workOrders;
    case 'maintenanceCertificates': return state.maintenanceCertificates;
    case 'shkLinks': return state.shkLinks;
    case 'auditLogs': return state.auditLogs;
  }
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  // Auth & Navigation – defaults
  currentView: 'login',
  currentUser: null,
  currentCompany: null,
  isAuthenticated: false,

  // Editing state – defaults
  editingCompanyId: null,
  editingUserId: null,
  editingTransactionId: null,
  editingCustomerId: null,
  editingBookingId: null,
  editingWorkOrderId: null,
  editingMaintenanceId: null,
  editingShkLinkId: null,
  transactionType: 'income',

  // UI State – defaults
  language: 'EN',
  isDarkMode: true,
  sidebarOpen: false,

  // Data Cache – defaults
  companies: [],
  users: [],
  customers: [],
  incomes: [],
  expenses: [],
  bookings: [],
  workOrders: [],
  maintenanceCertificates: [],
  shkLinks: [],
  auditLogs: [],

  // ── Actions ─────────────────────────────────────────────────────────────

  setCurrentView: (view) => set({ currentView: view }),

  login: (user, company = null) =>
    set({
      currentUser: user,
      currentCompany: company,
      isAuthenticated: true,
      currentView: user.role === 'Admin' ? 'adminDashboard' : 'companyDashboard',
    }),

  logout: () =>
    set({
      currentUser: null,
      currentCompany: null,
      isAuthenticated: false,
      currentView: 'login',
      editingCompanyId: null,
      editingUserId: null,
      editingTransactionId: null,
      editingCustomerId: null,
      editingBookingId: null,
      editingWorkOrderId: null,
      editingMaintenanceId: null,
      editingShkLinkId: null,
    }),

  setEditing: (type, id) => {
    const map: Record<EditingType, string> = {
      company: 'editingCompanyId',
      user: 'editingUserId',
      transaction: 'editingTransactionId',
      customer: 'editingCustomerId',
      booking: 'editingBookingId',
      workOrder: 'editingWorkOrderId',
      maintenance: 'editingMaintenanceId',
      shkLink: 'editingShkLinkId',
    };
    return set({ [map[type]]: id });
  },

  setTransactionType: (type) => set({ transactionType: type }),

  setLanguage: (lang) => set({ language: lang }),

  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setData: (type, data) => {
    switch (type) {
      case 'companies': return set({ companies: data as Company[] });
      case 'users': return set({ users: data as User[] });
      case 'customers': return set({ customers: data as Customer[] });
      case 'incomes': return set({ incomes: data as Income[] });
      case 'expenses': return set({ expenses: data as Expense[] });
      case 'bookings': return set({ bookings: data as Booking[] });
      case 'workOrders': return set({ workOrders: data as WorkOrder[] });
      case 'maintenanceCertificates': return set({ maintenanceCertificates: data as MaintenanceCertificate[] });
      case 'shkLinks': return set({ shkLinks: data as ShkLink[] });
      case 'auditLogs': return set({ auditLogs: data as AuditLog[] });
    }
  },

  updateDataItem: (type, id, updates) =>
    set((state) => {
      const arr = getDataArray(state, type) as { id: string }[];
      const idx = arr.findIndex((item) => item.id === id);
      if (idx === -1) return {};
      const newArr = [...arr];
      newArr[idx] = { ...newArr[idx], ...updates };
      return { [type]: newArr };
    }),

  addDataItem: (type, item) =>
    set((state) => {
      const arr = getDataArray(state, type);
      return { [type]: [...arr, item] };
    }),

  removeDataItem: (type, id) =>
    set((state) => {
      const arr = getDataArray(state, type) as { id: string }[];
      return { [type]: arr.filter((item) => item.id !== id) };
    }),

  clearAllData: () =>
    set({
      companies: [],
      users: [],
      customers: [],
      incomes: [],
      expenses: [],
      bookings: [],
      workOrders: [],
      maintenanceCertificates: [],
      shkLinks: [],
      auditLogs: [],
    }),
}));
