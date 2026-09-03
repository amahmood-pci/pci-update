// Vercel serverless function — creates a HelcimPay.js checkout session.
//
// SECURITY:
//   • The Helcim API token is a SECRET, read only from HELCIM_API_TOKEN. It never
//     reaches the browser.
//   • The charge amount is computed HERE from a trusted server-side price map
//     (api/_catalog.json), NOT from whatever total the browser sends. This stops a
//     tampered client from paying $0.01 for a $2,000 product.
//   • The order id is passed to Helcim as invoiceNumber so the webhook can later
//     mark exactly that order paid.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(__dirname, '_catalog.json'), 'utf8'));

const ALLOWED_ORIGINS = [
  'https://pci-update.vercel.app',
  'https://pcibio.com',
  'https://www.pcibio.com',
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
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
    const items = Array.isArray(body.items) ? body.items : [];
    const orderId = typeof body.orderId === 'string' ? body.orderId.slice(0, 64) : undefined;

    if (items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    // Authoritative total from the trusted catalog — client prices are ignored.
    let amount = 0;
    for (const item of items) {
      const code = String(item.code || '');
      const qty = Math.max(1, Math.min(999, parseInt(item.quantity, 10) || 0));
      const unit = catalog[code];
      if (unit == null) {
        return res.status(400).json({ error: `Unknown product in cart: ${code}` });
      }
      amount += unit * qty;
    }
    amount = Number(amount.toFixed(2));
    if (amount <= 0) {
      return res.status(400).json({ error: 'Order total must be greater than zero.' });
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
        amount,
        currency: 'USD',
        ...(orderId ? { invoiceNumber: orderId } : {}),
      }),
    });

    const data = await helcimRes.json().catch(() => ({}));
    if (!helcimRes.ok) {
      console.error('Helcim initialize failed', helcimRes.status, data);
      return res.status(502).json({ error: 'Could not start the payment session.' });
    }

    // Return only what the browser needs; echo the server-authoritative amount.
    return res.status(200).json({ checkoutToken: data.checkoutToken, amount });
  } catch (err) {
    console.error('helcim-initialize error', err);
    return res.status(500).json({ error: 'Unexpected error starting payment.' });
  }
}
