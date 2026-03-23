"use client";

import { useState, useEffect } from "react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, MapPin } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  total_purchases: number;
  unpaid_amount: number;
}

export default function ClientsPage() {
  const { isAuthorized } = useRoleGuard(["admin", "responsable", "personnel"]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Le nom ne peut pas dépasser 100 caractères";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Le téléphone est requis";
    } else {
      const phoneClean = formData.phone.replace(/\s/g, "");
      if (!/^[\+]?[0-9]{8,15}$/.test(phoneClean)) {
        newErrors.phone = "Numéro de téléphone invalide (8-15 chiffres)";
      }
    }

    // Email validation (optional but if provided, must be valid)
    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Format d'email invalide";
      } else if (formData.email.length > 255) {
        newErrors.email = "L'email ne peut pas dépasser 255 caractères";
      }
    }

    // Address validation (optional but if provided, check length)
    if (formData.address && formData.address.trim().length > 500) {
      newErrors.address = "L'adresse ne peut pas dépasser 500 caractères";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      // Show first error
      const firstError = Object.values(validationErrors)[0];
      alert(firstError);
      return;
    }

    setSubmitting(true);
    try {
      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchClients();
          setShowModal(false);
          setEditingClient(null);
          setFormData({ name: "", phone: "", email: "", address: "" });
        } else {
          const data = await res.json();
          alert(data.error || "Erreur lors de la mise à jour du client");
        }
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchClients();
          setShowModal(false);
          setFormData({ name: "", phone: "", email: "", address: "" });
        } else {
          const data = await res.json();
          alert(data.error || "Erreur lors de l'ajout du client");
        }
      }
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Erreur lors de la sauvegarde du client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client?")) {
      try {
        const res = await fetch(`/api/clients/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchClients();
        } else {
          const data = await res.json();
          alert(data.error || "Erreur lors de la suppression du client");
        }
      } catch (error) {
        console.error("Error deleting client:", error);
        alert("Erreur lors de la suppression du client");
      }
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClients = clients.length;
  const totalUnpaid = clients.reduce((sum, c) => sum + (c.unpaid_amount || 0), 0);
  const clientsWithDebt = clients.filter((c) => (c.unpaid_amount || 0) > 0).length;

  if (!isAuthorized) return null;
  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-1">{totalClients} clients enregistrés</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: "", phone: "", email: "", address: "" });
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Total clients</p>
          <p className="text-3xl font-bold text-blue-900">{totalClients}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <p className="text-sm text-orange-700 mb-1">Clients avec dette</p>
          <p className="text-3xl font-bold text-orange-900">{clientsWithDebt}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-sm text-red-700 mb-1">Total impayés</p>
          <p className="text-3xl font-bold text-red-900">{totalUnpaid.toLocaleString()} DT</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-3 rounded-full">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-600">ID: {client.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {client.phone || "N/A"}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {client.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {client.address || "N/A"}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Total achats</p>
                  <p className="font-bold text-gray-900">
                    {(client.total_purchases || 0).toLocaleString()} DT
                  </p>
                </div>
                <div>
                  {(client.unpaid_amount || 0) > 0 ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Dette: {(client.unpaid_amount || 0).toLocaleString()} DT
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      À jour
                    </span>
                  )}
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
              {editingClient ? "Modifier le client" : "Nouveau client"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nom complet</label>
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
                <label className="label">Adresse</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  rows={3}
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Enregistrement..." : editingClient ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClient(null);
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



