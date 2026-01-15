import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from '@/types';

export const useBusinesses = (filters?: {
  search?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['businesses', filters],
    queryFn: async () => {
      let query = supabase.from('businesses').select('*');

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Business[];
    },
  });
};

export const useBusiness = (businessId: string) => {
  return useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (error) throw error;
      return data as Business;
    },
    enabled: !!businessId,
  });
};

export const useBusinessCategories = () => {
  return useQuery({
    queryKey: ['business-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('businesses').select('category');

      if (error) throw error;
      
      const categories = [...new Set(data.map((b) => b.category))];
      return categories;
    },
  });
};
