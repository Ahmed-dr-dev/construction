"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Note: With Supabase Auth, the token is handled via hash fragments in the URL
  // The session is automatically handled by Supabase when the user clicks the reset link

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // With Supabase Auth, no token needed - the session is handled by Supabase
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          password
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      } else {
        setError(data.error || "Erreur lors de la réinitialisation du mot de passe");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("Erreur lors de la réinitialisation du mot de passe");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-center mb-2">Réinitialiser le mot de passe</h2>
      <p className="text-center text-gray-600 mb-6 text-sm">
        Entrez votre nouveau mot de passe
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
          Votre mot de passe a été réinitialisé avec succès. Redirection vers la page de connexion...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="label">
            Nouveau mot de passe
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
            minLength={6}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
            }}
            className={`input ${errors.confirmPassword ? "border-red-500" : ""}`}
            required
            placeholder="••••••••"
            minLength={6}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="btn btn-primary w-full"
        >
          {loading ? "Réinitialisation..." : success ? "Réinitialisé" : "Réinitialiser le mot de passe"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        <Link href="/signin" className="text-primary-600 hover:underline font-medium">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="card">
        <div className="text-center py-12 text-gray-600">Chargement...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
