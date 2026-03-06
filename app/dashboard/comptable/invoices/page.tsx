"use client";

import { useState, useEffect } from "react";
import { FileText, Users, Truck, Search } from "lucide-react";
import Link from "next/link";

export default function ComptableInvoicesPage() {
  const [activeTab, setActiveTab] = useState<"client" | "supplier">("client");
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/invoices?type=${activeTab}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d?.error)));
        return r.json();
      })
      .then((data) => {
        if (activeTab === "client") setClientInvoices(data.invoices || []);
        else setSupplierInvoices(data.invoices || []);
      })
      .catch(() => {
        if (activeTab === "client") setClientInvoices([]);
        else setSupplierInvoices([]);
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  const clientList = clientInvoices.filter(
    (inv) =>
      !search.trim() ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.sale?.client?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const supplierList = supplierInvoices.filter(
    (inv) =>
      !search.trim() ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplier_order?.supplier?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const list = activeTab === "client" ? clientList : supplierList;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary-600" />
          Factures (clients & fournisseurs)
        </h1>
        <p className="text-gray-600 mt-1">
          Gérer et consulter les factures clients et fournisseurs.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("client")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "client" ? "bg-white shadow text-primary-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Factures clients
          </button>
          <button
            onClick={() => setActiveTab("supplier")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "supplier" ? "bg-white shadow text-primary-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Truck className="w-4 h-4" />
            Factures fournisseurs
          </button>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">N° Facture</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    {activeTab === "client" ? "Client" : "Fournisseur"}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Montant (DT)</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Statut</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Aucune facture trouvée.
                    </td>
                  </tr>
                ) : (
                  list.map((inv) => {
                    const isClient = activeTab === "client";
                    const sale = inv.sale;
                    const order = inv.supplier_order;
                    const amount = sale?.total_amount ?? order?.total_amount ?? 0;
                    const status = sale?.status ?? order?.status ?? "—";
                    const name = sale?.client?.name ?? order?.supplier?.name ?? "—";
                    return (
                      <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{inv.invoice_number || "—"}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{name}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          {Number(amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              status === "paid" || status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {status === "paid" ? "Payé" : status === "delivered" ? "Livré" : status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/dashboard/invoices?type=${activeTab}`}
                            className="text-primary-600 hover:underline text-sm"
                          >
                            Voir détail
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500">
        Pour créer des factures et télécharger les PDF, utilisez la section{" "}
        <Link href="/dashboard/invoices" className="text-primary-600 hover:underline">
          Factures
        </Link>{" "}
        du menu gestion (accès selon droits).
      </p>
    </div>
  );
}
