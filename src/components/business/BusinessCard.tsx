import { Business } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, ArrowRight, Store, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BusinessCardProps {
  business: Business;
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/80">
      {/* Logo/Header */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Store className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <Badge className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground border-0">
          {business.category || 'General'}
        </Badge>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Business Name & Rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-xl text-foreground line-clamp-1">{business.name}</h3>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">4.8</span>
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {business.description}
          </p>
        )}

        {/* Contact Info */}
        <div className="flex flex-col gap-2">
          {business.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{business.address}</span>
            </div>
          )}
          {business.phone_number && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{business.phone_number}</span>
            </div>
          )}
        </div>

        {/* View Products Button */}
        <Link to={`/business/${business.id}`} className="block">
          <Button className="w-full gradient-primary border-0 text-primary-foreground group/btn h-11 text-base font-semibold">
            View Products
            <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
