import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import StatCard from "@/components/StatCard";

export default function Dashboard() {
  // Mock data - Replace with real data from Supabase
  const stats = {
    totalSales: "125,450",
    totalProducts: "234",
    todaySales: "15,230",
    totalClients: "156",
  };

  const lowStockProducts = [
    { id: 1, name: "Ciment 50kg", stock: 5, minStock: 20 },
    { id: 2, name: "Briques rouges", stock: 50, minStock: 100 },
    { id: 3, name: "Sable fin (m³)", stock: 2, minStock: 10 },
  ];

  const recentSales = [
    { id: 1, client: "Mohamed Alami", amount: "2,450 DH", date: "29/12/2025", status: "Payé" },
    { id: 2, client: "Fatima Zahra", amount: "5,780 DH", date: "29/12/2025", status: "Payé" },
    { id: 3, client: "Ahmed Benani", amount: "1,200 DH", date: "28/12/2025", status: "Non payé" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventes totales"
          value={`${stats.totalSales} DH`}
          icon={DollarSign}
          color="green"
          trend={{ value: "+12.5%", isPositive: true }}
        />
        <StatCard
          title="Produits"
          value={stats.totalProducts}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Ventes aujourd'hui"
          value={`${stats.todaySales} DH`}
          icon={ShoppingCart}
          color="orange"
          trend={{ value: "+8.2%", isPositive: true }}
        />
        <StatCard
          title="Clients"
          value={stats.totalClients}
          icon={Users}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Alertes Stock Bas
            </h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {product.stock} / Min: {product.minStock}
                  </p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Urgent
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 text-primary-500 mr-2" />
              Ventes Récentes
            </h2>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="font-medium text-gray-900">{sale.client}</p>
                  <p className="text-sm text-gray-600">{sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{sale.amount}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      sale.status === "Payé"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


