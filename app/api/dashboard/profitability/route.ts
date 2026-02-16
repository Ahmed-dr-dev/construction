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

    const { data: products } = await supabase.from('products').select('*');
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('product_id, quantity, price, sale_id');
    const { data: paidSales } = await supabase
      .from('sales')
      .select('id')
      .in('status', ['paid', 'Payé']);
    const paidIds = new Set((paidSales || []).map((s) => s.id));

    const qtySold: Record<string, number> = {};
    const revenueByProduct: Record<string, number> = {};
    saleItems?.forEach((item) => {
      if (paidIds.has(item.sale_id)) {
        const pid = item.product_id;
        qtySold[pid] = (qtySold[pid] || 0) + (item.quantity || 0);
        revenueByProduct[pid] = (revenueByProduct[pid] || 0) + (item.quantity || 0) * (item.price || 0);
      }
    });

    const list = (products || []).map((p) => {
      const cost = (p as { purchase_price?: number }).purchase_price ?? 0;
      const price = p.price ?? 0;
      const margin = price - cost;
      const marginPercent = price > 0 ? (margin / price) * 100 : 0;
      const sold = qtySold[p.id] || 0;
      const revenue = revenueByProduct[p.id] || 0;
      const totalCost = cost * sold;
      const profit = revenue - totalCost;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        prix_vente: price,
        prix_achat: cost,
        marge: Math.round(margin * 100) / 100,
        marge_pourcent: Math.round(marginPercent * 10) / 10,
        quantite_vendue: sold,
        chiffre_affaires: Math.round(revenue * 100) / 100,
        benefice: Math.round(profit * 100) / 100,
      };
    });

    const sorted = [...list].sort((a, b) => b.benefice - a.benefice);

    return NextResponse.json({
      products: sorted,
      summary: {
        totalCA: Math.round(list.reduce((s, x) => s + x.chiffre_affaires, 0) * 100) / 100,
        totalBenefice: Math.round(list.reduce((s, x) => s + x.benefice, 0) * 100) / 100,
      },
    });
  } catch (error: unknown) {
    console.error('Profitability error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: (error as Error)?.message },
      { status: 500 }
    );
  }
}
