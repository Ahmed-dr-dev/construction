-- Add supplier_order_id column to invoices table to support both client and supplier invoices
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS supplier_order_id uuid REFERENCES public.supplier_orders(id) ON DELETE CASCADE;

-- Add index for supplier_order_id
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_order_id ON public.invoices(supplier_order_id);

-- Note: sale_id and supplier_order_id are mutually exclusive - one should be null, the other should have a value
-- This constraint ensures at least one is provided (enforced at application level)
