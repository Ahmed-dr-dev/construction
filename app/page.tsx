import Link from "next/link";
import { Package2, ShoppingCart, BarChart3, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <nav className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Package2 className="w-8 h-8 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Gestion Construction</span>
        </div>
        <Link href="/auth/signin" className="btn btn-primary">
          Se connecter
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Plateforme de Gestion
            <br />
            <span className="text-primary-600">Magasin de Construction</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Solution simple et efficace pour gérer vos ventes, votre stock et vos clients.
            Remplacez vos cahiers par un système numérique moderne.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/dashboard" className="btn btn-primary text-lg px-8 py-3 flex items-center space-x-2">
              <span>Accéder au Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/signup" className="btn btn-secondary text-lg px-8 py-3">
              Créer un compte
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Gestion des Produits</h3>
            <p className="text-gray-600 text-sm">
              Ajoutez et gérez vos produits avec alertes de stock bas
            </p>
          </div>

          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Enregistrement des Ventes</h3>
            <p className="text-gray-600 text-sm">
              Enregistrez vos ventes rapidement avec calcul automatique
            </p>
          </div>

          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Gestion des Clients</h3>
            <p className="text-gray-600 text-sm">
              Suivez vos clients et leurs historiques d'achats
            </p>
          </div>

          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Statistiques</h3>
            <p className="text-gray-600 text-sm">
              Visualisez vos performances avec un tableau de bord clair
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center py-12">
          <h2 className="text-3xl font-bold mb-4">Prêt à moderniser votre gestion?</h2>
          <p className="text-primary-100 mb-6 text-lg">
            Commencez dès maintenant et simplifiez la gestion de votre magasin
          </p>
          <Link href="/signup" className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
            Créer un compte gratuitement
          </Link>
        </div>
      </div>

      <footer className="text-center py-8 text-gray-600 border-t border-gray-200">
        <p>&copy; 2025 Gestion Construction. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
