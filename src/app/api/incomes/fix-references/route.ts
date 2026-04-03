import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateReferenceNumber } from '@/lib/finnish-reference';

/**
 * POST /api/incomes/fix-references
 *
 * Scans all invoices and re-generates reference numbers using
 * the Finnish SFS 5338 (7-3-1 check digit) standard.
 * Only updates records whose current reference_number is invalid.
 */
export async function POST() {
  try {
    // Fetch all invoices
    const { data: invoices, error } = await supabase
      .from('incomes')
      .select('id, invoice_number, reference_number')
      .order('invoice_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ message: 'No invoices to fix', fixed: 0 });
    }

    let fixed = 0;
    const details: Array<{ id: string; invoiceNumber: number; oldRef: string; newRef: string }> = [];

    for (const inv of invoices) {
      const invoiceNumber = inv.invoice_number as number;
      const oldRef = (inv.reference_number as string) || '';

      // Generate the correct Finnish reference number from the invoice number
      const baseNum = String(invoiceNumber).padStart(6, '0');
      const correctRef = generateReferenceNumber(baseNum);

      // Only update if different
      if (oldRef !== correctRef) {
        const { error: updateError } = await supabase
          .from('incomes')
          .update({ reference_number: correctRef })
          .eq('id', inv.id);

        if (!updateError) {
          fixed++;
          details.push({
            id: inv.id,
            invoiceNumber,
            oldRef: oldRef || '(empty)',
            newRef: correctRef,
          });
        }
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixed} reference number(s)`,
      total: invoices.length,
      fixed,
      details,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
