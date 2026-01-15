import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Business } from '@/types';

interface ProductWithBusiness extends Product {
  business: Business;
}

export const useProducts = (filters?: {
  search?: string;
  category?: string;
  type?: string;
  businessId?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
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

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters?.businessId) {
        query = query.eq('business_id', filters.businessId);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ProductWithBusiness[];
    },
  });
};

export const useBusinessProducts = (businessId: string) => {
  return useQuery({
    queryKey: ['business-products', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!businessId,
  });
};

export const useProductCategories = () => {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_available', true);

      if (error) throw error;
      
      const categories = [...new Set(data.map((p) => p.category))];
      return categories;
    },
  });
};

export const useProductTypes = () => {
  return useQuery({
    queryKey: ['product-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('type')
        .eq('is_available', true);

      if (error) throw error;
      
      const types = [...new Set(data.map((p) => p.type))];
      return types;
    },
  });
};
