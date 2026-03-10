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
    const primaryColor = [41, 128, 185];
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
    
    // Supplier Information Section
    yPos += 10;
    doc.setFillColor(...lightGray);
    doc.roundedRect(20, yPos - 5, pageWidth - 40, 30, 3, 3, 'F');
    
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

    doc.setFont("helvetica", "bold");
    doc.text("Statut:", pageWidth - 80, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(46, 125, 50);
    doc.text("Validée", pageWidth - 45, yPos);
    doc.setTextColor(...darkGray);

    if (order?.order_date) {
      doc.setFont("helvetica", "bold");
      doc.text("Date commande:", pageWidth - 80, yPos + 14);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(order.order_date).toLocaleDateString("fr-FR"), pageWidth - 45, yPos + 14);
    }
    
    yPos += 40;
    
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
    doc.text("Merci de votre confiance!", pageWidth / 2, pageHeight - 25, { align: "center" });
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

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getClientInvoiceStatus = (invoice: ClientInvoice) => {
    const isPaid = invoice.sale?.status === "paid";

    return {
      label: isPaid ? "Payée" : "En attente",
      className: isPaid
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-orange-100 text-orange-700 border-orange-200",
    };
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
  const clientRevenue = clientInvoices.reduce(
    (sum, invoice) => sum + (invoice.sale?.total_amount || 0),
    0
  );
  const supplierSpend = supplierInvoices.reduce(
    (sum, invoice) => sum + (invoice.supplier_order?.total_amount || 0),
    0
  );
  const paidClientInvoices = clientInvoices.filter(
    (invoice) => invoice.sale?.status === "paid"
  ).length;
  const supplierWithOrders = supplierInvoices.filter(
    (invoice) => invoice.supplier_order?.order_number
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-700 via-primary-600 to-blue-600 px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-100">Centre de facturation</p>
            <h1 className="mt-2 text-3xl font-bold">Factures</h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-100">
              Consultez les factures clients et fournisseurs, recherchez rapidement un document
              et téléchargez une version PDF avec un rendu plus soigné.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-primary-100">Clients</p>
              <p className="mt-1 text-2xl font-bold">{clientInvoices.length}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-primary-100">Payées</p>
              <p className="mt-1 text-2xl font-bold">{paidClientInvoices}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-primary-100">Fournisseurs</p>
              <p className="mt-1 text-2xl font-bold">{supplierInvoices.length}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-primary-100">Documents</p>
              <p className="mt-1 text-2xl font-bold">{clientInvoices.length + supplierInvoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr,0.8fr,0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Montant facturé clients</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(clientRevenue)} DT
              </p>
            </div>
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Basé sur l&apos;ensemble des factures clients émises.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Achats fournisseurs</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(supplierSpend)} DT
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Total des factures fournisseurs enregistrées.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {activeTab === "client" ? "Factures visibles" : "Commandes liées"}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {activeTab === "client" ? currentInvoices.length : supplierWithOrders}
              </p>
            </div>
            <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {activeTab === "client"
              ? "Résultat actuel après application de la recherche."
              : "Factures fournisseurs associées à une commande."}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab("client")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "client"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Factures Clients
            </button>
            <button
              onClick={() => setActiveTab("supplier")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "supplier"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Truck className="w-4 h-4" />
              Factures Fournisseurs
            </button>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={
                activeTab === "client"
                  ? "Rechercher par client, email ou numéro de facture..."
                  : "Rechercher par fournisseur, commande ou facture..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input h-11 rounded-xl pl-10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === "client" ? (
          filteredClientInvoices.map((invoice) => {
            const total = invoice.sale?.total_amount || 0;
            const status = getClientInvoiceStatus(invoice);

            return (
              <div
                key={invoice.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Facture</p>
                        <h2 className="text-lg font-bold text-gray-900">{invoice.invoice_number}</h2>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Client</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {invoice.sale?.client?.name || "N/A"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {invoice.sale?.client?.email || "Email non renseigné"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Date d&apos;émission</p>
                        <p className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(invoice.created_at)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Montant</p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {formatCurrency(total)} DT
                        </p>
                      </div>
                    </div>

                    {invoice.sale?.items && invoice.sale.items.length > 0 && (
                      <div className="mt-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">Articles facturés</p>
                          <p className="text-xs text-gray-500">
                            {invoice.sale.items.length} ligne(s)
                          </p>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {invoice.sale.items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">
                                  {item.product?.name || "Produit"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.quantity} {item.product?.unit || ""} x {formatCurrency(item.price)} DT
                                </p>
                              </div>
                              <p className="shrink-0 font-semibold text-gray-900">
                                {formatCurrency(item.quantity * item.price)} DT
                              </p>
                            </div>
                          ))}
                        </div>
                        {invoice.sale.items.length > 3 && (
                          <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
                            + {invoice.sale.items.length - 3} autre(s) article(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 xl:min-w-[180px] xl:justify-end">
                    <button
                      onClick={() => generateClientInvoicePDF(invoice)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 xl:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          filteredSupplierInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Facture fournisseur</p>
                      <h2 className="text-lg font-bold text-gray-900">{invoice.invoice_number}</h2>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      Fournisseur
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Fournisseur</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {invoice.supplier_order?.supplier?.name || "N/A"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {invoice.supplier_order?.supplier?.email || "Email non renseigné"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Commande liée</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {invoice.supplier_order?.order_number || "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Date d&apos;émission</p>
                      <p className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(invoice.created_at)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Montant</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(invoice.supplier_order?.total_amount || 0)} DT
                      </p>
                    </div>
                  </div>

                  {invoice.supplier_order?.items && invoice.supplier_order.items.length > 0 && (
                    <div className="mt-4 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">Lignes de commande</p>
                        <p className="text-xs text-gray-500">
                          {invoice.supplier_order.items.length} ligne(s)
                        </p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {invoice.supplier_order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">{item.product_name}</p>
                              <p className="text-sm text-gray-500">
                                {item.quantity} {item.unit || ""} x {formatCurrency(item.unit_price)} DT
                              </p>
                            </div>
                            <p className="shrink-0 font-semibold text-gray-900">
                              {formatCurrency(item.total_price)} DT
                            </p>
                          </div>
                        ))}
                      </div>
                      {invoice.supplier_order.items.length > 3 && (
                        <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
                          + {invoice.supplier_order.items.length - 3} autre(s) ligne(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 xl:min-w-[180px] xl:justify-end">
                  <button
                    onClick={() => generateSupplierInvoicePDF(invoice)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-700 xl:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger PDF
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {currentInvoices.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Aucune facture trouvée
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Essayez de modifier votre recherche ou changez d&apos;onglet pour consulter un autre type de facture.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



