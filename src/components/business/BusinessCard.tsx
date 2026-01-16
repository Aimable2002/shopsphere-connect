import { Business } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, ArrowRight, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BusinessCardProps {
  business: Business;
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      {/* Logo */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center gradient-primary">
            <Store className="h-16 w-16 text-primary-foreground/50" />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Business Name */}
        <h3 className="font-semibold text-lg text-foreground">{business.name}</h3>

        {/* Description */}
        {business.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-2">
          {business.address && (
            <Badge variant="secondary" className="font-normal">
              <MapPin className="h-3 w-3 mr-1" />
              {business.address}
            </Badge>
          )}
          {business.phone && (
            <Badge variant="secondary" className="font-normal">
              <Phone className="h-3 w-3 mr-1" />
              {business.phone}
            </Badge>
          )}
        </div>

        {/* View Products Button */}
        <Link to={`/business/${business.id}`}>
          <Button className="w-full gradient-primary border-0 text-primary-foreground group/btn">
            View Products
            <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
