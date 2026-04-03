import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, createAuditLog } from '@/lib/supabase-helpers'

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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get counts for each company
    const companies = await Promise.all(
      (data || []).map(async (company) => {
        const [usersRes, customersRes, incomesRes, expensesRes, bookingsRes, workOrdersRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('incomes').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('work_orders').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
        ])

        const row = company as unknown as Record<string, unknown>
        const camel = toCamel<CompanyWithCounts>(row)
        camel._count = {
          users: usersRes.count ?? 0,
          customers: customersRes.count ?? 0,
          incomes: incomesRes.count ?? 0,
          expenses: expensesRes.count ?? 0,
          bookings: bookingsRes.count ?? 0,
          workOrders: workOrdersRes.count ?? 0,
        }
        return camel
      })
    )

    return NextResponse.json(companies)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, vat, vatId, accountNumber, address, zipCode, city, country, currency } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Check if code already exists
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('code', code)
      .limit(1)

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Company code already exists' }, { status: 409 })
    }

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('companies')
      .insert({
        id,
        name,
        code,
        vat: vat ?? '',
        vat_id: vatId ?? '',
        account_number: accountNumber ?? '',
        address: address ?? '',
        zip_code: zipCode ?? '',
        city: city ?? '',
        country: country ?? '',
        currency: currency ?? '€',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created company "${name}" (code: ${code})`)

    const camelData = toCamel<CompanyWithCounts>(data as unknown as Record<string, unknown>)
    return NextResponse.json(camelData, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
