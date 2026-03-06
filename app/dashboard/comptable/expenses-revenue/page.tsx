"use client";

import { useEffect, useState } from "react";
import { BarChart3, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";

export default function ComptableExpensesRevenuePage() {
  const [data, setData] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [comptableRes, salesRes, ordersRes] = await Promise.all([
          fetch("/api/dashboard/comptable", { cache: "no-store" }),
          fetch("/api/sales", { cache: "no-store" }),
          fetch("/api/supplier-orders", { cache: "no-store" }),
        ]);
        if (!comptableRes.ok || !salesRes.ok || !ordersRes.ok) throw new Error("Erreur chargement");
        const [comptableData, salesData, ordersData] = await Promise.all([
          comptableRes.json(),
          salesRes.json(),
          ordersRes.json(),
        ]);
        setData(comptableData);
        setSales(salesData.sales || []);
        setSupplierOrders(ordersData.orders || []);
      } catch {
        setData(null);
        setSales([]);
        setSupplierOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = data?.kpis || {};
  const totalRecettes = kpis.chiffreAffaires ?? 0;
  const totalDepenses = kpis.totalDepenses ?? 0;
  const solde = totalRecettes - totalDepenses;

  const recettesParMois = (() => {
    const byMonth: Record<string, number> = {};
    sales
      .filter((s: any) => (s.status === "paid" || s.status === "Payé") && s.date)
      .forEach((s: any) => {
        const m = s.date.slice(0, 7);
        byMonth[m] = (byMonth[m] || 0) + Number(s.total_amount || 0);
      });
    return Object.entries(byMonth)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  })();

  const depensesParMois = (() => {
    const byMonth: Record<string, number> = {};
    supplierOrders
      .filter((o: any) => (o.status === "delivered" || o.status === "Livré") && o.order_date)
      .forEach((o: any) => {
        const m = o.order_date.slice(0, 7);
        byMonth[m] = (byMonth[m] || 0) + Number(o.total_amount || 0);
      });
    return Object.entries(byMonth)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Chargement...
      </div>
    );
  }

  if (!data && sales.length === 0 && supplierOrders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dépenses et recettes</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          Impossible de charger les données.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary-600" />
          Dépenses et recettes
        </h1>
        <p className="text-gray-600 mt-1">
          Contrôle des recettes (ventes) et des dépenses (commandes fournisseurs livrées).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <ArrowUpCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Recettes totales</p>
              <p className="text-2xl font-bold text-green-700">{totalRecettes.toFixed(2)} DT</p>
              <p className="text-xs text-gray-500">Ventes payées</p>
            </div>
          </div>
        </div>
        <div className="card bg-gray-100 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gray-200">
              <ArrowDownCircle className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dépenses totales</p>
              <p className="text-2xl font-bold text-gray-800">{totalDepenses.toFixed(2)} DT</p>
              <p className="text-xs text-gray-500">Commandes livrées</p>
            </div>
          </div>
        </div>
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Solde</p>
              <p className={`text-2xl font-bold ${solde >= 0 ? "text-primary-700" : "text-red-600"}`}>
                {solde.toFixed(2)} DT
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recettes par mois</h2>
          {recettesParMois.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune donnée.</p>
          ) : (
            <div className="space-y-2">
              {recettesParMois.slice(-6).reverse().map((r) => (
                <div key={r.month} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">{r.month}</span>
                  <span className="font-semibold text-green-600">+{r.total.toFixed(2)} DT</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Dépenses par mois</h2>
          {depensesParMois.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune donnée.</p>
          ) : (
            <div className="space-y-2">
              {depensesParMois.slice(-6).reverse().map((r) => (
                <div key={r.month} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">{r.month}</span>
                  <span className="font-semibold text-gray-700">-{r.total.toFixed(2)} DT</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
