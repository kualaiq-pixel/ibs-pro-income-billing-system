import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { toCamel, parseJsonFields } from '@/lib/supabase-helpers';
import { generateInvoicePDF, type InvoiceData } from '@/lib/generate-invoice-pdf';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Fetch invoice with company and customer data
    const { data, error } = await supabase
      .from('incomes')
      .select('*, company:companies(*), customer:customers(*)')
      .eq('id', invoiceId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const inv = parseJsonFields(
      toCamel(data as unknown as Record<string, unknown>),
      ['services', 'customerDetails'],
    ) as Record<string, unknown>;

    const company = inv.company as Record<string, unknown> | null;
    const customer = inv.customer as Record<string, unknown> | null;
    const customerDetails = inv.customerDetails as Record<string, string> | null;
    const services = (inv.services as Array<{ description: string; price: number }> | null) ?? [];

    // Build InvoiceData for the PDF generator
    const pdfData: InvoiceData = {
      invoiceNumber: Number(inv.invoiceNumber) || 0,
      date: (inv.date as string) || '',
      referenceNumber: (inv.referenceNumber as string) || '',
      status: (inv.status as string) || 'Pending',
      vatRate: Number(inv.vatRate) || 25.5,
      amount: Number(inv.amount) || 0,
      paymentMethod: (inv.paymentMethod as string) || 'Bill',
      description: (inv.description as string) || '',
      category: (inv.category as string) || '',
      carMake: (inv.carMake as string) || '',
      carModel: (inv.carModel as string) || '',
      licensePlate: (inv.licensePlate as string) || '',
      customerName:
        (customer?.name as string) ||
        customerDetails?.name ||
        'Walk-in Customer',
      customerEmail: customerDetails?.email || '',
      customerAddress: customerDetails?.address || '',
      company: {
        name: (company?.name as string) || 'Company',
        vatId: (company?.vatId as string) || '',
        accountNumber: (company?.accountNumber as string) || '',
        address: (company?.address as string) || '',
        zipCode: (company?.zipCode as string) || '',
        city: (company?.city as string) || '',
        country: (company?.country as string) || '',
        phone: (company?.phone as string) || '',
        email: (company?.email as string) || '',
        currency: (company?.currency as string) || 'EUR',
      },
      services: services.map((s) => ({
        description: s.description || '',
        price: Number(s.price) || 0,
      })),
    };

    // Generate the PDF using jsPDF
    const pdfDoc = generateInvoicePDF(pdfData);
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    // Determine filename based on status
    const prefix = pdfData.status?.toLowerCase() === 'paid' ? 'Kuitti' : 'Lasku';
    const filename = `${prefix}_${pdfData.invoiceNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('PDF generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
