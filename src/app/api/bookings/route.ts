import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, parseJsonFields, createAuditLog } from '@/lib/supabase-helpers'

interface BookingRecord {
  id: string;
  companyId: string;
  customerId: string | null;
  carMake: string;
  carModel: string;
  licensePlate: string;
  serviceType: string;
  bookingDate: string;
  bookingTime: string;
  notes: string;
  status: string;
  customerDetails: unknown;
  company: unknown;
  customer: unknown;
  createdAt: string;
  updatedAt: string;
}

function parseBookingFields(row: Record<string, unknown>): BookingRecord {
  return parseJsonFields<BookingRecord>(row, ['customerDetails'])
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const status = searchParams.get('status')

    let query = supabase
      .from('bookings')
      .select('*, company:companies(*), customer:customers(*)')
      .order('booking_date', { ascending: false })

    if (companyId) query = query.eq('company_id', companyId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = (data || []).map((row) =>
      parseBookingFields(toCamel(row as unknown as Record<string, unknown>))
    )

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyId, customerId, carMake, carModel, licensePlate,
      serviceType, bookingDate, bookingTime, notes, status, customerDetails,
    } = body

    if (!companyId || !bookingDate) {
      return NextResponse.json({ error: 'Company ID and booking date are required' }, { status: 400 })
    }

    const customerDetailsStr = typeof customerDetails === 'string'
      ? customerDetails
      : customerDetails ? JSON.stringify(customerDetails) : ''

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        id,
        company_id: companyId,
        customer_id: customerId ?? null,
        car_make: carMake ?? '',
        car_model: carModel ?? '',
        license_plate: licensePlate ?? '',
        service_type: serviceType ?? '',
        booking_date: bookingDate,
        booking_time: bookingTime ?? '09:00',
        notes: notes ?? '',
        status: status ?? 'Scheduled',
        customer_details: customerDetailsStr,
      })
      .select('*, company:companies(*), customer:customers(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created booking for ${bookingDate} (${serviceType ?? 'General'})`)

    const result = parseBookingFields(toCamel(data as unknown as Record<string, unknown>))
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
