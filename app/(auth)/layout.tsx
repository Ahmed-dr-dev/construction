import { Package2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Package2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion Construction
          </h1>
          <p className="text-gray-600 mt-2">
            Gestion des ventes et du stock
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}


