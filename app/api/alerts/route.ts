import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Low stock alerts
    const { data: products } = await supabase.from('products').select('*');
    const lowStock = products?.filter((p) => p.stock <= p.min_stock) || [];
    const outOfStock = products?.filter((p) => p.stock === 0) || [];

    // Late orders (expected_delivery_date < today, status pending/confirmed)
    const { data: lateOrders } = await supabase
      .from('supplier_orders')
      .select('*, supplier:suppliers(name)')
      .in('status', ['pending', 'confirmed'])
      .lt('expected_delivery_date', today)
      .not('expected_delivery_date', 'is', null);

    // Unpaid invoices (sales unpaid)
    const { data: unpaidSales } = await supabase
      .from('sales')
      .select('*, client:clients(name)')
      .eq('status', 'unpaid');

    return NextResponse.json({
      lowStock: lowStock.map((p) => ({
        type: 'stock',
        severity: p.stock === 0 ? 'critical' : 'warning',
        message: p.stock === 0 ? `Rupture: ${p.name}` : `Stock faible: ${p.name} (${p.stock}/${p.min_stock})`,
        entity_id: p.id,
        entity_type: 'product',
      })),
      lateOrders: (lateOrders || []).map((o) => ({
        type: 'order',
        severity: 'warning',
        message: `Commande en retard: ${o.order_number} - ${o.supplier?.name}`,
        entity_id: o.id,
        entity_type: 'supplier_order',
      })),
      unpaidInvoices: (unpaidSales || []).map((s) => ({
        type: 'invoice',
        severity: 'info',
        message: `Facture non payée: ${s.client?.name} - ${s.total_amount} DT`,
        entity_id: s.id,
        entity_type: 'sale',
      })),
      all: [
        ...lowStock.map((p) => ({
          type: 'stock',
          severity: p.stock === 0 ? 'critical' : 'warning',
          message: p.stock === 0 ? `Rupture: ${p.name}` : `Stock faible: ${p.name}`,
          entity_id: p.id,
        })),
        ...(lateOrders || []).map((o) => ({
          type: 'order',
          severity: 'warning',
          message: `Commande en retard: ${o.order_number}`,
          entity_id: o.id,
        })),
        ...(unpaidSales || []).slice(0, 5).map((s) => ({
          type: 'invoice',
          severity: 'info',
          message: `Non payé: ${s.client?.name} - ${s.total_amount} DT`,
          entity_id: s.id,
        })),
      ],
    });
  } catch (error: any) {
    console.error('Alerts error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}
