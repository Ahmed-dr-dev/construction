"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Truck, Phone, Mail, Package } from "lucide-react";

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  products: string[];
  lastDelivery: string;
  totalOrders: number;
}

export default function SuppliersPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 1,
      name: "Cimenterie du Maroc",
      phone: "0522123456",
      email: "contact@ciment.ma",
      products: ["Ciment 50kg", "Ciment blanc"],
      lastDelivery: "25/12/2025",
      totalOrders: 45,
    },
    {
      id: 2,
      name: "Briques & Co",
      phone: "0522234567",
      email: "info@briques.ma",
      products: ["Briques rouges", "Briques creuses"],
      lastDelivery: "28/12/2025",
      totalOrders: 32,
    },
    {
      id: 3,
      name: "Sables du Sud",
      phone: "0522345678",
      email: "contact@sables.ma",
      products: ["Sable fin", "Gravier", "Sable de carrière"],
      lastDelivery: "20/12/2025",
      totalOrders: 28,
    },
    {
      id: 4,
      name: "Métallurgie Atlas",
      phone: "0522456789",
      email: "info@atlas-metal.ma",
      products: ["Fer à béton", "Treillis soudé"],
      lastDelivery: "26/12/2025",
      totalOrders: 38,
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    products: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      setSuppliers(
        suppliers.map((s) =>
          s.id === editingSupplier.id
            ? {
                ...s,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                products: formData.products.split(",").map((p) => p.trim()),
              }
            : s
        )
      );
    } else {
      const newSupplier: Supplier = {
        id: suppliers.length + 1,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        products: formData.products.split(",").map((p) => p.trim()),
        lastDelivery: new Date().toLocaleDateString("fr-FR"),
        totalOrders: 0,
      };
      setSuppliers([...suppliers, newSupplier]);
    }
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({ name: "", phone: "", email: "", products: "" });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      products: supplier.products.join(", "),
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur?")) {
      setSuppliers(suppliers.filter((s) => s.id !== id));
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm) ||
      supplier.products.some((p) =>
        p.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
          <p className="text-gray-600 mt-1">{suppliers.length} fournisseurs actifs</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setFormData({ name: "", phone: "", email: "", products: "" });
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
                    <h3 className="font-bold text-gray-900 text-lg">{supplier.name}</h3>
                    <p className="text-sm text-gray-500">ID: #{supplier.id}</p>
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
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {supplier.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {supplier.email}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 mr-2" />
                  Produits fournis:
                </div>
                <div className="flex flex-wrap gap-2">
                  {supplier.products.map((product, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                <div>
                  <p className="text-gray-500">Dernière livraison</p>
                  <p className="font-medium text-gray-900">{supplier.lastDelivery}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Total commandes</p>
                  <p className="font-bold text-primary-600 text-lg">{supplier.totalOrders}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nom du fournisseur</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Produits fournis (séparés par des virgules)</label>
                <textarea
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Ciment 50kg, Briques rouges, ..."
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingSupplier ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
                  }}
                  className="btn btn-secondary flex-1"
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



