"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, ArrowDownCircle } from "lucide-react";

export default function ComptableReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [comptableData, setComptableData] = useState<any>(null);
  const [profitability, setProfitability] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/reports?month=${month}&year=${year}`, { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard/comptable", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard/profitability", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([reportData, comptableRes, profitRes]) => {
        setReport(reportData);
        setComptableData(comptableRes);
        setProfitability(profitRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  const kpis = comptableData?.kpis || {};
  const summary = profitability?.summary || {};
  const period = report?.period || {};
  const reportSummary = report?.summary || {};

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Chargement des rapports...
      </div>
    );
  }

  const totalRevenue = reportSummary.totalRevenue ?? kpis.chiffreAffaires ?? 0;
  const totalBenefice = summary.totalBenefice ?? 0;
  const chargesMois = kpis.chargesMois ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary-600" />
          Rapports financiers
        </h1>
        <p className="text-gray-600 mt-1">
          Chiffre d'affaires, bénéfices et charges — synthèse pour le suivi comptable.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Période :</span>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="input w-32"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1).toLocaleString("fr-FR", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="input w-28"
        >
          {[year, year - 1, year - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-primary-700">
                {totalRevenue.toFixed(2)} DT
              </p>
              <p className="text-xs text-gray-500">
                {reportSummary.totalSalesCount ?? 0} ventes • {reportSummary.paidCount ?? 0} payées
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Bénéfice (si coûts renseignés)</p>
              <p className="text-2xl font-bold text-green-700">
                {totalBenefice.toFixed(2)} DT
              </p>
              <p className="text-xs text-gray-500">CA − coûts d'achat</p>
            </div>
          </div>
        </div>
        <div className="card bg-gray-100 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gray-200">
              <ArrowDownCircle className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Charges (fournisseurs)</p>
              <p className="text-2xl font-bold text-gray-800">
                {chargesMois.toFixed(2)} DT
              </p>
              <p className="text-xs text-gray-500">Commandes livrées ce mois</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Synthèse période</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Début</p>
            <p className="font-medium text-gray-900">{period.start || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Fin</p>
            <p className="font-medium text-gray-900">{period.end || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Nombre de ventes</p>
            <p className="font-medium text-gray-900">{reportSummary.totalSalesCount ?? 0}</p>
          </div>
          <div>
            <p className="text-gray-500">Ventes impayées (période)</p>
            <p className="font-medium text-orange-600">{reportSummary.unpaidCount ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Imprimer / Enregistrer en PDF
        </button>
      </div>
    </div>
  );
}
