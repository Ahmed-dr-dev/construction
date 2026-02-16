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
      .select('product_id, quantity')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    const avgDailySold: Record<string, number> = {};
    saleItems?.forEach((si) => {
      const pid = si.product_id;
      avgDailySold[pid] = (avgDailySold[pid] || 0) + (si.quantity || 0);
    });
    const days = 90;
    Object.keys(avgDailySold).forEach((k) => {
      avgDailySold[k] = avgDailySold[k] / days;
    });

    const recommendations = (products || [])
      .filter((p) => p.stock <= p.min_stock || p.stock === 0)
      .map((p) => {
        const avgDaily = avgDailySold[p.id] || 0;
        const daysOfStock = avgDaily > 0 ? p.stock / avgDaily : 0;
        const suggestedQty = Math.max(
          p.min_stock * 2 - p.stock,
          avgDaily * 14,
          p.min_stock
        );

        return {
          product: p,
          current_stock: p.stock,
          min_stock: p.min_stock,
          avg_daily_sold: Math.round(avgDaily * 100) / 100,
          days_until_stockout: Math.round(daysOfStock),
          suggested_quantity: Math.ceil(Math.max(0, suggestedQty)),
        };
      });

    // Supplier scores (based on delivered orders, delivery time)
    const { data: orders } = await supabase
      .from('supplier_orders')
      .select('supplier_id, status, order_date, expected_delivery_date')
      .in('status', ['delivered', 'confirmed', 'pending']);

    const supplierStats: Record<string, { delivered: number; late: number; total: number }> = {};
    orders?.forEach((o) => {
      const sid = o.supplier_id;
      if (!supplierStats[sid]) supplierStats[sid] = { delivered: 0, late: 0, total: 0 };
      supplierStats[sid].total++;
      if (o.status === 'delivered') supplierStats[sid].delivered++;
      if (o.expected_delivery_date && o.status !== 'delivered') {
        if (new Date(o.expected_delivery_date) < new Date()) supplierStats[sid].late++;
      }
    });

    const { data: suppliers } = await supabase.from('suppliers').select('*');
    const supplierScores = (suppliers || []).map((s) => {
      const stats = supplierStats[s.id] || { delivered: 0, late: 0, total: 0 };
      const deliveryRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
      const onTimeRate = stats.total > 0 ? 100 - (stats.late / stats.total) * 100 : 100;
      const score = (deliveryRate * 0.6 + onTimeRate * 0.4);

      return {
        ...s,
        score: Math.round(score * 10) / 10,
        total_orders: stats.total,
        delivered: stats.delivered,
        late: stats.late,
      };
    });

    const rankedSuppliers = supplierScores.sort((a, b) => b.score - a.score);
    const bestSupplier = rankedSuppliers[0] || null;

    // Meilleur fournisseur par produit (parmi ceux qui fournissent ce produit)
    const orderRecommendationsWithSupplier = recommendations.map((rec) => {
      const productId = rec.product?.id;
      const suppliersForProduct = rankedSuppliers.filter((s) => {
        const products = (s as { products?: string[] }).products;
        return Array.isArray(products) && products.includes(productId);
      });
      const bestForProduct = suppliersForProduct[0] || null;
      return {
        ...rec,
        best_supplier: bestForProduct ? { id: bestForProduct.id, name: bestForProduct.name, score: bestForProduct.score } : null,
      };
    });

    return NextResponse.json({
      orderRecommendations: orderRecommendationsWithSupplier,
      supplierScores: rankedSuppliers,
      bestSupplier,
      comparisonTable: rankedSuppliers.map((s, i) => ({
        rank: i + 1,
        name: s.name,
        score: s.score,
        total_orders: s.total_orders,
        delivered: s.delivered,
        late: s.late,
        delivery_rate: s.total_orders > 0 ? Math.round((s.delivered / s.total_orders) * 100) : 100,
      })),
    });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}
