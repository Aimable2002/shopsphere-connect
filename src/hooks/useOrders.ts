import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useCustomerOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });
}

export function useBusinessOrders(businessId: string) {
  return useQuery({
    queryKey: ['business-orders', businessId],
    queryFn: async () => {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          order:orders(*)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      
      // Group by order and return unique orders
      const ordersMap = new Map();
      orderItems?.forEach(item => {
        if (item.order && !ordersMap.has(item.order.id)) {
          ordersMap.set(item.order.id, {
            ...item.order,
            items: []
          });
        }
        if (item.order) {
          ordersMap.get(item.order.id).items.push(item);
        }
      });

      return Array.from(ordersMap.values());
    },
    enabled: !!businessId,
  });
}

export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
}

interface CreateOrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  platform_fee: number;
  items: {
    product_id: string;
    business_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
  }[];
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          customer_address: data.customer_address,
          total_amount: data.total_amount,
          platform_fee: data.platform_fee,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = data.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        business_id: item.business_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['business-orders'] });
    },
  });
}
