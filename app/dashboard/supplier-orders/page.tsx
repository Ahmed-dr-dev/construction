"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Eye, Calendar, Truck, Package, CheckCircle2, XCircle, Clock, FileText, X, Edit2, FileText as InvoiceIcon } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  products: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface OrderItem {
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit?: string;
  product_id?: string;
}

interface SupplierOrder {
  id: string;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  total_amount: number;
  notes?: string;
  supplier?: Supplier;
  items?: OrderItem[];
  creator?: { id: string; full_name: string };
}

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<SupplierOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<SupplierOrder | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [ordersWithInvoices, setOrdersWithInvoices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (orders.length > 0) {
      fetchSupplierInvoices();
    }
  }, [orders.length]);

  const fetchSupplierInvoices = async () => {
    try {
      const res = await fetch("/api/invoices?type=supplier");
      if (res.ok) {
        const data = await res.json();
        const invoiceOrderIds = new Set(
          (data.invoices || []).map((inv: any) => inv.supplier_order_id).filter(Boolean)
        );
        setOrdersWithInvoices(invoiceOrderIds as Set<string>);
      }
    } catch (error) {
      console.error("Error fetching supplier invoices:", error);
    }
  };

  const [formData, setFormData] = useState({
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    status: "pending" as "pending" | "confirmed" | "delivered" | "cancelled",
    notes: "",
    items: [{ product_name: "", description: "", quantity: 1, unit_price: 0, unit: "unité", product_id: "", total_price: 0 }] as Array<{
      product_name: string;
      description: string;
      quantity: number;
      unit_price: number;
      unit: string;
      product_id: string;
      total_price: number;
    }>,
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/supplier-orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
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
    // Supplier validation
    if (!formData.supplier_id) {
      alert("Veuillez sélectionner un fournisseur");
      return false;
    }

    // Order date validation
    if (!formData.order_date) {
      alert("Veuillez sélectionner une date de commande");
      return false;
    }
    const orderDate = new Date(formData.order_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (orderDate > today) {
      alert("La date de commande ne peut pas être dans le futur");
      return false;
    }

    // Expected delivery date validation (optional but if provided, must be after order date)
    if (formData.expected_delivery_date) {
      const deliveryDate = new Date(formData.expected_delivery_date);
      if (deliveryDate < orderDate) {
        alert("La date de livraison prévue doit être après la date de commande");
        return false;
      }
    }

    // Items validation
    const validItems = formData.items.filter(item => item.product_name.trim() !== "");
    if (validItems.length === 0) {
      alert("Veuillez ajouter au moins un article");
      return false;
    }

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      
      if (!item.product_name.trim()) {
        alert(`L'article ${i + 1} : Le nom du produit est requis`);
        return false;
      }
      if (item.product_name.trim().length > 200) {
        alert(`L'article ${i + 1} : Le nom du produit ne peut pas dépasser 200 caractères`);
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

      if (!item.unit_price || item.unit_price <= 0) {
        alert(`L'article ${i + 1} : Le prix unitaire doit être supérieur à 0`);
        return false;
      }

      if (item.unit_price > 1000000) {
        alert(`L'article ${i + 1} : Le prix unitaire ne peut pas dépasser 1,000,000 DT`);
        return false;
      }

      if (!item.unit || item.unit.trim().length === 0) {
        alert(`L'article ${i + 1} : L'unité est requise`);
        return false;
      }

      if (item.description && item.description.trim().length > 500) {
        alert(`L'article ${i + 1} : La description ne peut pas dépasser 500 caractères`);
        return false;
      }
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
      const res = await fetch("/api/supplier-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: formData.supplier_id,
          order_date: formData.order_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          status: formData.status,
          notes: formData.notes || null,
          items: formData.items.filter(item => item.product_name.trim() !== ""),
        }),
      });

      if (res.ok) {
        await fetchOrders();
        setShowModal(false);
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la création de la commande");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Erreur lors de la création de la commande");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      status: "pending",
      notes: "",
      items: [{ product_name: "", description: "", quantity: 1, unit_price: 0, unit: "unité", product_id: "", total_price: 0 }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_name: "", description: "", quantity: 1, unit_price: 0, unit: "unité", product_id: "", total_price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length > 0 ? newItems : [{ product_name: "", description: "", quantity: 1, unit_price: 0, unit: "unité", product_id: "", total_price: 0 }] });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const currentItem: {
      product_name: string;
      description: string;
      quantity: number;
      unit_price: number;
      unit: string;
      product_id: string;
      total_price: number;
    } = { ...newItems[index] };
    
    // Type-safe field update
    if (field === "product_name") {
      currentItem.product_name = value as string;
    } else if (field === "description") {
      currentItem.description = value as string;
    } else if (field === "quantity") {
      currentItem.quantity = value as number;
    } else if (field === "unit_price") {
      currentItem.unit_price = value as number;
    } else if (field === "unit") {
      currentItem.unit = value as string;
    } else if (field === "product_id") {
      currentItem.product_id = value as string;
    }
    
    // If product_id changed and product exists, auto-fill product name and unit
    if (field === "product_id" && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        currentItem.product_name = product.name;
        currentItem.unit = product.unit;
      }
    }
    
    // Calculate total_price
    if (field === "quantity" || field === "unit_price") {
      currentItem.total_price = parseFloat(currentItem.quantity?.toString() || "0") * parseFloat(currentItem.unit_price?.toString() || "0");
    }
    
    newItems[index] = currentItem;
    setFormData({ ...formData, items: newItems });
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/supplier-orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const responseData = await res.json();
        await fetchOrders();
        
        // Refresh invoices list if status changed to delivered
        if (newStatus === "delivered") {
          await fetchSupplierInvoices();
          
          // Show appropriate message based on invoice creation
          if (responseData.invoiceCreated) {
            alert("Commande marquée comme livrée. Le stock des produits a été mis à jour et la facture a été générée automatiquement.");
          } else if (responseData.invoiceError) {
            alert(`Commande marquée comme livrée. Le stock des produits a été mis à jour. Cependant, une erreur s'est produite lors de la génération de la facture: ${responseData.invoiceError}`);
          } else {
            alert("Commande marquée comme livrée. Le stock des produits a été mis à jour.");
          }
        } else {
          alert("Statut de la commande mis à jour.");
        }
        
        // Update viewingOrder if it's the same order
        if (viewingOrder && viewingOrder.id === orderId) {
          const updatedOrder = { ...viewingOrder, status: newStatus as any };
          setViewingOrder(updatedOrder);
        }
        if (editingStatus && editingStatus.id === orderId) {
          setEditingStatus(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const generateSupplierInvoice = async (orderId: string) => {
    setGeneratingInvoice(orderId);
    try {
      // Get order details
      const orderRes = await fetch(`/api/supplier-orders/${orderId}`);
      if (!orderRes.ok) {
        throw new Error("Commande introuvable");
      }
      const orderData = await orderRes.json();
      const order = orderData.order;
      const totalAmount = order.total_amount || order.items?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0) || 0;

      // Generate invoice number
      const lastInvoiceRes = await fetch("/api/invoices?type=supplier");
      const lastInvoiceData = await lastInvoiceRes.json();
      const lastInvoice = lastInvoiceData.invoices?.[0];
      
      let invoiceNumber = 'SINV-000001';
      if (lastInvoice?.invoice_number?.startsWith('SINV-')) {
        const lastNum = parseInt(lastInvoice.invoice_number.split('-')[1]);
        if (!isNaN(lastNum)) {
          invoiceNumber = `SINV-${String(lastNum + 1).padStart(6, '0')}`;
        }
      }

      // Create invoice using the unified invoices API
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          supplier_order_id: orderId,
          invoice_number: invoiceNumber
        }),
      });

      if (res.ok) {
        await fetchSupplierInvoices();
        alert("Facture fournisseur générée avec succès!");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la génération de la facture");
      }
    } catch (error) {
      console.error("Error generating supplier invoice:", error);
      alert("Erreur lors de la génération de la facture");
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock, label: "En attente" },
      confirmed: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircle2, label: "Confirmé" },
      delivered: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2, label: "Livré" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Annulé" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`px-3 py-1 ${config.bg} ${config.text} text-xs font-medium rounded-full flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes Fournisseurs</h1>
          <p className="text-gray-600 mt-1">{orders.length} commandes au total</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Commande</span>
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une commande..."
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">N° Commande</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Fournisseur</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant Total</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const total = order.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || order.total_amount;
                return (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{order.order_number}</td>
                    <td className="py-3 px-4 text-gray-600">{order.supplier?.name || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(order.order_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          disabled={updatingStatus === order.id}
                          className={`text-xs px-2 py-1 rounded border ${
                            order.status === "delivered" 
                              ? "bg-green-50 border-green-300 text-green-700"
                              : order.status === "confirmed"
                              ? "bg-blue-50 border-blue-300 text-blue-700"
                              : order.status === "cancelled"
                              ? "bg-red-50 border-red-300 text-red-700"
                              : "bg-yellow-50 border-yellow-300 text-yellow-700"
                          } font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmé</option>
                          <option value="delivered">Livré</option>
                          <option value="cancelled">Annulé</option>
                        </select>
                        {updatingStatus === order.id && (
                          <span className="text-xs text-gray-500">Mise à jour...</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouvelle Commande Fournisseur</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Fournisseur *</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date de commande *</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Date de livraison prévue</label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Statut *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input"
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="delivered">Livré</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Articles</label>
                <div className="space-y-4 border rounded-lg p-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-700">Article {index + 1}</span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Produit (référence)</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(index, "product_id", e.target.value)}
                            className="input text-sm"
                          >
                            <option value="">Sélectionner un produit</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-600 mb-1 block">Nom du produit *</label>
                          <input
                            type="text"
                            value={item.product_name}
                            onChange={(e) => updateItem(index, "product_name", e.target.value)}
                            className="input text-sm"
                            placeholder="Description du produit"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          className="input text-sm"
                          placeholder="Détails additionnels"
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Quantité *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                            className="input text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Unité</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(index, "unit", e.target.value)}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Prix unitaire (DT) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            className="input text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Total</label>
                          <input
                            type="text"
                            value={item.total_price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            className="input text-sm bg-gray-50"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full btn btn-secondary text-sm"
                  >
                    + Ajouter un article
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-600">Total: </span>
                  <span className="font-bold text-lg">
                    {formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Remarques, conditions spéciales..."
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Création..." : "Créer la commande"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
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

      {/* View Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Détails de la commande</h2>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">N° Commande</p>
                  <p className="font-medium">{viewingOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Statut</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={viewingOrder.status}
                      onChange={(e) => {
                        const updatedOrder = { ...viewingOrder, status: e.target.value as any };
                        setViewingOrder(updatedOrder);
                        updateOrderStatus(viewingOrder.id, e.target.value);
                      }}
                      disabled={updatingStatus === viewingOrder.id}
                      className={`input text-sm font-medium ${
                        viewingOrder.status === "delivered" 
                          ? "bg-green-50 border-green-300 text-green-700"
                          : viewingOrder.status === "confirmed"
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : viewingOrder.status === "cancelled"
                          ? "bg-red-50 border-red-300 text-red-700"
                          : "bg-yellow-50 border-yellow-300 text-yellow-700"
                      } disabled:opacity-50`}
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="delivered">Livré</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                    {updatingStatus === viewingOrder.id && (
                      <span className="text-xs text-gray-500">Mise à jour...</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fournisseur</p>
                  <p className="font-medium">{viewingOrder.supplier?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de commande</p>
                  <p className="font-medium">{new Date(viewingOrder.order_date).toLocaleDateString("fr-FR")}</p>
                </div>
                {viewingOrder.expected_delivery_date && (
                  <div>
                    <p className="text-sm text-gray-600">Date de livraison prévue</p>
                    <p className="font-medium">{new Date(viewingOrder.expected_delivery_date).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Montant total</p>
                  <p className="font-bold text-lg">
                    {(viewingOrder.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || viewingOrder.total_amount).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                  </p>
                </div>
              </div>
              
              {viewingOrder.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-sm">{viewingOrder.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Articles</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Produit</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-700">Qté</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-700">Prix unit.</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingOrder.items?.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">{item.quantity} {item.unit || ""}</td>
                          <td className="py-2 px-3 text-right">{item.unit_price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT</td>
                          <td className="py-2 px-3 text-right font-medium">{item.total_price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6 pt-4 border-t">
                {ordersWithInvoices.has(viewingOrder.id) ? (
                  <button
                    onClick={() => window.location.href = "/dashboard/invoices?tab=supplier"}
                    className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <InvoiceIcon className="w-4 h-4" />
                    <span>Voir la facture</span>
                  </button>
                ) : (
                  <button
                    onClick={() => generateSupplierInvoice(viewingOrder.id)}
                    disabled={generatingInvoice === viewingOrder.id || viewingOrder.status !== "delivered"}
                    className="btn btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={viewingOrder.status !== "delivered" ? "La commande doit être livrée pour générer une facture" : ""}
                  >
                    <InvoiceIcon className="w-4 h-4" />
                    <span>{generatingInvoice === viewingOrder.id ? "Génération..." : "Générer une facture"}</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingOrder(null)}
                  className="btn btn-secondary flex-1"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
