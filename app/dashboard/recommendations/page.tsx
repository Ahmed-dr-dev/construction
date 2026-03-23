"use client";

import { useEffect, useState } from "react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { ShoppingCart, Truck, Star, Package, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function RecommendationsPage() {
  const { isAuthorized } = useRoleGuard(["admin", "responsable"]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/recommendations")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (!isAuthorized) return null;
  if (loading || !data) return <div className="text-center py-12 text-gray-600">Chargement...</div>;

  const recs = data.orderRecommendations || [];
  const suppliers = data.supplierScores || [];
  const best = data.bestSupplier;
  const comparisonTable = data.comparisonTable || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ShoppingCart className="w-7 h-7 text-primary-500" />
        Recommandations de commandes et approvisionnement
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Quantités à commander (prévision rupture)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Produits en stock faible ou rupture. Quantité suggérée selon consommation moyenne et seuil min.
          </p>
          <div className="space-y-3">
            {recs.length === 0 ? (
              <p className="text-gray-500">Aucune recommandation. Stock OK.</p>
            ) : (
              recs.map((r: any) => (
                <div
                  key={r.product?.id}
                  className="p-4 rounded-lg border border-gray-200 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{r.product?.name}</p>
                      <p className="text-sm text-gray-500">
                        Stock: {r.current_stock} | Min: {r.min_stock} | Vente moy/jour: {r.avg_daily_sold}
                      </p>
                      <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Rupture prévue dans ~{r.days_until_stockout} jour(s) (simulation)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">Qté suggérée: {r.suggested_quantity}</p>
                      {r.best_supplier && (
                        <p className="text-xs text-gray-600 mt-1">
                          Fournisseur: {r.best_supplier.name} (score {r.best_supplier.score})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Meilleur fournisseur global
          </h2>
          {best ? (
            <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
              <p className="font-bold text-lg text-gray-900">{best.name}</p>
              <p className="text-primary-600 font-medium">Score: {best.score}/100</p>
              <p className="text-sm text-gray-600">
                Commandes: {best.total_orders} | Livrées: {best.delivered} | En retard: {best.late}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Aucun fournisseur enregistré</p>
          )}

          <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">Classement fournisseurs</h3>
          <div className="space-y-2">
            {suppliers.slice(0, 5).map((s: any, i: number) => (
              <div
                key={s.id}
                className="p-3 rounded-lg border border-gray-200 flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500">{i + 1}.</span>
                  <span className="font-medium text-gray-900">{s.name}</span>
                </div>
                <span className="font-bold text-primary-600">Score: {s.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau comparatif des fournisseurs */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Comparaison et score des fournisseurs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Rang</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Fournisseur</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Score</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Commandes</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Livrées</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">En retard</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Taux livraison</th>
              </tr>
            </thead>
            <tbody>
              {comparisonTable.map((row: any) => (
                <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{row.rank}</td>
                  <td className="py-3 px-4">{row.name}</td>
                  <td className="text-right py-3 px-4 font-bold text-primary-600">{row.score}</td>
                  <td className="text-right py-3 px-4">{row.total_orders}</td>
                  <td className="text-right py-3 px-4 text-green-600">{row.delivered}</td>
                  <td className="text-right py-3 px-4 text-red-600">{row.late}</td>
                  <td className="text-right py-3 px-4">{row.delivery_rate} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
