import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Testimonial } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Testimonial[];
    },
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (data: { rating: number; content: string }) => {
      const { error } = await supabase.from('testimonials').insert({
        user_id: user?.id,
        user_name: user.user_metadata.full_name || 'Anonymous',
        rating: data.rating,
        content: data.content,
        is_approved: true // Auto-approve for now
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
}
