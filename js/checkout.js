// Stripe Checkout — the only payment path on pcibio.com.
//
// Flow:
//   1. POST the cart to /api/stripe-checkout (server holds the secret key and
//      the authoritative product prices).
//   2. The server creates a Stripe Checkout Session and returns its hosted URL.
//   3. We redirect the browser to that URL. Stripe collects payment on their
//      PCI-scoped page and redirects back to /checkout-success.html on success
//      or /checkout-cancel.html on cancel.
//   4. The order is marked "paid" server-side by the Stripe webhook, not by the
//      browser. The success page just clears the cart and shows a receipt UI.
//
// Exposes window.pciStartCheckout({ items, subtotal, orderId }).
// `subtotal` is accepted for backward compatibility but ignored — Stripe uses
// the server-computed total from the catalog.

function toast(msg, kind) {
  if (window.pciToast) return window.pciToast(msg, kind);
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText =
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100000;' +
    'background:' + (kind === 'error' ? '#b91c1c' : '#012b1a') + ';color:#fff;padding:12px 20px;' +
    'border-radius:12px;font:500 13px Inter,sans-serif;box-shadow:0 12px 32px rgba(1,43,26,.35)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

async function startCheckout({ items, orderId } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    toast('Your cart is empty.', 'error');
    return;
  }

  toast('Opening secure checkout…');

  let session;
  try {
    // Only codes, quantities, and display names go to the server. The server
    // computes the authoritative amount from api/_catalog.json.
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          code: i.code,
          quantity: i.quantity || 1,
          // name is display-only on the Stripe checkout page; server ignores it for pricing.
          name: i.name,
        })),
        orderId,
      }),
    });
    session = await res.json();
    if (!res.ok || !session.url) {
      throw new Error(session?.error || 'Could not start checkout.');
    }
  } catch (err) {
    toast(typeof err.message === 'string' ? err.message : 'Could not start checkout.', 'error');
    return;
  }

  // Full-page redirect to Stripe's hosted Checkout. Stripe will bring the user
  // back to /checkout-success.html or /checkout-cancel.html.
  window.location.href = session.url;
}

window.pciStartCheckout = startCheckout;
export { startCheckout };
