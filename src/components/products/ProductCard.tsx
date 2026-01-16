import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, UtensilsCrossed, Bed, Building2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  showBusiness?: boolean;
}

const categoryIcons: Record<string, any> = {
  dinners: UtensilsCrossed,
  rooms: Bed,
  apartments: Building2,
};

const categoryColors: Record<string, string> = {
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
  const { addToCart, items, updateQuantity } = useCart();
  const [localQty, setLocalQty] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('12:00');
  
  const cartItem = items.find(item => item.product.id === product.id);
  const CategoryIcon = categoryIcons[product.category] || UtensilsCrossed;
  const isReservable = product.is_reservable || product.category === 'apartments' || product.category === 'rooms';

  const handleAddToCart = () => {
    addToCart(product, localQty);
    setLocalQty(1);
  };

  const handleAddReservation = () => {
    if (!startDate || !endDate) return;
    addToCart(product, 1, { startDate, startTime, endDate, endTime });
    setDialogOpen(false);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><CategoryIcon className="h-16 w-16 text-muted-foreground/30" /></div>
        )}
        <Badge className={`absolute top-3 left-3 ${categoryColors[product.category] || 'bg-muted'}`}>
          <CategoryIcon className="h-3 w-3 mr-1" />
          {product.category}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        {showBusiness && product.business && (
          <Link to={`/business/${product.business.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {product.business.name}
          </Link>
        )}
        <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
        {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
            {product.price_unit && product.price_unit !== 'fixed' && (
              <span className="text-sm text-muted-foreground">{priceUnitLabels[product.price_unit]}</span>
            )}
          </div>

          {isReservable ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary border-0">Book Now</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Book {product.name}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Check-in</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start", !startDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(d) => d < new Date()} /></PopoverContent>
                      </Popover>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start", !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(d) => d < (startDate || new Date())} /></PopoverContent>
                      </Popover>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full gradient-primary border-0" onClick={handleAddReservation} disabled={!startDate || !endDate}>Add to Cart</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : cartItem ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}><Minus className="h-4 w-4" /></Button>
              <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocalQty(Math.max(1, localQty - 1))} disabled={localQty <= 1}><Minus className="h-4 w-4" /></Button>
                <span className="w-8 text-center font-medium">{localQty}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocalQty(localQty + 1)}><Plus className="h-4 w-4" /></Button>
              </div>
              <Button size="sm" className="gradient-primary border-0" onClick={handleAddToCart}><ShoppingCart className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
