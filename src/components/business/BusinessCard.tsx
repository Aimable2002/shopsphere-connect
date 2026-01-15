import { Store, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Business } from '@/types';
import { Link } from 'react-router-dom';

interface BusinessCardProps {
  business: Business;
}

export const BusinessCard = ({ business }: BusinessCardProps) => {
  return (
    <Link to={`/?business=${business.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer animate-scale-in">
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="w-12 h-12 text-primary/50" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
            {business.category}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground text-lg mb-1">{business.name}</h3>
          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {business.description}
            </p>
          )}
          {business.address && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{business.address}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
