import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createAuditLog } from '@/lib/supabase-helpers'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (error || !data) {
      // Create default settings if not found
      const id = crypto.randomUUID()
      const { data: newSettings, error: createError } = await supabase
        .from('app_settings')
        .insert({
          id,
          settings: '{}',
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json({ id: newSettings.id })
    }

    let parsed: Record<string, unknown> = {}
    try {
      parsed = JSON.parse(data.settings as string)
    } catch {
      parsed = {}
    }

    return NextResponse.json({ id: data.id, ...parsed })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...settingsData } = body
    const settingsStr = JSON.stringify(settingsData)

    // Try update first
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('id', 'main')
      .single()

    let result

    if (existing) {
      const { data, error } = await supabase
        .from('app_settings')
        .update({
          settings: settingsStr,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'main')
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    } else {
      // Create new
      const newId = 'main'
      const { data, error } = await supabase
        .from('app_settings')
        .insert({
          id: newId,
          settings: settingsStr,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    }

    await createAuditLog(null, 'System', 'Updated application settings')

    return NextResponse.json({ id: result.id, ...settingsData })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
