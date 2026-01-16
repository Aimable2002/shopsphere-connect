import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, UtensilsCrossed, Bed, Building2, CalendarClock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  showBusiness?: boolean;
}

const categoryIcons = {
  dinners: UtensilsCrossed,
  rooms: Bed,
  apartments: Building2,
};

const categoryColors = {
  dinners: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  rooms: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  apartments: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const priceUnitLabels: Record<string, string> = {
  fixed: '',
  per_hour: '/hour',
  per_day: '/day',
  per_night: '/night',
};

export function ProductCard({ product, showBusiness = true }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart, items, updateQuantity } = useCart();
  const [localQty, setLocalQty] = useState(1);
  
  const cartItem = items.find(item => item.product.id === product.id);
  const CategoryIcon = categoryIcons[product.category];
  const isReservable = product.is_reservable || product.category === 'apartments' || product.category === 'rooms';

  const handleAddToCart = () => {
    addToCart(product, localQty);
    setLocalQty(1);
  };

  const handleQuantityChange = (delta: number) => {
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity + delta);
    } else {
      setLocalQty(prev => Math.max(1, prev + delta));
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CategoryIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <Badge className={`absolute top-3 left-3 ${categoryColors[product.category]}`}>
          <CategoryIcon className="h-3 w-3 mr-1" />
          {product.category}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Business Name */}
        {showBusiness && product.business && (
          <Link 
            to={`/business/${product.business.id}`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {product.business.name}
          </Link>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xl font-bold text-primary">
              ${Number(product.price).toFixed(2)}
            </span>
            {product.price_unit && product.price_unit !== 'fixed' && (
              <span className="text-sm text-muted-foreground">{priceUnitLabels[product.price_unit]}</span>
            )}
          </div>

          {isReservable ? (
            <Button
              size="sm"
              className="gradient-primary border-0 text-primary-foreground gap-2"
              onClick={() => navigate(`/reserve/${product.id}`)}
            >
              <CalendarClock className="h-4 w-4" />
              Book Now
            </Button>
          ) : cartItem ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(-1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={localQty <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{localQty}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                className="gradient-primary border-0 text-primary-foreground"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
