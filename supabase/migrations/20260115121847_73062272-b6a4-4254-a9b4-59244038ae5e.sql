-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('business', 'customer');

-- Create user_roles table to track user types
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add customer_user_id to orders table to link orders to authenticated customers
ALTER TABLE public.orders ADD COLUMN customer_user_id UUID REFERENCES auth.users(id);

-- Update orders RLS to allow customers to view their own orders
DROP POLICY IF EXISTS "Business owners can view their orders" ON public.orders;

CREATE POLICY "Business owners can view their orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = orders.business_id
      AND businesses.user_id = auth.uid()
    )
    OR customer_user_id = auth.uid()
  );

-- Update order_items RLS to allow customers to view their order items
DROP POLICY IF EXISTS "Business owners can view their order items" ON public.order_items;

CREATE POLICY "Users can view their order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN businesses b ON o.business_id = b.id
      WHERE o.id = order_items.order_id
      AND (b.user_id = auth.uid() OR o.customer_user_id = auth.uid())
    )
  );

-- Update order_items INSERT policy to require authentication
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

CREATE POLICY "Authenticated users can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update orders INSERT policy to require authentication
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND customer_user_id = auth.uid());