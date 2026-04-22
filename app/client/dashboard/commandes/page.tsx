"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClientAuth } from "@/lib/hooks/useClientAuth";
import { ShoppingCart, Check, CircleDashed } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Order {
  id: string;
  date: string;
  total_amount: number;
  status: string;
  created_at: string;
  invoice?: {
    id: string;
    invoice_number: string;
    created_at: string;
  }[];
  items?: OrderItem[];
}

function OrderTrackingSteps({ order }: { order: Order }) {
  const paid = order.status === "paid" || order.status === "Payé";
  const invoice = order.invoice && order.invoice.length > 0 ? order.invoice[0] : null;

  const steps = [
    { key: "placed", label: "Commande enregistrée", description: "Votre commande a bien été prise en compte.", done: true },
    {
      key: "payment",
      label: paid ? "Paiement confirmé" : "En attente de paiement",
      description: paid
        ? "Le paiement a été enregistré."
        : "Le règlement est en cours ou à effectuer selon les modalités convenues.",
      done: paid,
    },
    {
      key: "invoice",
      label: invoice ? "Facture émise" : "Facture",
      description: invoice
        ? `Document ${invoice.invoice_number} disponible dans « Mes factures ».`
        : "La facture sera disponible après validation du paiement.",
      done: !!invoice,
    },
  ];

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-600 mb-3">Suivi de la commande</p>
      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.key} className="flex gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                step.done
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-50 text-gray-400"
              }`}
            >
              {step.done ? <Check className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${step.done ? "text-gray-900" : "text-gray-500"}`}>{step.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ClientCommandesPage() {
  const { client } = useClientAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!client) return;
      setOrdersLoading(true);
      try {
        const res = await fetch("/api/client/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Error fetching client orders:", error);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [client]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "paid") return order.status === "paid" || order.status === "Payé";
    if (statusFilter === "unpaid") return order.status === "unpaid" || order.status === "Non payé";
    return true;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
      case "Payé":
        return { text: "Payé", color: "bg-green-100 text-green-700" };
      case "unpaid":
      case "Non payé":
        return { text: "En attente de paiement", color: "bg-orange-100 text-orange-700" };
      default:
        return { text: status || "Inconnu", color: "bg-gray-100 text-gray-700" };
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Suivi des commandes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Historique et étapes de traitement de vos commandes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs rounded-full border ${
                statusFilter === "all"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("paid")}
              className={`px-3 py-1.5 text-xs rounded-full border ${
                statusFilter === "paid"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Payées
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unpaid")}
              className={`px-3 py-1.5 text-xs rounded-full border ${
                statusFilter === "unpaid"
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              En attente
            </button>
            <Link href="/catalog" className="ml-1 text-sm text-primary-600 hover:text-primary-700">
              Continuer les achats
            </Link>
          </div>
        </div>

        {ordersLoading ? (
          <div className="text-center py-8 text-gray-600">Chargement des commandes...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="mb-2 font-medium">Aucune commande trouvée</p>
            <p className="mb-4 text-sm">Vous n&apos;avez pas encore passé de commande avec ce compte.</p>
            <Link
              href="/catalog"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Parcourir le catalogue</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusLabel(order.status);
              const invoice =
                order.invoice && order.invoice.length > 0 ? order.invoice[0] : null;
              return (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Commande N°</p>
                      <p className="font-bold text-lg text-gray-900">#{order.id.slice(0, 8)}</p>
                      {invoice && (
                        <p className="text-xs text-gray-500 mt-1">
                          Facture&nbsp;:{" "}
                          <span className="font-medium text-gray-800">{invoice.invoice_number}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Date de commande</p>
                      <p className="text-sm text-gray-800">{formatDate(order.created_at || order.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Montant total</p>
                      <p className="text-lg font-bold text-primary-600">
                        {order.total_amount?.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        DT
                      </p>
                    </div>
                  </div>

                  <OrderTrackingSteps order={order} />

                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Articles</p>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-2">
                            <span>
                              {item.product?.name || "Produit"}{" "}
                              <span className="text-xs text-gray-500">
                                ({item.quantity} x{" "}
                                {item.price.toLocaleString("fr-FR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                DT)
                              </span>
                            </span>
                            <span className="font-medium shrink-0">
                              {(item.quantity * item.price).toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              DT
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
