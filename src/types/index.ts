export interface Business {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  phone_number: string | null;
  logo_url: string | null;
  category: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  type: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  business?: Business;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  total_amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}
