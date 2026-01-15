import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessOrders, useBusinessStats, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { toast } from 'sonner';
import { Package, Settings, LogOut, DollarSign, ShoppingBag, Clock, Store, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Account = () => {
  const { user, business, userRole, signOut, refreshBusiness, loading } = useAuth();
  const navigate = useNavigate();
  const [businessForm, setBusinessForm] = useState({ name: '', description: '', phone_number: '', category: 'General', address: '' });
  const [saving, setSaving] = useState(false);

  const { data: businessOrders = [] } = useBusinessOrders(business?.id || '');
  const { data: stats } = useBusinessStats(business?.id || '');
  const { data: customerOrders = [] } = useCustomerOrders(user?.id || '');
  const updateStatus = useUpdateOrderStatus();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (business) setBusinessForm({ name: business.name, description: business.description || '', phone_number: business.phone_number || '', category: business.category, address: business.address || '' });
  }, [business]);

  const handleSaveBusiness = async () => {
    if (!businessForm.name) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      if (business) {
        await supabase.from('businesses').update(businessForm).eq('id', business.id);
      } else {
        await supabase.from('businesses').insert({ ...businessForm, user_id: user!.id });
      }
      await refreshBusiness();
      toast.success('Business saved!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center py-20">Loading...</div></Layout>;

  const isBusiness = userRole === 'business';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isBusiness ? <Store className="w-6 h-6 text-primary" /> : <User className="w-6 h-6 text-primary" />}
            <div>
              <h1 className="text-2xl font-bold">{isBusiness ? (business?.name || 'Set Up Your Business') : 'My Account'}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => { signOut(); navigate('/'); }}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
        </div>

        {/* Customer View */}
        {!isBusiness && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  My Orders
                </CardTitle>
                <CardDescription>Track your order history and status</CardDescription>
              </CardHeader>
              <CardContent>
                {customerOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button className="mt-4" onClick={() => navigate('/')}>Start Shopping</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order) => (
                      <Card key={order.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold">{order.business?.name || 'Business'}</p>
                                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                              <p className="text-sm mt-2">{order.order_items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}</p>
                              {order.business?.phone_number && (
                                <p className="text-sm mt-2 text-primary">Business Contact: {order.business.phone_number}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatPrice(Number(order.total_amount))}</p>
                              {order.status === 'pending' && (
                                <p className="text-xs text-muted-foreground mt-1">Awaiting payment confirmation</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Business View */}
        {isBusiness && (
          <>
            {business && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card><CardContent className="p-4 flex items-center gap-4"><ShoppingBag className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{stats?.totalOrders || 0}</p><p className="text-sm text-muted-foreground">Total Orders</p></div></CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-4"><DollarSign className="w-8 h-8 text-success" /><div><p className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</p><p className="text-sm text-muted-foreground">Revenue</p></div></CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-4"><Clock className="w-8 h-8 text-warning" /><div><p className="text-2xl font-bold">{formatPrice(stats?.pendingBalance || 0)}</p><p className="text-sm text-muted-foreground">Pending</p></div></CardContent></Card>
              </div>
            )}

            <Tabs defaultValue={business ? "orders" : "settings"}>
              <TabsList className="mb-6">
                {business && <TabsTrigger value="orders">Orders</TabsTrigger>}
                {business && <TabsTrigger value="menu" onClick={() => navigate('/menu')}>Menu</TabsTrigger>}
                <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                {businessOrders.length === 0 ? (
                  <div className="text-center py-12"><Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>No orders yet</p></div>
                ) : (
                  <div className="space-y-4">
                    {businessOrders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{order.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                              <p className="text-sm text-muted-foreground">{order.customer_address}</p>
                              <p className="text-sm mt-2">{order.order_items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatPrice(Number(order.total_amount) - Number(order.platform_fee))}</p>
                              <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ orderId: order.id, status: v })}>
                                <SelectTrigger className="w-32 mt-2"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label>Business Name *</Label><Input value={businessForm.name} onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })} /></div>
                    <div><Label>Description</Label><Textarea value={businessForm.description} onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })} /></div>
                    <div><Label>Phone Number (for payments)</Label><Input value={businessForm.phone_number} onChange={(e) => setBusinessForm({ ...businessForm, phone_number: e.target.value })} /></div>
                    <div><Label>Category</Label><Input value={businessForm.category} onChange={(e) => setBusinessForm({ ...businessForm, category: e.target.value })} /></div>
                    <div><Label>Address</Label><Input value={businessForm.address} onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })} /></div>
                    <Button onClick={handleSaveBusiness} disabled={saving}>{saving ? 'Saving...' : 'Save Business'}</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Account;
