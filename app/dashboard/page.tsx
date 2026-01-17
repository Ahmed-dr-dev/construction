"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Truck,
  FileText,
  CreditCard,
  TrendingDown,
} from "lucide-react";
import StatCard from "@/components/StatCard";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    todaySales: 0,
    totalClients: 0,
    totalSuppliers: 0,
    thisMonthSales: 0,
    lastMonthSales: 0,
    monthlyChange: 0,
    unpaidSales: 0,
    totalDebt: 0,
    avgSale: 0,
    pendingOrders: 0,
    totalSalesCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setLowStockProducts(data.lowStockProducts || []);
        setRecentSales(data.recentSales || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    // Refresh on window focus
    const handleFocus = () => {
      fetchStats(true);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchStats]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventes aujourd'hui"
          value={`${stats.todaySales.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`}
          icon={ShoppingCart}
          color="orange"
        />
        <StatCard
          title="Ventes ce mois"
          value={`${stats.thisMonthSales.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`}
          icon={DollarSign}
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
          value={stats.pendingOrders.toString()}
          icon={FileText}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Alertes Stock Bas
            </h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune alerte de stock bas</p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stock} / Min: {product.min_stock}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    Urgent
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 text-primary-500 mr-2" />
              Ventes Récentes
            </h2>
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
                    <p className="font-medium text-gray-900">
                      {sale.client?.name || "Client inconnu"}
                    </p>
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
                          : sale.status === "En attente"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {sale.status === "Payé" || sale.status === "paid" ? "Payé" : sale.status || "Non payé"}
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



