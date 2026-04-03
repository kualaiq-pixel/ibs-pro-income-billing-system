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

    // Aggregate counts in 6 queries instead of N*6 per-company queries
    const companiesData = data || []
    const companyIds = companiesData.map(c => c.id)

    let usersMap: Record<string, number> = {}
    let customersMap: Record<string, number> = {}
    let incomesMap: Record<string, number> = {}
    let expensesMap: Record<string, number> = {}
    let bookingsMap: Record<string, number> = {}
    let workOrdersMap: Record<string, number> = {}

    if (companyIds.length > 0) {
      const [usersRes, customersRes, incomesRes, expensesRes, bookingsRes, workOrdersRes] = await Promise.all([
        supabase.from('users').select('company_id').in('company_id', companyIds),
        supabase.from('customers').select('company_id').in('company_id', companyIds),
        supabase.from('incomes').select('company_id').in('company_id', companyIds),
        supabase.from('expenses').select('company_id').in('company_id', companyIds),
        supabase.from('bookings').select('company_id').in('company_id', companyIds),
        supabase.from('work_orders').select('company_id').in('company_id', companyIds),
      ])

      const groupByCompany = (rows: { company_id: string }[] | null) =>
        (rows ?? []).reduce<Record<string, number>>((acc, r) => {
          acc[r.company_id] = (acc[r.company_id] || 0) + 1
          return acc
        }, {})

      usersMap = groupByCompany(usersRes.data as { company_id: string }[] | null)
      customersMap = groupByCompany(customersRes.data as { company_id: string }[] | null)
      incomesMap = groupByCompany(incomesRes.data as { company_id: string }[] | null)
      expensesMap = groupByCompany(expensesRes.data as { company_id: string }[] | null)
      bookingsMap = groupByCompany(bookingsRes.data as { company_id: string }[] | null)
      workOrdersMap = groupByCompany(workOrdersRes.data as { company_id: string }[] | null)
    }

    const companies = companiesData.map((company) => {
      const row = company as unknown as Record<string, unknown>
      const camel = toCamel<CompanyWithCounts>(row)
      camel._count = {
        users: usersMap[company.id] ?? 0,
        customers: customersMap[company.id] ?? 0,
        incomes: incomesMap[company.id] ?? 0,
        expenses: expensesMap[company.id] ?? 0,
        bookings: bookingsMap[company.id] ?? 0,
        workOrders: workOrdersMap[company.id] ?? 0,
      }
      return camel
    })

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
