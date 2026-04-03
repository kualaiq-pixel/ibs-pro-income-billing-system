import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, createAuditLog } from '@/lib/supabase-helpers'

interface CompanyWithCounts {
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
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    customers: number;
    incomes: number;
    expenses: number;
    bookings: number;
    workOrders: number;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get counts
    const [usersRes, customersRes, incomesRes, expensesRes, bookingsRes, workOrdersRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('incomes').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('work_orders').select('id', { count: 'exact', head: true }).eq('company_id', id),
    ])

    const camelData = toCamel<CompanyWithCounts>(data as unknown as Record<string, unknown>)
    camelData._count = {
      users: usersRes.count ?? 0,
      customers: customersRes.count ?? 0,
      incomes: incomesRes.count ?? 0,
      expenses: expensesRes.count ?? 0,
      bookings: bookingsRes.count ?? 0,
      workOrders: workOrdersRes.count ?? 0,
    }

    return NextResponse.json(camelData)
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
    const { name, code, vat, vatId, accountNumber, address, zipCode, city, country, currency, phone, email, businessId } = body

    // Check if exists
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id, code')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check code uniqueness if changed
    if (code && code !== existing.code) {
      const { data: codeExists } = await supabase
        .from('companies')
        .select('id')
        .eq('code', code)
        .limit(1)

      if (codeExists && codeExists.length > 0) {
        return NextResponse.json({ error: 'Company code already exists' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (vat !== undefined) updateData.vat = vat
    if (vatId !== undefined) updateData.vat_id = vatId
    if (accountNumber !== undefined) updateData.account_number = accountNumber
    if (address !== undefined) updateData.address = address
    if (zipCode !== undefined) updateData.zip_code = zipCode
    if (city !== undefined) updateData.city = city
    if (country !== undefined) updateData.country = country
    if (currency !== undefined) updateData.currency = currency
    if (businessId !== undefined) updateData.business_id = businessId
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Updated company "${data.name}" (code: ${data.code})`)

    return NextResponse.json(toCamel<CompanyWithCounts>(data as unknown as Record<string, unknown>))
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
      .from('companies')
      .select('id, name, code')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Deleted company "${existing.name}" (code: ${existing.code})`)

    return NextResponse.json({ success: true, message: 'Company deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
