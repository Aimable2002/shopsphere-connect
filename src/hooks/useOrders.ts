import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types';

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export const useBusinessOrders = (businessId: string) => {
  return useQuery({
    queryKey: ['business-orders', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as OrderWithItems[];
    },
    enabled: !!businessId,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-orders'] });
    },
  });
};

export const useBusinessStats = (businessId: string) => {
  return useQuery({
    queryKey: ['business-stats', businessId],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, platform_fee, status')
        .eq('business_id', businessId);

      if (error) throw error;

      const totalOrders = orders.length;
      const completedOrders = orders.filter((o) => o.status === 'completed').length;
      const pendingOrders = orders.filter((o) => o.status === 'pending').length;
      const totalRevenue = orders
        .filter((o) => o.status === 'completed')
        .reduce((acc, o) => acc + Number(o.total_amount) - Number(o.platform_fee), 0);
      const pendingBalance = orders
        .filter((o) => o.status === 'pending')
        .reduce((acc, o) => acc + Number(o.total_amount) - Number(o.platform_fee), 0);

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        pendingBalance,
      };
    },
    enabled: !!businessId,
  });
};
