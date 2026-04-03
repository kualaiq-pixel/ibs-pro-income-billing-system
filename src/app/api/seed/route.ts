import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Check if data already exists
    const { count, error: countError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json({
        success: false,
        message: 'Database already has data. Clear it first if you want to re-seed.',
      }, { status: 400 })
    }

    // Generate IDs
    const company1Id = crypto.randomUUID()
    const company2Id = crypto.randomUUID()
    const adminId = crypto.randomUUID()
    const managerId = crypto.randomUUID()
    const accountantId = crypto.randomUUID()
    const viewerId = crypto.randomUUID()
    const customerId = crypto.randomUUID()
    const income1Id = crypto.randomUUID()
    const income2Id = crypto.randomUUID()
    const expense1Id = crypto.randomUUID()
    const expense2Id = crypto.randomUUID()
    const booking1Id = crypto.randomUUID()
    const booking2Id = crypto.randomUUID()
    const workOrderId = crypto.randomUUID()
    const certId = crypto.randomUUID()
    const link1Id = crypto.randomUUID()
    const link2Id = crypto.randomUUID()
    const settingsId = 'main'
    const auditLogId = crypto.randomUUID()

    // Seed Companies
    const { error: c1Error } = await supabase.from('companies').insert({
      id: company1Id,
      name: 'Default Corp LTD',
      code: 'DC001',
      vat: 'FI12345678',
      vat_id: 'FI12345678',
      account_number: 'FI12 3456 7890 1234',
      address: 'Business Street 10',
      zip_code: '00100',
      city: 'Helsinki',
      country: 'Finland',
      currency: '€',
    })
    if (c1Error) return NextResponse.json({ error: c1Error.message }, { status: 500 })

    const { error: c2Error } = await supabase.from('companies').insert({
      id: company2Id,
      name: 'Innovate Solutions Oy',
      code: 'IS002',
      vat: 'FI87654321',
      vat_id: 'FI87654321',
      account_number: 'FI98 7654 3210 9876',
      address: 'Tech Park 5',
      zip_code: '00200',
      city: 'Espoo',
      country: 'Finland',
      currency: '€',
    })
    if (c2Error) return NextResponse.json({ error: c2Error.message }, { status: 500 })

    // Seed Users
    const { error: u1Error } = await supabase.from('users').insert({
      id: adminId,
      username: 'admin',
      password: 'admin123',
      role: 'Admin',
      company_id: null,
    })
    if (u1Error) return NextResponse.json({ error: u1Error.message }, { status: 500 })

    const { error: u2Error } = await supabase.from('users').insert({
      id: managerId,
      username: 'manager',
      password: 'password',
      role: 'Manager',
      company_id: company1Id,
    })
    if (u2Error) return NextResponse.json({ error: u2Error.message }, { status: 500 })

    const { error: u3Error } = await supabase.from('users').insert({
      id: accountantId,
      username: 'accountant',
      password: 'password',
      role: 'Accountant',
      company_id: company1Id,
    })
    if (u3Error) return NextResponse.json({ error: u3Error.message }, { status: 500 })

    const { error: u4Error } = await supabase.from('users').insert({
      id: viewerId,
      username: 'viewer',
      password: 'pass',
      role: 'Viewer',
      company_id: company2Id,
    })
    if (u4Error) return NextResponse.json({ error: u4Error.message }, { status: 500 })

    // Seed Customer
    const { error: custError } = await supabase.from('customers').insert({
      id: customerId,
      company_id: company1Id,
      name: 'Global Tech Inc.',
      address: '123 Innovation Drive',
      email: 'contact@globaltech.com',
    })
    if (custError) return NextResponse.json({ error: custError.message }, { status: 500 })

    // Seed Incomes
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { error: i1Error } = await supabase.from('incomes').insert({
      id: income1Id,
      company_id: company1Id,
      customer_id: customerId,
      invoice_number: 1001,
      date: today,
      amount: 1500.0,
      services: JSON.stringify([
        { description: 'Oil Change', price: 85 },
        { description: 'Brake Inspection', price: 120 },
        { description: 'Tire Rotation', price: 60 },
      ]),
      description: 'Full service maintenance for company fleet vehicle',
      status: 'Paid',
      reference_number: '001001',
      vat_rate: 25.5,
      payment_method: 'Bank Transfer',
      category: 'Service',
      car_make: 'Toyota',
      car_model: 'Camry',
      license_plate: 'ABC-123',
    })
    if (i1Error) return NextResponse.json({ error: i1Error.message }, { status: 500 })

    const { error: i2Error } = await supabase.from('incomes').insert({
      id: income2Id,
      company_id: company1Id,
      customer_id: customerId,
      invoice_number: 1002,
      date: weekAgo,
      amount: 3200.0,
      services: JSON.stringify([
        { description: 'Engine Repair', price: 2000 },
        { description: 'Parts', price: 800 },
        { description: 'Labor', price: 400 },
      ]),
      description: 'Major engine repair and parts replacement',
      status: 'Pending',
      reference_number: '001002',
      vat_rate: 25.5,
      payment_method: 'Bill',
      category: 'Repair',
      car_make: 'Volvo',
      car_model: 'XC90',
      license_plate: 'XYZ-456',
    })
    if (i2Error) return NextResponse.json({ error: i2Error.message }, { status: 500 })

    // Seed Expenses
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { error: e1Error } = await supabase.from('expenses').insert([
      {
        id: expense1Id,
        company_id: company1Id,
        date: today,
        amount: 450.0,
        category: 'Parts',
        description: 'Purchase of brake pads and rotors',
        vat_rate: 25.5,
        payment_method: 'Credit Card',
      },
      {
        id: expense2Id,
        company_id: company1Id,
        date: threeDaysAgo,
        amount: 1200.0,
        category: 'Equipment',
        description: 'New diagnostic tool purchase',
        vat_rate: 25.5,
        payment_method: 'Bank Transfer',
      },
    ])
    if (e1Error) return NextResponse.json({ error: e1Error.message }, { status: 500 })

    // Seed Bookings
    const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { error: b1Error } = await supabase.from('bookings').insert({
      id: booking1Id,
      company_id: company1Id,
      customer_id: customerId,
      car_make: 'Toyota',
      car_model: 'Camry',
      license_plate: 'ABC-123',
      service_type: 'Annual Maintenance',
      booking_date: in2Days,
      booking_time: '09:00',
      notes: 'Customer requested premium oil',
      status: 'Confirmed',
    })
    if (b1Error) return NextResponse.json({ error: b1Error.message }, { status: 500 })

    const { error: b2Error } = await supabase.from('bookings').insert({
      id: booking2Id,
      company_id: company1Id,
      customer_id: customerId,
      car_make: 'Volvo',
      car_model: 'XC90',
      license_plate: 'XYZ-456',
      service_type: 'Wheel Alignment',
      booking_date: in5Days,
      booking_time: '14:00',
      notes: 'Follow-up after tire replacement',
      status: 'Scheduled',
    })
    if (b2Error) return NextResponse.json({ error: b2Error.message }, { status: 500 })

    // Seed Work Order
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const lastYear = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { error: woError } = await supabase.from('work_orders').insert({
      id: workOrderId,
      company_id: company1Id,
      booking_id: booking1Id,
      work_order_number: 1,
      date: today,
      status: 'In Progress',
      technician: 'Mikko Mechanic',
      estimated_hours: 3,
      actual_hours: 2.5,
      work_description: 'Full annual maintenance service including oil change, filter replacement, brake inspection, and fluid top-up',
      parts_used: JSON.stringify([
        { name: 'Engine Oil 5W-30', quantity: 5, unitPrice: 12, total: 60 },
        { name: 'Oil Filter', quantity: 1, unitPrice: 15, total: 15 },
        { name: 'Air Filter', quantity: 1, unitPrice: 25, total: 25 },
        { name: 'Brake Fluid', quantity: 1, unitPrice: 18, total: 18 },
      ]),
      labor_cost: 150,
      parts_cost: 118,
      total_cost: 268,
      recommendations: 'Next service recommended in 12 months or 15000 km',
      customer_approval: true,
      mileage: 45230,
      next_service_due: nextYear,
      service_guarantee: '12 months or 15000 km',
      warranty_details: 'Parts warranty: 24 months, Labor warranty: 12 months',
      service_quality_check: JSON.stringify([
        { item: 'Oil level', status: 'OK', notes: '' },
        { item: 'Brake pads', status: 'OK', notes: '60% remaining' },
        { item: 'Tire pressure', status: 'OK', notes: '' },
        { item: 'Coolant level', status: 'OK', notes: '' },
        { item: 'Battery health', status: 'Good', notes: '12.4V' },
      ]),
      technician_notes: 'Vehicle in good condition. Brakes have about 60% life remaining.',
      car_make: 'Toyota',
      car_model: 'Camry',
      license_plate: 'ABC-123',
      customer_id: customerId,
    })
    if (woError) return NextResponse.json({ error: woError.message }, { status: 500 })

    // Seed Maintenance Certificate
    const year = new Date().getFullYear()
    const { error: mcError } = await supabase.from('maintenance_certificates').insert({
      id: certId,
      company_id: company1Id,
      work_order_id: workOrderId,
      certificate_number: `MC-${year}-001`,
      issue_date: today,
      valid_until: nextYear,
      maintenance_type: 'Annual Maintenance',
      next_maintenance_date: nextYear,
      maintenance_interval: '12 months / 15000 km',
      certified_technician: 'Mikko Mechanic',
      inspection_results: JSON.stringify({
        engine: { status: 'Good', details: 'No leaks, smooth operation' },
        brakes: { status: 'Good', details: 'Pads at 60%, discs in good condition' },
        tires: { status: 'Good', details: 'Even wear, good pressure' },
        fluids: { status: 'Good', details: 'All levels normal' },
        electrical: { status: 'Good', details: 'Battery strong, lights working' },
      }),
      technician_notes: 'All systems checked and functioning properly. Vehicle passed maintenance inspection.',
      recommendations: 'Replace brake pads at next service. Consider tire rotation in 6 months.',
      service_history: JSON.stringify([
        { date: lastYear, type: 'Annual Maintenance', mileage: 30000, technician: 'Mikko Mechanic' },
        { date: today, type: 'Annual Maintenance', mileage: 45230, technician: 'Mikko Mechanic' },
      ]),
      additional_remarks: 'Customer satisfied with service. Vehicle is well maintained.',
      car_make: 'Toyota',
      car_model: 'Camry',
      license_plate: 'ABC-123',
      customer_id: customerId,
    })
    if (mcError) return NextResponse.json({ error: mcError.message }, { status: 500 })

    // Seed SHK Links
    const { error: shkError } = await supabase.from('shk_links').insert([
      {
        id: link1Id,
        company_id: company1Id,
        name: 'AutoData SHK Portal',
        url: 'https://shk.autodata.fi',
        username: 'dc001_user',
        password: 'shk_pass_2024',
      },
      {
        id: link2Id,
        company_id: company1Id,
        name: 'TIEKE Vehicle Registry',
        url: 'https://tieke.fi/vehicles',
        username: 'dc001_registry',
        password: 'reg_access_2024',
      },
    ])
    if (shkError) return NextResponse.json({ error: shkError.message }, { status: 500 })

    // Seed default settings
    const { error: sError } = await supabase.from('app_settings').insert({
      id: settingsId,
      settings: JSON.stringify({
        companyName: 'Default Corp LTD',
        defaultVatRate: 25.5,
        defaultCurrency: '€',
        invoicePrefix: 'INV',
        workOrderPrefix: 'WO',
        bookingTimeSlotDuration: 60,
        businessHours: { start: '08:00', end: '17:00' },
        weekendWork: false,
        notificationEmail: 'admin@defaultcorp.fi',
      }),
    })
    if (sError) return NextResponse.json({ error: sError.message }, { status: 500 })

    // Create audit log for seeding
    const { error: aError } = await supabase.from('audit_logs').insert({
      id: auditLogId,
      user_name: 'System',
      description: 'Database seeded with initial data (2 companies, 4 users, 1 customer, 2 incomes, 2 expenses, 2 bookings, 1 work order, 1 maintenance certificate, 2 SHK links)',
    })
    if (aError) return NextResponse.json({ error: aError.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        companies: 2,
        users: 4,
        customers: 1,
        incomes: 2,
        expenses: 2,
        bookings: 2,
        workOrders: 1,
        maintenanceCertificates: 1,
        shkLinks: 2,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
