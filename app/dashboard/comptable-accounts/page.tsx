"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, User, Lock, Shield, Trash2, Users, AlertTriangle } from "lucide-react";
import { ROLE_LABELS, ROLE_BADGE_CLASSES, type UserRole } from "@/lib/rbac";

type AppUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

const CREATABLE_ROLES: UserRole[] = ["admin", "responsable", "personnel", "comptable"];

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers]       = useState<AppUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "personnel" as UserRole,
    password: "",
    password_confirm: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/comptables", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.comptables ?? []);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/signin"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); return; }
    fetchUsers();
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.password !== form.password_confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (form.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères"); return; }
    if (!form.email.trim() || !form.full_name.trim()) { setError("Email et nom complet sont requis"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comptables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), fullName: form.full_name.trim(), password: form.password, role: form.role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Erreur lors de la création"); return; }
      setSuccess(`Compte ${ROLE_LABELS[form.role]} créé avec succès.`);
      setForm((p) => ({ ...p, email: "", full_name: "", password: "", password_confirm: "" }));
      await fetchUsers();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le compte de "${name}" ? Cette action est irréversible.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/comptables", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Erreur lors de la suppression"); return; }
      setSuccess("Compte supprimé.");
      await fetchUsers();
    } catch {
      setError("Erreur réseau");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (s: string) => {
    try { return new Date(s).toLocaleDateString("fr-FR", { dateStyle: "short" }); }
    catch { return s; }
  };

  const roleCount = (role: UserRole) => users.filter((u) => u.role === role).length;

  if (authLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-primary-500" />
          Gestion des comptes utilisateurs
        </h1>
        <div className="flex gap-2 flex-wrap">
          {CREATABLE_ROLES.map((r) => (
            <span key={r} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE_CLASSES[r]}`}>
              {ROLE_LABELS[r]} ({roleCount(r)})
            </span>
          ))}
        </div>
      </div>

      {/* Creation form */}
      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary-500" />
          Créer un nouveau compte
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Définissez le rôle pour contrôler les accès de l'utilisateur dans l'application.
        </p>

        {error   && <div className="mb-4 p-3 bg-red-50   border border-red-200   text-red-700   rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0"/>{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5" htmlFor="acc-email">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input id="acc-email" type="email" className="input w-full" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="utilisateur@exemple.com" required />
            </div>
            <div>
              <label className="label flex items-center gap-1.5" htmlFor="acc-name">
                <User className="w-3.5 h-3.5" /> Nom complet
              </label>
              <input id="acc-name" type="text" className="input w-full" value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Prénom Nom" required />
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5" htmlFor="acc-role">
              <Shield className="w-3.5 h-3.5" /> Rôle
            </label>
            <select id="acc-role" className="input w-full" value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}>
              {CREATABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {form.role === "admin"       && "Accès complet : gestion des comptes, supervision totale."}
              {form.role === "responsable" && "Gestion des produits, stock, commandes, fournisseurs et clients."}
              {form.role === "personnel"   && "Opérations quotidiennes : ventes, consultation produits/clients."}
              {form.role === "comptable"   && "Accès exclusif au module comptabilité."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5" htmlFor="acc-pwd">
                <Lock className="w-3.5 h-3.5" /> Mot de passe
              </label>
              <input id="acc-pwd" type="password" className="input w-full" value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" required minLength={6} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5" htmlFor="acc-pwd2">
                <Lock className="w-3.5 h-3.5" /> Confirmer
              </label>
              <input id="acc-pwd2" type="password" className="input w-full" value={form.password_confirm}
                onChange={(e) => setForm((p) => ({ ...p, password_confirm: e.target.value }))}
                placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Création en cours..." : `Créer le compte ${ROLE_LABELS[form.role]}`}
          </button>
        </form>
      </div>

      {/* Users table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Utilisateurs ({users.length})
        </h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Chargement...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun utilisateur.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-3 pr-4">Nom</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Rôle</th>
                  <th className="pb-3 pr-4">Créé le</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-900">{u.full_name}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_BADGE_CLASSES[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="py-3 text-right">
                      {u.id !== user?.id ? (
                        <button
                          onClick={() => handleDelete(u.id, u.full_name)}
                          disabled={deletingId === u.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">vous</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
