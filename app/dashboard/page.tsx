"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Package,
  PlusCircle,
  ArrowRight,
  Shield,
  UserCheck,
  UserX,
  LogIn,
  PlusSquare,
  RefreshCw,
  Trash2,
  Activity,
  Clock,
  UserCog,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROLE_LABELS, ROLE_BADGE_CLASSES, type UserRole } from "@/lib/rbac";

const COLORS = ["#22c55e", "#f97316", "#ef4444"]; // Disponible, Stock faible, Rupture

// ── Types ──────────────────────────────────────────────────────────────────────
interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    byRole: Record<string, number>;
  };
  security: { loginsToday: number };
  activity: {
    creates: number;
    updates: number;
    deletes: number;
    total: number;
    chart: { date: string; create: number; update: number; delete: number }[];
  };
  recentLogs: {
    id: string;
    action: string;
    entity_type: string;
    details: string;
    created_at: string;
    user: { full_name: string; role: string } | null;
  }[];
}

export default function Dashboard() {
  const { user } = useAuth();

  // Admin stats
  const [adminStats,        setAdminStats]        = useState<AdminStats | null>(null);
  const [adminBiz,          setAdminBiz]          = useState<typeof stats | null>(null);
  const [adminLowStock,     setAdminLowStock]     = useState<any[]>([]);
  const [adminStatsLoading, setAdminStatsLoading] = useState(false);

  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    todaySales: 0,
    totalClients: 0,
    thisMonthSales: 0,
    unpaidSales: 0,
    pendingOrders: 0,
    totalSalesCount: 0,
    monthlyChange: 0 as number | undefined,
  });
  const [analytics, setAnalytics] = useState<{
    salesByDay: { date: string; total: number }[];
    salesByMonth: { month: string; total: number }[];
    topProducts: { name: string; quantity: number; unit: string }[];
    stockEvolution: { name: string; stock: number; min_stock: number; status: string }[];
    kpis: { chiffreAffaires: number; nombreVentes: number; clientsActifsCeMois: number; caCeMois: number };
  } | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [resStats, resAnalytics] = await Promise.all([
        fetch("/api/dashboard/stats", { cache: "no-store" }),
        fetch("/api/dashboard/analytics", { cache: "no-store" }),
      ]);
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data.stats);
        setLowStockProducts(data.lowStockProducts || []);
        setRecentSales(data.recentSales || []);
      }
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      setAdminStatsLoading(true);
      Promise.all([
        fetch("/api/admin/stats",    { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/dashboard/stats",{ cache: "no-store" }).then((r) => r.json()),
      ])
        .then(([adminData, bizData]) => {
          setAdminStats(adminData);
          if (bizData?.stats)      setAdminBiz(bizData.stats);
          if (bizData?.lowStockProducts) setAdminLowStock(bizData.lowStockProducts);
        })
        .catch(() => {})
        .finally(() => setAdminStatsLoading(false));
      return;
    }
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 60000);
    const handleFocus = () => fetchStats(true);
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchStats, user?.role]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStockStatusBadge = (product: { stock: number; min_stock: number }) => {
    if (product.stock === 0)
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Rupture</span>;
    if (product.stock <= product.min_stock)
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Stock faible</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Disponible</span>;
  };

  if (loading && user?.role !== "admin") {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  // ── Vue Admin ─────────────────────────────────────────────────────────────
  if (user?.role === "admin") {
    if (adminStatsLoading || !adminStats) {
      return (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Chargement du tableau de bord...</span>
        </div>
      );
    }

    const fmt  = (v: number) => v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const biz  = adminBiz;
    const low  = adminLowStock;

    const ACTION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      login:  { label: "Connexion",    color: "bg-blue-100   text-blue-700",   icon: LogIn      },
      create: { label: "Ajout",        color: "bg-green-100  text-green-700",  icon: PlusSquare },
      update: { label: "Modification", color: "bg-orange-100 text-orange-700", icon: RefreshCw  },
      delete: { label: "Suppression",  color: "bg-red-100    text-red-700",    icon: Trash2     },
      logout: { label: "Déconnexion",  color: "bg-gray-100   text-gray-600",   icon: LogIn      },
    };

    return (
      <div className="space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-500" />
            Tableau de bord Administrateur
          </h1>
          <Link href="/dashboard/activity-logs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Voir tous les journaux →
          </Link>
        </div>

        {/* ── KPIs métier ─────────────────────────────────────────────────── */}
        {biz && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Vue d'ensemble métier
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "CA total",         value: `${fmt(biz.totalSales)} DT`,      icon: DollarSign,  bg: "bg-emerald-50", text: "text-emerald-600" },
                { label: "CA ce mois",        value: `${fmt(biz.thisMonthSales)} DT`,  icon: TrendingUp,  bg: "bg-blue-50",    text: "text-blue-600",
                  badge: biz.monthlyChange !== undefined
                    ? { label: `${biz.monthlyChange > 0 ? "+" : ""}${biz.monthlyChange}%`, pos: biz.monthlyChange >= 0 }
                    : undefined },
                { label: "Total impayés",     value: `${fmt(biz.unpaidSales)} DT`,     icon: CreditCard,  bg: "bg-red-50",     text: "text-red-500"    },
                { label: "Ventes aujourd'hui",value: `${fmt(biz.todaySales)} DT`,      icon: ShoppingCart,bg: "bg-orange-50",  text: "text-orange-600" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="card flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${c.bg} ${c.text} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
                      <p className="text-lg font-bold text-gray-900 leading-tight truncate">{c.value}</p>
                      {c.badge && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${c.badge.pos ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {c.badge.label} vs mois dernier
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Second row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                { label: "Clients",           value: biz.totalClients,   icon: Users,    bg: "bg-purple-50", text: "text-purple-600" },
                { label: "Produits",          value: biz.totalProducts,  icon: Package,  bg: "bg-sky-50",    text: "text-sky-600"    },
                { label: "Alertes stock",     value: low.length,          icon: AlertTriangle, bg: "bg-yellow-50",text: "text-yellow-600",
                  warn: low.length > 0 },
                { label: "Commandes client en attente", value: biz.pendingOrders, icon: FileText,  bg: "bg-gray-50",  text: "text-gray-600"   },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className={`card flex items-start gap-3 ${c.warn && c.value > 0 ? "border-l-4 border-yellow-400" : ""}`}>
                    <div className={`p-2.5 rounded-xl ${c.bg} ${c.text} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Utilisateurs + Sécurité (côte à côte) ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilisateurs */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" /> Utilisateurs
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total",    value: adminStats.users.total,    icon: Users,     bg: "bg-purple-50", text: "text-purple-600" },
                { label: "Actifs",   value: adminStats.users.active,   icon: UserCheck, bg: "bg-green-50",  text: "text-green-600"  },
                { label: "Inactifs", value: adminStats.users.inactive, icon: UserX,     bg: "bg-gray-50",   text: "text-gray-500"   },
                { label: "Bloqués",  value: adminStats.users.blocked,  icon: Shield,    bg: "bg-red-50",    text: "text-red-600"    },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="card flex items-center gap-3 p-4">
                    <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}><Icon className="w-4 h-4" /></div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{c.value}</p>
                      <p className="text-xs text-gray-500">{c.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Répartition par rôle */}
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Répartition par rôle</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(adminStats.users.byRole).map(([role, count]) => (
                  <span key={role} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE_CLASSES[role as UserRole] ?? "bg-gray-100 text-gray-700"}`}>
                    {ROLE_LABELS[role as UserRole] ?? role} <b>{count}</b>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Sécurité + Activités */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Sécurité & Activités (7j)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Connexions aujourd'hui", value: adminStats.security.loginsToday,  icon: LogIn,      bg: "bg-blue-50",   text: "text-blue-600"   },
                { label: "Comptes bloqués",        value: adminStats.users.blocked,          icon: Shield,     bg: "bg-red-50",    text: "text-red-600"    },
                { label: "Ajouts",                 value: adminStats.activity.creates,       icon: PlusSquare, bg: "bg-green-50",  text: "text-green-600"  },
                { label: "Modifications",          value: adminStats.activity.updates,       icon: RefreshCw,  bg: "bg-orange-50", text: "text-orange-600" },
                { label: "Suppressions",           value: adminStats.activity.deletes,       icon: Trash2,     bg: "bg-red-50",    text: "text-red-600"    },
                { label: "Total actions",          value: adminStats.activity.total,         icon: Activity,   bg: "bg-gray-50",   text: "text-gray-600"   },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="card flex items-center gap-3 p-4">
                    <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}><Icon className="w-4 h-4" /></div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{c.value}</p>
                      <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Mini activity chart */}
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-3 font-medium">Évolution des activités (7j)</p>
              {adminStats.activity.chart.every(d => d.create + d.update + d.delete === 0) ? (
                <p className="text-gray-400 text-xs text-center py-6">Aucune activité enregistrée</p>
              ) : (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminStats.activity.chart} barSize={8}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} allowDecimals={false} width={20} />
                      <Tooltip />
                      <Bar dataKey="create" name="Ajouts"        fill="#22c55e" radius={[2,2,0,0]} />
                      <Bar dataKey="update" name="Modifications" fill="#f97316" radius={[2,2,0,0]} />
                      <Bar dataKey="delete" name="Suppressions"  fill="#ef4444" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Dernières actions ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Dernières actions
            </h2>
            <Link href="/dashboard/activity-logs" className="text-xs text-primary-600 hover:underline font-medium">
              Voir tout →
            </Link>
          </div>
          <div className="card overflow-x-auto">
            {adminStats.recentLogs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">Aucune action enregistrée pour l'instant</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                    <th className="pb-3 pr-4 text-left">Utilisateur</th>
                    <th className="pb-3 pr-4 text-left">Action</th>
                    <th className="pb-3 pr-4 text-left">Détails</th>
                    <th className="pb-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {adminStats.recentLogs.map((log) => {
                    const meta = ACTION_META[log.action] ?? { label: log.action, color: "bg-gray-100 text-gray-600", icon: Activity };
                    const Icon = meta.icon;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                              <UserCog className="w-3.5 h-3.5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs leading-tight">{log.user?.full_name ?? "Système"}</p>
                              {log.user?.role && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE_CLASSES[log.user.role as UserRole] ?? "bg-gray-100 text-gray-600"}`}>
                                  {ROLE_LABELS[log.user.role as UserRole] ?? log.user.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                            <Icon className="w-3 h-3" />{meta.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500 text-xs max-w-xs truncate">{log.details ?? log.entity_type ?? "—"}</td>
                        <td className="py-3 text-gray-400 whitespace-nowrap text-xs">
                          {new Date(log.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ── Vue simplifiée pour le personnel ──────────────────────────────────────
  if (user?.role === "personnel" || user?.role === "employee") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-primary-500" />
          Bonjour, {user.full_name.split(" ")[0]} 👋
        </h1>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/dashboard/sales",    label: "Nouvelle vente",        icon: PlusCircle, color: "bg-primary-600" },
            { href: "/dashboard/products", label: "Consulter les produits", icon: Package,    color: "bg-blue-600"    },
            { href: "/dashboard/clients",  label: "Consulter les clients",  icon: Users,      color: "bg-green-600"   },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`${action.color} text-white rounded-xl p-5 flex items-center justify-between hover:opacity-90 transition-opacity`}
              >
                <span className="font-semibold text-sm">{action.label}</span>
                <Icon className="w-6 h-6 opacity-80" />
              </Link>
            );
          })}
        </div>

        {/* Today's sales KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ventes aujourd'hui</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.todaySales.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total des ventes</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalSalesCount} transactions</p>
            </div>
          </div>
        </div>

        {/* Stock alerts */}
        {lowStockProducts.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Alertes stock à surveiller
              </h2>
              <Link href="/dashboard/products" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${p.stock === 0 ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">Stock : {p.stock} / Min : {p.min_stock} {p.unit ? `(${p.unit})` : ""}</p>
                  </div>
                  {p.stock === 0
                    ? <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Rupture</span>
                    : <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Stock faible</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sales */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Ventes récentes
            </h2>
            <Link href="/dashboard/sales" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Aucune vente récente</p>
            ) : (
              recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{sale.client?.name || "Client inconnu"}</p>
                    <p className="text-xs text-gray-500">{formatDate(sale.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">
                      {sale.total_amount?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sale.status === "Payé" || sale.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {sale.status === "Payé" || sale.status === "paid" ? "Payé" : "Non payé"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const kpis = analytics?.kpis;
  const formatMoney = (value: number) =>
    `${value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DT`;
  const formatRevenueTooltip = (value: number | string | undefined) =>
    [`${Number(value ?? 0).toFixed(2)} DT`, "CA"] as const;
  const formatQuantityTooltip = (
    value: number | string | undefined,
    _name?: string,
    item?: { payload?: { unit?: string } }
  ) => [`${Number(value ?? 0)} ${item?.payload?.unit || ""}`, "Quantité"] as const;
  const formatStockTooltip = (
    value: number | string | undefined,
    _name?: string,
    item?: { payload?: { status?: string; min_stock?: number } }
  ) =>
    [
      `${Number(value ?? 0)} (min: ${item?.payload?.min_stock ?? 0}) - ${item?.payload?.status || ""}`,
      "Stock",
    ] as const;

  const kpiCards = [
    {
      title: "Chiffre d'affaires total",
      value: formatMoney(kpis?.chiffreAffaires ?? stats.totalSales),
      icon: DollarSign,
      color: "green" as const,
      badge: "Global",
      description: "Vue consolidée des ventes enregistrées depuis le lancement.",
      size: "featured" as const,
      className: "md:col-span-2 xl:col-span-2",
    },
    {
      title: "Ventes aujourd'hui",
      value: formatMoney(stats.todaySales),
      icon: TrendingUp,
      color: "blue" as const,
      badge: "Temps réel",
      description: "Performance de la journée en cours.",
    },
    {
      title: "Nombre de ventes",
      value: kpis?.nombreVentes ?? stats.totalSalesCount,
      icon: ShoppingCart,
      color: "orange" as const,
      badge: "Transactions",
      description: "Nombre total de commandes clients finalisées.",
    },
    {
      title: "Clients actifs (ce mois)",
      value: kpis?.clientsActifsCeMois ?? 0,
      icon: Users,
      color: "blue" as const,
      badge: "Mensuel",
      description: "Clients ayant commandé au moins une fois ce mois-ci.",
    },
    {
      title: "Total impayés",
      value: formatMoney(stats.unpaidSales),
      icon: CreditCard,
      color: "red" as const,
      badge: "À surveiller",
      description: "Montant restant à encaisser sur les ventes non réglées.",
    },
    {
      title: "Commandes en attente",
      value: stats.pendingOrders,
      icon: FileText,
      color: "orange" as const,
      badge: "Workflow",
      description: "Commandes nécessitant encore une validation ou un suivi.",
    },
  ];

  return (
    <div className="space-y-6">
  

      {/* KPI en temps réel */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ventes par jour (30 derniers jours)</h2>
          <div className="h-64">
            {analytics?.salesByDay?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} DT`} />
                  <Tooltip formatter={formatRevenueTooltip} labelFormatter={(l) => formatDate(l)} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} name="Chiffre d'affaires" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ventes par mois (12 mois)</h2>
          <div className="h-64">
            {analytics?.salesByMonth?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} DT`} />
                  <Tooltip formatter={formatRevenueTooltip} />
                  <Bar dataKey="total" fill="#22c55e" name="Chiffre d'affaires" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Produits les plus vendus (90 jours)</h2>
          <div className="h-64">
            {analytics?.topProducts?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={formatQuantityTooltip} />
                  <Bar dataKey="quantity" fill="#3b82f6" name="Quantité vendue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune vente sur la période</p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">État du stock (top 15 produits)</h2>
          <div className="h-64">
            {analytics?.stockEvolution?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.stockEvolution}
                    dataKey="stock"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, payload }) => `${name} (${payload?.status ?? ""})`}
                  >
                    {analytics.stockEvolution.map((_, index) => (
                      <Cell key={index} fill={COLORS[["Disponible", "Stock faible", "Rupture"].indexOf(_.status) % 3]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatStockTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun produit</p>
            )}
          </div>
        </div>
      </div>

      {/* Alertes stock avec statuts dynamiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Alertes stock (statuts dynamiques)
            </h2>
            <Link href="/dashboard/products" className="text-sm text-primary-600 hover:text-primary-700">
              Voir les produits
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune alerte. Tous les stocks sont OK.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    product.stock === 0 ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stock} / Min: {product.min_stock} {product.unit ? `(${product.unit})` : ""}
                    </p>
                  </div>
                  {getStockStatusBadge(product)}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 text-primary-500 mr-2" />
              Ventes récentes
            </h2>
            <Link href="/dashboard/sales" className="text-sm text-primary-600 hover:text-primary-700">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune vente récente</p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{sale.client?.name || "Client inconnu"}</p>
                    <p className="text-sm text-gray-600">{formatDate(sale.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {sale.total_amount?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        sale.status === "Payé" || sale.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {sale.status === "Payé" || sale.status === "paid" ? "Payé" : "Non payé"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
