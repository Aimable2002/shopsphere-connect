export type ProductCategory = 'dinners' | 'rooms' | 'apartments';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type AppRole = 'business' | 'customer';
export type PriceUnit = 'fixed' | 'per_hour' | 'per_day' | 'per_night';

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
  phone_number: string | null;
  address: string | null;
  logo_url: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  type: string;
  image_url: string | null;
  is_available: boolean;
  price_unit: PriceUnit;
  is_reservable: boolean;
  min_duration_hours: number | null;
  max_duration_hours: number | null;
  created_at: string;
  updated_at: string;
  business?: Business;
}

export interface Order {
  id: string;
  business_id: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
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
  unit_price: number;
  quantity: number;
  total_price: number;
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
  // For reservable items
  startDate?: Date;
  startTime?: string;
  endDate?: Date;
  endTime?: string;
  calculatedPrice?: number;
  duration?: number;
  durationUnit?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface PlatformStats {
  total_platform_fees: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_order_value: number;
  pending_order_value: number;
  completed_order_value: number;
  scheduled_reservations: number;
  scheduled_reservation_value: number;
  checkedin_reservations: number;
  checkedin_reservation_value: number;
  checkedout_reservations: number;
  checkedout_reservation_value: number;
  cancelled_reservations: number;
  cancelled_reservation_value: number;
  platform_holding: number;
  platform_payout_pending: number;
}

export interface OrderWithBusiness {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  total_amount: number;
  platform_fee: number;
  status: string;
  is_reservation: boolean;
  reservation_status: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  created_at: string;
  updated_at: string;
  businesses: {
    name: string;
  };
}
