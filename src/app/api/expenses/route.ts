import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, createAuditLog } from '@/lib/supabase-helpers'

interface ExpenseRecord {
  id: string;
  companyId: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  vatRate: number;
  paymentMethod: string;
  company: unknown;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const category = searchParams.get('category')

    let query = supabase
      .from('expenses')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false })

    if (companyId) query = query.eq('company_id', companyId)
    if (category) query = query.eq('category', category)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = toCamelArray<ExpenseRecord>((data || []) as unknown as Record<string, unknown>[])
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, date, amount, category, description, vatRate, paymentMethod } = body

    if (!companyId || !date || amount === undefined) {
      return NextResponse.json({ error: 'Company ID, date, and amount are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        id,
        company_id: companyId,
        date,
        amount: parseFloat(amount),
        category: category ?? '',
        description: description ?? '',
        vat_rate: vatRate !== undefined ? parseFloat(vatRate) : 0,
        payment_method: paymentMethod ?? 'Bill',
      })
      .select('*, company:companies(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created expense of €${amount} for category "${category ?? 'General'}"`)

    return NextResponse.json(toCamel<ExpenseRecord>(data as unknown as Record<string, unknown>), { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
