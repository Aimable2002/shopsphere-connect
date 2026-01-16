import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYPACK_API_URL = 'https://payments.paypack.rw/api';

interface PaypackAuth {
  access: string;
  refresh: string;
  expires_in: number;
  created_at?: number;
}

let tokenCache: PaypackAuth = {
  access: '',
  refresh: '',
  expires_in: 0,
  created_at: 0
};

async function getPaypackToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache.access && tokenCache.created_at) {
    const expiresInMs = tokenCache.expires_in * 1000;
    if (now - tokenCache.created_at < expiresInMs) {
      return tokenCache.access;
    }

    if (tokenCache.refresh) {
      try {
        const refreshRes = await fetch(
          `${PAYPACK_API_URL}/auth/refresh/${tokenCache.refresh}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (refreshRes.ok) {
          const refreshedData = await refreshRes.json();
          tokenCache = {
            ...refreshedData,
            created_at: now
          };
          return tokenCache.access;
        }
      } catch (err) {
        console.log('Token refresh failed:', err);
      }
    }
  }

  const appId = Deno.env.get('PAYPACK_APP_ID');
  const secretKey = Deno.env.get('PAYPACK_SECRET_KEY');
  
  if (!appId || !secretKey) {
    throw new Error('PayPack credentials not configured');
  }

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
    throw new Error(`PayPack authentication failed: ${response.status}`);
  }

  const data = await response.json();
  tokenCache = {
    ...data,
    created_at: now
  };

  return tokenCache.access;
}

async function initiatePayment(token: string, phone: string, amount: number): Promise<any> {
  const response = await fetch(`${PAYPACK_API_URL}/transactions/cashin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Webhook-Mode': 'development',
    },
    body: JSON.stringify({
      number: phone.replace(/^\+/, ''),
      amount: Math.round(amount),
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Payment initiation failed');
  }

  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paypack-signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, orderId, phone, amount } = await req.json();

    if (action === 'initiate') {
      if (!orderId || !phone || !amount) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: orderId, phone, amount' }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            } 
          }
        );
      }

      const token = await getPaypackToken();
      const paymentResult = await initiatePayment(token, phone, amount);
      
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
        throw new Error('Failed to store payment record');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          payment,
          paypackRef: paymentResult.ref,
          message: 'Payment initiated. Please check your phone to confirm.'
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    if (action === 'webhook') {
      const webhookSecret = Deno.env.get('PAYPACK_WEBHOOK_SECRET');
      const signature = req.headers.get('x-paypack-signature');
      
      const { data: webhookData } = await req.json();
      
      if (webhookData?.status === 'successful') {
        await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('paypack_ref', webhookData.ref);
        
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
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    if (action === 'check-status') {
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({ payment }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});