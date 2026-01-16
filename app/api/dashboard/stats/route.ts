import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: totalSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid');

    const { data: todaySales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('date', todayISO.split('T')[0]);

    const { data: products } = await supabase
      .from('products')
      .select('id');

    const { data: clients } = await supabase
      .from('clients')
      .select('id');

    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('*')
      .lte('stock', supabase.raw('min_stock'));

    const { data: recentSales } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    const totalSalesAmount = totalSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    const todaySalesAmount = todaySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

    return NextResponse.json({
      stats: {
        totalSales: totalSalesAmount,
        todaySales: todaySalesAmount,
        totalProducts: products?.length || 0,
        totalClients: clients?.length || 0,
      },
      lowStockProducts: lowStockProducts || [],
      recentSales: recentSales || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
