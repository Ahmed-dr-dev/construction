"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClientAuth } from "@/lib/hooks/useClientAuth";
import { Mail, Phone, PackageSearch, FileText, ArrowRight } from "lucide-react";

export default function ClientDashboardPage() {
  const { client } = useClientAuth();
  const [orders, setOrders] = useState<{ status: string; total_amount: number }[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const res = await fetch("/api/client/orders");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const totalOrders = orders.length;
  const totalPaid = orders
    .filter((o) => o.status === "paid" || o.status === "Payé")
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalUnpaid = orders
    .filter((o) => o.status === "unpaid" || o.status === "Non payé")
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Commandes totales</p>
          <p className="text-2xl font-bold text-gray-900">
            {statsLoading ? "—" : totalOrders}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
          <p className="text-xs text-green-700 uppercase tracking-wide mb-1">Montant payé</p>
          <p className="text-2xl font-bold text-green-700">
            {statsLoading
              ? "—"
              : `${totalPaid.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} DT`}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
          <p className="text-xs text-orange-700 uppercase tracking-wide mb-1">Montant en attente</p>
          <p className="text-2xl font-bold text-orange-700">
            {statsLoading
              ? "—"
              : `${totalUnpaid.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} DT`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/client/dashboard/commandes"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:border-primary-300 hover:shadow transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
              <PackageSearch className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 shrink-0" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-3">Suivi des commandes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Voir le détail, le statut et les étapes de chaque commande.
          </p>
        </Link>
        <Link
          href="/client/dashboard/factures"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:border-primary-300 hover:shadow transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
              <FileText className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 shrink-0" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-3">Mes factures</h2>
          <p className="text-sm text-gray-500 mt-1">Téléchargez vos factures au format PDF.</p>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mes informations</h2>
        <div className="space-y-2 text-gray-700">
          <p className="font-medium">{client?.name}</p>
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>{client?.email}</span>
          </div>
          {client?.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
