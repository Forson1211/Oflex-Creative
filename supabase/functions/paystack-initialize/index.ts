import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitializePaymentRequest {
  orderId: string;
  email: string;
  amount: number; // in dollars
  callbackUrl: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      throw new Error('Payment service not configured');
    }

    // Get auth header for user verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const { orderId, email, amount, callbackUrl }: InitializePaymentRequest = await req.json();

    console.log('Initializing Paystack payment:', { orderId, email, amount, userId: user.id });

    // Verify the order belongs to the user and is pending
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (orderError || !order) {
      console.error('Order not found or not pending:', orderError);
      throw new Error('Order not found or already processed');
    }

    // Convert amount to kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100);

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference: `order_${orderId}_${Date.now()}`,
        callback_url: callbackUrl,
        metadata: {
          order_id: orderId,
          user_id: user.id,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      throw new Error(paystackData.message || 'Failed to initialize payment');
    }

    console.log('Paystack payment initialized:', paystackData.data.reference);

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({ 
        payment_reference: paystackData.data.reference,
        payment_provider: 'paystack'
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        authorizationUrl: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in paystack-initialize:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
