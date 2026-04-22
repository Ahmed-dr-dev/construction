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
  BarChart3,
  UserCog,
  Activity,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type UserRole } from "@/lib/rbac";

interface SidebarProps {
  userRole?: UserRole;
  userName?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

// ── Per-role nav definitions ──────────────────────────────────────────────────

const NAV_ADMIN: NavSection[] = [
  {
    title: "Vue générale",
    items: [
      { href: "/dashboard",                    label: "Tableau de bord",       icon: LayoutDashboard },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/dashboard/comptable-accounts", label: "Gestion des comptes",  icon: UserCog },
      { href: "/dashboard/activity-logs",      label: "Journaux d'activité",  icon: Activity },
    ],
  },
];

const NAV_RESPONSABLE: NavSection[] = [
  {
    title: "Vue générale",
    items: [
      { href: "/dashboard",                    label: "Tableau de bord",        icon: LayoutDashboard },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/dashboard/products",           label: "Produits",               icon: Package },
      { href: "/dashboard/sales",              label: "Ventes",                 icon: ShoppingCart },
      { href: "/dashboard/clients",            label: "Clients",                icon: Users },
      { href: "/dashboard/invoices",           label: "Factures",               icon: FileText },
    ],
  },
  {
    title: "Approvisionnement",
    items: [
      { href: "/dashboard/suppliers",          label: "Fournisseurs",           icon: Truck },
      { href: "/dashboard/supplier-orders",    label: "Commandes Fournisseurs", icon: ShoppingBag },
    ],
  },
  {
    title: "Analytique",
    items: [
      { href: "/dashboard/profitability",      label: "Rentabilité",            icon: TrendingUp },
      { href: "/dashboard/recommendations",   label: "Recommandations",        icon: ClipboardList },
      { href: "/dashboard/assistant",          label: "Assistant IA",           icon: MessageCircle },
    ],
  },
];

const NAV_PERSONNEL: NavSection[] = [
  {
    title: "Opérations",
    items: [
      { href: "/dashboard",                    label: "Tableau de bord",        icon: LayoutDashboard },
      { href: "/dashboard/sales",              label: "Ventes",                 icon: ShoppingCart },
      { href: "/dashboard/products",           label: "Produits",               icon: Package },
      { href: "/dashboard/clients",            label: "Clients",                icon: Users },
    ],
  },
];

const NAV_COMPTABLE: NavSection[] = [
  {
    title: "Comptabilité",
    items: [
      { href: "/dashboard/comptable",                  label: "Tableau de bord comptable",        icon: LayoutDashboard },
      { href: "/dashboard/comptable/transactions",     label: "Transactions financières",          icon: Receipt },
      { href: "/dashboard/comptable/invoices",         label: "Factures",                          icon: FileText },
      { href: "/dashboard/comptable/payments",         label: "Paiements & encaissements",         icon: CreditCard },
      { href: "/dashboard/comptable/expenses-revenue", label: "Dépenses & recettes",               icon: BarChart3 },
      { href: "/dashboard/comptable/reports",          label: "Rapports financiers",               icon: BarChart3 },
    ],
  },
];

const NAV_BY_ROLE: Record<UserRole, NavSection[]> = {
  admin:       NAV_ADMIN,
  responsable: NAV_RESPONSABLE,
  personnel:   NAV_PERSONNEL,
  comptable:   NAV_COMPTABLE,
  employee:    NAV_PERSONNEL,
};

// ── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ userRole = "personnel", userName }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const sections = NAV_BY_ROLE[userRole] ?? NAV_PERSONNEL;

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Package2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Construction</h1>
            <p className="text-xs text-gray-500">Gestion Magasin</p>
          </div>
        </div>
      </div>

      {/* User (role shown in header only) */}
      <div className="px-4 py-3 border-b border-gray-100">
        {userName && <p className="text-xs text-gray-500 truncate">{userName}</p>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {section.title && (
              <p className="px-5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {section.title}
              </p>
            )}
            <div className="px-3 space-y-0.5">
              {section.items.map((item) => {
                const Icon   = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      active
                        ? "bg-primary-50 text-primary-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 w-full transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
