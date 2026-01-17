"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  unit: string;
}

const PRODUCT_CATEGORIES = [
  "Ciment",
  "Sable",
  "Gravier",
  "Briques",
  "Tuiles",
  "Bois",
  "Acier/Métaux",
  "Peinture",
  "Plomberie",
  "Électricité",
  "Isolation",
  "Carrelage",
  "Portes et Fenêtres",
  "Autres"
];

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    min_stock: "",
    unit: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    min_stock: "",
    unit: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      category: "",
      price: "",
      stock: "",
      min_stock: "",
      unit: "",
    };

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du produit est requis";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = "La catégorie est requise";
    } else if (formData.category.trim().length < 2) {
      newErrors.category = "La catégorie doit contenir au moins 2 caractères";
    }

    // Price validation
    if (!formData.price) {
      newErrors.price = "Le prix est requis";
    } else {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        newErrors.price = "Le prix doit être un nombre positif";
      }
    }

    // Stock validation
    if (!formData.stock) {
      newErrors.stock = "Le stock est requis";
    } else {
      const stockValue = parseInt(formData.stock);
      if (isNaN(stockValue) || stockValue < 0) {
        newErrors.stock = "Le stock doit être un nombre entier positif ou zéro";
      }
    }

    // Min stock validation
    if (!formData.min_stock) {
      newErrors.min_stock = "Le stock minimum est requis";
    } else {
      const minStockValue = parseInt(formData.min_stock);
      const stockValue = parseInt(formData.stock);
      if (isNaN(minStockValue) || minStockValue < 0) {
        newErrors.min_stock = "Le stock minimum doit être un nombre entier positif ou zéro";
      } else if (!isNaN(stockValue) && minStockValue > stockValue) {
        newErrors.min_stock = "Le stock minimum ne peut pas être supérieur au stock actuel";
      }
    }

    // Unit validation
    if (!formData.unit.trim()) {
      newErrors.unit = "L'unité est requise";
    } else if (formData.unit.trim().length < 1) {
      newErrors.unit = "L'unité doit contenir au moins 1 caractère";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchProducts();
          setShowModal(false);
          setEditingProduct(null);
          setFormData({ name: "", category: "", price: "", stock: "", min_stock: "", unit: "" });
          setErrors({ name: "", category: "", price: "", stock: "", min_stock: "", unit: "" });
        } else {
          const data = await res.json();
          alert(data.error || "Erreur lors de la mise à jour du produit");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchProducts();
          setShowModal(false);
          setFormData({ name: "", category: "", price: "", stock: "", min_stock: "", unit: "" });
          setErrors({ name: "", category: "", price: "", stock: "", min_stock: "", unit: "" });
        } else {
          const data = await res.json();
          alert(data.error || "Erreur lors de l'ajout du produit");
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erreur lors de la sauvegarde du produit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      min_stock: product.min_stock.toString(),
      unit: product.unit,
    });
    setErrors({ name: "", category: "", price: "", stock: "", min_stock: "", unit: "" });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchProducts();
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

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
            setFormData({ name: "", category: "", price: "", stock: "", min_stock: "", unit: "" });
            setErrors({ name: "", category: "", price: "", stock: "", min_stock: "", unit: "" });
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
                    {product.price} DT/{product.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {product.stock} {product.unit}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {product.stock <= product.min_stock ? (
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
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) {
                      setErrors({ ...errors, name: "" });
                    }
                  }}
                  className={`input ${errors.name ? "border-red-500" : ""}`}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="label">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value });
                    if (errors.category) {
                      setErrors({ ...errors, category: "" });
                    }
                  }}
                  className={`input ${errors.category ? "border-red-500" : ""}`}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prix (DT)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      if (errors.price) {
                        setErrors({ ...errors, price: "" });
                      }
                    }}
                    className={`input ${errors.price ? "border-red-500" : ""}`}
                    required
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                  )}
                </div>
                <div>
                  <label className="label">Unité</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => {
                      setFormData({ ...formData, unit: e.target.value });
                      if (errors.unit) {
                        setErrors({ ...errors, unit: "" });
                      }
                    }}
                    className={`input ${errors.unit ? "border-red-500" : ""}`}
                    placeholder="sac, m³..."
                    required
                  />
                  {errors.unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stock actuel</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: e.target.value });
                      if (errors.stock) {
                        setErrors({ ...errors, stock: "" });
                      }
                      // Re-validate min_stock if it's set
                      if (formData.min_stock && parseInt(e.target.value) < parseInt(formData.min_stock)) {
                        setErrors({ ...errors, min_stock: "Le stock minimum ne peut pas être supérieur au stock actuel" });
                      } else if (errors.min_stock && !isNaN(parseInt(e.target.value)) && parseInt(e.target.value) >= parseInt(formData.min_stock)) {
                        setErrors({ ...errors, min_stock: "" });
                      }
                    }}
                    className={`input ${errors.stock ? "border-red-500" : ""}`}
                    required
                  />
                  {errors.stock && (
                    <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                  )}
                </div>
                <div>
                  <label className="label">Stock minimum</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.min_stock}
                    onChange={(e) => {
                      setFormData({ ...formData, min_stock: e.target.value });
                      if (errors.min_stock) {
                        setErrors({ ...errors, min_stock: "" });
                      }
                      // Validate against stock
                      const stockValue = parseInt(formData.stock);
                      const minStockValue = parseInt(e.target.value);
                      if (!isNaN(stockValue) && !isNaN(minStockValue) && minStockValue > stockValue) {
                        setErrors({ ...errors, min_stock: "Le stock minimum ne peut pas être supérieur au stock actuel" });
                      }
                    }}
                    className={`input ${errors.min_stock ? "border-red-500" : ""}`}
                    required
                  />
                  {errors.min_stock && (
                    <p className="text-red-500 text-sm mt-1">{errors.min_stock}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Enregistrement..." : editingProduct ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    setErrors({ name: "", category: "", price: "", stock: "", min_stock: "", unit: "" });
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



