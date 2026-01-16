import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, Plus, Minus, ShoppingBag, AlertCircle, Truck, Smartphone, 
  Loader2, CheckCircle, Info, Package, Clock, XCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getTotalPrice, getPlatformFee, getGrandTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const createOrder = useCreateOrder();

  const [customerInfo, setCustomerInfo] = useState({
    name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });

  const [paymentStep, setPaymentStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (profile) {
      setCustomerInfo(prev => ({
        name: prev.name || profile.full_name || '',
        email: prev.email || profile.email || '',
        phone: prev.phone || profile.phone || '',
        address: prev.address || profile.address || '',
      }));
    }
  }, [profile]);

  const handleCreateOrder = async () => {
    if (!user) {
      toast.info('Please sign in to complete your order');
      navigate('/auth?mode=signup&role=customer');
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast.error('Please fill in all contact information');
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        total_amount: getGrandTotal(),
        platform_fee: getPlatformFee(),
        items: items.map(item => ({
          product_id: item.product.id,
          business_id: item.product.business_id,
          product_name: item.product.name,
          product_price: Number(item.product.price),
          quantity: item.quantity,
          subtotal: Number(item.product.price) * item.quantity,
        })),
      });

      setCurrentOrderId(order.id);
      setPaymentStep('payment');
      toast.success('Order created! Please complete payment.');
    } catch (error) {
      toast.error('Failed to create order. Please try again.');
    }
  };

  const handlePayPackPayment = async () => {
    if (!currentOrderId || !customerInfo.phone) {
      toast.error('Phone number is required for mobile money payment');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStep('processing');

    try {
      const { data, error } = await supabase.functions.invoke('paypack-payment', {
        body: {
          action: 'initiate',
          orderId: currentOrderId,
          phone: customerInfo.phone,
          amount: Math.round(getGrandTotal() * 100),
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || 'Payment initiated! Check your phone.');
        setPaymentStep('success');
        clearCart();
        
        setTimeout(() => {
          navigate('/account');
        }, 3000);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
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
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to get started!</p>
          <Button onClick={() => navigate('/')} className="gradient-primary border-0">
            Browse Products
          </Button>
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
            <div className="h-24 w-24 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Initiated!</h1>
            <p className="text-muted-foreground mb-6">
              Please check your phone to confirm the mobile money payment. 
              Your order will be confirmed once payment is received.
            </p>
            <Button onClick={() => navigate('/account')} className="gradient-primary border-0">
              View My Orders
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Shopping Cart</h1>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items - Mobile optimized */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 order-2 lg:order-1">
            {items.map(item => (
              <Card key={item.product.id} className="border-border/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Product Image - Smaller on mobile */}
                    <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info - Mobile layout */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{item.product.name}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.product.business?.name}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => removeFromCart(item.product.id)} 
                          disabled={paymentStep !== 'info'}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      {/* Price and Quantity - Mobile stack */}
                      <div className="flex items-center justify-between mt-2 sm:mt-3">
                        <p className="text-base sm:text-lg font-bold text-primary">${Number(item.product.price).toFixed(2)}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8" 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)} 
                            disabled={paymentStep !== 'info'}
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8" 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)} 
                            disabled={paymentStep !== 'info'}
                          >
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

          {/* Order Summary - Shows first on mobile */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <Card className="border-border/50 lg:sticky lg:top-24">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  {paymentStep === 'info' && 'Order Summary'}
                  {paymentStep === 'payment' && 'Complete Payment'}
                  {paymentStep === 'processing' && 'Processing Payment'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Platform Fee (5%)</span>
                  <span>${getPlatformFee().toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${getGrandTotal().toFixed(2)}</span>
                </div>

                {paymentStep === 'info' && (
                  <>
                    {user ? (
                      <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-sm">Full Name</Label>
                          <Input 
                            className="h-9 sm:h-10"
                            value={customerInfo.name} 
                            onChange={(e) => setCustomerInfo(p => ({ ...p, name: e.target.value }))} 
                          />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-sm">Email</Label>
                          <Input 
                            className="h-9 sm:h-10"
                            type="email" 
                            value={customerInfo.email} 
                            onChange={(e) => setCustomerInfo(p => ({ ...p, email: e.target.value }))} 
                          />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-sm">Phone (for Mobile Money)</Label>
                          <div className="relative">
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              className="pl-10 h-9 sm:h-10" 
                              value={customerInfo.phone} 
                              onChange={(e) => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} 
                              placeholder="+250..."
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-sm">Delivery Address</Label>
                          <Input 
                            className="h-9 sm:h-10"
                            value={customerInfo.address} 
                            onChange={(e) => setCustomerInfo(p => ({ ...p, address: e.target.value }))} 
                          />
                        </div>
                        <Button 
                          className="w-full gradient-primary border-0 h-10 sm:h-11" 
                          onClick={handleCreateOrder} 
                          disabled={createOrder.isPending}
                        >
                          {createOrder.isPending ? 'Creating Order...' : 'Proceed to Payment'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2 sm:pt-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">Please sign in to complete your order.</AlertDescription>
                        </Alert>
                        <Button 
                          className="w-full gradient-primary border-0 h-10 sm:h-11" 
                          onClick={() => navigate('/auth?mode=signup&role=customer')}
                        >
                          Sign In to Checkout
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {paymentStep === 'payment' && (
                  <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                    <Alert className="bg-primary/10 border-primary/30">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-foreground text-sm">
                        Click below to pay via Mobile Money. You'll receive a prompt on <strong>{customerInfo.phone}</strong>.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      className="w-full gradient-primary border-0 h-10 sm:h-11" 
                      onClick={handlePayPackPayment}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Initiating Payment...
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-4 w-4 mr-2" />
                          Pay with Mobile Money
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full h-10 sm:h-11" 
                      onClick={() => setPaymentStep('info')}
                      disabled={isProcessingPayment}
                    >
                      Go Back
                    </Button>
                  </div>
                )}

                {paymentStep === 'processing' && (
                  <div className="py-6 sm:py-8 text-center">
                    <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm sm:text-base">Processing your payment...</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">Please check your phone for the payment prompt.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Policies - Mobile optimized */}
            <Card className="border-border/50">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                  Order Policies
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Important information about your order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex gap-2 sm:gap-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Delivery</p>
                    <p className="text-xs text-muted-foreground">
                      Delivery fees are paid offline when goods arrive and will be communicated during transport.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Order Confirmation</p>
                    <p className="text-xs text-muted-foreground">
                      Orders are confirmed once payment is verified. You'll receive status updates via your phone.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Processing Time</p>
                    <p className="text-xs text-muted-foreground">
                      Businesses will process your order after payment confirmation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Issues & Support</p>
                    <p className="text-xs text-muted-foreground">
                      Contact support if you have any issues with your order. We'll help resolve any problems.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
