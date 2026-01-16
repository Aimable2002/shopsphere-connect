import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory } from '@/types';

interface ProductFilters {
  search?: string;
  category?: ProductCategory | 'all';
  businessId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          business:businesses(*)
        `)
        .eq('is_available', true);

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.businessId) {
        query = query.eq('business_id', filters.businessId);
      }

      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        query = query.gte('price', filters.minPrice);
      }

      // Only apply max price filter if it's explicitly set and not "unlimited"
      if (filters.maxPrice !== undefined && filters.maxPrice < Infinity) {
        query = query.lte('price', filters.maxPrice);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Product[];
    },
  });
}

export function useBusinessProducts(businessId: string) {
  return useQuery({
    queryKey: ['business-products', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!businessId,
  });
}
