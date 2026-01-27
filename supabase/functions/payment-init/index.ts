// @ts-nocheck
// File: supabase/functions/payment-init/index.ts

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const REQUEST_headers = { ...corsHeaders, 'Content-Type': 'application/json' };

    // Check for Paystack key and TRIM whitespace
    let PAYSTACK_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_KEY) {
      console.error('PAYSTACK_SECRET_KEY is missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Server Config Error: Missing Paystack Key' }),
        { headers: REQUEST_headers, status: 200 }
      );
    }
    PAYSTACK_KEY = PAYSTACK_KEY.trim(); // Critical fix for copy-paste errors

    const body = await req.json();
    const { orderId, email, amount, callbackUrl } = body;

    if (!orderId || !email || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: orderId, email, or amount' }),
        { headers: REQUEST_headers, status: 400 }
      );
    }

    // ===== EXCHANGE RATE LOGIC =====
    let usdToGhsRate = 15.5; // Default safe fallback

    // Attempt to fetch live rate with a strict timeout of 2 seconds
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const exchangeRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (exchangeRes.ok) {
        const exchangeData = await exchangeRes.json();
        if (exchangeData.rates && exchangeData.rates.GHS) {
          usdToGhsRate = exchangeData.rates.GHS;
        }
      }
    } catch (e) {
      console.warn('Exchange rate API timed out or failed, using fallback 15.5');
    }

    // Calculate amount
    const amountInGHS = amount * usdToGhsRate;
    const amountInPesewas = Math.round(amountInGHS * 100);

    console.log(`Init Paystack: Order ${orderId}, Amt ${amountInPesewas} (GHS Pesewas)`);

    // Call Paystack Initialize
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amountInPesewas,
        currency: 'GHS',
        reference: `order_${orderId}_${Date.now()}`, // Unique reference
        callback_url: callbackUrl,
        metadata: {
          order_id: orderId,
          user_id: body.userId, // Ensure we pass this if available, otherwise it relies on email match
          usd_amount: amount,
          exchange_rate: usdToGhsRate
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error('Paystack API Failed:', paystackData);
      return new Response(
        JSON.stringify({
          success: false,
          error: paystackData.message || 'Paystack rejected the initialization',
          details: paystackData
        }),
        { headers: REQUEST_headers, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        authorizationUrl: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        exchangeRate: usdToGhsRate,
      }),
      { headers: REQUEST_headers, status: 200 }
    );

  } catch (error) {
    console.error('Edge Function Exception:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
