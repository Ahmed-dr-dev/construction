export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  total_purchases: number;
  unpaid_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  products: string[];
  last_delivery: string;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  client_id: string;
  user_id: string;
  date: string;
  total_amount: number;
  status: 'paid' | 'unpaid';
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  sale_id: string;
  invoice_number: string;
  created_at: string;
}
