"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientAuth } from "@/lib/hooks/useClientAuth";
import { ShoppingCart, LogOut, Mail, Phone, FileText, Download } from "lucide-react";

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
  }[]; // Supabase returns an array for related rows
  items?: OrderItem[];
}

export default function ClientDashboardPage() {
  const { client, loading, signOut } = useClientAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "invoices">("orders");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [invoices, setInvoices] = useState<
    {
      id: string;
      invoice_number: string;
      created_at: string;
      sale?: {
        id: string;
        date: string;
        total_amount: number;
        status: string;
        created_at: string;
        items?: {
          id: string;
          quantity: number;
          price: number;
          product?: {
            id: string;
            name: string;
            unit: string;
          };
        }[];
      } | null;
    }[]
  >([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !client) {
      router.push("/client/signin");
    }
  }, [client, loading, router]);

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

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!client) return;
      setInvoicesLoading(true);
      try {
        const res = await fetch("/api/client/invoices");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error("Error fetching client invoices:", error);
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [client]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "paid") return order.status === "paid" || order.status === "Payé";
    if (statusFilter === "unpaid") return order.status === "unpaid" || order.status === "Non payé";
    return true;
  });

  const totalOrders = orders.length;
  const totalPaid = orders
    .filter((o) => o.status === "paid" || o.status === "Payé")
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalUnpaid = orders
    .filter((o) => o.status === "unpaid" || o.status === "Non payé")
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

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

  const handleDownloadInvoice = async (
    invoice: (typeof invoices)[0]
  ) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Gestion Construction", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text("Facture", 20, y);
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoice_number, 20, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(
      `Émise le ${formatDate(invoice.created_at)}`,
      20,
      y
    );
    y += 6;
    if (invoice.sale) {
      doc.text(
        `Commande #${invoice.sale.id.slice(0, 8)}`,
        20,
        y
      );
      y += 10;
    }

    if (client) {
      doc.text("Client", 20, y);
      y += 6;
      doc.text(client.name, 20, y);
      y += 5;
      doc.text(client.email, 20, y);
      if (client.phone) {
        y += 5;
        doc.text(client.phone, 20, y);
      }
      y += 10;
    }

    if (invoice.sale?.items && invoice.sale.items.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Détail", 20, y);
      doc.text("Qté", 90, y);
      doc.text("Prix unit.", 110, y);
      doc.text("Total", 160, y);
      doc.setFont("helvetica", "normal");
      y += 8;

      invoice.sale.items.forEach((item) => {
        const name = (item.product?.name || "Produit").slice(0, 28);
        doc.text(name, 20, y);
        doc.text(String(item.quantity), 90, y);
        doc.text(
          `${item.price.toFixed(2)} DT`,
          110,
          y
        );
        doc.text(
          `${(item.quantity * item.price).toFixed(2)} DT`,
          160,
          y
        );
        y += 6;
      });
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total: ${(invoice.sale?.total_amount ?? 0).toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} DT`,
        20,
        y
      );
      doc.setFont("helvetica", "normal");
    }

    doc.save(`Facture_${invoice.invoice_number}.pdf`);
  };

  if (loading || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/catalog" className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Espace client</span>
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Navigation
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border ${
                    activeTab === "orders"
                      ? "bg-primary-50 border-primary-600 text-primary-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Mes commandes</span>
                  </span>
                  <span className="text-xs text-gray-500">{totalOrders}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("invoices")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border ${
                    activeTab === "invoices"
                      ? "bg-primary-50 border-primary-600 text-primary-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Mes factures</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {invoices.length}
                  </span>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-600 space-y-1">
              <p className="font-medium text-gray-800">Astuce</p>
              <p>
                Utilisez cet espace pour retrouver vos bons de commande et vos
                reçus de paiement à tout moment.
              </p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Commandes totales
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                <p className="text-xs text-green-700 uppercase tracking-wide mb-1">
                  Montant payé
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {totalPaid.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  DT
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
                <p className="text-xs text-orange-700 uppercase tracking-wide mb-1">
                  Montant en attente
                </p>
                <p className="text-2xl font-bold text-orange-700">
                  {totalUnpaid.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  DT
                </p>
              </div>
            </div>

            {/* Client info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Mes informations
              </h2>
              <div className="space-y-2 text-gray-700">
                <p className="font-medium">{client.name}</p>
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "orders" ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Mes commandes
                    </h2>
                    <p className="text-sm text-gray-500">
                      Consultez l&apos;historique de vos achats et leur statut.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <Link
                      href="/catalog"
                      className="ml-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      Continuer les achats
                    </Link>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-8 text-gray-600">
                    Chargement des commandes...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <p className="mb-2 font-medium">Aucune commande trouvée</p>
                    <p className="mb-4 text-sm">
                      Vous n&apos;avez pas encore passé de commande avec ce
                      compte.
                    </p>
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
                        order.invoice && order.invoice.length > 0
                          ? order.invoice[0]
                          : null;
                      return (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Commande N°
                              </p>
                              <p className="font-bold text-lg text-gray-900">
                                #{order.id.slice(0, 8)}
                              </p>
                              {invoice && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Facture&nbsp;:{" "}
                                  <span className="font-medium text-gray-800">
                                    {invoice.invoice_number}
                                  </span>
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Date de commande
                              </p>
                              <p className="text-sm text-gray-800">
                                {formatDate(order.created_at || order.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}
                            >
                              {statusInfo.text}
                            </span>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Montant total
                              </p>
                              <p className="text-lg font-bold text-primary-600">
                                {order.total_amount?.toLocaleString("fr-FR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                DT
                              </p>
                            </div>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-3 border-t border-gray-100 pt-3">
                              <p className="text-xs font-medium text-gray-600 mb-2">
                                Articles
                              </p>
                              <ul className="space-y-1 text-sm text-gray-700">
                                {order.items.map((item) => (
                                  <li
                                    key={item.id}
                                    className="flex justify-between"
                                  >
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
                                    <span className="font-medium">
                                      {(item.quantity * item.price).toLocaleString(
                                        "fr-FR",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}{" "}
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
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Mes factures
                    </h2>
                    <p className="text-sm text-gray-500">
                      Consultez vos reçus de paiement et les détails associés.
                    </p>
                  </div>
                </div>

                {invoicesLoading ? (
                  <div className="text-center py-8 text-gray-600">
                    Chargement des factures...
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <p className="mb-2 font-medium">Aucune facture trouvée</p>
                    <p className="mb-4 text-sm">
                      Les factures apparaîtront ici après la création de
                      commandes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Facture
                            </p>
                            <p className="font-semibold text-gray-900">
                              {invoice.invoice_number}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Émise le {formatDate(invoice.created_at)}
                            </p>
                            {invoice.sale && (
                              <p className="text-xs text-gray-500 mt-1">
                                Commande #{invoice.sale.id.slice(0, 8)} •{" "}
                                {formatDate(
                                  invoice.sale.created_at ||
                                    invoice.sale.date
                                )}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            {invoice.sale && (
                              <>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                  Montant
                                </p>
                                <p className="text-lg font-bold text-primary-600">
                                  {invoice.sale.total_amount?.toLocaleString(
                                    "fr-FR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}{" "}
                                  DT
                                </p>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(invoice)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Télécharger PDF
                            </button>
                          </div>
                        </div>
                        {invoice.sale?.items && invoice.sale.items.length > 0 && (
                          <div className="mt-3 border-t border-gray-100 pt-3">
                            <p className="text-xs font-medium text-gray-600 mb-2">
                              Détail des articles
                            </p>
                            <ul className="space-y-1 text-sm text-gray-700">
                              {invoice.sale.items.map((item) => (
                                <li
                                  key={item.id}
                                  className="flex justify-between"
                                >
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
                                  <span className="font-medium">
                                    {(item.quantity * item.price).toLocaleString(
                                      "fr-FR",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}{" "}
                                    DT
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

