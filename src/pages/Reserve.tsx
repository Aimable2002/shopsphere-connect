import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Smartphone, 
  Loader2,
  XCircle,
  UserX,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addHours, differenceInHours, differenceInDays, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { Product } from '@/types';

const priceUnitLabels: Record<string, string> = {
  fixed: 'total',
  per_hour: 'per hour',
  per_day: 'per day',
  per_night: 'per night',
};

export default function Reserve() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [startTime, setStartTime] = useState('14:00');
  const [endDate, setEndDate] = useState<Date>();
  const [endTime, setEndTime] = useState('12:00');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [step, setStep] = useState<'booking' | 'payment' | 'processing' | 'success'>('booking');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (profile) {
      setCustomerInfo({
        name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      
      const { data, error } = await supabase
        .from('products')
        .select(`*, business:businesses(*)`)
        .eq('id', productId)
        .single();

      if (error) {
        toast.error('Product not found');
        navigate('/');
        return;
      }
      
      setProduct(data as Product);
      setLoading(false);
    }
    fetchProduct();
  }, [productId, navigate]);

  const calculatePrice = useMemo(() => {
    if (!product || !startDate || !endDate) return { total: 0, deposit: 0, duration: 0, unit: '' };

    const start = new Date(startDate);
    start.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));
    
    const end = new Date(endDate);
    end.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));

    let duration = 0;
    let total = 0;
    let unit = '';

    switch (product.price_unit) {
      case 'per_hour':
        duration = Math.max(1, differenceInHours(end, start));
        total = duration * Number(product.price);
        unit = duration === 1 ? 'hour' : 'hours';
        break;
      case 'per_day':
        duration = Math.max(1, differenceInDays(end, start));
        total = duration * Number(product.price);
        unit = duration === 1 ? 'day' : 'days';
        break;
      case 'per_night':
        duration = Math.max(1, differenceInDays(end, start));
        total = duration * Number(product.price);
        unit = duration === 1 ? 'night' : 'nights';
        break;
      default:
        total = Number(product.price);
        duration = 1;
        unit = 'stay';
    }

    const deposit = total; // Full payment as deposit for reservations
    
    return { total, deposit, duration, unit };
  }, [product, startDate, endDate, startTime, endTime]);

  const handleCreateReservation = async () => {
    if (!user) {
      toast.info('Please sign in to make a reservation');
      navigate('/auth?mode=signup&role=customer');
      return;
    }

    if (!startDate || !endDate || !customerInfo.name || !customerInfo.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const start = new Date(startDate);
    start.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));
    
    const end = new Date(endDate);
    end.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));

    if (isBefore(end, start)) {
      toast.error('End time must be after start time');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email || user.email,
          customer_phone: customerInfo.phone,
          customer_address: 'Reservation - No delivery',
          total_amount: calculatePrice.deposit,
          platform_fee: calculatePrice.deposit * 0.05,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product?.id,
        business_id: product?.business_id,
        product_name: product?.name || '',
        product_price: calculatePrice.deposit,
        quantity: 1,
        subtotal: calculatePrice.deposit,
      });

      // Create reservation
      const { error: resError } = await supabase
        .from('reservations')
        .insert({
          order_id: order.id,
          product_id: product?.id,
          business_id: product?.business_id,
          customer_id: user.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          deposit_amount: calculatePrice.deposit,
          total_price: calculatePrice.total,
          status: 'pending',
        });

      if (resError) throw resError;

      setStep('payment');
      toast.success('Reservation created! Please complete payment.');
    } catch (error: any) {
      console.error('Reservation error:', error);
      toast.error('Failed to create reservation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate payment for now - integrate with PayPack
      const { data, error } = await supabase.functions.invoke('paypack-payment', {
        body: {
          action: 'initiate',
          phone: customerInfo.phone,
          amount: Math.round(calculatePrice.deposit * 100),
        },
      });

      if (error) throw error;

      setStep('success');
      toast.success('Payment initiated! Check your phone.');
      
      setTimeout(() => {
        navigate('/account');
      }, 3000);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-64 mb-4" />
            <div className="grid lg:grid-cols-2 gap-8">
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Book Your Stay</h1>
          <p className="text-muted-foreground mb-8">
            Reserve {product.name} from {product.business?.name}
          </p>

          {step === 'success' ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-8 text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Reservation Confirmed!</h2>
                <p className="text-muted-foreground mb-4">
                  Check your phone to complete the deposit payment. You'll receive a confirmation once payment is verified.
                </p>
                <Button onClick={() => navigate('/account')} className="gradient-primary border-0">
                  View My Reservations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Booking Form */}
              <div className="space-y-6">
                {/* Product Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-24 w-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">📅</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.business?.name}</p>
                        <p className="text-lg font-bold text-primary mt-1">
                          ${Number(product.price).toFixed(2)} {priceUnitLabels[product.price_unit || 'fixed']}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Date/Time Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Check-in Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Check-in Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Check-out Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              disabled={(date) => date < (startDate || new Date())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Check-out Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Info */}
                {!user ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Please <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth?mode=signup&role=customer')}>sign in</Button> to make a reservation.
                    </AlertDescription>
                  </Alert>
                ) : step === 'booking' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(p => ({ ...p, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone (for Mobile Money) *</Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo(p => ({ ...p, phone: e.target.value }))}
                            placeholder="+250..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summary & Policies */}
              <div className="space-y-6">
                {/* Price Summary */}
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>
                      {step === 'payment' ? 'Complete Payment' : 'Reservation Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {startDate && endDate && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration</span>
                          <span>{calculatePrice.duration} {calculatePrice.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            ${Number(product.price).toFixed(2)} × {calculatePrice.duration} {calculatePrice.unit}
                          </span>
                          <span>${calculatePrice.total.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Deposit Required</span>
                          <span className="text-primary">${calculatePrice.deposit.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {step === 'booking' && (
                      <Button
                        className="w-full gradient-primary border-0"
                        onClick={handleCreateReservation}
                        disabled={!startDate || !endDate || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Reservation...
                          </>
                        ) : (
                          'Proceed to Payment'
                        )}
                      </Button>
                    )}

                    {step === 'payment' && (
                      <div className="space-y-3">
                        <Alert className="bg-primary/10 border-primary/30">
                          <Smartphone className="h-4 w-4 text-primary" />
                          <AlertDescription className="text-foreground">
                            Click below to pay via Mobile Money. You'll receive a prompt on <strong>{customerInfo.phone}</strong>.
                          </AlertDescription>
                        </Alert>
                        <Button
                          className="w-full gradient-primary border-0"
                          onClick={handlePayment}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-4 w-4 mr-2" />
                              Pay ${calculatePrice.deposit.toFixed(2)} Deposit
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {step === 'processing' && (
                      <div className="py-8 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Processing your payment...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Policies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Reservation Policies
                    </CardTitle>
                    <CardDescription>
                      Please read these important policies before booking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Service Completed</p>
                        <p className="text-xs text-muted-foreground">
                          When you attend and complete your reservation, the full deposit goes to the business.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Cancellation</p>
                        <p className="text-xs text-muted-foreground">
                          If you cancel before check-in time, you receive <strong>50% refund</strong>. The business keeps 50%.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">No-Show</p>
                        <p className="text-xs text-muted-foreground">
                          If you don't show up, you receive <strong>50% refund</strong>. The business keeps 50%.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <RefreshCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Issues & Disputes</p>
                        <p className="text-xs text-muted-foreground">
                          Contact support if you have issues with your reservation. We'll mediate between you and the business.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}