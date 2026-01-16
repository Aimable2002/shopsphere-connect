-- Add price_unit and is_reservable columns to products if not exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_unit text NOT NULL DEFAULT 'fixed';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_reservable boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_duration_hours integer;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_duration_hours integer;

-- Create admin_users table to track admin emails
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admin users can view admin_users table (check via database function)
CREATE POLICY "Only admins can view admin_users"
ON public.admin_users
FOR SELECT
USING (
  auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users)
);

-- Insert initial admin user
INSERT INTO public.admin_users (email) 
VALUES ('isupplya.b2b@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Create platform_transactions table for tracking platform finances
CREATE TABLE IF NOT EXISTS public.platform_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  transaction_type text NOT NULL, -- 'platform_fee', 'payout', 'refund'
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on platform_transactions
ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;

-- Only admins can view platform transactions
CREATE POLICY "Only admins can view platform_transactions"
ON public.platform_transactions
FOR SELECT
USING (
  auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users)
);

-- Only admins can insert platform transactions
CREATE POLICY "Only admins can insert platform_transactions"
ON public.platform_transactions
FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users)
);

-- Only admins can update platform transactions
CREATE POLICY "Only admins can update platform_transactions"
ON public.platform_transactions
FOR UPDATE
USING (
  auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users)
);

-- Create function to check if user is admin (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
  )
$$;

-- Create function to get platform stats (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_platform_fees', COALESCE(SUM(platform_fee), 0),
    'total_orders', COUNT(*),
    'pending_orders', COUNT(*) FILTER (WHERE status = 'pending'),
    'completed_orders', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_order_value', COALESCE(SUM(total_amount), 0)
  )
  FROM public.orders
$$;