import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, parseJsonFields, createAuditLog } from '@/lib/supabase-helpers'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const status = searchParams.get('status')

    let query = supabase
      .from('work_orders')
      .select('*, company:companies(*), booking:bookings(*)')
      .order('created_at', { ascending: false })

    if (companyId) query = query.eq('company_id', companyId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch maintenance certificates for each work order
    const result = await Promise.all(
      (data || []).map(async (wo) => {
        const row = wo as unknown as Record<string, unknown>
        const { data: certs } = await supabase
          .from('maintenance_certificates')
          .select('*')
          .eq('work_order_id', wo.id)

        return {
          ...parseWorkOrderFields(toCamel(row)),
          maintenanceCerts: certs ? toCamelArray(certs as unknown as Record<string, unknown>[]) : [],
        }
      })
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
      companyId, bookingId, date, status, technician,
      estimatedHours, actualHours, workDescription,
      partsUsed, laborCost, partsCost, totalCost,
      recommendations, customerApproval, mileage,
      nextServiceDue, serviceGuarantee, warrantyDetails,
      serviceQualityCheck, technicianNotes,
      carMake, carModel, licensePlate,
      customerId, customerDetails,
    } = body

    if (!companyId || !date) {
      return NextResponse.json({ error: 'Company ID and date are required' }, { status: 400 })
    }

    // Auto-generate workOrderNumber
    const { data: maxWO } = await supabase
      .from('work_orders')
      .select('work_order_number')
      .eq('company_id', companyId)
      .order('work_order_number', { ascending: false })
      .limit(1)

    const workOrderNumber = (maxWO?.[0]?.work_order_number ?? 0) + 1

    const partsUsedStr = typeof partsUsed === 'string' ? partsUsed : JSON.stringify(partsUsed ?? [])
    const sqcStr = typeof serviceQualityCheck === 'string'
      ? serviceQualityCheck
      : serviceQualityCheck ? JSON.stringify(serviceQualityCheck) : ''
    const cdStr = typeof customerDetails === 'string'
      ? customerDetails
      : customerDetails ? JSON.stringify(customerDetails) : ''

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        id,
        company_id: companyId,
        booking_id: bookingId ?? null,
        work_order_number: workOrderNumber,
        date,
        status: status ?? 'Draft',
        technician: technician ?? '',
        estimated_hours: estimatedHours !== undefined ? parseFloat(estimatedHours) : 0,
        actual_hours: actualHours !== undefined ? parseFloat(actualHours) : 0,
        work_description: workDescription ?? '',
        parts_used: partsUsedStr,
        labor_cost: laborCost !== undefined ? parseFloat(laborCost) : 0,
        parts_cost: partsCost !== undefined ? parseFloat(partsCost) : 0,
        total_cost: totalCost !== undefined ? parseFloat(totalCost) : 0,
        recommendations: recommendations ?? '',
        customer_approval: customerApproval ?? false,
        mileage: mileage ?? 0,
        next_service_due: nextServiceDue ?? '',
        service_guarantee: serviceGuarantee ?? '',
        warranty_details: warrantyDetails ?? '',
        service_quality_check: sqcStr,
        technician_notes: technicianNotes ?? '',
        car_make: carMake ?? '',
        car_model: carModel ?? '',
        license_plate: licensePlate ?? '',
        customer_id: customerId ?? null,
        customer_details: cdStr,
      })
      .select('*, company:companies(*), booking:bookings(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created work order #${workOrderNumber}`)

    const result = parseWorkOrderFields(toCamel(data as unknown as Record<string, unknown>))
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
