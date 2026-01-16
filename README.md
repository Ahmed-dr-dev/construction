# Plateforme Web de Gestion des Ventes et du Stock

Application web pour gérer les ventes et le stock d'un magasin de matériaux de construction.

## Installation

1. Installer les dépendances:
```bash
npm install
```

2. Créer un fichier `.env.local` avec vos clés Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

3. Exécuter le script SQL `supabase-schema.sql` dans votre base de données Supabase pour créer les tables et les politiques RLS.

4. Lancer le serveur de développement:
```bash
npm run dev
```

## Structure de la Base de Données

Le fichier `supabase-schema.sql` contient:
- Tables: users, products, clients, suppliers, sales, sale_items, invoices
- Fonctions: decrement_stock, update_client_stats
- Politiques RLS pour la sécurité

## Fonctionnalités

- Authentification (admin/employé)
- Gestion des produits avec alertes de stock bas
- Enregistrement des ventes avec mise à jour automatique du stock
- Gestion des clients et fournisseurs
- Génération de factures PDF
- Tableau de bord avec statistiques

## API Routes

- `/api/auth/*` - Authentification
- `/api/products/*` - Gestion des produits
- `/api/sales/*` - Gestion des ventes
- `/api/clients/*` - Gestion des clients
- `/api/suppliers/*` - Gestion des fournisseurs
- `/api/invoices/*` - Factures
- `/api/dashboard/stats` - Statistiques du tableau de bord
