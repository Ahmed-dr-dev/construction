import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const now = new Date();
    const startMonth = month ? parseInt(month) : now.getMonth() + 1;
    const startYear = year ? parseInt(year) : now.getFullYear();
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
    const endDate = new Date(startYear, startMonth, 0);
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data: sales } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(name),
        items:sale_items(*, product:products(name))
      `)
      .gte('date', startDate)
      .lte('date', endDateStr);

    const { data: products } = await supabase.from('products').select('*');
    const { data: clients } = await supabase.from('clients').select('*');

    const totalRevenue = sales?.reduce((s, x) => s + (x.status === 'paid' ? x.total_amount : 0), 0) || 0;
    const totalSalesCount = sales?.length || 0;
    const paidCount = sales?.filter((s) => s.status === 'paid').length || 0;

    const report = {
      period: { start: startDate, end: endDateStr },
      summary: {
        totalRevenue,
        totalSalesCount,
        paidCount,
        unpaidCount: totalSalesCount - paidCount,
        productsCount: products?.length || 0,
        clientsCount: clients?.length || 0,
      },
      sales: sales || [],
      products: products || [],
    };

    if (format === 'json') {
      return NextResponse.json(report);
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}
