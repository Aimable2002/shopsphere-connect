import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, UtensilsCrossed, Bed, Building2, Clock, Calendar, Moon, Info } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const priceUnitIcons: Record<string, any> = {
  per_hour: Clock,
  per_day: Calendar,
  per_night: Moon,
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
  const PriceUnitIcon = priceUnitIcons[product.price_unit];

  // Calculate preview price
  const calculatePreviewPrice = () => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    start.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));
    const end = new Date(endDate);
    end.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));

    let duration = 0;
    let unit = '';

    switch (product.price_unit) {
      case 'per_hour':
        duration = Math.max(1, differenceInHours(end, start));
        unit = duration === 1 ? 'hour' : 'hours';
        break;
      case 'per_day':
        duration = Math.max(1, differenceInDays(end, start));
        unit = duration === 1 ? 'day' : 'days';
        break;
      case 'per_night':
        duration = Math.max(1, differenceInDays(end, start));
        unit = duration === 1 ? 'night' : 'nights';
        break;
      default:
        duration = 1;
        unit = 'booking';
    }

    return {
      duration,
      unit,
      total: duration * Number(product.price)
    };
  };

  const previewPrice = calculatePreviewPrice();

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
          <div className="w-full h-full flex items-center justify-center"><CategoryIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" /></div>
        )}
        <Badge className={`absolute top-2 left-2 sm:top-3 sm:left-3 text-xs ${categoryColors[product.category] || 'bg-muted'}`}>
          <CategoryIcon className="h-3 w-3 mr-1" />
          {product.category}
        </Badge>
        {isReservable && (
          <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-blue-500 text-white text-xs">
            Bookable
          </Badge>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {showBusiness && product.business && (
          <Link to={`/business/${product.business.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {product.business.name}
          </Link>
        )}
        <h3 className="font-semibold text-foreground line-clamp-1 text-sm sm:text-base">{product.name}</h3>
        {product.description && <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{product.description}</p>}

        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <div className="flex items-center gap-1">
            <span className="text-lg sm:text-xl font-bold text-primary">RF{Number(product.price).toFixed(2)}</span>
            {product.price_unit && product.price_unit !== 'fixed' && (
              <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-0.5">
                {PriceUnitIcon && <PriceUnitIcon className="h-3 w-3" />}
                {priceUnitLabels[product.price_unit]}
              </span>
            )}
          </div>

          {isReservable ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary border-0 text-xs sm:text-sm h-8 sm:h-9">
                  <Bed className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">Book {product.name}</DialogTitle>
                  <DialogDescription className="text-sm">
                    Select your check-in and check-out dates to book this {product.category.slice(0, -1)}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Price info */}
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rate:</span>
                    <span className="font-semibold text-primary">
                      RF{Number(product.price).toFixed(2)}{priceUnitLabels[product.price_unit]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Check-in Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-xs sm:text-sm h-9", !startDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                            {startDate ? format(startDate, "MMM d") : "Select"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} disabled={(d) => d < new Date()} />
                        </PopoverContent>
                      </Popover>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Check-out Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-xs sm:text-sm h-9", !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                            {endDate ? format(endDate, "MMM d") : "Select"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} disabled={(d) => d < (startDate || new Date())} />
                        </PopoverContent>
                      </Popover>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>

                  {/* Price Preview */}
                  {previewPrice && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          {previewPrice.duration} {previewPrice.unit} × RF{Number(product.price).toFixed(2)}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          RF{previewPrice.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cancellation Policy */}
                  <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-xs">
                      <strong>Cancellation Policy:</strong> 100% refund before check-in, 50% after check-in
                    </AlertDescription>
                  </Alert>

                  <Button 
                    className="w-full gradient-primary border-0" 
                    onClick={handleAddReservation} 
                    disabled={!startDate || !endDate}
                  >
                    Add to Cart {previewPrice && `- RF${previewPrice.total.toFixed(2)}`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : cartItem ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}><Minus className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
              <span className="w-6 sm:w-8 text-center font-medium text-sm">{cartItem.quantity}</span>
              <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}><Plus className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setLocalQty(Math.max(1, localQty - 1))} disabled={localQty <= 1}><Minus className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
                <span className="w-5 sm:w-8 text-center font-medium text-sm">{localQty}</span>
                <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setLocalQty(localQty + 1)}><Plus className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
              </div>
              <Button size="sm" className="gradient-primary border-0 h-7 w-7 sm:h-8 sm:w-8 p-0" onClick={handleAddToCart}><ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
