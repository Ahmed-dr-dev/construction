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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];

    // First day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayISO = firstDayOfMonth.toISOString().split('T')[0];

    // First day of last month
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const firstDayLastMonthISO = firstDayOfLastMonth.toISOString().split('T')[0];

    // Last day of last month
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastDayLastMonthISO = lastDayOfLastMonth.toISOString().split('T')[0];

    // Total sales (all statuses)
    const { data: allSales } = await supabase
      .from('sales')
      .select('total_amount, status');

    // Paid sales only
    const { data: paidSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid');

    // Unpaid sales
    const { data: unpaidSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'unpaid');

    // Today's sales
    const { data: todaySales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('date', todayISO);

    // This month's sales
    const { data: thisMonthSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('date', firstDayISO);

    // Last month's sales
    const { data: lastMonthSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('date', firstDayLastMonthISO)
      .lte('date', lastDayLastMonthISO);

    const { data: products } = await supabase
      .from('products')
      .select('id');

    const { data: clients } = await supabase
      .from('clients')
      .select('id, unpaid_amount');

    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id');

    // Public orders (pending visitor orders - unpaid sales with null user_id)
    const { data: publicOrders } = await supabase
      .from('sales')
      .select('id')
      .eq('status', 'unpaid')
      .is('user_id', null);

    const { data: allProducts } = await supabase
      .from('products')
      .select('*');
    
    const lowStockProducts = allProducts?.filter(product => 
      product.stock <= product.min_stock
    ) || [];

    const { data: recentSales } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Calculate totals
    const totalSalesAmount = allSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    const paidSalesAmount = paidSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    const unpaidSalesAmount = unpaidSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    const todaySalesAmount = todaySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    const thisMonthAmount = thisMonthSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    const lastMonthAmount = lastMonthSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

    // Calculate total client debt
    const totalUnpaidClients = clients?.reduce((sum, client) => sum + (client.unpaid_amount || 0), 0) || 0;

    // Calculate average sale
    const totalSalesCount = paidSales?.length || 0;
    const avgSale = totalSalesCount > 0 ? paidSalesAmount / totalSalesCount : 0;

    // Monthly comparison percentage
    const monthlyChange = lastMonthAmount > 0 
      ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 
      : (thisMonthAmount > 0 ? 100 : 0);

    return NextResponse.json({
      stats: {
        totalSales: paidSalesAmount,
        todaySales: todaySalesAmount,
        thisMonthSales: thisMonthAmount,
        lastMonthSales: lastMonthAmount,
        monthlyChange: Math.round(monthlyChange * 10) / 10,
        totalProducts: products?.length || 0,
        totalClients: clients?.length || 0,
        totalSuppliers: suppliers?.length || 0,
        unpaidSales: unpaidSalesAmount,
        totalDebt: totalUnpaidClients,
        avgSale: Math.round(avgSale * 100) / 100,
        pendingOrders: publicOrders?.length || 0,
        totalSalesCount: totalSalesCount,
      },
      lowStockProducts: lowStockProducts || [],
      recentSales: recentSales || [],
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
