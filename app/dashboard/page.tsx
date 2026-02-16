"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Package,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#22c55e", "#f97316", "#ef4444"]; // Disponible, Stock faible, Rupture

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    todaySales: 0,
    totalClients: 0,
    thisMonthSales: 0,
    unpaidSales: 0,
    pendingOrders: 0,
    totalSalesCount: 0,
  });
  const [analytics, setAnalytics] = useState<{
    salesByDay: { date: string; total: number }[];
    salesByMonth: { month: string; total: number }[];
    topProducts: { name: string; quantity: number; unit: string }[];
    stockEvolution: { name: string; stock: number; min_stock: number; status: string }[];
    kpis: { chiffreAffaires: number; nombreVentes: number; clientsActifsCeMois: number; caCeMois: number };
  } | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [resStats, resAnalytics] = await Promise.all([
        fetch("/api/dashboard/stats", { cache: "no-store" }),
        fetch("/api/dashboard/analytics", { cache: "no-store" }),
      ]);
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data.stats);
        setLowStockProducts(data.lowStockProducts || []);
        setRecentSales(data.recentSales || []);
      }
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 60000);
    const handleFocus = () => fetchStats(true);
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchStats]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStockStatusBadge = (product: { stock: number; min_stock: number }) => {
    if (product.stock === 0)
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Rupture</span>;
    if (product.stock <= product.min_stock)
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Stock faible</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Disponible</span>;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  const kpis = analytics?.kpis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary-500" />
          Tableau de bord analytique
        </h1>
        <Link
          href="/dashboard/recommendations"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Voir les recommandations d&apos;approvisionnement →
        </Link>
      </div>

      {/* KPI en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'affaires total"
          value={`${(kpis?.chiffreAffaires ?? stats.totalSales).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Nombre de ventes"
          value={kpis?.nombreVentes ?? stats.totalSalesCount}
          icon={ShoppingCart}
          color="orange"
        />
        <StatCard
          title="Clients actifs (ce mois)"
          value={kpis?.clientsActifsCeMois ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Ventes aujourd'hui"
          value={`${stats.todaySales.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total impayés"
          value={`${stats.unpaidSales.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`}
          icon={CreditCard}
          color="red"
        />
        <StatCard
          title="Commandes en attente"
          value={stats.pendingOrders}
          icon={FileText}
          color="orange"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ventes par jour (30 derniers jours)</h2>
          <div className="h-64">
            {analytics?.salesByDay?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} DT`} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} DT`, "CA"]} labelFormatter={(l) => formatDate(l)} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} name="Chiffre d'affaires" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ventes par mois (12 mois)</h2>
          <div className="h-64">
            {analytics?.salesByMonth?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} DT`} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} DT`, "CA"]} />
                  <Bar dataKey="total" fill="#22c55e" name="Chiffre d'affaires" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Produits les plus vendus (90 jours)</h2>
          <div className="h-64">
            {analytics?.topProducts?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number, name: string, props: { payload: { unit: string } }) => [`${v} ${props?.payload?.unit || ""}`, "Quantité"]} />
                  <Bar dataKey="quantity" fill="#3b82f6" name="Quantité vendue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune vente sur la période</p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">État du stock (top 15 produits)</h2>
          <div className="h-64">
            {analytics?.stockEvolution?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.stockEvolution}
                    dataKey="stock"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, status }) => `${name} (${status})`}
                  >
                    {analytics.stockEvolution.map((_, index) => (
                      <Cell key={index} fill={COLORS[["Disponible", "Stock faible", "Rupture"].indexOf(_.status) % 3]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string, props: { payload: { status: string; min_stock: number } }) => [`${v} (min: ${props?.payload?.min_stock}) - ${props?.payload?.status}`, "Stock"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun produit</p>
            )}
          </div>
        </div>
      </div>

      {/* Alertes stock avec statuts dynamiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Alertes stock (statuts dynamiques)
            </h2>
            <Link href="/dashboard/products" className="text-sm text-primary-600 hover:text-primary-700">
              Voir les produits
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune alerte. Tous les stocks sont OK.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    product.stock === 0 ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stock} / Min: {product.min_stock} {product.unit ? `(${product.unit})` : ""}
                    </p>
                  </div>
                  {getStockStatusBadge(product)}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 text-primary-500 mr-2" />
              Ventes récentes
            </h2>
            <Link href="/dashboard/sales" className="text-sm text-primary-600 hover:text-primary-700">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune vente récente</p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{sale.client?.name || "Client inconnu"}</p>
                    <p className="text-sm text-gray-600">{formatDate(sale.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {sale.total_amount?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        sale.status === "Payé" || sale.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {sale.status === "Payé" || sale.status === "paid" ? "Payé" : "Non payé"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
