import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, createAuditLog } from '@/lib/supabase-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, username, password, isCompanyLogin, companyCode } = body

    if (action === 'logout') {
      return NextResponse.json({ success: true, message: 'Logged out successfully' })
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    if (isCompanyLogin && companyCode) {
      // Company login: find user by username AND verify company code
      const { data: users, error } = await supabase
        .from('users')
        .select('*, company:companies(*)')
        .eq('username', username)
        .limit(1)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const user = users?.[0]
      if (!user || user.password !== password) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      if (!user.company || user.company.code !== companyCode) {
        return NextResponse.json({ error: 'Invalid company code' }, { status: 401 })
      }

      await createAuditLog(user.id, user.username, `User "${user.username}" logged in (company: ${user.company.name})`)

      const camelUser = toCamel<{
        id: string;
        username: string;
        role: string;
        companyId: string | null;
        company: { id: string; name: string; code: string; [key: string]: unknown };
      }>(user as unknown as Record<string, unknown>)

      return NextResponse.json({
        success: true,
        user: {
          id: camelUser.id,
          username: camelUser.username,
          role: camelUser.role,
          companyId: camelUser.companyId,
          companyName: camelUser.company?.name,
          companyCode: camelUser.company?.code,
        },
      })
    }

    // Admin login
    const { data: users, error } = await supabase
      .from('users')
      .select('*, company:companies(*)')
      .eq('username', username)
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const user = users?.[0]
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required. Please use company login.' }, { status: 403 })
    }

    await createAuditLog(user.id, user.username, `User "${user.username}" logged in (role: ${user.role})`)

    const camelUser = toCamel<{
      id: string;
      username: string;
      role: string;
      companyId: string | null;
      company: { id: string; name: string; code: string; [key: string]: unknown } | null;
    }>(user as unknown as Record<string, unknown>)

    return NextResponse.json({
      success: true,
      user: {
        id: camelUser.id,
        username: camelUser.username,
        role: camelUser.role,
        companyId: camelUser.companyId,
        companyName: camelUser.company?.name,
        companyCode: camelUser.company?.code,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
