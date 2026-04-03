import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, createAuditLog } from '@/lib/supabase-helpers'

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
      .from('bookings')
      .select('id, status, booking_date')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, company:companies(*), customer:customers(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Changed booking status for ${existing.booking_date} from "${existing.status}" to "${status}"`)

    return NextResponse.json(toCamel(data as unknown as Record<string, unknown>))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
