-- Add reservation-specific fields to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_reservation boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS check_in_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS check_out_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS reservation_status text DEFAULT 'scheduled';

-- Update get_platform_stats to return more detailed data
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total_platform_fees', COALESCE(SUM(platform_fee), 0),
    'total_orders', COUNT(*),
    'pending_orders', COUNT(*) FILTER (WHERE status = 'pending' AND is_reservation = false),
    'completed_orders', COUNT(*) FILTER (WHERE status = 'completed' AND is_reservation = false),
    'total_order_value', COALESCE(SUM(total_amount), 0),
    'pending_order_value', COALESCE(SUM(total_amount) FILTER (WHERE status = 'pending' AND is_reservation = false), 0),
    'completed_order_value', COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed' AND is_reservation = false), 0),
    'scheduled_reservations', COUNT(*) FILTER (WHERE is_reservation = true AND reservation_status = 'scheduled'),
    'scheduled_reservation_value', COALESCE(SUM(total_amount) FILTER (WHERE is_reservation = true AND reservation_status = 'scheduled'), 0),
    'checkedin_reservations', COUNT(*) FILTER (WHERE is_reservation = true AND reservation_status = 'checked_in'),
    'checkedin_reservation_value', COALESCE(SUM(total_amount) FILTER (WHERE is_reservation = true AND reservation_status = 'checked_in'), 0),
    'checkedout_reservations', COUNT(*) FILTER (WHERE is_reservation = true AND reservation_status = 'checked_out'),
    'checkedout_reservation_value', COALESCE(SUM(total_amount) FILTER (WHERE is_reservation = true AND reservation_status = 'checked_out'), 0),
    'cancelled_reservations', COUNT(*) FILTER (WHERE is_reservation = true AND reservation_status = 'cancelled'),
    'cancelled_reservation_value', COALESCE(SUM(total_amount) FILTER (WHERE is_reservation = true AND reservation_status = 'cancelled'), 0),
    'platform_holding', COALESCE(SUM(total_amount) FILTER (WHERE is_reservation = true AND reservation_status IN ('scheduled', 'checked_in')), 0),
    'platform_payout_pending', COALESCE(SUM(total_amount - platform_fee) FILTER (WHERE status = 'completed' OR reservation_status = 'checked_out'), 0)
  )
  FROM public.orders
$$;

-- Allow admins to view all orders for admin dashboard
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.is_admin());