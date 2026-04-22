"use client";

import { useEffect, useState } from "react";
import { useClientAuth } from "@/lib/hooks/useClientAuth";
import { Download } from "lucide-react";

export default function ClientFacturesPage() {
  const { client } = useClientAuth();
  const [invoices, setInvoices] = useState<
    {
      id: string;
      invoice_number: string;
      created_at: string;
      sale?: {
        id: string;
        date: string;
        total_amount: number;
        status: string;
        created_at: string;
        items?: {
          id: string;
          quantity: number;
          price: number;
          product?: {
            id: string;
            name: string;
            unit: string;
          };
        }[];
      } | null;
    }[]
  >([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!client) return;
      setInvoicesLoading(true);
      try {
        const res = await fetch("/api/client/invoices");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error("Error fetching client invoices:", error);
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [client]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleDownloadInvoice = async (
    invoice: (typeof invoices)[0]
  ) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Gestion Construction", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text("Facture", 20, y);
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoice_number, 20, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Émise le ${formatDate(invoice.created_at)}`, 20, y);
    y += 6;
    if (invoice.sale) {
      doc.text(`Commande #${invoice.sale.id.slice(0, 8)}`, 20, y);
      y += 10;
    }

    if (client) {
      doc.text("Client", 20, y);
      y += 6;
      doc.text(client.name, 20, y);
      y += 5;
      doc.text(client.email, 20, y);
      if (client.phone) {
        y += 5;
        doc.text(client.phone, 20, y);
      }
      y += 10;
    }

    if (invoice.sale?.items && invoice.sale.items.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Détail", 20, y);
      doc.text("Qté", 90, y);
      doc.text("Prix unit.", 110, y);
      doc.text("Total", 160, y);
      doc.setFont("helvetica", "normal");
      y += 8;

      invoice.sale.items.forEach((item) => {
        const name = (item.product?.name || "Produit").slice(0, 28);
        doc.text(name, 20, y);
        doc.text(String(item.quantity), 90, y);
        doc.text(`${item.price.toFixed(2)} DT`, 110, y);
        doc.text(`${(item.quantity * item.price).toFixed(2)} DT`, 160, y);
        y += 6;
      });
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total: ${(invoice.sale?.total_amount ?? 0).toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} DT`,
        20,
        y
      );
      doc.setFont("helvetica", "normal");
    }

    doc.save(`Facture_${invoice.invoice_number}.pdf`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes factures</h1>
          <p className="text-sm text-gray-500 mt-1">Consultez vos reçus de paiement et les détails associés.</p>
        </div>
      </div>

      {invoicesLoading ? (
        <div className="text-center py-8 text-gray-600">Chargement des factures...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="mb-2 font-medium">Aucune facture trouvée</p>
          <p className="mb-4 text-sm">Les factures apparaîtront ici après la création de commandes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Facture</p>
                  <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                  <p className="text-xs text-gray-500 mt-1">Émise le {formatDate(invoice.created_at)}</p>
                  {invoice.sale && (
                    <p className="text-xs text-gray-500 mt-1">
                      Commande #{invoice.sale.id.slice(0, 8)} •{" "}
                      {formatDate(invoice.sale.created_at || invoice.sale.date)}
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  {invoice.sale && (
                    <>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Montant</p>
                      <p className="text-lg font-bold text-primary-600">
                        {invoice.sale.total_amount?.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        DT
                      </p>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger PDF
                  </button>
                </div>
              </div>
              {invoice.sale?.items && invoice.sale.items.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Détail des articles</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {invoice.sale.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span>
                          {item.product?.name || "Produit"}{" "}
                          <span className="text-xs text-gray-500">
                            ({item.quantity} x{" "}
                            {item.price.toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            DT)
                          </span>
                        </span>
                        <span className="font-medium shrink-0">
                          {(item.quantity * item.price).toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          DT
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
