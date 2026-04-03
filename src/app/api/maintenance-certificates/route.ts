import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, parseJsonFields, createAuditLog } from '@/lib/supabase-helpers'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    let query = supabase
      .from('maintenance_certificates')
      .select('*, company:companies(*), work_order:work_orders(*)')
      .order('created_at', { ascending: false })

    if (companyId) query = query.eq('company_id', companyId)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = (data || []).map((row) =>
      parseCertFields(toCamel(row as unknown as Record<string, unknown>))
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
      companyId, workOrderId, issueDate, validUntil,
      maintenanceType, nextMaintenanceDate, maintenanceInterval,
      certifiedTechnician, inspectionResults, technicianNotes,
      recommendations, serviceHistory, additionalRemarks,
      carMake, carModel, licensePlate,
      customerId, customerDetails,
    } = body

    if (!companyId || !issueDate) {
      return NextResponse.json({ error: 'Company ID and issue date are required' }, { status: 400 })
    }

    // Auto-generate certificateNumber (MC-YYYY-NNN)
    const year = new Date().getFullYear()
    const prefix = `MC-${year}-`

    const { data: existingCerts } = await supabase
      .from('maintenance_certificates')
      .select('certificate_number')
      .like('certificate_number', `${prefix}%`)

    let nextNum = 1
    if (existingCerts) {
      for (const cert of existingCerts) {
        const numStr = cert.certificate_number.replace(prefix, '')
        const num = parseInt(numStr, 10)
        if (num >= nextNum) nextNum = num + 1
      }
    }
    const certificateNumber = `${prefix}${String(nextNum).padStart(3, '0')}`

    const irStr = typeof inspectionResults === 'string'
      ? inspectionResults
      : inspectionResults ? JSON.stringify(inspectionResults) : '{}'
    const shStr = typeof serviceHistory === 'string'
      ? serviceHistory
      : serviceHistory ? JSON.stringify(serviceHistory) : '[]'
    const cdStr = typeof customerDetails === 'string'
      ? customerDetails
      : customerDetails ? JSON.stringify(customerDetails) : ''

    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('maintenance_certificates')
      .insert({
        id,
        company_id: companyId,
        work_order_id: workOrderId ?? null,
        certificate_number: certificateNumber,
        issue_date: issueDate,
        valid_until: validUntil ?? '',
        maintenance_type: maintenanceType ?? 'Regular Maintenance',
        next_maintenance_date: nextMaintenanceDate ?? '',
        maintenance_interval: maintenanceInterval ?? '',
        certified_technician: certifiedTechnician ?? '',
        inspection_results: irStr,
        technician_notes: technicianNotes ?? '',
        recommendations: recommendations ?? '',
        service_history: shStr,
        additional_remarks: additionalRemarks ?? '',
        car_make: carMake ?? '',
        car_model: carModel ?? '',
        license_plate: licensePlate ?? '',
        customer_id: customerId ?? null,
        customer_details: cdStr,
      })
      .select('*, company:companies(*), work_order:work_orders(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createAuditLog(null, 'System', `Created maintenance certificate ${certificateNumber}`)

    const result = parseCertFields(toCamel(data as unknown as Record<string, unknown>))
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
