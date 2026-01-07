"use client";

import { useState } from "react";
import { Plus, Search, Eye, Calendar } from "lucide-react";

interface Sale {
  id: number;
  client: string;
  date: string;
  amount: number;
  status: "Payé" | "Non payé";
  items: { product: string; quantity: number; price: number }[];
}

export default function SalesPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const [sales, setSales] = useState<Sale[]>([
    {
      id: 1,
      client: "Mohamed Alami",
      date: "29/12/2025",
      amount: 2450,
      status: "Payé",
      items: [
        { product: "Ciment 50kg", quantity: 10, price: 65 },
        { product: "Sable fin", quantity: 6, price: 300 },
      ],
    },
    {
      id: 2,
      client: "Fatima Zahra",
      date: "29/12/2025",
      amount: 5780,
      status: "Payé",
      items: [
        { product: "Briques rouges", quantity: 2000, price: 2.5 },
        { product: "Ciment 50kg", quantity: 8, price: 65 },
      ],
    },
    {
      id: 3,
      client: "Ahmed Benani",
      date: "28/12/2025",
      amount: 1200,
      status: "Non payé",
      items: [
        { product: "Fer à béton 8mm", quantity: 20, price: 45 },
        { product: "Ciment 50kg", quantity: 5, price: 65 },
      ],
    },
  ]);

  const [formData, setFormData] = useState({
    client: "",
    date: new Date().toISOString().split("T")[0],
    status: "Payé" as "Payé" | "Non payé",
    items: [{ product: "", quantity: 1, price: 0 }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const newSale: Sale = {
      id: sales.length + 1,
      client: formData.client,
      date: new Date(formData.date).toLocaleDateString("fr-FR"),
      amount: total,
      status: formData.status,
      items: formData.items,
    };
    setSales([newSale, ...sales]);
    setShowModal(false);
    setFormData({
      client: "",
      date: new Date().toISOString().split("T")[0],
      status: "Payé",
      items: [{ product: "", quantity: 1, price: 0 }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: "", quantity: 1, price: 0 }],
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

  const filteredSales = sales.filter(
    (sale) =>
      sale.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.date.includes(searchTerm)
  );

  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const paidSales = sales.filter((s) => s.status === "Payé").length;
  const unpaidSales = sales.filter((s) => s.status === "Non payé").length;

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
          <p className="text-3xl font-bold text-green-900">{totalSales.toLocaleString()} DH</p>
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
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">#{sale.id}</td>
                  <td className="py-3 px-4 text-gray-900">{sale.client}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{sale.date}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    {sale.amount.toLocaleString()} DH
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        sale.status === "Payé"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setViewingSale(sale)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="input"
                    required
                  />
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
                      <input
                        type="text"
                        placeholder="Produit"
                        value={item.product}
                        onChange={(e) => updateItem(index, "product", e.target.value)}
                        className="input flex-1"
                        required
                      />
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
                    DH
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn btn-primary flex-1">
                    Enregistrer la vente
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
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
            <h2 className="text-xl font-bold mb-4">Détails de la vente #{viewingSale.id}</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{viewingSale.client}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{viewingSale.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    viewingSale.status === "Payé"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {viewingSale.status}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold mb-2">Articles:</h3>
                <div className="space-y-2">
                  {viewingSale.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {(item.quantity * item.price).toLocaleString()} DH
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-lg">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {viewingSale.amount.toLocaleString()} DH
                </span>
              </div>
            </div>
            <button
              onClick={() => setViewingSale(null)}
              className="btn btn-secondary w-full mt-6"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



