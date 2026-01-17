-- Remove foreign key constraint to auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add password_hash column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

-- Make id auto-generate UUID if not provided
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Update existing records: remove default from password_hash (set for new records only)
ALTER TABLE public.users ALTER COLUMN password_hash DROP DEFAULT;

-- Updated table definition (for reference):
-- CREATE TABLE IF NOT EXISTS public.users (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   email TEXT NOT NULL,
--   full_name TEXT NOT NULL,
--   role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
--   password_hash TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
