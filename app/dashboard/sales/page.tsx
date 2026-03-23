"use client";

import { useState, useEffect } from "react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { Plus, Search, Eye, Calendar, FileText, Edit2, CheckCircle2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface SaleItem {
  id?: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

interface Sale {
  id: string;
  client_id: string;
  user_id?: string | null;
  date: string;
  total_amount: number;
  status: "paid" | "unpaid";
  client?: Client;
  items?: SaleItem[];
}

export default function SalesPage() {
  const { isAuthorized } = useRoleGuard(["admin", "responsable", "personnel"]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [salesWithInvoices, setSalesWithInvoices] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesWithInvoices();
  }, []);

  const fetchSalesWithInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        const invoiceSaleIds = new Set(
          (data.invoices || []).map((inv: any) => inv.sale?.id).filter(Boolean)
        );
        setSalesWithInvoices(invoiceSaleIds);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const [formData, setFormData] = useState({
    client_id: "",
    date: new Date().toISOString().split("T")[0],
    status: "Payé" as "Payé" | "Non payé",
    items: [{ product_id: "", quantity: 1, price: 0 }],
  });

  useEffect(() => {
    fetchSales();
    fetchClients();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/sales");
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const validateForm = () => {
    // Client validation
    if (!formData.client_id) {
      alert("Veuillez sélectionner un client");
      return false;
    }

    // Date validation
    if (!formData.date) {
      alert("Veuillez sélectionner une date");
      return false;
    }
    const saleDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (saleDate > today) {
      alert("La date de vente ne peut pas être dans le futur");
      return false;
    }

    // Items validation
    if (!formData.items || formData.items.length === 0) {
      alert("Veuillez ajouter au moins un article");
      return false;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      
      if (!item.product_id) {
        alert(`L'article ${i + 1} : Veuillez sélectionner un produit`);
        return false;
      }

      if (!item.quantity || item.quantity <= 0) {
        alert(`L'article ${i + 1} : La quantité doit être supérieure à 0`);
        return false;
      }

      if (!Number.isInteger(item.quantity)) {
        alert(`L'article ${i + 1} : La quantité doit être un nombre entier`);
        return false;
      }

      if (!item.price || item.price <= 0) {
        alert(`L'article ${i + 1} : Le prix doit être supérieur à 0`);
        return false;
      }

      // Check stock availability
      const product = products.find(p => p.id === item.product_id);
      if (product && item.quantity > product.stock) {
        alert(`L'article ${i + 1} : Stock insuffisant. Stock disponible: ${product.stock} ${product.unit}`);
        return false;
      }
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
      const items = formData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: formData.client_id,
          date: formData.date,
          status: formData.status,
          items,
        }),
      });

      if (res.ok) {
        await fetchSales();
        setShowModal(false);
        setFormData({
          client_id: "",
          date: new Date().toISOString().split("T")[0],
          status: "Payé",
          items: [{ product_id: "", quantity: 1, price: 0 }],
        });
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      product_id: productId,
      price: product?.price || 0,
    };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const filteredSales = sales.filter((sale) => {
    const clientName = sale.client?.name?.toLowerCase() || "";
    const dateStr = sale.date || "";
    const search = searchTerm.toLowerCase();
    return clientName.includes(search) || dateStr.includes(search);
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR");
  };

  const formatStatus = (status: string) => {
    return status === "paid" ? "Payé" : "Non payé";
  };

  const generateInvoice = async (saleId: string) => {
    setGeneratingInvoice(saleId);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sale_id: saleId }),
      });

      if (res.ok) {
        await fetchSalesWithInvoices();
        alert("Facture générée avec succès!");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la génération de la facture");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Erreur lors de la génération de la facture");
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const updateSaleStatus = async (saleId: string, newStatus: "paid" | "unpaid") => {
    setUpdatingStatus(saleId);
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchSales();
        // Update viewingSale if it's the same sale
        if (viewingSale && viewingSale.id === saleId) {
          const updatedSale = { ...viewingSale, status: newStatus };
          setViewingSale(updatedSale);
        }
        alert("Statut de la vente mis à jour avec succès!");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Error updating sale status:", error);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const approvePublicOrder = async (saleId: string) => {
    // Approving a public order means marking it as paid
    setUpdatingStatus(saleId);
    try {
      // Update status to paid
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });

      if (res.ok) {
        await fetchSales();
        // Update viewingSale if it's the same sale
        if (viewingSale && viewingSale.id === saleId) {
          const updatedSale = { ...viewingSale, status: "paid" as const };
          setViewingSale(updatedSale);
        }
        alert("Commande approuvée et marquée comme payée!");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'approbation");
      }
    } catch (error) {
      console.error("Error approving order:", error);
      alert("Erreur lors de l'approbation");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const paidSales = sales.filter((s) => s.status === "paid").length;
  const unpaidSales = sales.filter((s) => s.status === "unpaid").length;

  if (!isAuthorized) return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Ventes</h1>
          <p className="text-gray-600 mt-1">{sales.length} ventes enregistrées</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Vente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 mb-1">Total des ventes</p>
          <p className="text-3xl font-bold text-green-900">{totalSales.toLocaleString()} DT</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Ventes payées</p>
          <p className="text-3xl font-bold text-blue-900">{paidSales}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <p className="text-sm text-orange-700 mb-1">Ventes non payées</p>
          <p className="text-3xl font-bold text-orange-900">{unpaidSales}</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par client ou date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Aucune vente enregistrée
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isPublicOrder = !sale.user_id;
                  return (
                    <tr key={sale.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isPublicOrder ? 'bg-blue-50/50' : ''}`}>
                      <td className="py-3 px-4 font-medium text-gray-900">#{sale.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{sale.client?.name || "N/A"}</span>
                          {isPublicOrder && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              En ligne
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(sale.date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {sale.total_amount?.toLocaleString()} DT
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={sale.status}
                          onChange={(e) => updateSaleStatus(sale.id, e.target.value as "paid" | "unpaid")}
                          disabled={updatingStatus === sale.id}
                          className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 ${
                            sale.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="unpaid">Non payé</option>
                          <option value="paid">Payé</option>
                        </select>
                        {updatingStatus === sale.id && (
                          <span className="ml-2 text-xs text-gray-500">Mise à jour...</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPublicOrder ? (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                            Commande visiteurs
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            Vente interne
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingSale(sale)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
            <h2 className="text-xl font-bold mb-4">Nouvelle vente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Client</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Statut de paiement</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "Payé" | "Non payé" })
                  }
                  className="input"
                >
                  <option value="Payé">Payé</option>
                  <option value="Non payé">Non payé</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Articles</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    + Ajouter un article
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="input flex-1"
                        required
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.price} DT (Stock: {product.stock})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        className="input w-20"
                        min="1"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Prix"
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                        className="input w-24"
                        step="0.01"
                        min="0"
                        required
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn btn-danger px-3"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formData.items
                      .reduce((sum, item) => sum + item.quantity * item.price, 0)
                      .toLocaleString()}{" "}
                    DT
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? "Enregistrement..." : "Enregistrer la vente"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Détails de la vente #{viewingSale.id.slice(0, 8)}</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{viewingSale.client?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(viewingSale.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Statut:</span>
                <select
                  value={viewingSale.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as "paid" | "unpaid";
                    updateSaleStatus(viewingSale.id, newStatus);
                  }}
                  disabled={updatingStatus === viewingSale.id}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 ${
                    viewingSale.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="unpaid">Non payé</option>
                  <option value="paid">Payé</option>
                </select>
                {updatingStatus === viewingSale.id && (
                  <span className="text-xs text-gray-500">Mise à jour...</span>
                )}
              </div>
              {!viewingSale.user_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Commande en ligne</p>
                      <p className="text-xs text-blue-700">
                        Cette commande provient du catalogue public. Le client doit venir récupérer sa commande.
                      </p>
                    </div>
                    {viewingSale.status !== "paid" && (
                      <button
                        onClick={() => approvePublicOrder(viewingSale.id)}
                        disabled={updatingStatus === viewingSale.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approuver & Marquer payé</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold mb-2">Articles:</h3>
                <div className="space-y-2">
                  {viewingSale.items && viewingSale.items.length > 0 ? (
                    viewingSale.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product?.name || "N/A"} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          {(item.quantity * item.price).toLocaleString()} DT
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">Aucun article</span>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-lg">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {viewingSale.total_amount?.toLocaleString()} DT
                </span>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              {salesWithInvoices.has(viewingSale.id) ? (
                <button
                  onClick={() => window.location.href = "/dashboard/invoices"}
                  className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Voir la facture</span>
                </button>
              ) : (
                <button
                  onClick={() => generateInvoice(viewingSale.id)}
                  disabled={generatingInvoice === viewingSale.id}
                  className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{generatingInvoice === viewingSale.id ? "Génération..." : "Générer une facture"}</span>
                </button>
              )}
              <button
                onClick={() => setViewingSale(null)}
                className="btn btn-secondary flex-1"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
