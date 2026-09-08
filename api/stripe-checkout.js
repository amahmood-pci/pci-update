// Vercel serverless function — creates a Stripe Checkout Session and returns
// the hosted-checkout URL. Replaces the previous Helcim initializer.
//
// SECURITY:
//   • The Stripe secret key is read only from STRIPE_SECRET_KEY. It never
//     reaches the browser.
//   • The charge amount is computed HERE from a trusted server-side price map
//     (api/_catalog.json), NOT from whatever total the browser sends. This stops
//     a tampered client from paying $0.01 for a $2,000 product.
//   • The order id is passed to Stripe as client_reference_id (and mirrored in
//     metadata.orderId) so the webhook can later mark exactly that order paid.

import Stripe from 'stripe';
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

function pickOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  // Fallback: use the deployment's own host (Vercel sets req.headers.host).
  const host = req.headers.host;
  return host ? `https://${host}` : 'https://pcibio.com';
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({
      error: 'Payment is not configured yet. Set STRIPE_SECRET_KEY in the deployment environment.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const items = Array.isArray(body.items) ? body.items : [];
    const orderId = typeof body.orderId === 'string' ? body.orderId.slice(0, 64) : undefined;

    if (items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    // Build Stripe line_items using the SERVER-authoritative catalog price.
    // The `name` sent from the client is display-only and cannot alter the price.
    const line_items = [];
    let amount = 0;
    for (const item of items) {
      const code = String(item.code || '');
      const qty = Math.max(1, Math.min(999, parseInt(item.quantity, 10) || 0));
      const unit = catalog[code];
      if (unit == null) {
        return res.status(400).json({ error: `Unknown product in cart: ${code}` });
      }
      const displayName = (typeof item.name === 'string' && item.name.trim().length > 0)
        ? item.name.trim().slice(0, 250)
        : code;
      line_items.push({
        quantity: qty,
        price_data: {
          currency: 'usd',
          product_data: {
            name: displayName,
            metadata: { code },
          },
          // Stripe expects the smallest currency unit (cents for USD).
          unit_amount: Math.round(unit * 100),
        },
      });
      amount += unit * qty;
    }
    amount = Number(amount.toFixed(2));
    if (amount <= 0) {
      return res.status(400).json({ error: 'Order total must be greater than zero.' });
    }

    const stripe = new Stripe(secret);
    const origin = pickOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout-cancel.html`,
      ...(orderId ? { client_reference_id: orderId } : {}),
      metadata: {
        source: 'pcibio-web',
        ...(orderId ? { orderId } : {}),
      },
      shipping_address_collection: { allowed_countries: ['US'] },
      billing_address_collection: 'required',
      allow_promotion_codes: false,
    });

    return res.status(200).json({ url: session.url, amount });
  } catch (err) {
    console.error('stripe-checkout error', err);
    return res.status(500).json({ error: 'Unexpected error starting payment.' });
  }
}
