import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product & { business?: { name: string } };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem, removeItem, getItemQuantity, updateQuantity } = useCart();
  const quantity = getItemQuantity(product.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 animate-scale-in">
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-4xl">📦</span>
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-card/90 text-foreground text-xs">
          {product.category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          {product.business && (
            <p className="text-xs text-muted-foreground mb-1">{product.business.name}</p>
          )}
          <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
          {quantity === 0 ? (
            <Button
              size="sm"
              onClick={() => addItem(product)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => updateQuantity(product.id, quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-6 text-center font-semibold">{quantity}</span>
              <Button
                size="icon"
                className="h-8 w-8 bg-accent hover:bg-accent/90"
                onClick={() => addItem(product)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
