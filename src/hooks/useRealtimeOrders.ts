import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useRealtimeOrders(businessId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId) return;

    console.log('Setting up realtime subscription for business:', businessId);

    const channel = supabase
      .channel(`business-orders-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_items',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          console.log('New order item received:', payload);
          toast.success('🔔 New order received!', {
            description: 'A customer has placed a new order.',
            duration: 5000,
          });
          // Invalidate orders query to refetch
          queryClient.invalidateQueries({ queryKey: ['business-orders', businessId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['business-orders', businessId] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [businessId, queryClient]);
}
