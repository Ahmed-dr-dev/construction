# Guide de Configuration

## Étapes de Configuration

### 1. Installation des Dépendances

```bash
npm install
```

### 2. Configuration Supabase

1. Créer un projet sur [Supabase](https://supabase.com)
2. Copier l'URL du projet et la clé anonyme
3. Créer un fichier `.env.local` à la racine du projet:

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

### 3. Configuration de la Base de Données

1. Aller dans l'éditeur SQL de Supabase
2. Exécuter le contenu du fichier `supabase-schema.sql`
3. Vérifier que toutes les tables sont créées

### 4. Créer le Premier Utilisateur Admin

Vous pouvez créer le premier utilisateur via l'interface d'inscription ou directement dans Supabase:

1. Aller dans Authentication > Users
2. Créer un nouvel utilisateur
3. Aller dans Table Editor > users
4. Ajouter une entrée avec l'ID de l'utilisateur, email, full_name, et role='admin'

### 5. Lancer l'Application

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Structure des Rôles

- **admin**: Accès complet (produits, clients, fournisseurs, ventes, factures)
- **employee**: Accès limité (ventes, produits en lecture, factures)

## Notes Importantes

- Les politiques RLS (Row Level Security) sont activées pour toutes les tables
- Seuls les admins peuvent modifier les produits, clients et fournisseurs
- Les employés peuvent créer des ventes et des factures
- Le stock est automatiquement décrémenté lors d'une vente
- Les statistiques des clients sont mises à jour automatiquement
