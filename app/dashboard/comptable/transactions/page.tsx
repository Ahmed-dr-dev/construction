"use client";

import { useEffect, useState } from "react";
import { Receipt, Search, FileText, ShoppingBag } from "lucide-react";

export default function ComptableTransactionsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "ventes" | "commandes">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setError(null);
    const load = async () => {
      try {
        const [salesRes, ordersRes] = await Promise.all([
          fetch("/api/sales", { cache: "no-store" }),
          fetch("/api/supplier-orders", { cache: "no-store" }),
        ]);
        if (!salesRes.ok || !ordersRes.ok) throw new Error("Erreur chargement");
        const [salesData, ordersData] = await Promise.all([
          salesRes.json(),
          ordersRes.json(),
        ]);
        setSales(salesData.sales || []);
        setSupplierOrders(ordersData.orders || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur chargement");
        setSales([]);
        setSupplierOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const transactions = [
    ...sales.map((s: any) => ({
      id: s.id,
      type: "vente" as const,
      date: s.date,
      amount: s.total_amount,
      status: s.status,
      ref: `Vente #${s.id?.slice(0, 8)}`,
      thirdParty: s.client?.name || "—",
    })),
    ...supplierOrders.map((o: any) => ({
      id: o.id,
      type: "commande_fournisseur" as const,
      date: o.order_date,
      amount: o.total_amount,
      status: o.status,
      ref: `Cmd #${o.order_number || o.id?.slice(0, 8)}`,
      thirdParty: o.supplier?.name || "—",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let filtered = transactions;
  if (filter === "ventes") filtered = transactions.filter((t) => t.type === "vente");
  if (filter === "commandes") filtered = transactions.filter((t) => t.type === "commande_fournisseur");
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.ref.toLowerCase().includes(q) ||
        t.thirdParty.toLowerCase().includes(q)
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Chargement des transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions financières</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const formatDate = (d: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt className="w-8 h-8 text-primary-600" />
          Transactions financières
        </h1>
        <p className="text-gray-600 mt-1">
          Consulter et vérifier toutes les transactions (ventes et commandes fournisseurs).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par référence ou tiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "ventes", "commandes"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "Toutes" : f === "ventes" ? "Ventes" : "Commandes fournisseurs"}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Référence</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tiers</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Montant (DT)</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Aucune transaction trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={`${t.type}-${t.id}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        {t.type === "vente" ? (
                          <FileText className="w-4 h-4 text-green-600" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-gray-600" />
                        )}
                        {t.type === "vente" ? "Vente" : "Commande fournisseur"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{formatDate(t.date)}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{t.ref}</td>
                    <td className="py-3 px-4 text-gray-700">{t.thirdParty}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${t.type === "vente" ? "text-green-600" : "text-gray-900"}`}>
                      {t.type === "vente" ? "+" : "-"}{Number(t.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          t.status === "paid" || t.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {t.status === "paid" ? "Payé" : t.status === "delivered" ? "Livré" : t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
