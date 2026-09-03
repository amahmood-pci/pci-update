// Helcim checkout — replaces the old Squarespace hand-off.
//
// Flow:
//   1. POST the cart total to /api/helcim-initialize (server holds the secret token).
//   2. Load HelcimPay.js and render the hosted payment iframe with the returned token.
//   3. On SUCCESS, mark the logged order as paid, clear the cart, and confirm.
//
// Exposes window.pciStartCheckout({ items, subtotal, orderId }).

const HELCIM_PAY_SCRIPT = 'https://secure.helcim.app/helcim-pay/services/start.js';

let scriptPromise = null;
function loadHelcimPay() {
  if (window.appendHelcimPayIframe) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = HELCIM_PAY_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load the secure payment library.'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

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

async function startCheckout({ items, subtotal, orderId } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    toast('Your cart is empty.', 'error');
    return;
  }

  toast('Opening secure checkout…');

  let session;
  try {
    // Send only codes + quantities; the SERVER computes the authoritative amount.
    const res = await fetch('/api/helcim-initialize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ code: i.code, quantity: i.quantity || 1 })),
        orderId,
      }),
    });
    session = await res.json();
    if (!res.ok || !session.checkoutToken) {
      throw new Error(session?.error || 'Could not start checkout.');
    }
  } catch (err) {
    toast(typeof err.message === 'string' ? err.message : 'Could not start checkout.', 'error');
    return;
  }

  try {
    await loadHelcimPay();
  } catch (err) {
    toast(err.message, 'error');
    return;
  }

  const { checkoutToken } = session;

  // Listen for the result of this specific checkout session.
  const handler = async (event) => {
    if (!event.data || event.data.eventName !== `helcim-pay-js-${checkoutToken}`) return;

    if (event.data.eventStatus === 'ABORTED') {
      window.removeEventListener('message', handler);
      toast('Checkout cancelled.', 'error');
    }

    if (event.data.eventStatus === 'SUCCESS') {
      window.removeEventListener('message', handler);
      if (window.removeHelcimPayIframe) window.removeHelcimPayIframe();
      // Note: the order is marked "paid" server-side by the Helcim webhook, not
      // here — the browser is never trusted to confirm payment.
      if (window.pciClearCart) window.pciClearCart();
      toast('Payment successful — thank you! A receipt is on its way.');
      window.dispatchEvent(new CustomEvent('pci-checkout-success', { detail: { orderId } }));
    }
  };
  window.addEventListener('message', handler);

  window.appendHelcimPayIframe(checkoutToken, true);
}

window.pciStartCheckout = startCheckout;
export { startCheckout };
