# Configuration des Variables d'Environnement

## Problème: Variables d'environnement manquantes

Si vous voyez l'erreur:
```
Missing Supabase environment variables
```

Cela signifie que les clés Supabase ne sont pas configurées.

## Solution

### 1. Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant:

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

### 2. Obtenir vos clés Supabase

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Exemple de fichier `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjU5ODQwMCwiZXhwIjoxOTU4MTc0NDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Redémarrer le serveur de développement

Après avoir créé/modifié `.env.local`, vous devez redémarrer le serveur:

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez
npm run dev
```

## Notes Importantes

- ⚠️ Le fichier `.env.local` est dans `.gitignore` et ne sera pas commité
- ⚠️ Ne partagez jamais vos clés Supabase publiquement
- ⚠️ Les variables doivent commencer par `NEXT_PUBLIC_` pour être accessibles côté client
- ✅ Utilisez `.env.local` pour le développement local
- ✅ Utilisez les variables d'environnement de votre plateforme d'hébergement pour la production

## Vérification

Pour vérifier que les variables sont bien chargées, vous pouvez temporairement ajouter dans votre code:

```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

Mais **retirez cette ligne** avant de commit car elle expose votre URL.
