"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, MapPin } from "lucide-react";

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalPurchases: number;
  unpaidAmount: number;
}

export default function ClientsPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: "Mohamed Alami",
      phone: "0612345678",
      email: "m.alami@email.com",
      address: "Casablanca, Maroc",
      totalPurchases: 15400,
      unpaidAmount: 0,
    },
    {
      id: 2,
      name: "Fatima Zahra",
      phone: "0623456789",
      email: "f.zahra@email.com",
      address: "Rabat, Maroc",
      totalPurchases: 28900,
      unpaidAmount: 0,
    },
    {
      id: 3,
      name: "Ahmed Benani",
      phone: "0634567890",
      email: "a.benani@email.com",
      address: "Marrakech, Maroc",
      totalPurchases: 12300,
      unpaidAmount: 1200,
    },
    {
      id: 4,
      name: "Karim Tazi",
      phone: "0645678901",
      email: "k.tazi@email.com",
      address: "Fès, Maroc",
      totalPurchases: 45600,
      unpaidAmount: 3400,
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      setClients(
        clients.map((c) =>
          c.id === editingClient.id ? { ...c, ...formData } : c
        )
      );
    } else {
      const newClient: Client = {
        id: clients.length + 1,
        ...formData,
        totalPurchases: 0,
        unpaidAmount: 0,
      };
      setClients([...clients, newClient]);
    }
    setShowModal(false);
    setEditingClient(null);
    setFormData({ name: "", phone: "", email: "", address: "" });
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

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client?")) {
      setClients(clients.filter((c) => c.id !== id));
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClients = clients.length;
  const totalUnpaid = clients.reduce((sum, c) => sum + c.unpaidAmount, 0);
  const clientsWithDebt = clients.filter((c) => c.unpaidAmount > 0).length;

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
          <p className="text-3xl font-bold text-red-900">{totalUnpaid.toLocaleString()} DH</p>
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
                    <p className="text-sm text-gray-600">ID: #{client.id}</p>
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
                  {client.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {client.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {client.address}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Total achats</p>
                  <p className="font-bold text-gray-900">
                    {client.totalPurchases.toLocaleString()} DH
                  </p>
                </div>
                <div>
                  {client.unpaidAmount > 0 ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Dette: {client.unpaidAmount.toLocaleString()} DH
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
                <button type="submit" className="btn btn-primary flex-1">
                  {editingClient ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClient(null);
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

