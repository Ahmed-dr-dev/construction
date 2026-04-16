import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

const PRODUCT_IMAGES = [
  "/WhatsApp Image 2026-04-06 at 2.26.42 PM (1).jpeg",
  "/WhatsApp Image 2026-04-06 at 2.26.42 PM.jpeg",
  "/WhatsApp Image 2026-04-06 at 2.28.11 PM.jpeg",
  "/WhatsApp Image 2026-04-06 at 2.28.13 PM.jpeg",
  "/WhatsApp Image 2026-04-06 at 2.28.14 PM (1).jpeg",
  "/WhatsApp Image 2026-04-06 at 2.28.14 PM.jpeg",
  "/WhatsApp Image 2026-04-06 at 2.28.17 PM.jpeg",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Navbar */}
      <nav className="px-8 py-4 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Image
            src="/WhatsApp Image 2026-04-06 at 2.26.36 PM.jpeg"
            alt="JM Construction Logo"
            width={56}
            height={56}
            className="rounded-xl object-cover"
          />
          <span className="text-xl font-bold text-gray-900">JM Construction</span>
        </div>
        <Link href="/signin" className="btn btn-primary">
          Se connecter
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <Image
              src="/WhatsApp Image 2026-04-06 at 2.26.36 PM.jpeg"
              alt="JM Construction"
              width={160}
              height={160}
              className="rounded-2xl object-cover shadow-xl"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Plateforme de Gestion
            <br />
            <span className="text-primary-600">JM Construction</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Solution complète pour gérer vos ventes, votre stock et vos clients.
            Remplacez vos cahiers par un système numérique moderne.
          </p>
          <div className="flex items-center justify-center flex-wrap gap-4">
            <Link href="/catalog" className="btn btn-primary text-lg px-8 py-3 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Parcourir le catalogue</span>
            </Link>
            <Link href="/signin" className="btn btn-secondary text-lg px-8 py-3">
              Se connecter
            </Link>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
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
        </div>

        {/* Product Images Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Nos Produits</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {PRODUCT_IMAGES.map((src, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow aspect-square">
                <Image
                  src={src}
                  alt={`Produit ${i + 1}`}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="text-center py-8 text-gray-600 border-t border-gray-200">
        <p>&copy; 2026 JM Construction. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
