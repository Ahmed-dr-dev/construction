import Link from "next/link";
import { Package2, ShoppingCart, Search } from "lucide-react";

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
        <Link href="/signin" className="btn btn-primary">
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
          <div className="flex items-center justify-center space-x-4 flex-wrap gap-4">
            <Link href="/catalog" className="btn btn-primary text-lg px-8 py-3 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Parcourir le catalogue</span>
            </Link>
            <Link href="/track-order" className="btn btn-secondary text-lg px-8 py-3 flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Suivre une commande</span>
            </Link>
            <Link href="/signin" className="btn btn-secondary text-lg px-8 py-3">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Catalogue Produits</h2>
            <p className="text-primary-100 mb-6">
              Parcourez notre catalogue complet et passez commande en ligne
            </p>
            <Link href="/catalog" className="inline-block bg-white text-primary-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              Voir le catalogue
            </Link>
          </div>
          <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Espace de connexion</h2>
            <p className="text-blue-100 mb-6">
              Accédez à l&apos;espace gestion ou à l&apos;espace client depuis une seule page de connexion.
            </p>
            <Link href="/signin" className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              Accéder à l&apos;espace de connexion
            </Link>
          </div>
          <div className="card bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Suivi de Commande</h2>
            <p className="text-orange-50 mb-6">
              Retrouvez rapidement une commande avec son numéro, votre email ou votre téléphone.
            </p>
            <Link href="/track-order" className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-orange-50 transition-colors">
              <Search className="w-4 h-4" />
              Suivre ma commande
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center py-8 text-gray-600 border-t border-gray-200">
        <p>&copy; 2026 Gestion Construction. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
