import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, parseJsonFields, createAuditLog } from '@/lib/supabase-helpers'

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('bookings')
      .select('*, company:companies(*), customer:customers(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(parseBookingFields(toCamel(data as unknown as Record<string, unknown>)))
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
    const {
      carMake, carModel, licensePlate, serviceType,
      bookingDate, bookingTime, notes, status,
      customerId, customerDetails,
    } = body

    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (carMake !== undefined) updateData.car_make = carMake
    if (carModel !== undefined) updateData.car_model = carModel
    if (licensePlate !== undefined) updateData.license_plate = licensePlate
    if (serviceType !== undefined) updateData.service_type = serviceType
    if (bookingDate !== undefined) updateData.booking_date = bookingDate
    if (bookingTime !== undefined) updateData.booking_time = bookingTime
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status
    if (customerId !== undefined) updateData.customer_id = customerId || null
    if (customerDetails !== undefined) {
      updateData.customer_details = typeof customerDetails === 'string'
        ? customerDetails
        : customerDetails ? JSON.stringify(customerDetails) : ''
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select('*, company:companies(*), customer:customers(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Updated booking for ${data.booking_date}`)

    return NextResponse.json(parseBookingFields(toCamel(data as unknown as Record<string, unknown>)))
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
      .from('bookings')
      .select('id, booking_date')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Deleted booking for ${existing.booking_date}`)

    return NextResponse.json({ success: true, message: 'Booking deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
