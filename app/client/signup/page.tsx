"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientAuth } from "@/lib/hooks/useClientAuth";

export default function ClientSignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+216");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { signUp, client, loading: authLoading } = useClientAuth();

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const localDigits = digits.startsWith("216") ? digits.slice(3) : digits;
    return `+216${localDigits.slice(0, 8)}`;
  };

  useEffect(() => {
    if (!authLoading && client) {
      router.push("/client/dashboard");
    }
  }, [client, authLoading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = "Le prénom doit contenir au moins 2 caractères";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = "Le nom doit contenir au moins 2 caractères";
    }

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!phone.trim()) {
      newErrors.phone = "Le téléphone est requis";
    } else if (!/^\+216\d{8}$/.test(phone)) {
      newErrors.phone = "Le téléphone doit être au format +216XXXXXXXX";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await signUp(
      firstName.trim(),
      lastName.trim(),
      email.trim(),
      phone.trim(),
      password
    );

    if (result.success) {
      router.push("/client/dashboard");
    } else {
      setError(result.error || "Erreur lors de la création du compte");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-sm rounded-lg p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6">Créer un compte client</h1>
        <p className="text-center text-gray-600 mb-6">
          Créez un compte pour suivre vos commandes et gérer vos informations.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) setErrors({ ...errors, firstName: "" });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Votre prénom"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) setErrors({ ...errors, lastName: "" });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Votre nom"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="votre@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhoneInput(e.target.value));
                if (errors.phone) setErrors({ ...errors, phone: "" });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="+21612345678"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création du compte..." : "Créer un compte"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          <span>Déjà un compte ? </span>
          <Link href="/client/signin" className="text-primary-600 hover:underline font-medium">
            Se connecter
          </Link>
        </div>

        <div className="text-center mt-4 text-xs text-gray-500">
          <Link href="/catalog" className="hover:underline">
            Retour au catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}

