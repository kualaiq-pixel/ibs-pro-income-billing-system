import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, parseJsonFields, createAuditLog } from '@/lib/supabase-helpers'
import { generateReferenceNumber } from '@/lib/finnish-reference'

const safeFloat = (v: unknown, fallback = 0) => { const n = parseFloat(String(v ?? '')); return isNaN(n) ? fallback : n; };

interface IncomeRecord {
  id: string;
  companyId: string;
  customerId: string | null;
  invoiceNumber: number;
  date: string;
  amount: number;
  services: unknown;
  description: string;
  status: string;
  referenceNumber: string;
  vatRate: number;
  paymentMethod: string;
  category: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  customerDetails: unknown;
  company: unknown;
  customer: unknown;
  createdAt: string;
  updatedAt: string;
}

function parseIncomeFields(row: Record<string, unknown>): IncomeRecord {
  const parsed = parseJsonFields<IncomeRecord>(row, ['services', 'customerDetails'])
  return parsed
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const status = searchParams.get('status')

    let query = supabase
      .from('incomes')
      .select('*, company:companies(*), customer:customers(*)')
      .order('created_at', { ascending: false })

    if (companyId) query = query.eq('company_id', companyId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = (data || []).map((row) =>
      parseIncomeFields(toCamel(row as unknown as Record<string, unknown>))
    )

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyId, customerId, date, amount, services, description,
      status, vatRate, paymentMethod, category,
      carMake, carModel, licensePlate, customerDetails,
    } = body

    if (!companyId || !date || amount === undefined) {
      return NextResponse.json({ error: 'Company ID, date, and amount are required' }, { status: 400 })
    }

    // Auto-generate invoiceNumber (max existing + 1)
    const { data: maxIncome } = await supabase
      .from('incomes')
      .select('invoice_number')
      .eq('company_id', companyId)
      .order('invoice_number', { ascending: false })
      .limit(1)

    const invoiceNumber = (maxIncome?.[0]?.invoice_number ?? 0) + 1

    // Auto-generate referenceNumber using Finnish SFS 5338 standard
    const refNum = String(invoiceNumber).padStart(6, '0')
    const referenceNumber = generateReferenceNumber(refNum)

    const servicesStr = typeof services === 'string' ? services : JSON.stringify(services ?? [])
    const customerDetailsStr = typeof customerDetails === 'string'
      ? customerDetails
      : customerDetails ? JSON.stringify(customerDetails) : ''

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('incomes')
      .insert({
        id,
        company_id: companyId,
        customer_id: customerId ?? null,
        invoice_number: invoiceNumber,
        date,
        amount: safeFloat(amount),
        services: servicesStr,
        description: description ?? '',
        status: status ?? 'Pending',
        reference_number: referenceNumber,
        vat_rate: vatRate !== undefined ? safeFloat(vatRate, 25.5) : 25.5,
        payment_method: paymentMethod ?? 'Bill',
        category: category ?? 'Service',
        car_make: carMake ?? '',
        car_model: carModel ?? '',
        license_plate: licensePlate ?? '',
        customer_details: customerDetailsStr,
      })
      .select('*, company:companies(*), customer:customers(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created invoice #${invoiceNumber} for €${amount} (${status ?? 'Pending'})`)

    const result = parseIncomeFields(toCamel(data as unknown as Record<string, unknown>))
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
