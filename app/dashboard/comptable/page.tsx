"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  FileText,
  CreditCard,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Coins,
  TrendingUp,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function ComptableDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch("/api/dashboard/comptable", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d?.error || "Erreur chargement")));
        return r.json();
      })
      .then(setData)
      .catch((e) => {
        setError(e?.message || "Erreur lors du chargement des données");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-medium">Impossible de charger les données</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recent = data?.recentTransactions || [];

  const formatDate = (d: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return d;
    }
  };

  const cards = [
    {
      title: "Chiffre d'affaires total",
      value: `${(kpis.chiffreAffaires ?? 0).toFixed(2)} DT`,
      sub: "Encaissements (ventes payées)",
      icon: Coins,
      href: "/dashboard/comptable/expenses-revenue",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "CA ce mois",
      value: `${(kpis.caCeMois ?? 0).toFixed(2)} DT`,
      sub: "Ventes payées ce mois",
      icon: TrendingUp,
      href: "/dashboard/comptable/reports",
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      title: "À recevoir",
      value: `${(kpis.totalARecevoir ?? 0).toFixed(2)} DT`,
      sub: "Ventes non encore encaissées",
      icon: AlertCircle,
      href: "/dashboard/comptable/payments",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Dette clients",
      value: `${(kpis.totalDetteClients ?? 0).toFixed(2)} DT`,
      sub: "Impayés clients",
      icon: CreditCard,
      href: "/dashboard/comptable/payments",
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Dépenses (fournisseurs)",
      value: `${(kpis.totalDepenses ?? 0).toFixed(2)} DT`,
      sub: "Commandes livrées",
      icon: ArrowDownCircle,
      href: "/dashboard/comptable/expenses-revenue",
      color: "text-gray-700",
      bg: "bg-gray-100",
    },
  ];

  return (
    <div className="space-y-8">
      <p className="text-gray-600">
        Suivi financier du magasin — recettes, dépenses, factures et rapports.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className={`inline-flex p-2 rounded-lg ${card.bg} ${card.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              Dernières transactions
            </h2>
            <Link
              href="/dashboard/comptable/transactions"
              className="text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {recent.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune transaction récente.</p>
            ) : (
              recent.map((t: any) => (
                <div
                  key={`${t.type}-${t.id}`}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{t.label}</p>
                    <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${t.type === 'vente' ? 'text-green-600' : 'text-gray-700'}`}>
                      {t.type === 'vente' ? '+' : '-'}{Number(t.amount || 0).toFixed(2)} DT
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'paid' || t.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {t.status === 'paid' ? 'Payé' : t.status === 'delivered' ? 'Livré' : t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Accès rapide
          </h2>
          <div className="space-y-2">
            <Link
              href="/dashboard/comptable/transactions"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Consulter les transactions financières</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/invoices"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Gérer les factures (clients & fournisseurs)</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/comptable/payments"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Suivre paiements et encaissements</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/comptable/expenses-revenue"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Contrôler dépenses et recettes</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/comptable/reports"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Générer les rapports financiers</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
