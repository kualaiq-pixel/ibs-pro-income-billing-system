import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, createAuditLog } from '@/lib/supabase-helpers'

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('shk_links')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'SHK link not found' }, { status: 404 })
    }

    return NextResponse.json(toCamel<ShkLinkRecord>(data as unknown as Record<string, unknown>))
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
    const { name, url, username, password, companyId } = body

    const { data: existing, error: checkError } = await supabase
      .from('shk_links')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'SHK link not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (url !== undefined) updateData.url = url
    if (username !== undefined) updateData.username = username
    if (password !== undefined) updateData.password = password
    if (companyId !== undefined) updateData.company_id = companyId

    const { data, error } = await supabase
      .from('shk_links')
      .update(updateData)
      .eq('id', id)
      .select('*, company:companies(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Updated SHK link "${data.name}"`)

    return NextResponse.json(toCamel<ShkLinkRecord>(data as unknown as Record<string, unknown>))
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
      .from('shk_links')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'SHK link not found' }, { status: 404 })
    }

    const { error } = await supabase.from('shk_links').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Deleted SHK link "${existing.name}"`)

    return NextResponse.json({ success: true, message: 'SHK link deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
