import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, createAuditLog } from '@/lib/supabase-helpers'

interface UserWithCompany {
  id: string;
  username: string;
  role: string;
  companyId: string | null;
  company: { id: string; name: string; code: string; [key: string]: unknown } | null;
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
      .from('users')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(toCamel<UserWithCompany>(data as unknown as Record<string, unknown>))
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
    const { username, password, role, companyId } = body

    // Check if exists
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check username uniqueness if changed
    if (username && username !== existing.username) {
      const { data: usernameExists } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .limit(1)

      if (usernameExists && usernameExists.length > 0) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (username !== undefined) updateData.username = username
    if (password !== undefined) updateData.password = password
    if (role !== undefined) updateData.role = role
    if (companyId !== undefined) updateData.company_id = companyId || null

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*, company:companies(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(data.id, data.username, `Updated user "${data.username}" (role: ${data.role})`)

    return NextResponse.json(toCamel<UserWithCompany>(data as unknown as Record<string, unknown>))
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
      .from('users')
      .select('id, username, role')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, existing.username, `Deleted user "${existing.username}" (role: ${existing.role})`)

    return NextResponse.json({ success: true, message: 'User deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
