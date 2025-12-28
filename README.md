# Plateforme de Gestion des Ventes et du Stock

Application web pour la gestion d'un magasin de matériaux de construction.

## Technologies

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **jsPDF** (Génération de factures)

## Installation

```bash
npm install
```

## Configuration

1. Créez un fichier `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Configuration Supabase:

Créez les tables suivantes dans votre base de données Supabase:

```sql
-- Table users (géré par Supabase Auth)

-- Table products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  min_stock INTEGER NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table clients
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  total_purchases DECIMAL(10,2) DEFAULT 0,
  unpaid_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table suppliers
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  products TEXT[] NOT NULL,
  last_delivery DATE,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table sales
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Démarrage

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Fonctionnalités

- ✅ Authentification (Connexion/Inscription)
- ✅ Gestion des produits
- ✅ Gestion du stock avec alertes
- ✅ Gestion des ventes
- ✅ Gestion des clients
- ✅ Gestion des fournisseurs
- ✅ Génération de factures PDF
- ✅ Tableau de bord avec statistiques
- ✅ Rôles (Admin/Employé)

## Structure

```
app/
├── (auth)/          # Pages d'authentification
├── dashboard/       # Pages du tableau de bord
components/          # Composants réutilisables
lib/                 # Utilitaires et configuration
```
