export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const { type, id, title, priceInCents } = req.body;

  if (!type || !id || !title || !priceInCents) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Use Stripe API directly via fetch to avoid requiring the stripe package at build time
    const referer = typeof req.headers.referer === 'string' ? req.headers.referer.replace(/\/$/, '') : '';
    const origin = req.headers.origin || referer || 'https://actionvault.stuntlisting.com';

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${origin}/?purchase=success&type=${type}&id=${id}`);
    params.append('cancel_url', `${origin}/?purchase=cancelled`);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Atlas Action: ${title}`);
    params.append('line_items[0][price_data][unit_amount]', String(priceInCents));
    params.append('line_items[0][quantity]', '1');

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (!response.ok) {
      console.error('Stripe error:', session);
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }

    return res.status(200).json({ sessionUrl: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
