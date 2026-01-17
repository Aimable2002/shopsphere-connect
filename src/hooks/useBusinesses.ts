import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from '@/types';

interface BusinessFilters {
  search?: string;
}

const countLetterSequenceMatches = (str: string, query: string): number => {
  if (!str || !query) return 0;
  
  const strLower = str.toLowerCase();
  const queryLower = query.toLowerCase();
  
  let matches = 0;
  let queryIndex = 0;
  let strIndex = 0;
  
  while (queryIndex < queryLower.length && strIndex < strLower.length) {
    if (queryLower[queryIndex] === strLower[strIndex]) {
      matches++;
      queryIndex++;
    }
    strIndex++;
  }
  
  return matches;
};

const getBusinessMatchScore = (business: Business, query: string): number => {
  if (!query.trim()) return 0;
  
  const fieldScores = [
    countLetterSequenceMatches(business.name, query) * 2,
    countLetterSequenceMatches(business.address || '', query) * 1.5,
    countLetterSequenceMatches(business.category, query) * 1
  ];
  
  return Math.max(...fieldScores);
};

export function useBusinesses(filters: BusinessFilters = {}) {
  return useQuery({
    queryKey: ['businesses', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      let businesses = data as unknown as Business[];
      
      if (filters.search && filters.search.trim()) {
        const query = filters.search.trim();
        
        const businessesWithScores = businesses.map(business => ({
          business,
          matchScore: getBusinessMatchScore(business, query)
        }));
        
        const hasMatches = businessesWithScores.filter(item => item.matchScore > 0);
        const noMatches = businessesWithScores.filter(item => item.matchScore === 0);
        
        hasMatches.sort((a, b) => b.matchScore - a.matchScore);
        
        businesses = [
          ...hasMatches.map(item => item.business),
          ...noMatches.map(item => item.business)
        ];
      }
      
      return businesses;
    },
  });
}

export function useBusiness(id: string) {
  return useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as Business;
    },
    enabled: !!id,
  });
}