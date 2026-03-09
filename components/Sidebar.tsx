"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  FileText,
  LogOut,
  Package2,
  ShoppingBag,
  TrendingUp,
  ClipboardList,
  MessageCircle,
  Receipt,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  userRole?: string;
}

export default function Sidebar({ userRole = "admin" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const comptableMenuItems = [
    { href: "/dashboard/comptable", label: "Tableau de bord comptable", icon: LayoutDashboard },
    { href: "/dashboard/comptable/transactions", label: "Transactions financières", icon: Receipt },
    { href: "/dashboard/comptable/invoices", label: "Factures (clients & fournisseurs)", icon: FileText },
    { href: "/dashboard/comptable/payments", label: "Paiements & encaissements", icon: CreditCard },
    { href: "/dashboard/comptable/expenses-revenue", label: "Dépenses & recettes", icon: BarChart3 },
    { href: "/dashboard/comptable/reports", label: "Rapports financiers", icon: BarChart3 },
  ];

  const gestionMenuItems = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin", "employee"] },
    { href: "/dashboard/products", label: "Produits", icon: Package, roles: ["admin", "employee"] },
    { href: "/dashboard/sales", label: "Ventes", icon: ShoppingCart, roles: ["admin", "employee"] },
    { href: "/dashboard/supplier-orders", label: "Commandes Fournisseurs", icon: ShoppingBag, roles: ["admin", "employee"] },
    { href: "/dashboard/clients", label: "Clients", icon: Users, roles: ["admin"] },
    { href: "/dashboard/suppliers", label: "Fournisseurs", icon: Truck, roles: ["admin"] },
    { href: "/dashboard/comptable-accounts", label: "Comptables", icon: UserPlus, roles: ["admin"] },
    { href: "/dashboard/invoices", label: "Factures", icon: FileText, roles: ["admin", "employee"] },
    { href: "/dashboard/profitability", label: "Rentabilité", icon: TrendingUp, roles: ["admin", "employee"] },
    { href: "/dashboard/recommendations", label: "Recommandations", icon: ClipboardList, roles: ["admin", "employee"] },
    { href: "/dashboard/assistant", label: "Dashboard", icon: MessageCircle, roles: ["admin", "employee"] },
  ];

  const isComptable = userRole === "comptable";

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Package2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Construction</h1>
            <p className="text-xs text-gray-500">Gestion Magasin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {isComptable
          ? comptableMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })
          : gestionMenuItems.map((item) => {
              if (!item.roles.includes(userRole || "employee")) return null;
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

