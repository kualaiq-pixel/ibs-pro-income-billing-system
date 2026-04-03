import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel } from '@/lib/supabase-helpers'

interface AuditLogRecord {
  id: string;
  timestamp: string;
  userName: string;
  description: string;
  userId: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '100', 10)

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(Math.min(limit, 1000))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = toCamelArray<AuditLogRecord>((data || []) as unknown as Record<string, unknown>[])
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userName, description } = body

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        id,
        user_id: userId ?? null,
        user_name: userName ?? 'System',
        description,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(toCamel<AuditLogRecord>(data as unknown as Record<string, unknown>), { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
