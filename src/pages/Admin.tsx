import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, Package, TrendingUp, Clock, CheckCircle, AlertCircle, Shield, 
  Calendar, LogIn, LogOut, XCircle, Wallet, CreditCard, Building2
} from 'lucide-react';
import { PlatformStats, OrderWithBusiness } from '@/types';
import { format } from 'date-fns';

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_stats');
      if (error) throw error;
      return data as unknown as PlatformStats;
    },
    enabled: isAdmin,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, businesses(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as OrderWithBusiness[];
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Filter orders by type
  const pendingOrders = orders?.filter(o => !o.is_reservation && o.status === 'pending') || [];
  const completedOrders = orders?.filter(o => !o.is_reservation && o.status === 'completed') || [];
  const scheduledReservations = orders?.filter(o => o.is_reservation && o.reservation_status === 'scheduled') || [];
  const checkedInReservations = orders?.filter(o => o.is_reservation && o.reservation_status === 'checked_in') || [];
  const checkedOutReservations = orders?.filter(o => o.is_reservation && o.reservation_status === 'checked_out') || [];
  const cancelledReservations = orders?.filter(o => o.is_reservation && o.reservation_status === 'cancelled') || [];

  const formatCurrency = (amount: number) => `RF${Number(amount || 0).toLocaleString()}`;

  const OrderTable = ({ ordersList, showReservationDates = false }: { ordersList: OrderWithBusiness[], showReservationDates?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business</TableHead>
          <TableHead>Customer</TableHead>
          {showReservationDates && (
            <>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
            </>
          )}
          <TableHead>Amount</TableHead>
          <TableHead>Platform Fee</TableHead>
          <TableHead>Business Payout</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordersList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showReservationDates ? 8 : 6} className="text-center text-muted-foreground py-8">
              No records found
            </TableCell>
          </TableRow>
        ) : (
          ordersList.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.businesses?.name || 'Unknown'}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                </div>
              </TableCell>
              {showReservationDates && (
                <>
                  <TableCell>
                    {order.check_in_date ? format(new Date(order.check_in_date), 'MMM dd, yyyy HH:mm') : '-'}
                  </TableCell>
                  <TableCell>
                    {order.check_out_date ? format(new Date(order.check_out_date), 'MMM dd, yyyy HH:mm') : '-'}
                  </TableCell>
                </>
              )}
              <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
              <TableCell className="text-primary">{formatCurrency(order.platform_fee)}</TableCell>
              <TableCell className="text-green-600">{formatCurrency(order.total_amount - order.platform_fee)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(order.created_at), 'MMM dd, yyyy')}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Wallet Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Platform Wallet
          </h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Platform Fees Earned</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.total_platform_fees || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transaction Value</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.total_order_value || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/10">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Holding (Active Reservations)</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats?.platform_holding || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-500/10">
                    <CreditCard className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Business Payouts</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.platform_payout_pending || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Orders Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders Overview
          </h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                    <p className="text-3xl font-bold">{stats?.pending_orders || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Value: {formatCurrency(stats?.pending_order_value || 0)}</p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Orders</p>
                    <p className="text-3xl font-bold">{stats?.completed_orders || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Value: {formatCurrency(stats?.completed_order_value || 0)}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-3xl font-bold">{stats?.total_orders || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">All time</p>
                  </div>
                  <Package className="h-10 w-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reservations Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Reservations Overview
          </h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Scheduled
                    </p>
                    <p className="text-2xl font-bold">{stats?.scheduled_reservations || 0}</p>
                    <p className="text-sm text-blue-600 mt-1">{formatCurrency(stats?.scheduled_reservation_value || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <LogIn className="h-4 w-4" /> Checked In
                    </p>
                    <p className="text-2xl font-bold">{stats?.checkedin_reservations || 0}</p>
                    <p className="text-sm text-green-600 mt-1">{formatCurrency(stats?.checkedin_reservation_value || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <LogOut className="h-4 w-4" /> Checked Out
                    </p>
                    <p className="text-2xl font-bold">{stats?.checkedout_reservations || 0}</p>
                    <p className="text-sm text-purple-600 mt-1">{formatCurrency(stats?.checkedout_reservation_value || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Cancelled
                    </p>
                    <p className="text-2xl font-bold">{stats?.cancelled_reservations || 0}</p>
                    <p className="text-sm text-red-600 mt-1">{formatCurrency(stats?.cancelled_reservation_value || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Lists */}
        <div className="mt-8">
          <Tabs defaultValue="pending-orders" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-2 mb-4">
              <TabsTrigger value="pending-orders" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Pending Orders ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed-orders" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Completed Orders ({completedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Scheduled ({scheduledReservations.length})
              </TabsTrigger>
              <TabsTrigger value="checked-in" className="flex items-center gap-1">
                <LogIn className="h-4 w-4" />
                Checked In ({checkedInReservations.length})
              </TabsTrigger>
              <TabsTrigger value="checked-out" className="flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Checked Out ({checkedOutReservations.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                Cancelled ({cancelledReservations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending-orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Pending Orders
                    <Badge variant="secondary">{formatCurrency(stats?.pending_order_value || 0)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTable ordersList={pendingOrders} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed-orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Completed Orders
                    <Badge variant="secondary">{formatCurrency(stats?.completed_order_value || 0)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTable ordersList={completedOrders} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Scheduled Reservations
                    <Badge variant="secondary">{formatCurrency(stats?.scheduled_reservation_value || 0)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTable ordersList={scheduledReservations} showReservationDates />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checked-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="h-5 w-5 text-green-500" />
                    Currently Checked In
                    <Badge variant="secondary">{formatCurrency(stats?.checkedin_reservation_value || 0)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTable ordersList={checkedInReservations} showReservationDates />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checked-out">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogOut className="h-5 w-5 text-purple-500" />
                    Checked Out (Pending Payout)
                    <Badge variant="secondary">{formatCurrency(stats?.checkedout_reservation_value || 0)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTable ordersList={checkedOutReservations} showReservationDates />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cancelled">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Cancelled Reservations
                    <Badge variant="secondary">{formatCurrency(stats?.cancelled_reservation_value || 0)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTable ordersList={cancelledReservations} showReservationDates />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
