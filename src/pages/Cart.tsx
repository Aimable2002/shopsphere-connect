import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, Smartphone, Loader2, CheckCircle, CalendarClock, Info, Bed, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, updateQuantity, removeFromCart, getTotalPrice, getPlatformFee, getGrandTotal, clearCart } = useCart();
  const { user } = useAuth();
  const createOrder = useCreateOrder();

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
  });

  const [paymentStep, setPaymentStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Separate reservations and regular products
  const reservations = items.filter(item => item.startDate && item.endDate);
  const products = items.filter(item => !item.startDate || !item.endDate);

  // Group products by business
  const itemsByBusiness = items.reduce((acc, item) => {
    const businessId = item.product.business_id;
    if (!acc[businessId]) {
      acc[businessId] = [];
    }
    acc[businessId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleCreateOrder = async () => {
    if (!user) {
      toast.info('Please sign in to complete your order');
      navigate('/auth?mode=signup&role=customer', { state: { from: location.pathname } });
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error('Please fill in all contact information');
      return;
    }

    try {
      // Create order for each business
      for (const [businessId, businessItems] of Object.entries(itemsByBusiness)) {
        const subtotal = businessItems.reduce((sum, item) => {
          if (item.calculatedPrice) return sum + item.calculatedPrice;
          return sum + Number(item.product.price) * item.quantity;
        }, 0);
        const platformFee = subtotal * 0.05;

        await createOrder.mutateAsync({
          business_id: businessId,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email || user.email || '',
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          total_amount: subtotal + platformFee,
          platform_fee: platformFee,
          items: businessItems.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            unit_price: item.calculatedPrice ? item.calculatedPrice : Number(item.product.price),
            quantity: item.quantity,
            total_price: item.calculatedPrice ? item.calculatedPrice : Number(item.product.price) * item.quantity,
          })),
        });
      }

      setPaymentStep('payment');
      toast.success('Order created! Please complete payment.');
    } catch (error) {
      toast.error('Failed to create order. Please try again.');
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    setPaymentStep('processing');
  
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please sign in to make payment');
      }
  
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', user?.email)
        .order('created_at', { ascending: false })
        .limit(1);
  
      if (ordersError || !orders?.[0]) {
        throw new Error('No order found');
      }
  
      const orderId = orders[0].id;
      const amount = Number(getGrandTotal());
  
      const { data, error } = await supabase.functions.invoke('paypack-payment', {
        body: {
          action: 'initiate',
          orderId: orderId,
          phone: customerInfo.phone,
          amount: amount,
        },
      });
  
      if (error) {
        throw new Error(error.message || 'Payment failed');
      }
  
      if (!data.success) {
        throw new Error(data.error || 'Payment initiation failed');
      }
  
      setPaymentStep('success');
      clearCart();
      toast.success('Payment initiated! Check your phone.');
      
      setTimeout(() => navigate('/account'), 3000);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setPaymentStep('payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (items.length === 0 && paymentStep !== 'success') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 sm:py-16 text-center">
          <ShoppingBag className="h-20 w-20 sm:h-24 sm:w-24 mx-auto text-muted-foreground/30 mb-4 sm:mb-6" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">Add some products or book a room to get started!</p>
          <Button onClick={() => navigate('/')} className="gradient-primary border-0">Browse Marketplace</Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="max-w-md mx-auto">
            <CheckCircle className="h-20 w-20 sm:h-24 sm:w-24 mx-auto text-green-500 mb-4 sm:mb-6" />
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Order Placed!</h1>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">Check your phone to complete mobile money payment.</p>
            <Button onClick={() => navigate('/account')} className="gradient-primary border-0">View My Orders</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Reservations Section */}
            {reservations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bed className="h-5 w-5 text-blue-500" />
                  <h2 className="font-semibold">Reservations ({reservations.length})</h2>
                </div>
                
                {/* Cancellation Policy */}
                <Alert className="mb-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>Cancellation Policy:</strong>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      <li>• Cancel before check-in: <span className="text-green-600 font-medium">100% refund</span></li>
                      <li>• Cancel during stay: <span className="text-yellow-600 font-medium">50% refund</span> (50% to business)</li>
                      <li>• Complete stay: <span className="text-blue-600 font-medium">Business receives full payment</span></li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {reservations.map(item => (
                    <Card key={item.product.id} className="border-blue-500/20">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {item.product.image_url ? (
                              <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                                <Bed className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-sm sm:text-base">{item.product.name}</h3>
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                  {item.product.category}
                                </span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.product.id)} disabled={paymentStep !== 'info'}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            
                            {/* Reservation Details */}
                            <div className="mt-2 p-2 rounded bg-muted/50 text-xs sm:text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-muted-foreground">Check-in:</span>
                                  <p className="font-medium">{format(item.startDate!, 'MMM d, yyyy')}</p>
                                  <p className="text-muted-foreground">{item.startTime}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Check-out:</span>
                                  <p className="font-medium">{format(item.endDate!, 'MMM d, yyyy')}</p>
                                  <p className="text-muted-foreground">{item.endTime}</p>
                                </div>
                              </div>
                              <Separator className="my-2" />
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                  {item.duration} {item.durationUnit} × RF{Number(item.product.price).toFixed(2)}
                                </span>
                                <span className="font-bold text-primary text-sm sm:text-base">
                                  RF{item.calculatedPrice?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            {products.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                  <h2 className="font-semibold">Products ({products.length})</h2>
                </div>

                <div className="space-y-3">
                  {products.map(item => (
                    <Card key={item.product.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {item.product.image_url ? (
                              <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-sm sm:text-base">{item.product.name}</h3>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.product.id)} disabled={paymentStep !== 'info'}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-primary text-sm sm:text-base">
                                RF{(Number(item.product.price) * item.quantity).toFixed(2)}
                              </span>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} disabled={paymentStep !== 'info'}>
                                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <span className="w-6 sm:w-8 text-center text-sm">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={paymentStep !== 'info'}>
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <Card className="h-fit lg:sticky lg:top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">{paymentStep === 'payment' ? 'Complete Payment' : 'Order Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {reservations.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reservations ({reservations.length})</span>
                  <span>RF{reservations.reduce((sum, item) => sum + (item.calculatedPrice || 0), 0).toFixed(2)}</span>
                </div>
              )}
              {products.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Products ({products.length})</span>
                  <span>RF{products.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>RF{getTotalPrice().toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Platform Fee (5%)</span><span>RF{getPlatformFee().toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-base sm:text-lg"><span>Total</span><span className="text-primary">RF{getGrandTotal().toFixed(2)}</span></div>

              {paymentStep === 'info' && (
                user ? (
                  <div className="space-y-3 pt-3 sm:pt-4">
                    <div className="space-y-1.5 sm:space-y-2"><Label className="text-xs sm:text-sm">Full Name</Label><Input className="h-9 sm:h-10 text-sm" value={customerInfo.name} onChange={(e) => setCustomerInfo(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="space-y-1.5 sm:space-y-2"><Label className="text-xs sm:text-sm">Phone (Mobile Money)</Label><Input className="h-9 sm:h-10 text-sm" value={customerInfo.phone} onChange={(e) => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="+250..." /></div>
                    <div className="space-y-1.5 sm:space-y-2"><Label className="text-xs sm:text-sm">Delivery/Contact Address</Label><Input className="h-9 sm:h-10 text-sm" value={customerInfo.address} onChange={(e) => setCustomerInfo(p => ({ ...p, address: e.target.value }))} /></div>
                    <Button className="w-full gradient-primary border-0" onClick={handleCreateOrder} disabled={createOrder.isPending}>
                      {createOrder.isPending ? 'Creating Order...' : 'Proceed to Payment'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-3 sm:pt-4">
                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs sm:text-sm">Please sign in to complete your order.</AlertDescription></Alert>
                    <Button className="w-full gradient-primary border-0" onClick={() => navigate('/auth?mode=signup&role=customer', { state: { from: location.pathname } })}>Sign In to Checkout</Button>
                  </div>
                )
              )}

              {paymentStep === 'payment' && (
                <div className="space-y-3 pt-3 sm:pt-4">
                  <Button className="w-full gradient-primary border-0" onClick={handlePayment} disabled={isProcessingPayment}>
                    {isProcessingPayment ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : <><Smartphone className="h-4 w-4 mr-2" />Pay with Mobile Money</>}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setPaymentStep('info')} disabled={isProcessingPayment}>Go Back</Button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-6 sm:py-8 text-center">
                  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-sm">Processing payment...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
