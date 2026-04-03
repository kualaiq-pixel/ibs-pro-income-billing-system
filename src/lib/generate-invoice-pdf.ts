/**
 * Professional A4 Invoice/Receipt PDF Generator
 *
 * Uses jsPDF + jspdf-autotable to create a clean, print-ready Finnish invoice
 * without any website UI elements. Supports:
 * - Conditional header: LASKU (Invoice) or KUITTI (Receipt) based on status
 * - Virtuaaliviivakoodi (Finnish virtual barcode) for Bill payments
 * - RF reference number (international format)
 * - Bilingual labels (Finnish / English)
 * - Full payment details section
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  formatReferenceNumber,
  generateRFReference,
  formatRFReference,
  generateVirtualBarcode,
  ibanToBBAN,
} from './finnish-reference';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface InvoiceCompany {
  name: string;
  vatId?: string;
  accountNumber?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  currency?: string;
}

interface InvoiceService {
  description: string;
  price: number;
}

interface InvoiceData {
  invoiceNumber: number;
  date: string;
  referenceNumber: string;
  status: string;
  vatRate: number;
  amount: number;
  paymentMethod: string;
  description?: string;
  category?: string;
  carMake?: string;
  carModel?: string;
  licensePlate?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  company: InvoiceCompany;
  services: InvoiceService[];
}

/* ── Colors (RGB arrays for jsPDF) ──────────────────────────────────────── */

const COLORS = {
  primary: [30, 64, 55] as const,
  primaryLight: [220, 237, 230] as const,
  text: [30, 30, 30] as const,
  textMuted: [100, 100, 100] as const,
  border: [200, 200, 200] as const,
  white: [255, 255, 255] as const,
  accentGreen: [16, 148, 100] as const,
  receiptGreen: [22, 101, 52] as const,
  tableHeader: [240, 245, 242] as const,
  tableStripe: [248, 251, 249] as const,
  paymentBox: [240, 248, 255] as const,
};

/* ── Helper ─────────────────────────────────────────────────────────────── */

function currencySymbol(code?: string): string {
  if (code === 'EUR' || !code) return '\u20AC';
  const map: Record<string, string> = {
    USD: '$', GBP: '\u00A3', SEK: 'kr', NOK: 'kr', JPY: '\u00A5',
    CHF: 'CHF', CNY: '\u00A5', KRW: '\u20A9', RUB: '\u20BD', TRY: '\u20BA',
    AED: '\u062F.\u0625', SAR: '\u0631.\u0633',
  };
  return map[code] ?? code;
}

function fmtMoney(amount: number, code?: string): string {
  const sym = currencySymbol(code);
  return `${amount.toFixed(2)} ${sym}`;
}

function formatIBAN(iban?: string): string {
  if (!iban) return '\u2014';
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

function getDueDate(invoiceDate: string, days: number): Date | null {
  try {
    const d = new Date(invoiceDate);
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + days);
    return d;
  } catch {
    return null;
  }
}

function formatDate(date: Date | null, fallback: string): string {
  if (!date) return fallback;
  return date.toISOString().split('T')[0];
}

function getCustomerBlockHeight(data: InvoiceData): number {
  let h = 12;
  if (data.customerAddress) h += 4;
  if (data.customerEmail) h += 4;
  return h + 5;
}

function isPaid(status: string): boolean {
  return status?.toLowerCase() === 'paid';
}

/* ── Main Generator ─────────────────────────────────────────────────────── */

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const sym = currencySymbol(data.company.currency);
  const formattedRef = formatReferenceNumber(data.referenceNumber || '');
  const rfRef = generateRFReference(data.referenceNumber || '');
  const formattedRF = rfRef ? formatRFReference(rfRef) : '';
  const paid = isPaid(data.status);
  const dueDate = getDueDate(data.date, 14);

  // ── Header: Company name + Document Title ───────────────────────────────
  // Left: Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.company.name || 'Company', margin, y + 7);

  // Right: Conditional title — LASKU or KUITTI
  if (paid) {
    doc.setFontSize(28);
    doc.setTextColor(...COLORS.receiptGreen);
    doc.text('KUITTI', pageW - margin, y + 7, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text('RECEIPT', pageW - margin, y + 13, { align: 'right' });
  } else {
    doc.setFontSize(28);
    doc.setTextColor(...COLORS.primary);
    doc.text('LASKU', pageW - margin, y + 7, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text('INVOICE', pageW - margin, y + 13, { align: 'right' });
  }

  y += 18;

  // ── Divider line ──────────────────────────────────────────────────────
  doc.setDrawColor(...(paid ? COLORS.receiptGreen : COLORS.primary));
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Company info (left) + Invoice meta (right) ──────────────────────
  const leftColX = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('LASKUTTAJA / SENDER', leftColX, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);

  const companyLines: string[] = [];
  if (data.company.name) companyLines.push(data.company.name);
  if (data.company.address) companyLines.push(data.company.address);
  if (data.company.zipCode || data.company.city) {
    companyLines.push(`${data.company.zipCode || ''} ${data.company.city || ''}`.trim());
  }
  if (data.company.country) companyLines.push(data.company.country);
  companyLines.push('');
  if (data.company.vatId) companyLines.push(`Y-tunnus: ${data.company.vatId}`);
  if (data.company.phone) companyLines.push(`Puh: ${data.company.phone}`);
  if (data.company.email) companyLines.push(`Email: ${data.company.email}`);

  for (const line of companyLines) {
    doc.text(line, leftColX, y);
    y += 4;
  }

  // Right column: Invoice details
  let rightY = margin + 26;
  const rightColX = pageW - margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text(paid ? 'KUITIN TIEDOT / RECEIPT INFO' : 'LASKUN TIEDOT / INVOICE INFO', rightColX, rightY);
  rightY += 5;

  const metaLines = [
    { label: paid ? 'Kuittinro / Receipt No:' : 'Laskunro / Invoice No:', value: `#${data.invoiceNumber}` },
    { label: 'P\u00E4iv\u00E4m\u00E4\u00E4r\u00E4 / Date:', value: data.date },
  ];

  if (!paid && dueDate) {
    metaLines.push({ label: 'Er\u00E4p\u00E4iv\u00E4 / Due Date:', value: formatDate(dueDate, '14 p\u00E4iv\u00E4\u00E4 / 14 days') });
  }

  metaLines.push(
    { label: 'Maksutapa / Payment:', value: data.paymentMethod || 'Bill' },
    { label: 'Viitenumero / Ref:', value: formattedRef || '\u2014' },
  );

  if (formattedRF) {
    metaLines.push({ label: 'RF-viite / RF Ref:', value: formattedRF });
  }

  metaLines.push({ label: 'Tila / Status:', value: data.status });

  for (const { label, value } of metaLines) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(label, rightColX, rightY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(value, rightColX, rightY + 5, { align: 'right' });
    rightY += 10;
  }

  if (y < rightY) y = rightY + 5;
  y += 5;

  // ── Customer info ────────────────────────────────────────────────────
  const custBlockH = getCustomerBlockHeight(data);
  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(margin, y - 3, contentW, custBlockH, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.text('VASTAANOTTAJA / RECIPIENT', margin + 4, y + 1);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(data.customerName || 'Walk-in Customer', margin + 4, y + 1);
  y += 5;

  doc.setFontSize(9);
  if (data.customerAddress) {
    doc.text(data.customerAddress, margin + 4, y + 1);
    y += 4;
  }
  if (data.customerEmail) {
    doc.text(data.customerEmail, margin + 4, y + 1);
    y += 4;
  }

  y += 5;

  // ── Vehicle info ─────────────────────────────────────────────────────
  if (data.carMake || data.licensePlate) {
    const vehicleText = [
      data.carMake,
      data.carModel,
      data.licensePlate ? `(${data.licensePlate})` : '',
    ].filter(Boolean).join(' ');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('AJONEUVO / VEHICLE', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(vehicleText, margin, y);
    y += 8;
  }

  // ── Services table ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('PALVELUT / SERVICES', margin, y);
  y += 2;

  const services = Array.isArray(data.services) && data.services.length > 0
    ? data.services
    : [{ description: data.description || data.category || 'Service', price: data.amount }];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.tableHeader,
      textColor: COLORS.primary,
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.1,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.tableStripe,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
    },
    head: [[
      'Kuvaus / Description',
      `Hinta ALV ${data.vatRate}% (${sym})`,
    ]],
    body: services.map((s) => [
      s.description || '\u2014',
      fmtMoney(s.price, data.company.currency),
    ]),
  });

  y = ((doc as Record<string, unknown>).lastAutoTable as Record<string, number> | undefined)?.finalY ?? y + 30;
  y += 8;

  // ── Totals block ────────────────────────────────────────────────────
  const netAmount = data.amount / (1 + data.vatRate / 100);
  const vatAmount = data.amount - netAmount;

  const totalsX = pageW - margin - 65;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Veroton hinta / Net Amount:', totalsX, y);
  doc.text(fmtMoney(netAmount, data.company.currency), pageW - margin, y, { align: 'right' });
  y += 5;

  doc.text(`ALV ${data.vatRate}% / VAT:`, totalsX, y);
  doc.text(fmtMoney(vatAmount, data.company.currency), pageW - margin, y, { align: 'right' });
  y += 2;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, pageW - margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.text('YHTEENS\u00C4 / TOTAL:', totalsX, y);
  doc.text(fmtMoney(data.amount, data.company.currency), pageW - margin, y, { align: 'right' });
  y += 10;

  // ── Payment details box (only for Bill payments) ─────────────────────
  if (data.paymentMethod === 'Bill') {
    const hasBarcode = !!data.company.accountNumber && formattedRef;
    const boxH = hasBarcode ? 68 : 52;

    doc.setFillColor(...COLORS.paymentBox);
    doc.setDrawColor(...COLORS.accentGreen);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, boxH, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text('MAKSUMIETTELO / PAYMENT DETAILS', margin + 5, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);

    const leftX = margin + 5;
    const midX = margin + contentW / 2 + 5;
    let payY = y + 14;

    // Row 1: Receiver + IBAN
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(7);
    doc.text('Saaja / Receiver', leftX, payY);
    doc.text('IBAN', midX, payY);
    payY += 4;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text(data.company.name || '\u2014', leftX, payY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatIBAN(data.company.accountNumber), midX, payY);
    payY += 5;

    // Row 2: Reference + Y-tunnus
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('Viitenumero / Reference', leftX, payY);
    doc.text('Y-tunnus / Business ID', midX, payY);
    payY += 4;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(formattedRef || '\u2014', leftX, payY);
    doc.setFontSize(9);
    doc.text(data.company.vatId || '\u2014', midX, payY);
    payY += 5;

    // Row 3: Amount + Due Date
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('M\u00E4\u00E4r\u00E4 / Amount', leftX, payY);
    doc.text('Er\u00E4p\u00E4iv\u00E4 / Due Date', midX, payY);
    payY += 4;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.accentGreen);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtMoney(data.amount, data.company.currency), leftX, payY);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(dueDate, '14 p\u00E4iv\u00E4\u00E4 / 14 days'), midX, payY);

    // ── Virtuaaliviivakoodi (Virtual Barcode) ─────────────────────────
    if (hasBarcode) {
      payY += 6;
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.15);
      doc.line(leftX, payY - 2, margin + contentW - 5, payY - 2);
      payY += 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('VIRTUAALIVIIVAKOODI / VIRTUAL BARCODE', leftX, payY);
      payY += 4;

      const amountCents = Math.round(data.amount * 100);
      const barcode = generateVirtualBarcode({
        iban: data.company.accountNumber || '',
        amountCents,
        referenceNumber: data.referenceNumber || '',
        dueDate: dueDate || undefined,
      });

      if (barcode) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.text);
        // Split barcode into lines if too long
        const barcodeChunks = doc.splitTextToSize(barcode, contentW - 15);
        for (const chunk of barcodeChunks) {
          doc.text(chunk, leftX, payY);
          payY += 3.5;
        }
      }
    }

    y += boxH + 8;
  }

  // ── Notes ────────────────────────────────────────────────────────────
  if (data.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.text('HUOMAUTUKSET / NOTES', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    const lines = doc.splitTextToSize(data.description, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 5;
  }

  // ── Footer ───────────────────────────────────────────────────────────
  const footerY = pageH - 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3);

  const footerParts = [
    data.company.name,
    data.company.vatId ? `Y-tunnus: ${data.company.vatId}` : '',
    data.company.address,
    data.company.phone ? `Puh: ${data.company.phone}` : '',
    data.company.email ? `Email: ${data.company.email}` : '',
  ].filter(Boolean).join('  |  ');

  doc.text(footerParts, margin, footerY, { maxWidth: contentW });
  doc.text(
    `${paid ? 'Receipt' : 'Invoice'} #${data.invoiceNumber}  |  Generated by IBS Pro  |  ${new Date().toISOString().split('T')[0]}`,
    pageW - margin,
    footerY,
    { align: 'right' },
  );

  return doc;
}

/* ── Export for API Route ──────────────────────────────────────────────── */

export type { InvoiceData };
