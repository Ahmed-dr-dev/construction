-- Create supplier_invoices table for supplier order invoices
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  supplier_order_id uuid NOT NULL REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NULL,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue')),
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  paid_amount numeric(10, 2) NOT NULL DEFAULT 0,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT supplier_invoices_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_invoices_invoice_number_unique UNIQUE (invoice_number)
) TABLESPACE pg_default;

-- Create index
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_order_id ON public.supplier_invoices(supplier_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON public.supplier_invoices(status);
