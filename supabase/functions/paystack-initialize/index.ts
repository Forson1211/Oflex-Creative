// File: supabase/functions/paystack-initialize/index.ts

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const REQUEST_headers = { ...corsHeaders, 'Content-Type': 'application/json' };

    // Check for Paystack key
    const PAYSTACK_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_KEY) {
      console.error('PAYSTACK_SECRET_KEY is missing from environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuration Error: Paystack secret key is missing. Please check your Supabase secrets.'
        }),
        { headers: REQUEST_headers, status: 200 }
      );
    }

    const body = await req.json();
    const { orderId, email, amount, callbackUrl } = body;

    if (!orderId || !email || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: orderId, email, or amount' }),
        { headers: REQUEST_headers, status: 400 }
      );
    }

    // ===== GET REAL-TIME EXCHANGE RATE =====
    let usdToGhsRate = 15.5; // Fallback rate

    try {
      // Using free exchangerate-api.com (no API key needed for basic usage)
      const exchangeRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (exchangeRes.ok) {
        const exchangeData = await exchangeRes.json();
        if (exchangeData.rates && exchangeData.rates.GHS) {
          usdToGhsRate = exchangeData.rates.GHS;
          console.log(`Using live rate: 1 USD = ${usdToGhsRate} GHS`);
        }
      }
    } catch (exchangeError) {
      console.error('Exchange API error, using fallback rate:', exchangeError);
    }

    // Calculate amount in GHS, then convert to pesewas (smallest unit)
    const amountInGHS = amount * usdToGhsRate;
    const amountInPesewas = Math.round(amountInGHS * 100);

    console.log(`Initializing Payment for Order ${orderId}: $${amount} USD → ${amountInGHS.toFixed(2)} GHS → ${amountInPesewas} pesewas`);

    // Call Paystack
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
        reference: `order_${orderId}_${Date.now()}`,
        callback_url: callbackUrl,
        metadata: {
          order_id: orderId,
          usd_amount: amount,
          exchange_rate: usdToGhsRate,
          ghs_amount: amountInGHS,
          site_url: req.headers.get('origin') || 'unknown'
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error('Paystack API Error:', paystackData);
      return new Response(
        JSON.stringify({
          success: false,
          error: paystackData.message || 'Payment provider rejected the request',
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
    console.error('Exception in paystack-initialize:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
