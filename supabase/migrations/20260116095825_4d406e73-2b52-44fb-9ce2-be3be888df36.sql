-- Allow business owners to update order status for orders containing their products
CREATE POLICY "Business owners can update order status" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi 
    JOIN public.businesses b ON oi.business_id = b.id 
    WHERE oi.order_id = orders.id AND b.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_items oi 
    JOIN public.businesses b ON oi.business_id = b.id 
    WHERE oi.order_id = orders.id AND b.user_id = auth.uid()
  )
);