import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelArray, toCamel, parseJsonFields } from '@/lib/supabase-helpers'

interface IncomeRecord {
  id: string;
  amount: number;
  status: string;
  customer: unknown;
  [key: string]: unknown;
}

interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  [key: string]: unknown;
}

interface BookingRecord {
  id: string;
  status: string;
  customer: unknown;
  bookingDate: string;
  [key: string]: unknown;
}

interface WorkOrderRecord {
  id: string;
  status: string;
  totalCost: number;
  booking: unknown;
  [key: string]: unknown;
}

interface CustomerRecord {
  id: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, reportType, dateFrom, dateTo } = body

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const reportData: Record<string, unknown> = {}

    // Income report
    if (reportType === 'income' || reportType === 'financial' || !reportType) {
      let incomeQuery = supabase
        .from('incomes')
        .select('*, customer:customers(*)')
        .eq('company_id', companyId)

      if (dateFrom) incomeQuery = incomeQuery.gte('date', dateFrom)
      if (dateTo) incomeQuery = incomeQuery.lte('date', dateTo)

      const { data: incomes, error: incError } = await incomeQuery
      if (incError) return NextResponse.json({ error: incError.message }, { status: 500 })

      const parsedIncomes = (incomes || []).map((row) =>
        parseJsonFields<IncomeRecord>(toCamel(row as unknown as Record<string, unknown>), ['services', 'customerDetails'])
      )

      const totalIncome = parsedIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0)
      const paidIncome = parsedIncomes.filter((inc) => inc.status === 'Paid').reduce((sum, inc) => sum + (inc.amount || 0), 0)
      const pendingIncome = parsedIncomes.filter((inc) => inc.status === 'Pending').reduce((sum, inc) => sum + (inc.amount || 0), 0)
      const overdueIncome = parsedIncomes.filter((inc) => inc.status === 'Overdue').reduce((sum, inc) => sum + (inc.amount || 0), 0)

      reportData.income = {
        records: parsedIncomes,
        total: totalIncome,
        paid: paidIncome,
        pending: pendingIncome,
        overdue: overdueIncome,
        count: parsedIncomes.length,
      }
    }

    // Expense report
    if (reportType === 'expense' || reportType === 'financial' || !reportType) {
      let expenseQuery = supabase
        .from('expenses')
        .select('*')
        .eq('company_id', companyId)

      if (dateFrom) expenseQuery = expenseQuery.gte('date', dateFrom)
      if (dateTo) expenseQuery = expenseQuery.lte('date', dateTo)

      const { data: expenses, error: expError } = await expenseQuery
      if (expError) return NextResponse.json({ error: expError.message }, { status: 500 })

      const parsedExpenses = toCamelArray<ExpenseRecord>((expenses || []) as unknown as Record<string, unknown>[])
      const totalExpenses = parsedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

      reportData.expense = {
        records: parsedExpenses,
        total: totalExpenses,
        count: parsedExpenses.length,
      }
    }

    // Summary
    if ((reportType === 'financial' || reportType === 'summary' || !reportType) && reportData.income && reportData.expense) {
      const incomeTotal = (reportData.income as Record<string, unknown>).total as number
      const expenseTotal = (reportData.expense as Record<string, unknown>).total as number
      reportData.summary = {
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
        netProfit: incomeTotal - expenseTotal,
        profitMargin: incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0,
      }
    }

    // Bookings report
    if (reportType === 'bookings' || !reportType) {
      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select('*, customer:customers(*)')
        .eq('company_id', companyId)
        .order('booking_date', { ascending: false })

      if (bookError) return NextResponse.json({ error: bookError.message }, { status: 500 })

      const parsedBookings = toCamelArray<BookingRecord>((bookings || []) as unknown as Record<string, unknown>[])
      const statusCounts = parsedBookings.reduce((acc: Record<string, number>, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1
        return acc
      }, {})

      reportData.bookings = {
        records: parsedBookings,
        statusCounts,
        count: parsedBookings.length,
      }
    }

    // Work orders report
    if (reportType === 'work-orders' || !reportType) {
      const { data: workOrders, error: woError } = await supabase
        .from('work_orders')
        .select('*, booking:bookings(*)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (woError) return NextResponse.json({ error: woError.message }, { status: 500 })

      const parsedWorkOrders = (workOrders || []).map((row) =>
        parseJsonFields<WorkOrderRecord>(toCamel(row as unknown as Record<string, unknown>), ['partsUsed', 'serviceQualityCheck', 'customerDetails'])
      )
      const statusCounts = parsedWorkOrders.reduce((acc: Record<string, number>, wo) => {
        acc[wo.status] = (acc[wo.status] || 0) + 1
        return acc
      }, {})
      const totalRevenue = parsedWorkOrders.reduce((sum, wo) => sum + (wo.totalCost || 0), 0)

      reportData.workOrders = {
        records: parsedWorkOrders,
        statusCounts,
        totalRevenue,
        count: parsedWorkOrders.length,
      }
    }

    // Customers report
    if (reportType === 'customers' || !reportType) {
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyId)

      if (custError) return NextResponse.json({ error: custError.message }, { status: 500 })

      // Enrich with counts
      const parsedCustomers = await Promise.all(
        (customers || []).map(async (customer) => {
          const [incomesRes, bookingsRes] = await Promise.all([
            supabase.from('incomes').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
            supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
          ])

          const row = toCamel<CustomerRecord>(customer as unknown as Record<string, unknown>)
          return {
            ...row,
            _count: {
              incomes: incomesRes.count ?? 0,
              bookings: bookingsRes.count ?? 0,
            },
          }
        })
      )

      reportData.customers = {
        records: parsedCustomers,
        count: parsedCustomers.length,
      }
    }

    return NextResponse.json(reportData)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
