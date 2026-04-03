import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, parseJsonFields, createAuditLog } from '@/lib/supabase-helpers'

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
  return parseJsonFields<IncomeRecord>(row, ['services', 'customerDetails'])
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('incomes')
      .select('*, company:companies(*), customer:customers(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    return NextResponse.json(parseIncomeFields(toCamel(data as unknown as Record<string, unknown>)))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      date, amount, services, description, status, vatRate,
      paymentMethod, category, carMake, carModel, licensePlate,
      customerId, customerDetails,
    } = body

    const { data: existing, error: checkError } = await supabase
      .from('incomes')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (date !== undefined) updateData.date = date
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (services !== undefined) updateData.services = typeof services === 'string' ? services : JSON.stringify(services)
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (vatRate !== undefined) updateData.vat_rate = parseFloat(vatRate)
    if (paymentMethod !== undefined) updateData.payment_method = paymentMethod
    if (category !== undefined) updateData.category = category
    if (carMake !== undefined) updateData.car_make = carMake
    if (carModel !== undefined) updateData.car_model = carModel
    if (licensePlate !== undefined) updateData.license_plate = licensePlate
    if (customerId !== undefined) updateData.customer_id = customerId || null
    if (customerDetails !== undefined) {
      updateData.customer_details = typeof customerDetails === 'string'
        ? customerDetails
        : customerDetails ? JSON.stringify(customerDetails) : ''
    }

    const { data, error } = await supabase
      .from('incomes')
      .update(updateData)
      .eq('id', id)
      .select('*, company:companies(*), customer:customers(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Updated invoice #${data.invoice_number}`)

    return NextResponse.json(parseIncomeFields(toCamel(data as unknown as Record<string, unknown>)))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: existing, error: checkError } = await supabase
      .from('incomes')
      .select('id, invoice_number')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    const { error } = await supabase.from('incomes').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Deleted invoice #${existing.invoice_number}`)

    return NextResponse.json({ success: true, message: 'Income deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const { data: existing, error: checkError } = await supabase
      .from('incomes')
      .select('id, status, invoice_number')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('incomes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, company:companies(*), customer:customers(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Changed invoice #${existing.invoice_number} status from "${existing.status}" to "${status}"`)

    return NextResponse.json(parseIncomeFields(toCamel(data as unknown as Record<string, unknown>)))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
