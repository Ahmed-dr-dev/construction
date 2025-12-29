"use client";

import { useState } from "react";
import { Search, Download, FileText, Calendar } from "lucide-react";
import jsPDF from "jspdf";

interface Invoice {
  id: number;
  client: string;
  date: string;
  amount: number;
  status: "Payé" | "Non payé";
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [invoices] = useState<Invoice[]>([
    { id: 1, client: "Mohamed Alami", date: "29/12/2025", amount: 2450, status: "Payé" },
    { id: 2, client: "Fatima Zahra", date: "29/12/2025", amount: 5780, status: "Payé" },
    { id: 3, client: "Ahmed Benani", date: "28/12/2025", amount: 1200, status: "Non payé" },
    { id: 4, client: "Karim Tazi", date: "27/12/2025", amount: 3400, status: "Payé" },
  ]);

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("FACTURE", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Facture N°: ${invoice.id}`, 20, 40);
    doc.text(`Date: ${invoice.date}`, 20, 50);
    doc.text(`Client: ${invoice.client}`, 20, 60);
    doc.text(`Montant: ${invoice.amount.toLocaleString()} DH`, 20, 70);
    doc.text(`Statut: ${invoice.status}`, 20, 80);
    
    doc.save(`facture-${invoice.id}.pdf`);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
        <p className="text-gray-600 mt-1">{invoices.length} factures générées</p>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une facture..."
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">N° Facture</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-primary-600" />
                      <span className="font-medium text-gray-900">#{invoice.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{invoice.client}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{invoice.date}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    {invoice.amount.toLocaleString()} DH
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        invoice.status === "Payé"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => generatePDF(invoice)}
                        className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Télécharger</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


