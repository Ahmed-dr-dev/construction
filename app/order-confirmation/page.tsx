"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package2, CheckCircle2, ArrowRight, Home, Search, Copy, Check } from "lucide-react";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const invoiceNumber = searchParams.get("invoiceNumber");
  const [copied, setCopied] = useState(false);

  if (!orderId || !invoiceNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Informations de commande manquantes</p>
          <Link href="/catalog" className="text-primary-600 hover:text-primary-700">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Package2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Gestion Construction</span>
            </Link>
            <Link href="/signin" className="text-gray-600 hover:text-gray-900">
              Se connecter
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Commande confirmée !
            </h1>
            <p className="text-gray-600">
              Merci pour votre commande. Nous avons bien reçu votre demande.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Numéro de commande</p>
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <code className="text-lg font-mono font-bold text-gray-900">{orderId.slice(0, 8)}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(orderId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copier le numéro de commande"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Numéro de facture</p>
                <p className="text-lg font-medium text-gray-900">{invoiceNumber}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Prochaines étapes:</strong> Notre équipe va examiner votre commande et vous contactera dans les plus brefs délais pour confirmer les détails de livraison et le paiement.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/track-order?orderId=${orderId}`}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Suivre ma commande</span>
            </Link>
            <Link
              href="/catalog"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <span>Continuer les achats</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
