import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, parseJsonFields, createAuditLog, toCamelArray } from '@/lib/supabase-helpers'

interface WorkOrderRecord {
  id: string;
  companyId: string;
  bookingId: string | null;
  workOrderNumber: number;
  date: string;
  status: string;
  technician: string;
  estimatedHours: number;
  actualHours: number;
  workDescription: string;
  partsUsed: unknown;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  recommendations: string;
  customerApproval: boolean;
  mileage: number;
  nextServiceDue: string;
  serviceGuarantee: string;
  warrantyDetails: string;
  serviceQualityCheck: unknown;
  technicianNotes: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  customerId: string | null;
  customerDetails: unknown;
  company: unknown;
  booking: unknown;
  maintenanceCerts: unknown[];
  createdAt: string;
  updatedAt: string;
}

function parseWorkOrderFields(row: Record<string, unknown>): WorkOrderRecord {
  return parseJsonFields<WorkOrderRecord>(row, ['partsUsed', 'serviceQualityCheck', 'customerDetails'])
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, company:companies(*), booking:bookings(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Fetch maintenance certificates
    const { data: certs } = await supabase
      .from('maintenance_certificates')
      .select('*')
      .eq('work_order_id', id)

    const row = data as unknown as Record<string, unknown>
    return NextResponse.json({
      ...parseWorkOrderFields(toCamel(row)),
      maintenanceCerts: certs ? toCamelArray(certs as unknown as Record<string, unknown>[]) : [],
    })
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
      date, status, technician, estimatedHours, actualHours,
      workDescription, partsUsed, laborCost, partsCost, totalCost,
      recommendations, customerApproval, mileage,
      nextServiceDue, serviceGuarantee, warrantyDetails,
      serviceQualityCheck, technicianNotes,
      carMake, carModel, licensePlate,
      customerId, customerDetails, bookingId,
    } = body

    const { data: existing, error: checkError } = await supabase
      .from('work_orders')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (date !== undefined) updateData.date = date
    if (status !== undefined) updateData.status = status
    if (technician !== undefined) updateData.technician = technician
    if (estimatedHours !== undefined) updateData.estimated_hours = parseFloat(estimatedHours)
    if (actualHours !== undefined) updateData.actual_hours = parseFloat(actualHours)
    if (workDescription !== undefined) updateData.work_description = workDescription
    if (partsUsed !== undefined) updateData.parts_used = typeof partsUsed === 'string' ? partsUsed : JSON.stringify(partsUsed)
    if (laborCost !== undefined) updateData.labor_cost = parseFloat(laborCost)
    if (partsCost !== undefined) updateData.parts_cost = parseFloat(partsCost)
    if (totalCost !== undefined) updateData.total_cost = parseFloat(totalCost)
    if (recommendations !== undefined) updateData.recommendations = recommendations
    if (customerApproval !== undefined) updateData.customer_approval = customerApproval
    if (mileage !== undefined) updateData.mileage = mileage
    if (nextServiceDue !== undefined) updateData.next_service_due = nextServiceDue
    if (serviceGuarantee !== undefined) updateData.service_guarantee = serviceGuarantee
    if (warrantyDetails !== undefined) updateData.warranty_details = warrantyDetails
    if (serviceQualityCheck !== undefined) {
      updateData.service_quality_check = typeof serviceQualityCheck === 'string'
        ? serviceQualityCheck
        : serviceQualityCheck ? JSON.stringify(serviceQualityCheck) : ''
    }
    if (technicianNotes !== undefined) updateData.technician_notes = technicianNotes
    if (carMake !== undefined) updateData.car_make = carMake
    if (carModel !== undefined) updateData.car_model = carModel
    if (licensePlate !== undefined) updateData.license_plate = licensePlate
    if (customerId !== undefined) updateData.customer_id = customerId || null
    if (customerDetails !== undefined) {
      updateData.customer_details = typeof customerDetails === 'string'
        ? customerDetails
        : customerDetails ? JSON.stringify(customerDetails) : ''
    }
    if (bookingId !== undefined) updateData.booking_id = bookingId || null

    const { data, error } = await supabase
      .from('work_orders')
      .update(updateData)
      .eq('id', id)
      .select('*, company:companies(*), booking:bookings(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Updated work order #${data.work_order_number}`)

    return NextResponse.json(parseWorkOrderFields(toCamel(data as unknown as Record<string, unknown>)))
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
      .from('work_orders')
      .select('id, work_order_number')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    const { error } = await supabase.from('work_orders').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Deleted work order #${existing.work_order_number}`)

    return NextResponse.json({ success: true, message: 'Work order deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
