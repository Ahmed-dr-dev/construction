"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Package } from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
}

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Mock data
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "Ciment 50kg", category: "Ciment", price: 65, stock: 150, minStock: 50, unit: "sac" },
    { id: 2, name: "Briques rouges", category: "Briques", price: 2.5, stock: 5000, minStock: 1000, unit: "unité" },
    { id: 3, name: "Sable fin", category: "Sable", price: 300, stock: 25, minStock: 10, unit: "m³" },
    { id: 4, name: "Gravier", category: "Gravier", price: 350, stock: 18, minStock: 10, unit: "m³" },
    { id: 5, name: "Fer à béton 8mm", category: "Fer", price: 45, stock: 200, minStock: 50, unit: "barre" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    minStock: "",
    unit: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...editingProduct, ...formData, price: Number(formData.price), stock: Number(formData.stock), minStock: Number(formData.minStock) }
          : p
      ));
    } else {
      const newProduct: Product = {
        id: products.length + 1,
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        unit: formData.unit,
      };
      setProducts([...products, newProduct]);
    }
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: "", category: "", price: "", stock: "", minStock: "", unit: "" });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      unit: product.unit,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-600 mt-1">{products.length} produits au total</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: "", category: "", price: "", stock: "", minStock: "", unit: "" });
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Produit</span>
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Produit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Prix</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Stock</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <Package className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{product.category}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {product.price} DH/{product.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {product.stock} {product.unit}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {product.stock <= product.minStock ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        Stock bas
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        En stock
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nom du produit</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Catégorie</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prix (DH)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Unité</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input"
                    placeholder="sac, m³..."
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stock actuel</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Stock minimum</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingProduct ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
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


