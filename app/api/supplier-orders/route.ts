import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
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
        supplier:suppliers(id, name, phone, email),
        items:supplier_order_items(*),
        creator:users(id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const { 
      supplier_id,
      order_date,
      expected_delivery_date,
      status,
      notes,
      items
    } = body;

    if (!supplier_id || !order_date || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Le fournisseur, la date et les articles sont requis' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
    }, 0);

    // Generate order number
    const { data: lastOrder } = await supabase
      .from('supplier_orders')
      .select('order_number')
      .like('order_number', 'PO-%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let orderNumber = 'PO-000001';
    if (lastOrder?.order_number) {
      const lastNum = parseInt(lastOrder.order_number.split('-')[1]);
      orderNumber = `PO-${String(lastNum + 1).padStart(6, '0')}`;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('supplier_orders')
      .insert({
        supplier_id,
        order_number: orderNumber,
        order_date,
        expected_delivery_date: expected_delivery_date || null,
        status: status || 'pending',
        total_amount: totalAmount,
        notes: notes || null,
        created_by: userId,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_name: item.product_name,
      description: item.description || null,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.quantity) * parseFloat(item.unit_price),
      unit: item.unit || 'unité',
      product_id: item.product_id || null,
    }));

    const { error: itemsError } = await supabase
      .from('supplier_order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order if items fail
      await supabase.from('supplier_orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    // Fetch complete order with relations
    const { data: completeOrder, error: fetchError } = await supabase
      .from('supplier_orders')
      .select(`
        *,
        supplier:suppliers(id, name, phone, email),
        items:supplier_order_items(*),
        creator:users(id, full_name)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: completeOrder });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
