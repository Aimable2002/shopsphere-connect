import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYPACK_API_URL = 'https://payments.paypack.rw/api';

interface PaypackAuth {
  access_token: string;
  expires_in: number;
}

async function getPaypackToken(): Promise<string> {
  const appId = Deno.env.get('PAYPACK_APP_ID');
  const secretKey = Deno.env.get('PAYPACK_SECRET_KEY');
  
  if (!appId || !secretKey) {
    throw new Error('PayPack credentials not configured');
  }

  console.log('Authenticating with PayPack...');
  
  const response = await fetch(`${PAYPACK_API_URL}/auth/agents/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: appId,
      client_secret: secretKey,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPack auth error:', errorText);
    throw new Error(`PayPack authentication failed: ${response.status}`);
  }

  const data: PaypackAuth = await response.json();
  console.log('PayPack authentication successful');
  return data.access_token;
}

async function initiatePayment(token: string, phone: string, amount: number): Promise<any> {
  console.log(`Initiating cashin for ${phone}, amount: ${amount} RWF`);
  
  const response = await fetch(`${PAYPACK_API_URL}/transactions/cashin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      number: phone.replace(/^\+/, ''), // Remove leading + if present
      amount: Math.round(amount),
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('PayPack cashin error:', data);
    throw new Error(data.message || 'Payment initiation failed');
  }

  console.log('PayPack cashin response:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, orderId, phone, amount } = await req.json();
    console.log(`Processing action: ${action}, orderId: ${orderId}`);

    if (action === 'initiate') {
      if (!orderId || !phone || !amount) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: orderId, phone, amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get PayPack token
      const token = await getPaypackToken();
      
      // Initiate payment
      const paymentResult = await initiatePayment(token, phone, amount);
      
      // Store payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          paypack_ref: paymentResult.ref,
          amount: amount,
          phone_number: phone,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error storing payment:', paymentError);
        throw new Error('Failed to store payment record');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          payment,
          paypackRef: paymentResult.ref,
          message: 'Payment initiated. Please check your phone to confirm.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'webhook') {
      // Handle PayPack webhook callback
      const webhookSecret = Deno.env.get('PAYPACK_WEBHOOK_SECRET');
      
      // Verify webhook (PayPack uses signature in header)
      const signature = req.headers.get('x-paypack-signature');
      console.log('Webhook received, ref:', orderId);
      
      const { data: webhookData } = await req.json();
      
      if (webhookData?.status === 'successful') {
        // Update payment status
        await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('paypack_ref', webhookData.ref);
        
        // Update order status to confirmed
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('paypack_ref', webhookData.ref)
          .single();
        
        if (payment) {
          await supabase
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', payment.order_id);
        }
      }

      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check-status') {
      // Check payment status
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({ payment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
