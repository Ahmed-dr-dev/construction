-- Updated users table definition (without auth.users dependency)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_check CHECK (
    (role = ANY (ARRAY['admin'::text, 'employee'::text]))
  )
) TABLESPACE pg_default;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
