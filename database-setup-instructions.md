# Instructions de Configuration de la Base de Données

## Étapes pour Configurer la Base de Données dans Supabase

### 1. Accéder à l'Éditeur SQL

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**

### 2. Exécuter le Script SQL

1. Ouvrez le fichier `supabase-schema.sql` dans votre éditeur
2. **Copiez tout le contenu** du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter` / `Cmd+Enter`)

### 3. Vérifier la Création des Tables

1. Allez dans **Table Editor** dans le menu de gauche
2. Vérifiez que les tables suivantes sont créées:
   - ✅ `users`
   - ✅ `products`
   - ✅ `clients`
   - ✅ `suppliers`
   - ✅ `sales`
   - ✅ `sale_items`
   - ✅ `invoices`

### 4. Vérifier les Politiques RLS

1. Allez dans **Authentication** > **Policies**
2. Vérifiez que les politiques RLS sont activées pour toutes les tables

### 5. Créer le Premier Utilisateur Admin

#### Option A: Via l'Interface Web
1. Allez dans **Authentication** > **Users**
2. Cliquez sur **Add User** > **Create new user**
3. Entrez un email et un mot de passe
4. Notez l'ID de l'utilisateur créé
5. Allez dans **Table Editor** > `users`
6. Cliquez sur **Insert row**
7. Remplissez:
   - `id`: L'ID de l'utilisateur créé (UUID)
   - `email`: L'email de l'utilisateur
   - `full_name`: Le nom complet
   - `role`: `admin`

#### Option B: Via SQL
```sql
-- Remplacez les valeurs suivantes:
-- - USER_ID: L'ID de l'utilisateur créé dans Authentication
-- - EMAIL: L'email de l'utilisateur
-- - FULL_NAME: Le nom complet

INSERT INTO users (id, email, full_name, role)
VALUES (
  'USER_ID_ICI',
  'admin@example.com',
  'Administrateur',
  'admin'
);
```

### 6. Tester la Configuration

1. Connectez-vous à l'application avec les identifiants créés
2. Vérifiez que vous pouvez accéder au dashboard
3. Testez la création d'un produit (si vous êtes admin)

## Structure des Tables

### users
- `id` (UUID, Primary Key) - Référence auth.users
- `email` (TEXT)
- `full_name` (TEXT)
- `role` (TEXT) - 'admin' ou 'employee'
- `created_at`, `updated_at` (TIMESTAMP)

### products
- `id` (UUID, Primary Key)
- `name`, `category`, `unit` (TEXT)
- `price` (DECIMAL)
- `stock`, `min_stock` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

### clients
- `id` (UUID, Primary Key)
- `name`, `phone`, `email`, `address` (TEXT)
- `total_purchases`, `unpaid_amount` (DECIMAL)
- `created_at`, `updated_at` (TIMESTAMP)

### suppliers
- `id` (UUID, Primary Key)
- `name`, `phone`, `email` (TEXT)
- `products` (TEXT[]) - Tableau de produits
- `last_delivery` (DATE)
- `total_orders` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

### sales
- `id` (UUID, Primary Key)
- `client_id` (UUID) - Référence clients
- `user_id` (UUID) - Référence users
- `date` (DATE)
- `total_amount` (DECIMAL)
- `status` (TEXT) - 'paid' ou 'unpaid'
- `created_at` (TIMESTAMP)

### sale_items
- `id` (UUID, Primary Key)
- `sale_id` (UUID) - Référence sales
- `product_id` (UUID) - Référence products
- `quantity` (INTEGER)
- `price` (DECIMAL)
- `created_at` (TIMESTAMP)

### invoices
- `id` (UUID, Primary Key)
- `sale_id` (UUID) - Référence sales
- `invoice_number` (TEXT, UNIQUE)
- `created_at` (TIMESTAMP)

## Fonctions Disponibles

### decrement_stock(product_id, quantity)
Décrémente le stock d'un produit après une vente.

### update_client_stats(client_id, amount, is_paid)
Met à jour les statistiques d'un client (total_purchases, unpaid_amount).

## Notes Importantes

- ⚠️ Les politiques RLS sont activées - seuls les utilisateurs authentifiés peuvent accéder aux données
- ⚠️ Seuls les admins peuvent modifier les produits, clients et fournisseurs
- ⚠️ Les employés peuvent créer des ventes et consulter les produits
- ✅ Le stock est automatiquement décrémenté lors d'une vente
- ✅ Les statistiques des clients sont mises à jour automatiquement

## Dépannage

### Erreur: "relation does not exist"
- Vérifiez que vous avez bien exécuté tout le script SQL
- Vérifiez que les extensions sont activées

### Erreur: "permission denied"
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur est bien authentifié

### Erreur: "foreign key constraint"
- Vérifiez que les tables référencées existent
- Vérifiez que les IDs utilisés existent dans les tables parentes
