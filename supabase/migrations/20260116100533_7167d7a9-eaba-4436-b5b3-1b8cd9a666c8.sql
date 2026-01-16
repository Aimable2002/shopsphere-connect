-- Enable realtime for orders and order_items tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Create payments table to track PayPack transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  paypack_ref TEXT,
  amount NUMERIC(10,2) NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Customers can view their payments" 
ON public.payments FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payments.order_id AND customer_id = auth.uid())
);

CREATE POLICY "Customers can create payments" 
ON public.payments FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payments.order_id AND customer_id = auth.uid())
);

-- Trigger for updating timestamps
CREATE TRIGGER update_payments_updated_at 
BEFORE UPDATE ON public.payments 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();