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
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, Smartphone, Loader2, CheckCircle, CalendarClock } from 'lucide-react';
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
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Group items by business
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
      const { data, error } = await supabase.functions.invoke('paypack-payment', {
        body: {
          action: 'initiate',
          phone: customerInfo.phone,
          amount: Math.round(getGrandTotal() * 100),
        },
      });

      if (error) throw error;

      setPaymentStep('success');
      clearCart();
      toast.success('Payment initiated! Check your phone.');
      
      setTimeout(() => navigate('/account'), 3000);
    } catch (error: any) {
      toast.error('Payment failed. Please try again.');
      setPaymentStep('payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (items.length === 0 && paymentStep !== 'success') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to get started!</p>
          <Button onClick={() => navigate('/')} className="gradient-primary border-0">Browse Products</Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <CheckCircle className="h-24 w-24 mx-auto text-green-500 mb-6" />
            <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
            <p className="text-muted-foreground mb-6">Check your phone to complete mobile money payment.</p>
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
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <Card key={item.product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">{item.product.name}</h3>
                          {item.startDate && item.endDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <CalendarClock className="h-3 w-3" />
                              {format(item.startDate, 'MMM d')} - {format(item.endDate, 'MMM d')}
                              {item.duration && ` (${item.duration} ${item.durationUnit})`}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)} disabled={paymentStep !== 'info'}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">
                          ${item.calculatedPrice?.toFixed(2) || (Number(item.product.price) * item.quantity).toFixed(2)}
                        </span>
                        {!item.calculatedPrice && (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} disabled={paymentStep !== 'info'}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={paymentStep !== 'info'}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card className="h-fit sticky top-24">
            <CardHeader>
              <CardTitle>{paymentStep === 'payment' ? 'Complete Payment' : 'Order Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${getTotalPrice().toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee (5%)</span><span>${getPlatformFee().toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">${getGrandTotal().toFixed(2)}</span></div>

              {paymentStep === 'info' && (
                user ? (
                  <div className="space-y-3 pt-4">
                    <div className="space-y-2"><Label>Full Name</Label><Input value={customerInfo.name} onChange={(e) => setCustomerInfo(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Phone (Mobile Money)</Label><Input value={customerInfo.phone} onChange={(e) => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="+250..." /></div>
                    <div className="space-y-2"><Label>Delivery Address</Label><Input value={customerInfo.address} onChange={(e) => setCustomerInfo(p => ({ ...p, address: e.target.value }))} /></div>
                    <Button className="w-full gradient-primary border-0" onClick={handleCreateOrder} disabled={createOrder.isPending}>
                      {createOrder.isPending ? 'Creating Order...' : 'Proceed to Payment'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-4">
                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Please sign in to complete your order.</AlertDescription></Alert>
                    <Button className="w-full gradient-primary border-0" onClick={() => navigate('/auth?mode=signup&role=customer', { state: { from: location.pathname } })}>Sign In to Checkout</Button>
                  </div>
                )
              )}

              {paymentStep === 'payment' && (
                <div className="space-y-3 pt-4">
                  <Button className="w-full gradient-primary border-0" onClick={handlePayment} disabled={isProcessingPayment}>
                    {isProcessingPayment ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : <><Smartphone className="h-4 w-4 mr-2" />Pay with Mobile Money</>}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setPaymentStep('info')} disabled={isProcessingPayment}>Go Back</Button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-8 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Processing payment...</p>
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
