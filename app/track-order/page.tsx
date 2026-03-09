"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Check, Copy, Mail, Package2, Phone, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    unit: string;
  } | null;
}

interface Order {
  id: string;
  date: string;
  total_amount: number;
  status: string;
  created_at: string;
  client?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  items?: OrderItem[];
}

const initialForm = {
  order_id: "",
  email: "",
  phone: "",
};

function getStatusLabel(status: string) {
  switch (status) {
    case "paid":
    case "Payé":
      return {
        text: "Payé",
        color: "bg-green-100 text-green-700 border-green-200",
      };
    case "unpaid":
    case "Non payé":
      return {
        text: "En attente de paiement",
        color: "bg-orange-100 text-orange-700 border-orange-200",
      };
    default:
      return {
        text: status || "Inconnu",
        color: "bg-gray-100 text-gray-700 border-gray-200",
      };
  }
}

function formatDate(value: string) {
  if (!value) return "N/A";

  try {
    return new Date(value).toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(initialForm);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoSearchDone, setAutoSearchDone] = useState(false);

  const submitSearch = async (payload: typeof initialForm) => {
    const cleanedPayload = {
      order_id: payload.order_id.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
    };

    if (!cleanedPayload.order_id && !cleanedPayload.email && !cleanedPayload.phone) {
      setError("Renseignez un numéro de commande, un email ou un téléphone.");
      setOrders([]);
      setHasSearched(true);
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await fetch("/api/public/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        setOrders([]);
        setError(data.error || "Impossible de récupérer la commande.");
        return;
      }

      setOrders(data.orders || []);
    } catch (requestError) {
      console.error("Error tracking order:", requestError);
      setOrders([]);
      setError("Erreur lors de la recherche. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const orderId = searchParams.get("order_id")?.trim() || "";
    if (!orderId) return;

    setFormData((current) =>
      current.order_id === orderId ? current : { ...current, order_id: orderId }
    );
  }, [searchParams]);

  useEffect(() => {
    const orderId = searchParams.get("order_id")?.trim() || "";
    if (!orderId || autoSearchDone) return;

    setAutoSearchDone(true);
    void submitSearch({
      order_id: orderId,
      email: "",
      phone: "",
    });
  }, [autoSearchDone, searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitSearch(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <nav className="bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Package2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Gestion Construction</span>
            </Link>
            <Link href="/catalog" className="text-sm font-medium text-gray-600 hover:text-primary-600">
              Parcourir le catalogue
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[420px,1fr] gap-8 items-start">
          <section className="card">
            <div className="mb-6">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100">
                <Search className="w-3.5 h-3.5" />
                Suivi de commande
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mt-4">
                Retrouver une commande
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Recherchez avec l&apos;identifiant complet de commande, l&apos;email
                client ou le numéro de téléphone.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="order_id" className="label">
                  Numéro de commande
                </label>
                <input
                  id="order_id"
                  value={formData.order_id}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      order_id: event.target.value,
                    }))
                  }
                  className="input"
                  placeholder="Collez l'identifiant complet"
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="input"
                  placeholder="client@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Téléphone
                </label>
                <input
                  id="phone"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="input"
                  placeholder="+216 ..."
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" />
                {loading ? "Recherche..." : "Suivre la commande"}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            {!hasSearched ? (
              <div className="card text-center py-14">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Aucune recherche lancée
                </h2>
                <p className="text-gray-600">
                  Lancez une recherche pour afficher le statut et le détail des
                  commandes correspondantes.
                </p>
              </div>
            ) : orders.length === 0 && !loading && !error ? (
              <div className="card text-center py-14">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Aucune commande trouvée
                </h2>
                <p className="text-gray-600">
                  Vérifiez les informations saisies ou recherchez avec l&apos;email
                  ou le téléphone du client.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const status = getStatusLabel(order.status);

                return (
                  <article key={order.id} className="card">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          Référence
                        </p>
                        <div className="flex items-start gap-2">
                          <code className="text-sm md:text-base font-mono text-gray-900 break-all">
                            {order.id}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(order.id);
                              setCopiedId(order.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="mt-0.5 shrink-0 p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Copier le numéro"
                          >
                            {copiedId === order.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${status.color}`}>
                          {status.text}
                        </span>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Total
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          Date
                        </p>
                        <p className="text-sm text-gray-800 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(order.created_at || order.date)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          Email
                        </p>
                        <p className="text-sm text-gray-800 flex items-center gap-2 break-all">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {order.client?.email || "Non renseigné"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          Téléphone
                        </p>
                        <p className="text-sm text-gray-800 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {order.client?.phone || "Non renseigné"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">
                            Articles commandés
                          </h2>
                          <p className="text-sm text-gray-500">
                            {order.items?.length || 0} article(s)
                          </p>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 ? (
                        <ul className="space-y-3">
                          {order.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.product?.name || "Produit"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.quantity} {item.product?.unit || "u"} x{" "}
                                  {item.price.toLocaleString("fr-FR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  DT
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                {(item.quantity * item.price).toLocaleString("fr-FR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                DT
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Aucun article disponible pour cette commande.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
