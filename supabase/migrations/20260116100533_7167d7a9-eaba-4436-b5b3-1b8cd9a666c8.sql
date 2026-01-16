DROP POLICY IF EXISTS "Customers can view their payment" ON public.payment;

CREATE POLICY "Customers can view their payments" 
ON public.payment FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = payment.order_id 
    AND customer_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can create payment" ON public.payment;

CREATE POLICY "Customers can create payments" 
ON public.payment FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = payment.order_id 
    AND customer_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Business owners can view payments" ON public.payment;

CREATE POLICY "Business owners can view payments" 
ON public.payment FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    JOIN public.businesses ON orders.business_id = businesses.id
    WHERE orders.id = payment.order_id 
    AND businesses.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage payments" ON public.payment;

CREATE POLICY "Service role can manage payments" 
ON public.payment FOR ALL 
USING (true) 
WITH CHECK (true);