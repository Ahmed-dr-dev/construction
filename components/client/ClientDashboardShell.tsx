"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClientAuth } from "@/lib/hooks/useClientAuth";
import { ShoppingCart, LogOut, LayoutDashboard, PackageSearch, FileText } from "lucide-react";

const NAV = [
  { href: "/client/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/client/dashboard/commandes", label: "Suivi des commandes", icon: PackageSearch },
  { href: "/client/dashboard/factures", label: "Mes factures", icon: FileText },
] as const;

export default function ClientDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { client, loading, signOut } = useClientAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [orderCount, setOrderCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);

  useEffect(() => {
    if (!loading && !client) {
      router.push("/client/signin");
    }
  }, [client, loading, router]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      try {
        const [oRes, iRes] = await Promise.all([
          fetch("/api/client/orders"),
          fetch("/api/client/invoices"),
        ]);
        if (cancelled) return;
        if (oRes.ok) {
          const d = await oRes.json();
          setOrderCount((d.orders || []).length);
        }
        if (iRes.ok) {
          const d = await iRes.json();
          setInvoiceCount((d.invoices || []).length);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  if (loading || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/catalog" className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Espace client</span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <aside className="w-56 space-y-4 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Navigation</p>
              <div className="space-y-2">
                {NAV.map(({ href, label, icon: Icon }) => {
                  const active =
                    href === "/client/dashboard"
                      ? pathname === href
                      : pathname === href || pathname.startsWith(`${href}/`);
                  const count =
                    href === "/client/dashboard/commandes"
                      ? orderCount
                      : href === "/client/dashboard/factures"
                        ? invoiceCount
                        : null;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors ${
                        active
                          ? "bg-primary-50 border-primary-600 text-primary-700"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </span>
                      {count !== null && (
                        <span className="text-xs text-gray-500 shrink-0">{count}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-600 space-y-1">
              <p className="font-medium text-gray-800">Astuce</p>
              <p>
                Retrouvez l&apos;étape de vos commandes dans &laquo; Suivi des commandes &raquo; et vos reçus sous
                &laquo; Mes factures &raquo;.
              </p>
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
