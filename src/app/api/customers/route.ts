import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, createAuditLog } from '@/lib/supabase-helpers'

interface CustomerWithCompany {
  id: string;
  companyId: string;
  name: string;
  address: string;
  email: string;
  company: { id: string; name: string; [key: string]: unknown } | null;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    let query = supabase
      .from('customers')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with counts
    const result = await Promise.all(
      (data || []).map(async (customer) => {
        const row = customer as unknown as Record<string, unknown>
        const camel = toCamel<CustomerWithCompany>(row)

        const [incomesRes, bookingsRes] = await Promise.all([
          supabase.from('incomes').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
        ])

        return {
          ...camel,
          _count: {
            incomes: incomesRes.count ?? 0,
            bookings: bookingsRes.count ?? 0,
          },
        }
      })
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
    const { companyId, name, address, email } = body

    if (!companyId || !name) {
      return NextResponse.json({ error: 'Company ID and name are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('customers')
      .insert({
        id,
        company_id: companyId,
        name,
        address: address ?? '',
        email: email ?? '',
      })
      .select('*, company:companies(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created customer "${name}"`)

    return NextResponse.json(toCamel<CustomerWithCompany>(data as unknown as Record<string, unknown>), { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
