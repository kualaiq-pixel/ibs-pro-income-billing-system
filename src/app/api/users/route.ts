import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, createAuditLog } from '@/lib/supabase-helpers'

interface UserWithCompany {
  id: string;
  username: string;
  role: string;
  companyId: string | null;
  company: { id: string; name: string; code: string; [key: string]: unknown } | null;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    let query = supabase
      .from('users')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = toCamelArray<UserWithCompany>((data || []) as unknown as Record<string, unknown>[])
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, role, companyId } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Check if username exists
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1)

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('users')
      .insert({
        id,
        username,
        password,
        role: role ?? 'Staff',
        company_id: companyId ?? null,
      })
      .select('*, company:companies(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created user "${username}" with role "${role ?? 'Staff'}"`)

    const camelData = toCamel<UserWithCompany>(data as unknown as Record<string, unknown>)
    return NextResponse.json(camelData, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
