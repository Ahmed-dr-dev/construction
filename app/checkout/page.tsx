"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package2, ArrowLeft, CheckCircle2, X, Copy, Check } from "lucide-react";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    notes: "",
  });

  useEffect(() => {
    loadCartFromStorage();
  }, []);

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

    // Name validation
    if (!formData.client_name.trim()) {
      newErrors.client_name = "Le nom est requis";
    } else if (formData.client_name.trim().length < 2) {
      newErrors.client_name = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.client_name.trim().length > 100) {
      newErrors.client_name = "Le nom ne peut pas dépasser 100 caractères";
    }

    // Email validation
    if (!formData.client_email.trim()) {
      newErrors.client_email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = "Format d'email invalide";
    } else if (formData.client_email.length > 255) {
      newErrors.client_email = "L'email ne peut pas dépasser 255 caractères";
    }

    // Phone validation
    if (!formData.client_phone.trim()) {
      newErrors.client_phone = "Le téléphone est requis";
    } else {
      const phoneClean = formData.client_phone.replace(/\s/g, "");
      if (!/^[\+]?[0-9]{8,15}$/.test(phoneClean)) {
        newErrors.client_phone = "Numéro de téléphone invalide (8-15 chiffres)";
      }
    }

    // Address validation (optional but if provided, check length)
    if (formData.client_address && formData.client_address.trim().length > 500) {
      newErrors.client_address = "L'adresse ne peut pas dépasser 500 caractères";
    }

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
          client_name: formData.client_name.trim(),
          client_email: formData.client_email.trim(),
          client_phone: formData.client_phone.trim(),
          client_address: formData.client_address.trim() || null,
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
              <Link href="/track-order" className="text-gray-600 hover:text-gray-900">
                Suivre ma commande
              </Link>
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
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => updateField("client_name", e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.client_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Votre nom complet"
                  />
                  {errors.client_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => updateField("client_email", e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.client_email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="votre@email.com"
                  />
                  {errors.client_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => updateField("client_phone", e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.client_phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="+212 6XX XXX XXX"
                  />
                  {errors.client_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse de livraison
                  </label>
                  <textarea
                    value={formData.client_address}
                    onChange={(e) => updateField("client_address", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Votre adresse complète"
                  />
                </div>

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
                <strong>Important :</strong> Gardez ce numéro de commande pour suivre votre commande. Vous pouvez utiliser ce numéro ou votre email pour consulter l'état de votre commande.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/track-order?orderId=${orderData.order.id}`}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-center"
                onClick={() => setShowOrderSuccessModal(false)}
              >
                Suivre ma commande maintenant
              </Link>
              <button
                onClick={() => {
                  setShowOrderSuccessModal(false);
                  router.push(`/order-confirmation?orderId=${orderData.order.id}&invoiceNumber=${orderData.invoice_number}`);
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Voir la confirmation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
