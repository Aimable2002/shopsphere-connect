import { BusinessCard } from './BusinessCard';
import { Business } from '@/types';
import { Loader2 } from 'lucide-react';

interface BusinessGridProps {
  businesses: Business[];
  loading?: boolean;
}

export const BusinessGrid = ({ businesses, loading }: BusinessGridProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">🏪</span>
        <h3 className="text-xl font-semibold mb-2">No businesses found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
};
