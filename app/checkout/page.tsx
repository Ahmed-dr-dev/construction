"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package2, ArrowLeft, CheckCircle2, X, Copy, Check } from "lucide-react";
import { useClientAuth } from "@/lib/hooks/useClientAuth";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { client, loading: clientLoading } = useClientAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    notes: "",
  });

  useEffect(() => {
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    if (!clientLoading && !client) {
      router.push("/signin");
    }
  }, [client, clientLoading, router]);

  const loadCartFromStorage = () => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("catalog_cart");
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        setCart(cartItems);
        
        // Redirect to catalog if cart is empty
        if (cartItems.length === 0) {
          router.push("/catalog");
        }
      } else {
        router.push("/catalog");
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Notes validation (optional but if provided, check length)
    if (formData.notes && formData.notes.trim().length > 1000) {
      newErrors.notes = "Les notes ne peuvent pas dépasser 1000 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: formData.notes.trim() || null,
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Show success modal with order ID before redirecting
        setShowOrderSuccessModal(true);
        setOrderData(data);
        
        // Clear cart
        localStorage.removeItem("catalog_cart");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la commande. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Erreur lors de la commande. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
            <div className="flex items-center space-x-4">
              <Link href="/signin" className="text-gray-600 hover:text-gray-900">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/catalog"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser votre commande</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informations de livraison</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Instructions spéciales, remarques..."
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || cart.length === 0}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Traitement..." : "Confirmer la commande"}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Résumé de la commande</h2>
              
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-gray-600">
                        {item.quantity} x {item.price.toLocaleString("fr-FR")} DT
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {(item.price * item.quantity).toLocaleString("fr-FR")} DT
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {cartTotal.toLocaleString("fr-FR")} DT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      {showOrderSuccessModal && orderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Commande confirmée !
              </h2>
              <p className="text-gray-600">
                Votre commande a été enregistrée avec succès
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Numéro de commande</p>
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                    <code className="text-sm font-mono text-gray-900">{orderData.order.id.slice(0, 8)}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(orderData.order.id);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copier le numéro de commande"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Numéro de facture</p>
                  <p className="text-lg font-medium text-gray-900">{orderData.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Montant total</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {orderData.order.total_amount?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Important :</strong> Gardez ce numéro de commande pour toute référence future en magasin ou auprès de notre équipe.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowOrderSuccessModal(false);
                  router.push("/client/dashboard");
                }}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Voir mes commandes
              </button>
              <button
                onClick={() => {
                  setShowOrderSuccessModal(false);
                  router.push("/catalog");
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Retour au catalogue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
