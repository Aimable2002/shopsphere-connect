import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerOrders, useBusinessOrders } from '@/hooks/useOrders';
import { useUpdateOrderStatus } from '@/hooks/useUpdateOrderStatus';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, DollarSign, Settings, Store, Phone, User, MapPin, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { OrderStatus } from '@/types';

const statusOptions: OrderStatus[] = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function OrderCard({ order, isBusiness }: { order: any; isBusiness: boolean }) {
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">${Number(order.total_amount).toFixed(2)}</p>
        </div>
      </div>

      {isBusiness && (
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            {order.customer_name}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {order.customer_phone}
          </div>
          {order.customer_address && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {order.customer_address}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {isBusiness ? (
          <Select
            value={order.status}
            onValueChange={(value) => handleStatusChange(value as OrderStatus)}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${statusColors[status].split(' ')[0]}`} />
                    <span className="capitalize">{status}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge className={statusColors[order.status as OrderStatus]}>
            {order.status}
          </Badge>
        )}

        {order.items && order.items.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {order.items.length} item{order.items.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const { user, userRole, business, profile, loading, refreshBusiness, refreshProfile } = useAuth();
  const customerOrders = useCustomerOrders();
  const businessOrders = useBusinessOrders(business?.id || '');
  
  // Enable real-time order updates for businesses
  useRealtimeOrders(userRole === 'business' ? business?.id : undefined);

  const [businessForm, setBusinessForm] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (business) {
      setBusinessForm({
        name: business.name || '',
        description: business.description || '',
        phone: business.phone || '',
        address: business.address || '',
      });
    }
  }, [business]);

  const handleCreateBusiness = async () => {
    if (!businessForm.name || !businessForm.phone) {
      toast.error('Please fill in business name and phone');
      return;
    }

    const { error } = await supabase.from('businesses').insert({
      user_id: user!.id,
      name: businessForm.name,
      description: businessForm.description,
      phone: businessForm.phone,
      address: businessForm.address,
    });

    if (error) {
      toast.error('Failed to create business');
    } else {
      toast.success('Business created successfully!');
      refreshBusiness();
    }
  };

  const handleUpdateBusiness = async () => {
    if (!business) return;

    const { error } = await supabase.from('businesses').update({
      name: businessForm.name,
      description: businessForm.description,
      phone: businessForm.phone,
      address: businessForm.address,
    }).eq('id', business.id);

    if (error) {
      toast.error('Failed to update business');
    } else {
      toast.success('Business updated!');
      refreshBusiness();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const orders = userRole === 'business' ? businessOrders.data : customerOrders.data;
  const totalOrderValue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          {userRole === 'business' ? 'Business Dashboard' : 'My Account'}
        </h1>

        {userRole === 'business' && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{orders?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${totalOrderValue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Store className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold">${Number(business?.balance || 0).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders?.length ? (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isBusiness={userRole === 'business'}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            {userRole === 'business' && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Business Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input value={businessForm.name} onChange={(e) => setBusinessForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone (for payments)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" value={businessForm.phone} onChange={(e) => setBusinessForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250..." />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={businessForm.description} onChange={(e) => setBusinessForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={businessForm.address} onChange={(e) => setBusinessForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <Button onClick={business ? handleUpdateBusiness : handleCreateBusiness} className="gradient-primary border-0">
                    {business ? 'Update Business' : 'Create Business'}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Email: {profile?.email || user?.email}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
