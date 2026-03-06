"use client";

import { useEffect, useState } from "react";
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ComptablePaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [comptableRes, salesRes] = await Promise.all([
          fetch("/api/dashboard/comptable", { cache: "no-store" }),
          fetch("/api/sales", { cache: "no-store" }),
        ]);
        if (!comptableRes.ok || !salesRes.ok) throw new Error("Erreur chargement");
        const [comptableData, salesData] = await Promise.all([
          comptableRes.json(),
          salesRes.json(),
        ]);
        setData(comptableData);
        setSales(salesData.sales || []);
      } catch {
        setData(null);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = data?.kpis || {};
  const paidSales = sales.filter((s: any) => s.status === "paid");
  const unpaidSales = sales.filter((s: any) => s.status === "unpaid");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Chargement...
      </div>
    );
  }

  const clientName = (s: any) => (Array.isArray(s.client) ? s.client[0]?.name : s.client?.name) || "Client";
  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

  if (!data && sales.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Paiements et encaissements</h1>
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
          <CreditCard className="w-8 h-8 text-primary-600" />
          Paiements et encaissements
        </h1>
        <p className="text-gray-600 mt-1">
          Suivre les encaissements (ventes payées) et les montants à recevoir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Encaissements (payés)</p>
              <p className="text-2xl font-bold text-green-700">
                {(kpis.totalEncaissements ?? 0).toFixed(2)} DT
              </p>
              <p className="text-xs text-gray-500">{kpis.nombreVentes ?? 0} ventes payées</p>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-100">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">À recevoir</p>
              <p className="text-2xl font-bold text-orange-700">
                {(kpis.totalARecevoir ?? 0).toFixed(2)} DT
              </p>
              <p className="text-xs text-gray-500">{kpis.nombreVentesImpayees ?? 0} ventes impayées</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dette clients</p>
              <p className="text-2xl font-bold text-red-700">
                {(kpis.totalDetteClients ?? 0).toFixed(2)} DT
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ventes payées</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {paidSales.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune vente payée.</p>
            ) : (
              paidSales.slice(0, 20).map((s: any) => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-900 text-sm">
                    {s.client?.name || "Client"} — {s.date}
                  </p>
                  <span className="font-semibold text-green-600">
                    +{Number(s.total_amount || 0).toFixed(2)} DT
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ventes non payées</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {unpaidSales.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune vente en attente.</p>
            ) : (
              unpaidSales.slice(0, 20).map((s: any) => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-900 text-sm">
                    {clientName(s)} — {formatDate(s.date)}
                  </p>
                  <span className="font-semibold text-orange-600">
                    {Number(s.total_amount || 0).toFixed(2)} DT
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500">
        Pour modifier le statut de paiement, utilisez la section{" "}
        <Link href="/dashboard/sales" className="text-primary-600 hover:underline">Ventes</Link>.
      </p>
    </div>
  );
}
