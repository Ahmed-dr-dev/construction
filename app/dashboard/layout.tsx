"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/lib/hooks/useAuth";
import { hasPermission, ROLE_LABELS, type UserRole } from "@/lib/rbac";
import { ShieldX, ArrowLeft } from "lucide-react";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                             "Tableau de bord",
  "/dashboard/products":                    "Produits",
  "/dashboard/sales":                       "Ventes",
  "/dashboard/clients":                     "Clients",
  "/dashboard/suppliers":                   "Fournisseurs",
  "/dashboard/supplier-orders":             "Commandes Fournisseurs",
  "/dashboard/invoices":                    "Factures",
  "/dashboard/profitability":               "Rentabilité",
  "/dashboard/recommendations":            "Recommandations",
  "/dashboard/assistant":                   "Assistant IA",
  "/dashboard/comptable-accounts":          "Gestion des comptes",
  "/dashboard/activity-logs":              "Journaux d'activité",
  "/dashboard/comptable":                   "Tableau de bord comptable",
  "/dashboard/comptable/transactions":      "Transactions financières",
  "/dashboard/comptable/invoices":          "Factures",
  "/dashboard/comptable/payments":          "Paiements & encaissements",
  "/dashboard/comptable/expenses-revenue":  "Dépenses & recettes",
  "/dashboard/comptable/reports":           "Rapports financiers",
};

function AccessDeniedView({ role }: { role: UserRole }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="p-5 rounded-full bg-red-50">
        <ShieldX className="w-12 h-12 text-red-400" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-gray-800">Page non accessible</h2>
        <p className="text-sm text-gray-500">
          Cette page n'est pas disponible pour le rôle{" "}
          <span className="font-semibold text-gray-700">{ROLE_LABELS[role]}</span>.
        </p>
        <p className="text-xs text-gray-400">
          Contactez un administrateur si vous pensez que c'est une erreur.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au tableau de bord
      </Link>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/signin"); return; }

    // Comptable lands on /dashboard → redirect to their dashboard
    if (user.role === "comptable" && pathname === "/dashboard") {
      router.replace("/dashboard/comptable");
      return;
    }

    setReady(true);
  }, [user, loading, pathname, router]);

  if (loading || !ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const authorized = hasPermission(user.role, pathname);
  const pageTitle  = authorized ? (PAGE_TITLES[pathname] ?? "Tableau de bord") : "Accès refusé";

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} userName={user.full_name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={pageTitle} userName={user.full_name} userRole={user.role} />
        <main className="flex-1 p-8 bg-gray-50 overflow-auto">
          {authorized ? children : <AccessDeniedView role={user.role} />}
        </main>
      </div>
    </div>
  );
}
