import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamel, parseJsonFields, createAuditLog } from '@/lib/supabase-helpers'

interface CertRecord {
  id: string;
  companyId: string;
  workOrderId: string | null;
  certificateNumber: string;
  issueDate: string;
  validUntil: string;
  maintenanceType: string;
  nextMaintenanceDate: string;
  maintenanceInterval: string;
  certifiedTechnician: string;
  inspectionResults: unknown;
  technicianNotes: string;
  recommendations: string;
  serviceHistory: unknown;
  additionalRemarks: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  customerId: string | null;
  customerDetails: unknown;
  company: unknown;
  workOrder: unknown;
  createdAt: string;
  updatedAt: string;
}

function parseCertFields(row: Record<string, unknown>): CertRecord {
  return parseJsonFields<CertRecord>(row, ['inspectionResults', 'serviceHistory', 'customerDetails'])
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('maintenance_certificates')
      .select('*, company:companies(*), work_order:work_orders(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Maintenance certificate not found' }, { status: 404 })
    }

    return NextResponse.json(parseCertFields(toCamel(data as unknown as Record<string, unknown>)))
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
      issueDate, validUntil, maintenanceType, nextMaintenanceDate,
      maintenanceInterval, certifiedTechnician, inspectionResults,
      technicianNotes, recommendations, serviceHistory,
      additionalRemarks, carMake, carModel, licensePlate,
      customerId, customerDetails, workOrderId,
    } = body

    const { data: existing, error: checkError } = await supabase
      .from('maintenance_certificates')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Maintenance certificate not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (issueDate !== undefined) updateData.issue_date = issueDate
    if (validUntil !== undefined) updateData.valid_until = validUntil
    if (maintenanceType !== undefined) updateData.maintenance_type = maintenanceType
    if (nextMaintenanceDate !== undefined) updateData.next_maintenance_date = nextMaintenanceDate
    if (maintenanceInterval !== undefined) updateData.maintenance_interval = maintenanceInterval
    if (certifiedTechnician !== undefined) updateData.certified_technician = certifiedTechnician
    if (inspectionResults !== undefined) {
      updateData.inspection_results = typeof inspectionResults === 'string'
        ? inspectionResults
        : inspectionResults ? JSON.stringify(inspectionResults) : '{}'
    }
    if (technicianNotes !== undefined) updateData.technician_notes = technicianNotes
    if (recommendations !== undefined) updateData.recommendations = recommendations
    if (serviceHistory !== undefined) {
      updateData.service_history = typeof serviceHistory === 'string'
        ? serviceHistory
        : serviceHistory ? JSON.stringify(serviceHistory) : '[]'
    }
    if (additionalRemarks !== undefined) updateData.additional_remarks = additionalRemarks
    if (carMake !== undefined) updateData.car_make = carMake
    if (carModel !== undefined) updateData.car_model = carModel
    if (licensePlate !== undefined) updateData.license_plate = licensePlate
    if (customerId !== undefined) updateData.customer_id = customerId || null
    if (customerDetails !== undefined) {
      updateData.customer_details = typeof customerDetails === 'string'
        ? customerDetails
        : customerDetails ? JSON.stringify(customerDetails) : ''
    }
    if (workOrderId !== undefined) updateData.work_order_id = workOrderId || null

    const { data, error } = await supabase
      .from('maintenance_certificates')
      .update(updateData)
      .eq('id', id)
      .select('*, company:companies(*), work_order:work_orders(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Updated maintenance certificate ${data.certificate_number}`)

    return NextResponse.json(parseCertFields(toCamel(data as unknown as Record<string, unknown>)))
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
      .from('maintenance_certificates')
      .select('id, certificate_number')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Maintenance certificate not found' }, { status: 404 })
    }

    const { error } = await supabase.from('maintenance_certificates').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Deleted maintenance certificate ${existing.certificate_number}`)

    return NextResponse.json({ success: true, message: 'Maintenance certificate deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
