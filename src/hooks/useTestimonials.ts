import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Testimonial } from '@/types';

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async (): Promise<Testimonial[]> => {
      return []; // Testimonials table doesn't exist yet
    },
  });
}

export function useCreateTestimonial() {
  return {
    mutateAsync: async () => {},
    isPending: false,
  };
}
