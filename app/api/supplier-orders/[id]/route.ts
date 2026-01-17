import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('supplier_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:supplier_order_items(*),
        creator:users(id, full_name)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, expected_delivery_date, notes } = body;

    // Get current order status before updating
    const { data: currentOrder } = await supabase
      .from('supplier_orders')
      .select('status')
      .eq('id', params.id)
      .single();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updateData.status = status;
    if (expected_delivery_date !== undefined) updateData.expected_delivery_date = expected_delivery_date;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        supplier:suppliers(*),
        items:supplier_order_items(*),
        creator:users(id, full_name)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Auto-generate invoice when status changes TO "delivered" (not if already delivered)
    const isStatusChangingToDelivered = status === 'delivered' && currentOrder?.status !== 'delivered';
    let invoiceCreated = false;
    let invoiceError: any = null;

    if (isStatusChangingToDelivered) {
      // Check if invoice already exists (use maybeSingle to avoid error if none exists)
      const { data: existingInvoice, error: checkError } = await supabase
        .from('invoices')
        .select('id')
        .eq('supplier_order_id', params.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing invoice:', checkError);
        invoiceError = checkError;
      }

      // Only create invoice if none exists and check didn't fail
      if (!existingInvoice && !checkError) {
        // Get order total
        const totalAmount = data.total_amount || data.items?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0) || 0;

        if (totalAmount > 0) {
          // Generate invoice number (SINV for supplier invoices)
          const { data: lastInvoice, error: lastInvoiceError } = await supabase
            .from('invoices')
            .select('invoice_number')
            .like('invoice_number', 'SINV-%')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastInvoiceError) {
            console.error('Error fetching last invoice:', lastInvoiceError);
            invoiceError = lastInvoiceError;
          } else {
            let invoiceNumber = 'SINV-000001';
            if (lastInvoice?.invoice_number) {
              const lastNum = parseInt(lastInvoice.invoice_number.split('-')[1]);
              if (!isNaN(lastNum)) {
                invoiceNumber = `SINV-${String(lastNum + 1).padStart(6, '0')}`;
              }
            }

            // Create invoice in the unified invoices table
            const { data: newInvoice, error: insertError } = await supabase
              .from('invoices')
              .insert({
                supplier_order_id: params.id,
                invoice_number: invoiceNumber,
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating supplier invoice:', insertError);
              invoiceError = insertError;
            } else if (newInvoice) {
              invoiceCreated = true;
              console.log('Invoice created successfully:', newInvoice);
            }
          }
        } else {
          console.warn('Cannot create invoice: total amount is 0');
          invoiceError = { message: 'Le montant total est 0' };
        }
      } else if (existingInvoice) {
        console.log('Invoice already exists for this order');
      }
    }

    return NextResponse.json({ 
      order: data,
      invoiceCreated,
      invoiceError: invoiceError ? invoiceError.message : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
