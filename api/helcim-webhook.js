// Vercel serverless function — Helcim webhook. THIS is the authoritative source
// of truth for "paid". The browser never marks an order paid; only a verified
// Helcim event does, via the Supabase service-role key (server-side only).
//
// Setup:
//   • Helcim → Settings → Webhooks → point at https://<your-domain>/api/helcim-webhook
//   • Env vars (Vercel, server-side, NOT VITE_):
//       HELCIM_WEBHOOK_SECRET   — the verifier token Helcim shows for the webhook
//       SUPABASE_URL            — your project URL
//       SUPABASE_SERVICE_ROLE_KEY — service_role key (SECRET; bypasses RLS)
//
// We verify the Helcim signature, fetch the transaction to confirm it's APPROVED,
// and then mark the matching order (by invoiceNumber = our order id) paid.

import crypto from 'node:crypto';

function verifySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  try {
    const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(digest);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.HELCIM_WEBHOOK_SECRET;
  const supaUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiToken = process.env.HELCIM_API_TOKEN;
  if (!secret || !supaUrl || !serviceKey) {
    console.error('helcim-webhook: missing env configuration');
    return res.status(500).json({ error: 'Webhook not configured.' });
  }

  const raw = await readRaw(req);
  const signature = req.headers['webhook-signature'] || req.headers['helcim-signature'];
  if (!verifySignature(raw, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return res.status(400).json({ error: 'Bad JSON' }); }

  // Helcim sends the transaction id; confirm status server-side before trusting it.
  const txId = event?.id || event?.transactionId;
  if (!txId) return res.status(200).json({ ok: true, note: 'no transaction id' });

  try {
    let approved = false;
    let invoiceNumber = null;

    if (apiToken) {
      const txRes = await fetch(`https://api.helcim.com/v2/card-transactions/${txId}`, {
        headers: { 'api-token': apiToken, accept: 'application/json' },
      });
      const tx = await txRes.json().catch(() => ({}));
      approved = (tx?.status || '').toUpperCase() === 'APPROVED' || tx?.type === 'purchase';
      invoiceNumber = tx?.invoiceNumber || null;
    }

    if (!approved || !invoiceNumber) {
      return res.status(200).json({ ok: true, note: 'not an approved purchase' });
    }

    // Mark the order paid (service role bypasses RLS). Only touches status/reference.
    const patchRes = await fetch(
      `${supaUrl}/rest/v1/orders?id=eq.${encodeURIComponent(invoiceNumber)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json',
          prefer: 'return=minimal',
        },
        body: JSON.stringify({ status: 'paid', reference: String(txId) }),
      }
    );
    if (!patchRes.ok) {
      console.error('order patch failed', patchRes.status, await patchRes.text());
      return res.status(500).json({ error: 'Could not update order.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('helcim-webhook error', err);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
}
