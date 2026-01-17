"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package2, Search, Mail, Hash, Calendar, CheckCircle2, Clock, XCircle, ShoppingCart, ArrowLeft, MapPin, Phone } from "lucide-react";

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
  status: "paid" | "unpaid";
  created_at: string;
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  items?: OrderItem[];
}

export default function TrackOrderPage() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<"email" | "phone" | "order_id">("email");
  const [searchValue, setSearchValue] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Check URL params for orderId and auto-search
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("orderId");
      if (orderId && !searched) {
        setSearchType("order_id");
        setSearchValue(orderId);
        // Auto-search if orderId is provided in URL
        handleSearchWithOrderId(orderId);
      }
    }
  }, []);

  const handleSearchWithOrderId = async (orderId: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/public/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error searching orders:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      alert("Veuillez entrer un email ou un numéro de commande");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch("/api/public/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(searchType === "email" && { email: searchValue.trim() }),
          ...(searchType === "phone" && { phone: searchValue.trim() }),
          ...(searchType === "order_id" && { order_id: searchValue.trim() }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la recherche");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error searching orders:", error);
      alert("Erreur lors de la recherche");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "unpaid":
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return { text: "Payé", color: "bg-green-100 text-green-700" };
      case "unpaid":
        return { text: "En attente de paiement", color: "bg-orange-100 text-orange-700" };
      default:
        return { text: "Inconnu", color: "bg-gray-100 text-gray-700" };
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Package2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Gestion Construction</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/catalog" className="text-gray-600 hover:text-gray-900">
                Catalogue
              </Link>
              <Link href="/signin" className="text-gray-600 hover:text-gray-900">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/catalog"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Suivre ma commande
          </h1>
          <p className="text-gray-600 mb-4">
            Entrez votre email, téléphone ou numéro de commande pour voir l'état de vos commandes
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 rounded-full p-1.5 mt-0.5">
                <Search className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Comment rechercher votre commande ?
                </p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Par email : Utilisez l'adresse email utilisée lors de la commande</li>
                  <li>Par téléphone : Utilisez le numéro de téléphone utilisé lors de la commande</li>
                  <li>Par numéro de commande : Utilisez le numéro reçu après votre achat (affiché dans la modal de confirmation)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setSearchType("email");
                  setSearchValue("");
                  setOrders([]);
                  setSearched(false);
                }}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                  searchType === "email"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchType("phone");
                  setSearchValue("");
                  setOrders([]);
                  setSearched(false);
                }}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                  searchType === "phone"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Téléphone</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchType("order_id");
                  setSearchValue("");
                  setOrders([]);
                  setSearched(false);
                }}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                  searchType === "order_id"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>N° Commande</span>
              </button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type={searchType === "email" ? "email" : searchType === "phone" ? "tel" : "text"}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === "email"
                      ? "votre@email.com"
                      : searchType === "phone"
                      ? "+212 6XX XXX XXX"
                      : "Numéro de commande (ex: 12345678-1234-1234)"
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5" />
                <span>{loading ? "Recherche..." : "Rechercher"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Orders List */}
            {searched && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-gray-600">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p>Recherche en cours...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune commande trouvée
                </h3>
                <p className="text-gray-600 mb-4">
                  Aucune commande n'a été trouvée avec les informations fournies. Vérifiez que vous avez saisi correctement votre email, téléphone ou numéro de commande.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/catalog"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Parcourir le catalogue
                  </Link>
                  <button
                    onClick={() => {
                      setSearchValue("");
                      setOrders([]);
                      setSearched(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Nouvelle recherche
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {orders.length} commande{orders.length > 1 ? "s" : ""} trouvée{orders.length > 1 ? "s" : ""}
                  </h2>
                  <button
                    onClick={() => {
                      setSearchValue("");
                      setOrders([]);
                      setSearched(false);
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Nouvelle recherche
                  </button>
                </div>
                {orders.map((order) => {
                  const statusInfo = getStatusLabel(order.status);
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Order Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(order.status)}
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Commande N°</p>
                              <p className="font-bold text-lg text-gray-900">#{order.id.slice(0, 8)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Date de commande</p>
                            <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="p-6 space-y-6">
                        {/* Client Info */}
                        {order.client && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Client</p>
                              <p className="font-medium text-gray-900">{order.client.name}</p>
                            </div>
                            {order.client.email && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>Email</span>
                                </p>
                                <p className="font-medium text-gray-900">{order.client.email}</p>
                              </div>
                            )}
                            {order.client.phone && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>Téléphone</span>
                                </p>
                                <p className="font-medium text-gray-900">{order.client.phone}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Order Items */}
                        {order.items && order.items.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                              <ShoppingCart className="w-4 h-4" />
                              <span>Articles commandés</span>
                            </h3>
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Produit</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Quantité</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Prix unitaire</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item, index) => (
                                    <tr key={item.id || index} className="border-t border-gray-100">
                                      <td className="py-3 px-4">
                                        <p className="font-medium text-gray-900">
                                          {item.product?.name || "Produit"}
                                        </p>
                                        {item.product?.unit && (
                                          <p className="text-xs text-gray-500">{item.product.unit}</p>
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-center text-gray-900">{item.quantity}</td>
                                      <td className="py-3 px-4 text-right text-gray-900">
                                        {item.price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                                      </td>
                                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                                        {(item.quantity * item.price).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Order Total */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <span className="text-lg font-medium text-gray-900">Total de la commande:</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {order.total_amount?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                          </span>
                        </div>

                        {/* Order Status Info */}
                        <div className={`p-4 rounded-lg ${
                          order.status === "paid"
                            ? "bg-green-50 border border-green-200"
                            : "bg-orange-50 border border-orange-200"
                        }`}>
                          <div className="flex items-start space-x-3">
                            {order.status === "paid" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                            )}
                            <div>
                              <p className={`text-sm font-medium ${
                                order.status === "paid" ? "text-green-900" : "text-orange-900"
                              }`}>
                                {order.status === "paid"
                                  ? "Commande payée"
                                  : "En attente de paiement"}
                              </p>
                              <p className={`text-xs mt-1 ${
                                order.status === "paid" ? "text-green-700" : "text-orange-700"
                              }`}>
                                {order.status === "paid"
                                  ? "Votre commande a été payée. Vous pouvez venir la récupérer."
                                  : "Votre commande est en attente de paiement. Veuillez vous rendre au magasin pour finaliser votre achat."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
