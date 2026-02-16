"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useClientAuth } from "@/lib/hooks/useClientAuth";

export default function SignIn() {
  const [activeSpace, setActiveSpace] = useState<"staff" | "client">("staff");

  // Staff form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Client form state
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const {
    signIn: clientSignIn,
    client,
    loading: clientAuthLoading,
  } = useClientAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!clientAuthLoading && client) {
      router.push("/client/dashboard");
    }
  }, [client, clientAuthLoading, router]);

  const validateStaffForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateClientForm = () => {
    const newErrors: Record<string, string> = {};

    if (!clientEmail.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!clientPassword) {
      newErrors.password = "Le mot de passe est requis";
    }

    setClientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStaffSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateStaffForm()) {
      return;
    }

    setLoading(true);

    const result = await signIn(email.trim(), password);
    
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Erreur lors de la connexion");
      setLoading(false);
    }
  };

  const handleClientSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError("");

    if (!validateClientForm()) {
      return;
    }

    setClientLoading(true);

    const result = await clientSignIn(clientEmail.trim(), clientPassword);

    if (result.success) {
      router.push("/client/dashboard");
    } else {
      setClientError(result.error || "Erreur lors de la connexion");
      setClientLoading(false);
    }
  };

  if (authLoading || clientAuthLoading) {
    return (
      <div className="card">
        <div className="text-center text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-center mb-4">Espace de connexion</h2>

      <div className="flex mb-6 rounded-lg overflow-hidden border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveSpace("staff")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeSpace === "staff"
              ? "bg-primary-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Espace gestion
        </button>
        <button
          type="button"
          onClick={() => setActiveSpace("client")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeSpace === "client"
              ? "bg-primary-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Espace client
        </button>
      </div>

      {activeSpace === "staff" ? (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleStaffSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                className={`input ${errors.email ? "border-red-500" : ""}`}
                required
                placeholder="admin@exemple.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                className={`input ${errors.password ? "border-red-500" : ""}`}
                required
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Connexion..." : "Se connecter (gestion)"}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              <Link
                href="/forgot-password"
                className="text-primary-600 hover:underline font-medium"
              >
                Mot de passe oublié ?
              </Link>
            </p>
          </div>
        </>
      ) : (
        <>
          {clientError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {clientError}
            </div>
          )}

          <form onSubmit={handleClientSignIn} className="space-y-4">
            <div>
              <label htmlFor="client-email" className="label">
                Email
              </label>
              <input
                id="client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  if (clientErrors.email)
                    setClientErrors({ ...clientErrors, email: "" });
                }}
                className={`input ${clientErrors.email ? "border-red-500" : ""}`}
                required
                placeholder="votre@email.com"
              />
              {clientErrors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {clientErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="client-password" className="label">
                Mot de passe
              </label>
              <input
                id="client-password"
                type="password"
                value={clientPassword}
                onChange={(e) => {
                  setClientPassword(e.target.value);
                  if (clientErrors.password)
                    setClientErrors({ ...clientErrors, password: "" });
                }}
                className={`input ${clientErrors.password ? "border-red-500" : ""}`}
                required
                placeholder="••••••••"
              />
              {clientErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {clientErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={clientLoading}
              className="btn btn-primary w-full"
            >
              {clientLoading ? "Connexion..." : "Se connecter (client)"}
            </button>
          </form>

          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{" "}
              <Link
                href="/client/signup"
                className="text-primary-600 hover:underline font-medium"
              >
                Créer un compte client
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Vous pouvez créer un compte client pour suivre vos commandes et gérer
              vos informations.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

