// Server-side purchase verification endpoint
// Client sends the Stripe session ID, we verify directly with Stripe API
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const { sessionId } = req.body;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  // Basic validation: Stripe session IDs start with cs_
  if (!sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid session ID format' });
  }

  try {
    // Retrieve the checkout session from Stripe to verify payment
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[Verify] Stripe API error:', response.status);
      return res.status(400).json({ error: 'Invalid session', verified: false });
    }

    const session = await response.json();

    // Verify payment was actually completed
    if (session.payment_status !== 'paid') {
      return res.status(200).json({
        verified: false,
        reason: 'Payment not completed',
      });
    }

    // Extract purchase details from session metadata
    const metadata = session.metadata || {};
    const purchaseType = metadata.purchase_type;
    const purchaseId = metadata.purchase_id;

    if (!purchaseType || !purchaseId) {
      return res.status(200).json({
        verified: false,
        reason: 'Missing purchase metadata',
      });
    }

    return res.status(200).json({
      verified: true,
      type: purchaseType,
      id: purchaseId,
      amountTotal: session.amount_total,
      customerEmail: session.customer_details?.email || null,
    });
  } catch (error: any) {
    console.error('[Verify] Error:', error.message);
    return res.status(500).json({ error: 'Verification failed', verified: false });
  }
}
