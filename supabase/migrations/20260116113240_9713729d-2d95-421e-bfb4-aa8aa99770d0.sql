-- Step 1: Add 'apartments' to product_category enum
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'apartments';

-- Step 2: Create reservations table for booking management
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'no_show', 'cancelled')),
  customer_attended BOOLEAN DEFAULT NULL,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  business_payout NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Policies for reservations
CREATE POLICY "Customers can view their reservations" 
ON public.reservations FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Business owners can view their reservations" 
ON public.reservations FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.businesses WHERE id = reservations.business_id AND user_id = auth.uid())
);

CREATE POLICY "Customers can create reservations" 
ON public.reservations FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Business owners can update reservations" 
ON public.reservations FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.businesses WHERE id = reservations.business_id AND user_id = auth.uid())
);

CREATE POLICY "Customers can cancel their reservations" 
ON public.reservations FOR UPDATE 
USING (auth.uid() = customer_id AND status IN ('pending', 'confirmed'));

-- Add reservation pricing fields to products
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS price_unit TEXT DEFAULT 'fixed' CHECK (price_unit IN ('fixed', 'per_hour', 'per_day', 'per_night')),
  ADD COLUMN IF NOT EXISTS min_duration_hours INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_duration_hours INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_reservable BOOLEAN DEFAULT false;

-- Trigger for updating timestamps
CREATE TRIGGER update_reservations_updated_at 
BEFORE UPDATE ON public.reservations 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for reservations
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;