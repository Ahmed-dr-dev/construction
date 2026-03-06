"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, User, Lock, Shield } from "lucide-react";

type ComptableUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
};

export default function ComptableAccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [comptables, setComptables] = useState<ComptableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "comptable",
    password: "",
    password_confirm: "",
  });

  const fetchComptables = async () => {
    try {
      const res = await fetch("/api/comptables", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setComptables(data.comptables ?? []);
      }
    } catch {
      setComptables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
      return;
    }
    if (!authLoading && user?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    fetchComptables();
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.password_confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (!form.email.trim() || !form.full_name.trim()) {
      setError("Email et nom complet sont requis");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/comptables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          fullName: form.full_name.trim(),
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        return;
      }
      setSuccess("Compte comptable créé.");
      setForm((prev) => ({ ...prev, email: "", full_name: "", password: "", password_confirm: "" }));
      await fetchComptables();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return s;
    }
  };

  if (authLoading || (user && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <UserPlus className="w-7 h-7 text-primary-500" />
        Création de compte comptable
      </h1>

      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouveau comptable (attributs table users)</h2>
        <p className="text-sm text-gray-600 mb-6">
          Les champs correspondent à la table <code className="bg-gray-100 px-1 rounded">users</code> : email, full_name, role, password (stocké en password_hash). Id, created_at et updated_at sont gérés automatiquement.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label flex items-center gap-2" htmlFor="comptable-email">
              <Mail className="w-4 h-4" /> Email
            </label>
            <input
              id="comptable-email"
              type="email"
              className="input w-full"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="comptable@exemple.com"
              required
            />
          </div>
          <div>
            <label className="label flex items-center gap-2" htmlFor="comptable-full_name">
              <User className="w-4 h-4" /> Nom complet (full_name)
            </label>
            <input
              id="comptable-full_name"
              type="text"
              className="input w-full"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Nom du comptable"
              required
            />
          </div>
          <div>
            <label className="label flex items-center gap-2" htmlFor="comptable-role">
              <Shield className="w-4 h-4" /> Rôle (role)
            </label>
            <input
              id="comptable-role"
              type="text"
              className="input w-full bg-gray-100"
              value={form.role}
              readOnly
              title="Fixé à comptable pour cette page"
            />
          </div>
          <div>
            <label className="label flex items-center gap-2" htmlFor="comptable-password">
              <Lock className="w-4 h-4" /> Mot de passe (password → password_hash)
            </label>
            <input
              id="comptable-password"
              type="password"
              className="input w-full"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="label flex items-center gap-2" htmlFor="comptable-password_confirm">
              <Lock className="w-4 h-4" /> Confirmer le mot de passe
            </label>
            <input
              id="comptable-password_confirm"
              type="password"
              className="input w-full"
              value={form.password_confirm}
              onChange={(e) => setForm((p) => ({ ...p, password_confirm: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Création..." : "Créer le compte comptable"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comptables existants (id, email, full_name, role, created_at, updated_at)</h2>
        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : comptables.length === 0 ? (
          <p className="text-gray-500">Aucun compte comptable.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-3 pr-4">id</th>
                  <th className="py-3 pr-4">email</th>
                  <th className="py-3 pr-4">full_name</th>
                  <th className="py-3 pr-4">role</th>
                  <th className="py-3 pr-4">created_at</th>
                  <th className="py-3">updated_at</th>
                </tr>
              </thead>
              <tbody>
                {comptables.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{c.id}</td>
                    <td className="py-3 pr-4">{c.email}</td>
                    <td className="py-3 pr-4">{c.full_name}</td>
                    <td className="py-3 pr-4">{c.role}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatDate(c.created_at)}</td>
                    <td className="py-3 text-gray-600">{formatDate(c.updated_at)}</td>
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
