"use client";

import { useState, useEffect } from "react";
import { Search, Download, FileText, Calendar, Users, Truck } from "lucide-react";
import jsPDF from "jspdf";

interface ClientInvoice {
  id: string;
  invoice_number: string;
  created_at: string;
  sale?: {
    id: string;
    date: string;
    total_amount: number;
    status: "paid" | "unpaid";
    client?: {
      id: string;
      name: string;
      email?: string;
    };
    items?: Array<{
      id: string;
      quantity: number;
      price: number;
      product?: {
        name: string;
        unit: string;
      };
    }>;
  };
}

interface SupplierInvoice {
  id: string;
  invoice_number: string;
  created_at: string;
  supplier_order?: {
    id: string;
    order_number: string;
    order_date: string;
    total_amount: number;
    supplier?: {
      id: string;
      name: string;
      email?: string;
    };
    items?: Array<{
      id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      unit: string;
    }>;
  };
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"client" | "supplier">("client");
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [activeTab]);

  useEffect(() => {
    // Check URL params for tab selection
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "supplier") {
      setActiveTab("supplier");
    }
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      if (activeTab === "client") {
        const res = await fetch("/api/invoices?type=client");
        if (res.ok) {
          const data = await res.json();
          setClientInvoices(data.invoices || []);
        }
      } else {
        const res = await fetch("/api/invoices?type=supplier");
        if (res.ok) {
          const data = await res.json();
          setSupplierInvoices(data.invoices || []);
        }
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateClientInvoicePDF = (invoice: ClientInvoice) => {
    const doc = new jsPDF();
    const sale = invoice.sale;
    const client = sale?.client;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = [41, 128, 185]; // Primary blue
    const lightGray = [245, 245, 245];
    const darkGray = [51, 51, 51];
    
    // Header with colored background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("GESTION CONSTRUCTION", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Magasin de Matériaux de Construction", pageWidth / 2, 30, { align: "center" });
    
    // Reset text color
    doc.setTextColor(...darkGray);
    
    // Invoice Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", pageWidth / 2, 60, { align: "center" });
    
    // Invoice Number and Date Section
    let yPos = 75;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Facture N°:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.invoice_number, 60, yPos);
    
    doc.setFont("helvetica", "bold");
    doc.text("Date:", pageWidth - 80, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(invoice.created_at).toLocaleDateString("fr-FR"), pageWidth - 50, yPos);
    
    yPos += 15;
    
    // Divider line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);
    
    // Client Information Section
    yPos += 10;
    doc.setFillColor(...lightGray);
    doc.roundedRect(20, yPos - 5, pageWidth - 40, 25, 3, 3, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INFORMATIONS CLIENT", 25, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (client) {
      doc.text(`Nom: ${client.name}`, 25, yPos + 8);
      if (client.email) {
        doc.text(`Email: ${client.email}`, 25, yPos + 14);
      }
    }
    
    doc.setFont("helvetica", "bold");
    doc.text("Statut:", pageWidth - 80, yPos);
    doc.setFont("helvetica", "normal");
    const statusText = sale?.status === "paid" ? "Payé" : "Non payé";
    const statusColor = sale?.status === "paid" ? [46, 125, 50] : [255, 152, 0];
    doc.setTextColor(...statusColor);
    doc.text(statusText, pageWidth - 45, yPos);
    doc.setTextColor(...darkGray);
    
    yPos += 35;
    
    // Items Table Header
    doc.setFillColor(...primaryColor);
    doc.roundedRect(20, yPos - 6, pageWidth - 40, 8, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DESIGNATION", 25, yPos);
    doc.text("QTÉ", 120, yPos);
    doc.text("PRIX UNIT.", 145, yPos);
    doc.text("TOTAL", pageWidth - 25, yPos, { align: "right" });
    
    doc.setTextColor(...darkGray);
    yPos += 12;
    
    // Items Table Rows
    if (sale?.items && sale.items.length > 0) {
      sale.items.forEach((item, index) => {
        const itemY = yPos + (index * 10);
        
        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, itemY - 6, pageWidth - 40, 10, 'F');
        }
        
        const productName = item.product?.name || "Produit";
        const quantity = item.quantity;
        const unitPrice = item.price;
        const total = quantity * unitPrice;
        const unit = item.product?.unit || "";
        
        // Truncate long product names
        const maxWidth = 95;
        const nameLines = doc.splitTextToSize(productName, maxWidth);
        doc.setFontSize(9);
        doc.text(nameLines[0], 25, itemY);
        if (nameLines.length > 1) {
          doc.text(nameLines[1], 25, itemY + 5);
        }
        
        doc.text(`${quantity} ${unit}`, 120, itemY);
        doc.text(`${unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`, 145, itemY);
        doc.text(`${total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`, pageWidth - 25, itemY, { align: "right" });
      });
      
      yPos += (sale.items.length * 10) + 5;
    }
    
    // Bottom border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    yPos += 10;
    
    // Total Section
    if (sale) {
      const totalAmount = sale.total_amount;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("MONTANT TOTAL:", pageWidth - 70, yPos);
      doc.setFontSize(14);
      doc.text(`${totalAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`, pageWidth - 25, yPos, { align: "right" });
    }
    
    yPos += 15;
    
    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 35, pageWidth - 20, pageHeight - 35);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text("Merci de votre confiance!", pageWidth / 2, pageHeight - 25, { align: "center" });
    doc.text("Pour toute question, veuillez nous contacter.", pageWidth / 2, pageHeight - 20, { align: "center" });
    doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, pageWidth / 2, pageHeight - 15, { align: "center" });
    
    doc.save(`facture-client-${invoice.invoice_number}.pdf`);
  };

  const generateSupplierInvoicePDF = (invoice: SupplierInvoice) => {
    const doc = new jsPDF();
    const order = invoice.supplier_order;
    const supplier = order?.supplier;
    const totalAmount = order?.total_amount || 0;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = [255, 152, 0]; // Orange for supplier
    const lightGray = [245, 245, 245];
    const darkGray = [51, 51, 51];
    
    // Header with colored background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("GESTION CONSTRUCTION", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Magasin de Matériaux de Construction", pageWidth / 2, 30, { align: "center" });
    
    // Reset text color
    doc.setTextColor(...darkGray);
    
    // Invoice Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE FOURNISSEUR", pageWidth / 2, 60, { align: "center" });
    
    // Invoice Number and Date Section
    let yPos = 75;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Facture N°:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.invoice_number, 60, yPos);
    
    doc.setFont("helvetica", "bold");
    doc.text("Date:", pageWidth - 80, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(invoice.created_at).toLocaleDateString("fr-FR"), pageWidth - 50, yPos);
    
    yPos += 15;
    
    // Divider line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);
    
    // Supplier Information Section
    yPos += 10;
    doc.setFillColor(...lightGray);
    doc.roundedRect(20, yPos - 5, pageWidth - 40, 35, 3, 3, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INFORMATIONS FOURNISSEUR", 25, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (supplier) {
      doc.text(`Nom: ${supplier.name}`, 25, yPos + 8);
      if (supplier.email) {
        doc.text(`Email: ${supplier.email}`, 25, yPos + 14);
      }
    }
    
    if (order) {
      doc.setFont("helvetica", "bold");
      doc.text("Commande N°:", 25, yPos + 22);
      doc.setFont("helvetica", "normal");
      doc.text(order.order_number, 65, yPos + 22);
      
      if (order.order_date) {
        doc.setFont("helvetica", "bold");
        doc.text("Date Commande:", pageWidth - 80, yPos + 8);
        doc.setFont("helvetica", "normal");
        doc.text(new Date(order.order_date).toLocaleDateString("fr-FR"), pageWidth - 45, yPos + 8);
      }
    }
    
    yPos += 45;
    
    // Items Table Header
    doc.setFillColor(...primaryColor);
    doc.roundedRect(20, yPos - 6, pageWidth - 40, 8, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DESIGNATION", 25, yPos);
    doc.text("QTÉ", 130, yPos);
    doc.text("PRIX UNIT.", 160, yPos);
    doc.text("TOTAL", pageWidth - 25, yPos, { align: "right" });
    
    doc.setTextColor(...darkGray);
    yPos += 12;
    
    // Items Table Rows
    if (order?.items && order.items.length > 0) {
      order.items.forEach((item, index) => {
        const itemY = yPos + (index * 10);
        
        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, itemY - 6, pageWidth - 40, 10, 'F');
        }
        
        const productName = item.product_name;
        const quantity = item.quantity;
        const unitPrice = item.unit_price;
        const total = item.total_price;
        const unit = item.unit || "";
        
        // Truncate long product names
        const maxWidth = 100;
        const nameLines = doc.splitTextToSize(productName, maxWidth);
        doc.setFontSize(9);
        doc.text(nameLines[0], 25, itemY);
        if (nameLines.length > 1) {
          doc.text(nameLines[1], 25, itemY + 5);
        }
        
        doc.text(`${quantity} ${unit}`, 130, itemY);
        doc.text(`${unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`, 160, itemY);
        doc.text(`${total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`, pageWidth - 25, itemY, { align: "right" });
      });
      
      yPos += (order.items.length * 10) + 5;
    }
    
    // Bottom border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    yPos += 10;
    
    // Total Section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("MONTANT TOTAL:", pageWidth - 70, yPos);
    doc.setFontSize(14);
    doc.text(`${totalAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`, pageWidth - 25, yPos, { align: "right" });
    
    yPos += 15;
    
    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 35, pageWidth - 20, pageHeight - 35);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text("Document comptable - Facture fournisseur", pageWidth / 2, pageHeight - 25, { align: "center" });
    doc.text("Pour toute question, veuillez nous contacter.", pageWidth / 2, pageHeight - 20, { align: "center" });
    doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, pageWidth / 2, pageHeight - 15, { align: "center" });
    
    doc.save(`facture-fournisseur-${invoice.invoice_number}.pdf`);
  };

  const filteredClientInvoices = clientInvoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.sale?.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.sale?.client?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  const filteredSupplierInvoices = supplierInvoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier_order?.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier_order?.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  const currentInvoices = activeTab === "client" ? filteredClientInvoices : filteredSupplierInvoices;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-600 mt-1">
            {activeTab === "client" 
              ? `${clientInvoices.length} factures clients` 
              : `${supplierInvoices.length} factures fournisseurs`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("client")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "client"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Factures Clients</span>
        </button>
        <button
          onClick={() => setActiveTab("supplier")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "supplier"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Factures Fournisseurs</span>
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={activeTab === "client" ? "Rechercher une facture client..." : "Rechercher une facture fournisseur..."}
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {activeTab === "client" ? "Client" : "Fournisseur"}
                </th>
                {activeTab === "supplier" && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">N° Commande</th>
                )}
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                {activeTab === "supplier" && (
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Payé</th>
                )}
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === "client" ? (
                filteredClientInvoices.map((invoice) => {
                  const total = invoice.sale?.total_amount || 0;
                  return (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-primary-600" />
                          <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{invoice.sale?.client?.name || "N/A"}</td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(invoice.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            invoice.sale?.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {invoice.sale?.status === "paid" ? "Payé" : "Non payé"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => generateClientInvoicePDF(invoice)}
                            className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Télécharger</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                filteredSupplierInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{invoice.supplier_order?.supplier?.name || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600">{invoice.supplier_order?.order_number || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(invoice.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {(invoice.supplier_order?.total_amount || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      -
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        -
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => generateSupplierInvoicePDF(invoice)}
                          className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Télécharger</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {currentInvoices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucune facture {activeTab === "client" ? "client" : "fournisseur"} trouvée
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



