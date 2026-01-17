-- Enhance suppliers table with more realistic fields
ALTER TABLE public.suppliers 
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Maroc',
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'Net 30',
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS notes text;

-- Update existing table definition:
/*
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NULL,
  contact_person text NULL,
  address text NULL,
  city text NULL,
  country text NULL DEFAULT 'Maroc',
  tax_id text NULL,
  registration_number text NULL,
  products text[] NULL DEFAULT '{}'::text[],
  payment_terms text NULL DEFAULT 'Net 30',
  bank_name text NULL,
  bank_account text NULL,
  website text NULL,
  status text NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text NULL,
  last_delivery date NULL,
  total_orders integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
*/
