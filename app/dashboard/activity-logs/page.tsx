"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import {
  Activity,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  LogIn,
  PlusSquare,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCog,
} from "lucide-react";
import { ROLE_BADGE_CLASSES, ROLE_LABELS, type UserRole } from "@/lib/rbac";

type LogUser = { id: string; full_name: string; email: string; role: string };

interface ActivityLogRow {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
  user: LogUser | LogUser[] | null;
}

interface Summary {
  all: number;
  login: number;
  create: number;
  update: number;
  delete: number;
  logout: number;
}

const ACTION_META: Record<string, { label: string; color: string; icon: ElementType }> = {
  login: { label: "Connexion", color: "bg-blue-100 text-blue-800", icon: LogIn },
  create: { label: "Ajout", color: "bg-emerald-100 text-emerald-800", icon: PlusSquare },
  update: { label: "Modification", color: "bg-amber-100 text-amber-800", icon: RefreshCw },
  delete: { label: "Suppression", color: "bg-red-100 text-red-800", icon: Trash2 },
  logout: { label: "Déconnexion", color: "bg-gray-100 text-gray-700", icon: LogIn },
};

function logUser(log: ActivityLogRow): LogUser | null {
  const u = log.user;
  if (!u) return null;
  return Array.isArray(u) ? u[0] ?? null : u;
}

export default function ActivityLogsPage() {
  const { isAuthorized } = useRoleGuard(["admin"]);

  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [entityType, setEntityType] = useState("");
  const [qInput, setQInput] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = qInput.trim();
      setQDebounced((prev) => {
        if (prev !== next) queueMicrotask(() => setOffset(0));
        return next;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (actionFilter) params.set("action", actionFilter);
      if (entityType.trim()) params.set("entity_type", entityType.trim());
      if (qDebounced) params.set("q", qDebounced);
      if (offset > 0) params.set("summary", "0");

      const res = await fetch(`/api/activity-logs?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement");

      setLogs(data.logs || []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      if (data.summary) setSummary(data.summary as Summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, actionFilter, entityType, qDebounced]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const pageEnd = Math.min(offset + logs.length, offset + limit);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  const actionChips = useMemo(() => {
    const s = summary;
    return [
      { key: null as string | null, label: "Toutes", count: s?.all ?? null },
      { key: "login" as const, label: "Connexions", count: s?.login ?? null },
      { key: "create" as const, label: "Ajouts", count: s?.create ?? null },
      { key: "update" as const, label: "Modifs.", count: s?.update ?? null },
      { key: "delete" as const, label: "Suppressions", count: s?.delete ?? null },
      { key: "logout" as const, label: "Déconnexions", count: s?.logout ?? null },
    ];
  }, [summary]);

  const exportCsv = () => {
    const rows = [
      ["Date", "Utilisateur", "Email", "Rôle", "Action", "Entité", "ID entité", "Détails"],
      ...logs.map((log) => {
        const u = logUser(log);
        return [
          new Date(log.created_at).toISOString(),
          u?.full_name ?? "",
          u?.email ?? "",
          u?.role ?? "",
          log.action,
          log.entity_type ?? "",
          log.entity_id ?? "",
          (log.details ?? "").replaceAll('"', '""'),
        ];
      }),
    ];
    const body = rows.map((r) => r.map((c) => `"${String(c)}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!isAuthorized) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-8 h-8 text-primary-600" />
            Journaux d&apos;activité
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Historique des connexions et des opérations. Filtrez par type d&apos;action, entité ou texte
            dans le détail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void fetchLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!logs.length}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            CSV (page)
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {actionChips.map((chip) => {
            const active = actionFilter === chip.key;
            return (
              <button
                key={chip.key ?? "all"}
                type="button"
                onClick={() => {
                  setActionFilter(chip.key);
                  setOffset(0);
                }}
                className={`card text-left p-4 transition ring-2 ring-transparent ${
                  active ? "ring-primary-500 bg-primary-50/80" : "hover:border-gray-300"
                }`}
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{chip.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {chip.count !== null ? chip.count : "—"}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recherche</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Texte dans les détails…"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="w-full lg:w-48">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type d&apos;entité</label>
            <input
              type="text"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setOffset(0);
              }}
              placeholder="ex. user, product"
              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="w-full lg:w-36">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Par page</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} lignes
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-100">{error}</div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
          <p className="text-sm text-gray-600">
            {loading ? (
              "Chargement…"
            ) : total === 0 ? (
              "Aucun enregistrement"
            ) : (
              <>
                <span className="font-semibold text-gray-900">
                  {offset + 1}–{pageEnd}
                </span>
                <span className="text-gray-500"> sur {total}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!hasPrev || loading}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => setOffset((o) => o + limit)}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="py-3 px-4 font-semibold">Utilisateur</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entité</th>
                <th className="py-3 px-4 font-semibold min-w-[200px]">Détails</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Chargement des journaux…
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-500">
                    Aucune entrée ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const u = logUser(log);
                  const meta = ACTION_META[log.action] ?? {
                    label: log.action,
                    color: "bg-gray-100 text-gray-700",
                    icon: Activity,
                  };
                  const Icon = meta.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 p-1.5 rounded-lg bg-primary-50 text-primary-600 shrink-0">
                            <UserCog className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{u?.full_name ?? "Système"}</p>
                            {u?.email && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                            {u?.role && (
                              <span
                                className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  ROLE_BADGE_CLASSES[u.role as UserRole] ?? "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {ROLE_LABELS[u.role as UserRole] ?? u.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${meta.color}`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          {log.entity_type ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono">
                              {log.entity_type}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          {log.entity_id && (
                            <p className="text-[11px] text-gray-400 font-mono truncate max-w-[140px]" title={log.entity_id}>
                              {log.entity_id.slice(0, 8)}…
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top text-gray-600 max-w-md">
                        <p className="line-clamp-3" title={log.details ?? undefined}>
                          {log.details ?? "—"}
                        </p>
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {new Date(log.created_at).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        Réservé aux administrateurs. Les comptages par action tiennent compte du filtre « type d&apos;entité » et de la
        recherche, pas du filtre d&apos;action sélectionné.
      </p>
    </div>
  );
}
