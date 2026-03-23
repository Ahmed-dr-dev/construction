"use client";

import { useState, useEffect } from "react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { Plus, Search, Edit2, Trash2, Truck, Phone, Mail, Package, MapPin, User, Building2, CreditCard, Globe, FileText, CheckCircle2, XCircle } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  contact_person?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  registration_number?: string;
  products: string[];
  payment_terms?: string;
  bank_name?: string;
  bank_account?: string;
  website?: string;
  status?: string;
  notes?: string;
  last_delivery: string;
  total_orders: number;
}

export default function SuppliersPage() {
  const { isAuthorized } = useRoleGuard(["admin", "responsable"]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    contact_person: "",
    address: "",
    city: "",
      country: "Tunisie",
    tax_id: "",
    registration_number: "",
    products: "",
    payment_terms: "Net 30",
    bank_name: "",
    bank_account: "",
    website: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      alert("Le nom du fournisseur est requis");
      return false;
    }
    if (formData.name.trim().length < 2) {
      alert("Le nom doit contenir au moins 2 caractères");
      return false;
    }
    if (formData.name.trim().length > 200) {
      alert("Le nom ne peut pas dépasser 200 caractères");
      return false;
    }

    // Phone validation
    if (!formData.phone.trim()) {
      alert("Le téléphone est requis");
      return false;
    }
    const phoneClean = formData.phone.replace(/\s/g, "");
    if (!/^[\+]?[0-9]{8,15}$/.test(phoneClean)) {
      alert("Numéro de téléphone invalide (8-15 chiffres)");
      return false;
    }

    // Email validation (optional but if provided, must be valid)
    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        alert("Format d'email invalide");
        return false;
      }
      if (formData.email.length > 255) {
        alert("L'email ne peut pas dépasser 255 caractères");
        return false;
      }
    }

    // Tax ID validation (optional but if provided, check format)
    if (formData.tax_id && formData.tax_id.trim()) {
      if (formData.tax_id.trim().length > 50) {
        alert("L'identifiant fiscal ne peut pas dépasser 50 caractères");
        return false;
      }
    }

    // Website validation (optional but if provided, must be valid URL)
    if (formData.website && formData.website.trim()) {
      try {
        const url = new URL(formData.website);
        if (!["http:", "https:"].includes(url.protocol)) {
          alert("L'URL du site web doit commencer par http:// ou https://");
          return false;
        }
      } catch {
        alert("Format d'URL invalide pour le site web");
        return false;
      }
    }

    // Address validation (optional but if provided, check length)
    if (formData.address && formData.address.trim().length > 500) {
      alert("L'adresse ne peut pas dépasser 500 caractères");
      return false;
    }

    // Notes validation (optional but if provided, check length)
    if (formData.notes && formData.notes.trim().length > 1000) {
      alert("Les notes ne peuvent pas dépasser 1000 caractères");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const productsArray = formData.products
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const submitData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        contact_person: formData.contact_person || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || "Tunisie",
        tax_id: formData.tax_id || null,
        registration_number: formData.registration_number || null,
        products: productsArray,
        payment_terms: formData.payment_terms || "Net 30",
        bank_name: formData.bank_name || null,
        bank_account: formData.bank_account || null,
        website: formData.website || null,
        status: formData.status || "active",
        notes: formData.notes || null,
      };

      if (editingSupplier) {
        const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
        if (res.ok) {
          await fetchSuppliers();
          setShowModal(false);
          setEditingSupplier(null);
          resetForm();
        } else {
          const data = await res.json();
          alert(data.error || "Erreur lors de la mise à jour du fournisseur");
        }
      } else {
        const res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
        if (res.ok) {
          await fetchSuppliers();
          setShowModal(false);
          resetForm();
        } else {
          const data = await res.json();
          alert(data.error || "Erreur lors de l'ajout du fournisseur");
        }
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("Erreur lors de la sauvegarde du fournisseur");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      contact_person: "",
      address: "",
      city: "",
      country: "Tunisie",
      tax_id: "",
      registration_number: "",
      products: "",
      payment_terms: "Net 30",
      bank_name: "",
      bank_account: "",
      website: "",
      status: "active",
      notes: "",
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      contact_person: supplier.contact_person || "",
      address: supplier.address || "",
      city: supplier.city || "",
      country: supplier.country || "Tunisie",
      tax_id: supplier.tax_id || "",
      registration_number: supplier.registration_number || "",
      products: Array.isArray(supplier.products)
        ? supplier.products.join(", ")
        : supplier.products || "",
      payment_terms: supplier.payment_terms || "Net 30",
      bank_name: supplier.bank_name || "",
      bank_account: supplier.bank_account || "",
      website: supplier.website || "",
      status: supplier.status || "active",
      notes: supplier.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur?")) {
      try {
        const res = await fetch(`/api/suppliers/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchSuppliers();
        } else {
          const data = await res.json();
          alert(data.error || "Erreur lors de la suppression du fournisseur");
        }
      } catch (error) {
        console.error("Error deleting supplier:", error);
        alert("Erreur lors de la suppression du fournisseur");
      }
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.city && supplier.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (Array.isArray(supplier.products) &&
        supplier.products.some((p) =>
          p.toLowerCase().includes(searchTerm.toLowerCase())
        ))
  );

  const activeSuppliers = suppliers.filter(s => s.status === "active" || !s.status);

  if (!isAuthorized) return null;
  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
          <p className="text-gray-600 mt-1">{activeSuppliers.length} fournisseurs actifs sur {suppliers.length} total</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Truck className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-lg">{supplier.name}</h3>
                      {supplier.status === "active" || !supplier.status ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">ID: {supplier.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {supplier.contact_person && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    {supplier.contact_person}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {supplier.phone || "N/A"}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {supplier.email || "N/A"}
                </div>
                {(supplier.address || supplier.city) && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                    <span>
                      {[supplier.address, supplier.city, supplier.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {supplier.payment_terms && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Paiement: {supplier.payment_terms}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 mr-2" />
                  Produits fournis:
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(supplier.products) && supplier.products.length > 0 ? (
                    supplier.products.map((product, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {product}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Aucun produit</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                <div>
                  <p className="text-gray-500">Dernière livraison</p>
                  <p className="font-medium text-gray-900">{formatDate(supplier.last_delivery)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Total commandes</p>
                  <p className="font-bold text-primary-600 text-lg">{supplier.total_orders || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de base */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informations de base
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Nom du fournisseur *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Personne de contact</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="input"
                      placeholder="Nom du responsable"
                    />
                  </div>
                  <div>
                    <label className="label">Statut *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Coordonnées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Téléphone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      placeholder="20123456, 71234567 ou 91234567"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Site web</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="input"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Adresse complète</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input"
                      rows={2}
                      placeholder="Rue, quartier, zone..."
                    />
                  </div>
                  <div>
                    <label className="label">Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input"
                      placeholder="Tunis, Sfax, Sousse..."
                    />
                  </div>
                  <div>
                    <label className="label">Pays</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Informations légales */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations légales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">ID Fiscal / RC</label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="input"
                      placeholder="Ex: RC123456"
                    />
                  </div>
                  <div>
                    <label className="label">Numéro d'enregistrement</label>
                    <input
                      type="text"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      className="input"
                      placeholder="Ex: RC123456 ou RC.B123456"
                    />
                  </div>
                </div>
              </div>

              {/* Informations financières */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informations financières
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Conditions de paiement</label>
                    <select
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                      className="input"
                    >
                      <option value="Net 15">Net 15 jours</option>
                      <option value="Net 30">Net 30 jours</option>
                      <option value="Net 45">Net 45 jours</option>
                      <option value="Net 60">Net 60 jours</option>
                      <option value="À la livraison">À la livraison</option>
                      <option value="Comptant">Comptant</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Banque</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="input"
                      placeholder="Ex: STB, BNA, BIAT, ATTIJARI, AMEN..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Numéro de compte bancaire</label>
                    <input
                      type="text"
                      value={formData.bank_account}
                      onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                      className="input"
                      placeholder="IBAN ou numéro de compte"
                    />
                  </div>
                </div>
              </div>

              {/* Produits */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produits fournis
                </h3>
                <div>
                  <label className="label">Produits (séparés par des virgules) *</label>
                  <textarea
                    value={formData.products}
                    onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Ciment 50kg, Briques rouges, Sable fin..."
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <div>
                  <label className="label">Remarques et informations additionnelles</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Informations complémentaires, historique, accords spéciaux..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Enregistrement..." : editingSupplier ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
                    resetForm();
                  }}
                  className="btn btn-secondary flex-1"
                  disabled={submitting}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



