"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/lib/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pageTitle, setPageTitle] = useState("Tableau de bord");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const path = window.location.pathname;
    if (user?.role === "comptable" && path === "/dashboard") {
      router.replace("/dashboard/comptable");
      return;
    }
    const titles: Record<string, string> = {
      "/dashboard": "Tableau de bord",
      "/dashboard/comptable": "Tableau de bord comptable",
      "/dashboard/comptable/transactions": "Transactions financières",
      "/dashboard/comptable/invoices": "Factures",
      "/dashboard/comptable/payments": "Paiements & encaissements",
      "/dashboard/comptable/expenses-revenue": "Dépenses & recettes",
      "/dashboard/comptable/reports": "Rapports financiers",
      "/dashboard/products": "Produits",
      "/dashboard/sales": "Ventes",
      "/dashboard/clients": "Clients",
      "/dashboard/suppliers": "Fournisseurs",
      "/dashboard/comptable-accounts": "Comptables",
      "/dashboard/invoices": "Factures",
    };
    setPageTitle(titles[path] || "Tableau de bord");
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Header 
          title={pageTitle}
          userName={user.full_name}
          userRole={user.role}
        />
        <main className="flex-1 p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

