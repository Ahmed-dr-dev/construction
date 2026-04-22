"use client";

import { useState } from "react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import {
  MessageCircle,
  BarChart3,
  Package,
  TrendingUp,
  Truck,
  Coins,
  Users,
  ClipboardList,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type QuestionId =
  | "ca_total"
  | "ca_mois"
  | "top_products"
  | "stock_alert"
  | "recommandations"
  | "rentabilite"
  | "clients_actifs"
  | "meilleur_fournisseur";

interface QuestionDef {
  id: QuestionId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const QUESTIONS: QuestionDef[] = [
  {
    id: "ca_total",
    label: "Quel est mon chiffre d'affaires total ?",
    icon: Coins,
    description: "CA total encaissé (ventes payées)",
  },
  {
    id: "ca_mois",
    label: "Quel est mon CA ce mois-ci ?",
    icon: BarChart3,
    description: "Chiffre d'affaires du mois en cours",
  },
  {
    id: "top_products",
    label: "Quels sont mes produits les plus vendus ?",
    icon: Package,
    description: "Top produits sur les 90 derniers jours",
  },
  {
    id: "stock_alert",
    label: "Quels produits sont en stock faible ou rupture ?",
    icon: Package,
    description: "Alertes stock (seuil minimum dépassé)",
  },
  {
    id: "recommandations",
    label: "Quelles sont les recommandations d'approvisionnement ?",
    icon: ClipboardList,
    description: "Quantités à commander et fournisseurs suggérés",
  },
  {
    id: "rentabilite",
    label: "Quel est mon bénéfice et ma rentabilité ?",
    icon: TrendingUp,
    description: "Bénéfice total et produits les plus rentables",
  },
  {
    id: "clients_actifs",
    label: "Combien de clients actifs ce mois ?",
    icon: Users,
    description: "Clients ayant effectué au moins une commande ce mois",
  },
  {
    id: "meilleur_fournisseur",
    label: "Quel fournisseur performe le mieux ?",
    icon: Truck,
    description: "Classement et score des fournisseurs",
  },
];

export default function AssistantPage() {
  const { isAuthorized } = useRoleGuard(["admin", "responsable"]);
  const [selectedId, setSelectedId] = useState<QuestionId | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<React.ReactNode | null>(null);

  const handleAsk = async (id: QuestionId) => {
    setSelectedId(id);
    setLoading(true);
    setAnswer(null);
    try {
      switch (id) {
        case "ca_total": {
          const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
          const data = await res.json();
          const total = data?.stats?.totalSales ?? 0;
          const count = data?.stats?.totalSalesCount ?? 0;
          setAnswer(
            <AnswerBox>
              <p className="text-lg font-semibold text-gray-900">
                Votre chiffre d'affaires total (ventes payées) est de{" "}
                <span className="text-primary-600">{total.toFixed(2)} DT</span>.
              </p>
              <p className="text-gray-600 mt-2">
                Cela représente <strong>{count}</strong> ventes au total.
              </p>
            </AnswerBox>
          );
          break;
        }
        case "ca_mois": {
          const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
          const data = await res.json();
          const mois = data?.stats?.thisMonthSales ?? 0;
          const change = data?.stats?.monthlyChange ?? 0;
          setAnswer(
            <AnswerBox>
              <p className="text-lg font-semibold text-gray-900">
                Ce mois-ci, votre CA s'élève à{" "}
                <span className="text-primary-600">{mois.toFixed(2)} DT</span>.
              </p>
              <p className="text-gray-600 mt-2">
                Évolution par rapport au mois dernier :{" "}
                <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                  {change >= 0 ? "+" : ""}{change} %
                </span>
              </p>
            </AnswerBox>
          );
          break;
        }
        case "top_products": {
          const res = await fetch("/api/dashboard/analytics", { cache: "no-store" });
          const data = await res.json();
          const top = data?.topProducts?.slice(0, 10) ?? [];
          setAnswer(
            <AnswerBox>
              <p className="text-lg font-semibold text-gray-900 mb-3">
                Produits les plus vendus (90 derniers jours) :
              </p>
              <ul className="space-y-2">
                {top.length === 0 ? (
                  <li className="text-gray-500">Aucune donnée de vente sur la période.</li>
                ) : (
                  top.map((p: { name: string; quantity: number; unit: string }, i: number) => (
                    <li key={i} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-800">{p.name}</span>
                      <span className="text-primary-600">
                        {p.quantity} {p.unit}
                      </span>
                    </li>
                  ))
                )}
              </ul>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 mt-3 text-primary-600 hover:underline text-sm"
              >
                Voir les graphiques <ChevronRight className="w-4 h-4" />
              </Link>
            </AnswerBox>
          );
          break;
        }
        case "stock_alert": {
          const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
          const data = await res.json();
          const low = data?.lowStockProducts ?? [];
          const rupture = low.filter((p: { stock: number }) => p.stock === 0);
          const faible = low.filter((p: { stock: number }) => p.stock > 0);
          setAnswer(
            <AnswerBox>
              <p className="text-lg font-semibold text-gray-900 mb-3">État du stock :</p>
              {low.length === 0 ? (
                <p className="text-gray-600">Aucune alerte. Tous les produits sont au-dessus du seuil minimum.</p>
              ) : (
                <>
                  {rupture.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-red-700 mb-1">Rupture ({rupture.length}) :</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {rupture.map((p: { id: string; name: string }) => (
                          <li key={p.id}>{p.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {faible.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-orange-700 mb-1">Stock faible ({faible.length}) :</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {faible.map((p: { id: string; name: string; stock: number; min_stock: number }) => (
                          <li key={p.id}>
                            {p.name} — stock actuel : {p.stock}, minimum : {p.min_stock}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Link
                    href="/dashboard/products"
                    className="inline-flex items-center gap-1 mt-3 text-primary-600 hover:underline text-sm"
                  >
                    Gérer les produits <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </AnswerBox>
          );
          break;
        }
        case "recommandations": {
          const res = await fetch("/api/analytics/recommendations", { cache: "no-store" });
          const data = await res.json();
          const recs = data?.orderRecommendations ?? [];
          const best = data?.bestSupplier;
          setAnswer(
            <AnswerBox>
              <p className="text-lg font-semibold text-gray-900 mb-3">Recommandations d'approvisionnement :</p>
              {recs.length === 0 ? (
                <p className="text-gray-600">Aucune commande urgente suggérée. Le stock est suffisant.</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">
                    <strong>{recs.length}</strong> produit(s) à réapprovisionner :
                  </p>
                  <ul className="space-y-2 mb-3">
                    {recs.slice(0, 8).map((r: { product?: { name: string }; suggested_quantity: number; best_supplier?: { name: string } }, i: number) => (
                      <li key={i} className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="font-medium text-gray-800">{r.product?.name}</span>
                        <span className="text-primary-600">
                          Qté suggérée : {r.suggested_quantity}
                          {r.best_supplier ? ` — ${r.best_supplier.name}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {best && (
                    <p className="text-sm text-gray-600">
                      Meilleur fournisseur global : <strong>{best.name}</strong> (score {best.score}).
                    </p>
                  )}
                  <Link
                    href="/dashboard/recommendations"
                    className="inline-flex items-center gap-1 mt-3 text-primary-600 hover:underline text-sm"
                  >
                    Voir toutes les recommandations <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </AnswerBox>
          );
          break;
        }
        case "rentabilite": {
          const res = await fetch("/api/dashboard/profitability", { cache: "no-store" });
          const data = await res.json();
          const summary = data?.summary ?? {};
          const products = data?.products?.slice(0, 5) ?? [];
          const ca = summary.totalCA ?? 0;
          const benefice = summary.totalBenefice ?? 0;
          setAnswer(
            <AnswerBox>
              <p className="text-lg font-semibold text-gray-900 mb-2">Rentabilité :</p>
              <p className="text-gray-700">
                Chiffre d'affaires total (ventes) : <strong className="text-primary-600">{ca.toFixed(2)} DT</strong>.
              </p>
              <p className="text-gray-700 mt-1">
                Bénéfice total (si prix d'achat renseignés) :{" "}
                <strong className={benefice >= 0 ? "text-green-600" : "text-red-600"}>
                  {benefice.toFixed(2)} DT
                </strong>
              </p>
              {products.length > 0 && (
                <>
                  <p className="text-sm font-medium text-gray-700 mt-3 mb-1">Top 5 produits par bénéfice :</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {products.map((p: { name: string; benefice: number }, i: number) => (
                      <li key={i}>
                        {p.name} — {p.benefice.toFixed(2)} DT
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <Link
                href="/dashboard/profitability"
                className="inline-flex items-center gap-1 mt-3 text-primary-600 hover:underline text-sm"
              >
                Voir la page Rentabilité <ChevronRight className="w-4 h-4" />
              </Link>
            </AnswerBox>
          );
          break;
        }
        case "clients_actifs": {
          const res = await fetch("/api/dashboard/analytics", { cache: "no-store" });
          const data = await res.json();
          const kpis = data?.kpis ?? {};
          const n = kpis.clientsActifsCeMois ?? 0;
          const caMois = kpis.caCeMois ?? 0;
          setAnswer(
            <AnswerBox>
              <p className="text-lg font-semibold text-gray-900">
                Ce mois-ci, vous avez{" "}
                <span className="text-primary-600">{n} client{n !== 1 ? "s" : ""} actif{n !== 1 ? "s" : ""}</span>{" "}
                (ayant passé au moins une commande).
              </p>
              <p className="text-gray-600 mt-2">
                CA du mois : <strong>{caMois.toFixed(2)} DT</strong>.
              </p>
            </AnswerBox>
          );
          break;
        }
        case "meilleur_fournisseur": {
          const res = await fetch("/api/analytics/recommendations", { cache: "no-store" });
          const data = await res.json();
          const table = data?.comparisonTable ?? [];
          const best = data?.bestSupplier;
          setAnswer(
            <AnswerBox>
              <p className="text-lg font-semibold text-gray-900 mb-3">Classement des fournisseurs :</p>
              {best && (
                <p className="text-gray-700 mb-2">
                  Meilleur fournisseur : <strong className="text-primary-600">{best.name}</strong> (score{" "}
                  {best.score}/100, {best.delivered} livraisons, {best.late} en retard).
                </p>
              )}
              {table.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-600">
                  {table.slice(0, 5).map((row: { rank: number; name: string; score: number; delivery_rate: number }) => (
                    <li key={row.name} className="flex justify-between py-0.5">
                      <span>{row.rank}. {row.name}</span>
                      <span>Score {row.score} — Taux livraison {row.delivery_rate} %</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Aucune donnée de commandes fournisseurs.</p>
              )}
              <Link
                href="/dashboard/recommendations"
                className="inline-flex items-center gap-1 mt-3 text-primary-600 hover:underline text-sm"
              >
                Voir le détail <ChevronRight className="w-4 h-4" />
              </Link>
            </AnswerBox>
          );
          break;
        }
      }
    } catch (e) {
      console.error(e);
      setAnswer(
        <AnswerBox>
          <p className="text-red-600">Erreur lors du chargement des données. Réessayez.</p>
        </AnswerBox>
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary-100">
          <MessageCircle className="w-8 h-8 text-primary-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-600 mb-0.5">Assistant intelligent</p>
          <h1 className="text-2xl font-bold text-gray-900">Questions fréquentes</h1>
          <p className="text-gray-600">
            Choisissez une question pour obtenir une réponse basée sur vos données (CA, stock, ventes,
            fournisseurs).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUESTIONS.map((q) => {
          const Icon = q.icon;
          const isSelected = selectedId === q.id;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => handleAsk(q.id)}
              disabled={loading}
              className={`card text-left transition-all hover:shadow-md hover:border-primary-200 ${
                isSelected ? "ring-2 ring-primary-500 border-primary-300" : ""
              } ${loading ? "opacity-70 pointer-events-none" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{q.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{q.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="min-h-[200px]">
        {loading && (
          <div className="card flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Chargement des données...</span>
          </div>
        )}
        {!loading && answer && <div className="mt-4">{answer}</div>}
        {!loading && !answer && selectedId && (
          <div className="card text-gray-500 text-center py-8">Sélectionnez une question ci-dessus.</div>
        )}
      </div>
    </div>
  );
}

function AnswerBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="card bg-primary-50/50 border-primary-200">
      <div className="flex items-start gap-2">
        <MessageCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
