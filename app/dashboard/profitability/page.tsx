"use client";

import { useEffect, useState } from "react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { DollarSign, TrendingUp, Package } from "lucide-react";
import Link from "next/link";

interface ProfitabilityRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  prix_vente: number;
  prix_achat: number;
  marge: number;
  marge_pourcent: number;
  quantite_vendue: number;
  chiffre_affaires: number;
  benefice: number;
}

export default function ProfitabilityPage() {
  const { isAuthorized } = useRoleGuard(["admin", "responsable"]);
  const [data, setData] = useState<{ products: ProfitabilityRow[]; summary: { totalCA: number; totalBenefice: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/profitability")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!isAuthorized) return null;
  if (loading) return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  if (!data) return <div className="text-center py-12 text-gray-600">Erreur chargement</div>;

  const { products, summary } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <TrendingUp className="w-7 h-7 text-primary-500" />
        Rentabilité des produits
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1">Chiffre d&apos;affaires total (ventes)</p>
              <p className="text-2xl font-bold text-green-800">
                {summary.totalCA.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-700 mb-1">Bénéfice total (si prix d&apos;achat renseigné)</p>
              <p className="text-2xl font-bold text-primary-800">
                {summary.totalBenefice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
              </p>
            </div>
            <Package className="w-10 h-10 text-primary-600" />
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Renseignez le prix d&apos;achat (coût) dans la fiche produit pour obtenir la marge et le bénéfice réels. Sinon, le coût est considéré à 0.
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Produit</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Prix vente (DT)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Prix achat (DT)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Marge (DT)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Marge %</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Qté vendue</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">CA (DT)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Bénéfice (DT)</th>
              </tr>
            </thead>
            <tbody>
              {products.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.category} • {row.unit}</p>
                  </td>
                  <td className="text-right py-3 px-4">{row.prix_vente.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">{row.prix_achat.toFixed(2)}</td>
                  <td className="text-right py-3 px-4 font-medium">{row.marge.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">
                    <span className={row.marge_pourcent >= 0 ? "text-green-600" : "text-red-600"}>
                      {row.marge_pourcent.toFixed(1)} %
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">{row.quantite_vendue}</td>
                  <td className="text-right py-3 px-4">{row.chiffre_affaires.toFixed(2)}</td>
                  <td className="text-right py-3 px-4 font-bold text-primary-600">{row.benefice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        <Link href="/dashboard/products" className="text-primary-600 hover:underline">Gérer les produits</Link>
        {" "}(ajoutez le champ prix d&apos;achat en base si nécessaire pour la rentabilité).
      </p>
    </div>
  );
}
