// Cart persistence layer.
//
// Design goal: DO NOT rewrite the existing cart engines in product.js /
// products-list.js. Those keep using localStorage synchronously as the UI's
// source of truth. This module adds a thin sync layer on top:
//
//   • On login (or page load while logged in) it pulls the user's saved cart
//     from Supabase, merges it with whatever is in localStorage, writes the
//     merged result back to localStorage, and fires a 'pci-cart-synced' event
//     so the UI can re-render.
//   • Whenever the app saves the cart, it calls window.__pciPushCart(cart),
//     which upserts the cart to Supabase (fire-and-forget) if logged in.
//
// If Supabase isn't configured, everything below is a no-op and the site
// behaves exactly as before (localStorage only).

import { supabase, isSupabaseEnabled } from './supabase.js';

const LS_KEY = 'pci_cart';

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
};

const writeLocal = (cart) => {
  localStorage.setItem(LS_KEY, JSON.stringify(cart));
};

// Merge two carts by product code. For duplicates, keep the higher quantity
// (so re-opening on another device never silently shrinks your cart).
const mergeCarts = (a, b) => {
  const byCode = new Map();
  [...a, ...b].forEach((item) => {
    if (!item || !item.code) return;
    const existing = byCode.get(item.code);
    if (!existing) {
      byCode.set(item.code, { ...item });
    } else {
      existing.quantity = Math.max(existing.quantity || 1, item.quantity || 1);
    }
  });
  return Array.from(byCode.values());
};

// Push the current cart to Supabase for the logged-in user. Fire-and-forget.
async function pushCart(cart) {
  if (!isSupabaseEnabled()) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // anonymous → localStorage only, nothing to push

  await supabase
    .from('carts')
    .upsert(
      { user_id: user.id, items: cart, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
}

// Pull the saved cart, merge with local, persist, and notify the UI.
async function pullAndMerge() {
  if (!isSupabaseEnabled()) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('carts')
    .select('items')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return;

  const serverCart = (data && data.items) || [];
  const merged = mergeCarts(readLocal(), serverCart);
  writeLocal(merged);

  // If the merge changed anything relative to the server, push it back so both
  // sides converge.
  await pushCart(merged);

  // Tell the page to re-render its badges / drawer from localStorage.
  window.dispatchEvent(new CustomEvent('pci-cart-synced'));
}

// Expose the push hook globally so the existing saveCart() functions can call
// it with a single line, without importing anything.
window.__pciPushCart = (cart) => {
  pushCart(cart).catch(() => {});
};

// Clear the cart everywhere (local + Supabase) — called after a successful checkout.
window.pciClearCart = () => {
  writeLocal([]);
  pushCart([]).catch(() => {});
  window.dispatchEvent(new CustomEvent('pci-cart-synced'));
};

// Run an initial sync on load, and again whenever auth state changes
// (login / logout / token refresh).
if (isSupabaseEnabled()) {
  pullAndMerge().catch(() => {});
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      pullAndMerge().catch(() => {});
    }
  });
}
