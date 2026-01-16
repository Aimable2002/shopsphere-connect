export type ProductCategory = 'dinners' | 'rooms' | 'apartments';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type AppRole = 'business' | 'customer';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  image_url: string | null;
  is_available: boolean;
  price_unit: 'fixed' | 'per_hour' | 'per_day' | 'per_night';
  min_duration_hours: number | null;
  max_duration_hours: number | null;
  is_reservable: boolean;
  created_at: string;
  updated_at: string;
  business?: Business;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'no_show' | 'cancelled';

export interface Reservation {
  id: string;
  order_id: string;
  product_id: string | null;
  business_id: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  deposit_amount: number;
  total_price: number;
  status: ReservationStatus;
  customer_attended: boolean | null;
  refund_amount: number;
  business_payout: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
  business?: Business;
}

export interface Order {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  platform_fee: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  business_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface Testimonial {
  id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  content: string;
  is_approved: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}
