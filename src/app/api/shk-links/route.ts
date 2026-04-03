import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, createAuditLog } from '@/lib/supabase-helpers'

interface ShkLinkRecord {
  id: string;
  companyId: string;
  name: string;
  url: string;
  username: string;
  password: string;
  company: unknown;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    let query = supabase
      .from('shk_links')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false })

    if (companyId) query = query.eq('company_id', companyId)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = toCamelArray<ShkLinkRecord>((data || []) as unknown as Record<string, unknown>[])
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, name, url, username, password } = body

    if (!companyId || !name || !url) {
      return NextResponse.json({ error: 'Company ID, name, and URL are required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('shk_links')
      .insert({
        id,
        company_id: companyId,
        name,
        url,
        username: username ?? '',
        password: password ?? '',
      })
      .select('*, company:companies(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created SHK link "${name}"`)

    return NextResponse.json(toCamel<ShkLinkRecord>(data as unknown as Record<string, unknown>), { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
