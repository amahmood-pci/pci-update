// Vercel serverless function — creates a HelcimPay.js checkout session.
//
// The Helcim API token is a SECRET and must never reach the browser. It is read
// from the HELCIM_API_TOKEN environment variable (set in Vercel → Project →
// Settings → Environment Variables). The browser calls this endpoint, which
// talks to Helcim server-to-server and returns only the short-lived checkout
// token used to render the payment iframe.
//
// Docs: https://devdocs.helcim.com/docs/overview-of-helcimpayjs

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.HELCIM_API_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'Payment is not configured yet. Set HELCIM_API_TOKEN in the deployment environment.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const amount = Number(body.amount);
    const currency = (body.currency || 'USD').toUpperCase();

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      return res.status(400).json({ error: 'A valid order amount is required.' });
    }

    const helcimRes = await fetch('https://api.helcim.com/v2/helcim-pay/initialize', {
      method: 'POST',
      headers: {
        'api-token': token,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        paymentType: 'purchase',
        amount: Number(amount.toFixed(2)),
        currency,
      }),
    });

    const data = await helcimRes.json().catch(() => ({}));
    if (!helcimRes.ok) {
      console.error('Helcim initialize failed', helcimRes.status, data);
      return res.status(502).json({ error: data?.errors || 'Could not start the payment session.' });
    }

    // Return only what the browser needs to render the iframe.
    return res.status(200).json({
      checkoutToken: data.checkoutToken,
      secretToken: data.secretToken,
    });
  } catch (err) {
    console.error('helcim-initialize error', err);
    return res.status(500).json({ error: 'Unexpected error starting payment.' });
  }
}
