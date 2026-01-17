import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

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

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    const hash = createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook received:', event.event);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, metadata, amount, currency } = event.data;
      const orderId = metadata?.order_id;
      const userId = metadata?.user_id;

      if (!orderId || !userId) {
        console.error('Missing order_id or user_id in metadata');
        return new Response('Missing metadata', { status: 400, headers: corsHeaders });
      }

      console.log(`Processing successful payment for order ${orderId}`);

      // Verify the order exists and matches
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('payment_reference', reference)
        .single();

      if (orderError || !order) {
        console.error('Order not found:', orderError);
        return new Response('Order not found', { status: 404, headers: corsHeaders });
      }

      if (order.status === 'completed') {
        console.log('Order already completed, skipping');
        return new Response('Already processed', { status: 200, headers: corsHeaders });
      }

      // Update order status to completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order:', updateError);
        throw updateError;
      }

      // Fetch order items to create purchase records
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, product_title')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Failed to fetch order items:', itemsError);
        throw itemsError;
      }

      // Fetch template links for products
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
        user_id: userId,
        order_id: orderId,
        product_id: item.product_id,
        product_title: item.product_title,
        template_link: templateLinkMap.get(item.product_id) || null,
      })) || [];

      if (purchaseRecords.length > 0) {
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert(purchaseRecords);

        if (purchaseError) {
          console.error('Failed to create purchases:', purchaseError);
          // Don't throw - order is already marked complete
        }
      }

      // Clear the user's cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      console.log(`Order ${orderId} completed successfully`);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
