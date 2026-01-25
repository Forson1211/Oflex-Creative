import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
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

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('APP_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { reference }: { reference: string } = await req.json();

    console.log('Verifying Paystack payment:', reference);

    // Verify with Paystack API
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      console.log('Payment not successful:', paystackData);
      return new Response(
        JSON.stringify({
          success: false,
          status: paystackData.data?.status || 'failed',
          message: 'Payment not completed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const orderId = paystackData.data.metadata?.order_id;

    // Check if order is already completed
    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (order?.status === 'completed') {
      return new Response(
        JSON.stringify({ success: true, status: 'completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // If payment is successful but order not yet completed, process it now
    // (This is a backup in case webhook hasn't processed yet)
    console.log(`Processing verified payment for order ${orderId}`);

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);

    // Fetch order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, product_title')
      .eq('order_id', orderId);

    // Fetch template links
    const productIds = orderItems?.map(item => item.product_id).filter(Boolean) || [];
    const { data: products } = await supabase
      .from('products')
      .select('id, template_link')
      .in('id', productIds);

    const templateLinkMap = new Map(
      (products || []).map(p => [p.id, p.template_link])
    );

    // Create purchase records
    const purchaseRecords = orderItems?.map((item) => ({
      user_id: user.id,
      order_id: orderId,
      product_id: item.product_id,
      product_title: item.product_title,
      template_link: templateLinkMap.get(item.product_id) || null,
    })) || [];

    if (purchaseRecords.length > 0) {
      await supabase.from('purchases').insert(purchaseRecords);
    }

    // Clear cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    console.log(`Order ${orderId} verified and completed`);

    return new Response(
      JSON.stringify({ success: true, status: 'completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
