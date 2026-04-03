import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, createAuditLog } from '@/lib/supabase-helpers'

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('expenses')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(toCamel<ExpenseRecord>(data as unknown as Record<string, unknown>))
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
    const { date, amount, category, description, vatRate, paymentMethod } = body

    const { data: existing, error: checkError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (date !== undefined) updateData.date = date
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (vatRate !== undefined) updateData.vat_rate = parseFloat(vatRate)
    if (paymentMethod !== undefined) updateData.payment_method = paymentMethod

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select('*, company:companies(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Updated expense (ID: ${id})`)

    return NextResponse.json(toCamel<ExpenseRecord>(data as unknown as Record<string, unknown>))
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
      .from('expenses')
      .select('id, amount, category')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Deleted expense of €${existing.amount} (${existing.category})`)

    return NextResponse.json({ success: true, message: 'Expense deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
