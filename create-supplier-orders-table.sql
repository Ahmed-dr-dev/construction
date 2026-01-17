-- Create supplier_orders table
CREATE TABLE IF NOT EXISTS public.supplier_orders (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date date NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  notes text NULL,
  created_by uuid NULL REFERENCES public.users(id),
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT supplier_orders_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_orders_order_number_unique UNIQUE (order_number)
) TABLESPACE pg_default;

-- Create supplier_order_items table
CREATE TABLE IF NOT EXISTS public.supplier_order_items (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  description text NULL,
  quantity numeric(10, 2) NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) NOT NULL,
  unit text NULL DEFAULT 'unité',
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT supplier_order_items_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create index on supplier_orders
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier_id ON public.supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON public.supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_order_id ON public.supplier_order_items(order_id);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_supplier_order_number()
RETURNS text AS $$
DECLARE
  last_number integer;
  new_number text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS integer)), 0) + 1
  INTO last_number
  FROM public.supplier_orders
  WHERE order_number LIKE 'PO-%';
  
  new_number := 'PO-' || LPAD(last_number::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update supplier stats when order is delivered
CREATE OR REPLACE FUNCTION update_supplier_on_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE public.suppliers
    SET 
      total_orders = COALESCE(total_orders, 0) + 1,
      last_delivery = NEW.order_date,
      updated_at = NOW()
    WHERE id = NEW.supplier_id;
    
    -- Update product stock if product_id exists in order items
    UPDATE public.products p
    SET 
      stock = COALESCE(p.stock, 0) + (
        SELECT SUM(soi.quantity)
        FROM public.supplier_order_items soi
        WHERE soi.order_id = NEW.id AND soi.product_id = p.id
      ),
      updated_at = NOW()
    WHERE id IN (
      SELECT DISTINCT product_id
      FROM public.supplier_order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update supplier stats
DROP TRIGGER IF EXISTS trigger_update_supplier_on_order_delivered ON public.supplier_orders;
CREATE TRIGGER trigger_update_supplier_on_order_delivered
  AFTER UPDATE ON public.supplier_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_on_order_delivered();
