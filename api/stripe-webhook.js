// Vercel serverless function — Stripe webhook. THIS is the authoritative
// source of truth for "paid". The browser never marks an order paid; only a
// verified Stripe event does, via the Supabase service-role key (server-side).
//
// Setup:
//   • Stripe → Developers → Webhooks → add endpoint
//     https://<your-domain>/api/stripe-webhook
//     Events: checkout.session.completed  (async payment events optional:
//     checkout.session.async_payment_succeeded / _failed)
//   • Env vars (Vercel, server-side, NOT VITE_):
//       STRIPE_SECRET_KEY         — sk_live_... (or sk_test_...)
//       STRIPE_WEBHOOK_SECRET     — whsec_... shown when you add the endpoint
//       SUPABASE_URL              — your project URL
//       SUPABASE_SERVICE_ROLE_KEY — service_role key (SECRET; bypasses RLS)
//
// We verify the Stripe signature, confirm the session is fully paid, and
// mark the matching order (by client_reference_id / metadata.orderId) paid.

import Stripe from 'stripe';

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

// Stripe requires the raw request body to verify the signature; disable Vercel's
// default JSON body parser for this route.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supaUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !stripeKey || !supaUrl || !serviceKey) {
    console.error('stripe-webhook: missing env configuration');
    return res.status(500).json({ error: 'Webhook not configured.' });
  }

  const stripe = new Stripe(stripeKey);
  const raw = await readRaw(req);
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.warn('stripe-webhook signature verification failed', err?.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle payment success events. Async payment methods (bank debit, etc.)
  // may fire checkout.session.async_payment_succeeded instead of completed.
  const paidEvents = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
  ]);

  if (!paidEvents.has(event.type)) {
    return res.status(200).json({ ok: true, note: `ignored event ${event.type}` });
  }

  const session = event.data.object || {};
  const orderId = session.client_reference_id
    || session.metadata?.orderId
    || null;

  if (session.payment_status !== 'paid') {
    return res.status(200).json({ ok: true, note: `payment_status=${session.payment_status}` });
  }

  if (!orderId) {
    // Nothing to update — Stripe collected payment but we have no order row to mark.
    // This is not fatal; log for auditing.
    console.warn('stripe-webhook: paid session without orderId', session.id);
    return res.status(200).json({ ok: true, note: 'no orderId on session' });
  }

  try {
    const patchRes = await fetch(
      `${supaUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json',
          prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status: 'paid',
          reference: String(session.payment_intent || session.id),
        }),
      }
    );
    if (!patchRes.ok) {
      const detail = await patchRes.text();
      console.error('order patch failed', patchRes.status, detail);
      return res.status(500).json({ error: 'Could not update order.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('stripe-webhook error', err);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
}
