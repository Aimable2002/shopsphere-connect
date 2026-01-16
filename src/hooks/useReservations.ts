import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  status: string;
  customer_attended: boolean | null;
  refund_amount: number;
  business_payout: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: any;
  business?: any;
  order?: any;
}

export function useCustomerReservations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer-reservations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          product:products(*),
          business:businesses(*),
          order:orders(*)
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user?.id,
  });
}

export function useBusinessReservations() {
  const { business } = useAuth();

  return useQuery({
    queryKey: ['business-reservations', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          product:products(*),
          order:orders(*)
        `)
        .eq('business_id', business?.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!business?.id,
  });
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      reservationId, 
      status, 
      customerAttended 
    }: { 
      reservationId: string; 
      status: string;
      customerAttended?: boolean;
    }) => {
      // Get the reservation first
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*, business:businesses(*)')
        .eq('id', reservationId)
        .single();

      if (fetchError) throw fetchError;

      let refundAmount = 0;
      let businessPayout = 0;

      // Calculate refund and payout based on status
      if (status === 'completed' && customerAttended) {
        // Customer attended - full payment to business
        businessPayout = reservation.deposit_amount;
        refundAmount = 0;
      } else if (status === 'no_show' || (status === 'cancelled' && customerAttended === false)) {
        // No show or cancelled - 50/50 split
        refundAmount = reservation.deposit_amount * 0.5;
        businessPayout = reservation.deposit_amount * 0.5;
      } else if (status === 'cancelled') {
        // Cancellation before time - 50/50 split
        refundAmount = reservation.deposit_amount * 0.5;
        businessPayout = reservation.deposit_amount * 0.5;
      }

      // Update reservation
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status,
          customer_attended: customerAttended,
          refund_amount: refundAmount,
          business_payout: businessPayout,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (updateError) throw updateError;

      // Update business balance if there's a payout
      if (businessPayout > 0) {
        const { error: balanceError } = await supabase
          .from('businesses')
          .update({
            balance: (reservation.business?.balance || 0) + businessPayout,
          })
          .eq('id', reservation.business_id);

        if (balanceError) console.error('Balance update error:', balanceError);
      }

      return { refundAmount, businessPayout };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['business-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['customer-reservations'] });
      toast.success('Reservation status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update reservation');
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      // Get the reservation first
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (fetchError) throw fetchError;

      // Check if reservation can be cancelled
      if (!['pending', 'confirmed'].includes(reservation.status)) {
        throw new Error('This reservation cannot be cancelled');
      }

      // Calculate 50/50 split
      const refundAmount = reservation.deposit_amount * 0.5;
      const businessPayout = reservation.deposit_amount * 0.5;

      // Update reservation
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          refund_amount: refundAmount,
          business_payout: businessPayout,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (updateError) throw updateError;

      return { refundAmount, businessPayout };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer-reservations'] });
      toast.success(`Reservation cancelled. You will receive a 50% refund ($${data.refundAmount.toFixed(2)})`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel reservation');
    },
  });
}