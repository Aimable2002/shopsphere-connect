import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CustomerOrder {
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
  order_items: OrderItem[];
  business?: {
    name: string;
    phone_number: string | null;
  };
}

export const useCustomerOrders = (userId: string) => {
  return useQuery({
    queryKey: ['customer-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          businesses:business_id (name, phone_number)
        `)
        .eq('customer_user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(order => ({
        ...order,
        business: order.businesses
      })) as CustomerOrder[];
    },
    enabled: !!userId,
  });
};
