// Checkout page: order review + account + secure handoff to the Squarespace store.
import './products.js';   // populates window.pciProducts (for per-item store URLs)
import { SHOP_BASE, shopUrl } from './config.js';
import { supabase, isSupabaseEnabled } from './supabase.js';
import './auth.js';       // provides window.pciOpenAuth + account widget
import './cart-sync.js';  // syncs cart for logged-in users

const LS_KEY = 'pci_cart';
const money = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const getCart = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
};
const saveCart = (cart) => {
  localStorage.setItem(LS_KEY, JSON.stringify(cart));
  if (window.__pciPushCart) window.__pciPushCart(cart);
  render();
};

const blockImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='10' fill='%23ecfdf5'/><rect x='24' y='20' width='52' height='44' rx='5' fill='%23fef9c3' stroke='%23eab308' stroke-width='2'/><text x='50' y='84' font-family='sans-serif' font-size='11' fill='%23334155' text-anchor='middle'>FFPE</text></svg>";
const slideImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='10' fill='%23ecfdf5'/><rect x='16' y='34' width='68' height='30' rx='4' fill='%23fff' stroke='%2394a3b8' stroke-width='2'/><text x='50' y='84' font-family='sans-serif' font-size='11' fill='%23334155' text-anchor='middle'>SLIDE</text></svg>";

function productFor(code) {
  return (window.pciProducts || []).find((p) => p.code === code);
}

function renderItems() {
  const cart = getCart();
  const wrap = document.getElementById('checkout-items');
  const empty = document.getElementById('checkout-empty');
  const proceed = document.getElementById('proceed-btn');

  if (!cart.length) {
    wrap.innerHTML = '';
    empty.classList.remove('hidden');
    if (proceed) proceed.disabled = true;
    return;
  }
  empty.classList.add('hidden');
  if (proceed) proceed.disabled = false;

  wrap.innerHTML = '';
  cart.forEach((item, idx) => {
    const prod = productFor(item.code);
    const buyHref = shopUrl(prod);
    const thumb = item.image || prod?.image || (item.imageType === 'block' ? blockImg : slideImg);
    const line = document.createElement('div');
    line.className = 'flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0';
    line.innerHTML = `
      <img src="${thumb}" alt="${item.name}" class="w-16 h-16 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1 shrink-0" referrerpolicy="no-referrer">
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-bold text-slate-800 leading-snug">${item.name}</h3>
        <p class="text-[10px] font-mono text-slate-400 uppercase mt-0.5">${item.code}</p>
        <div class="flex items-center gap-3 mt-2">
          <div class="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold">
            <button class="ci-minus text-slate-400 hover:text-slate-800" data-idx="${idx}">−</button>
            <span class="font-mono text-slate-700 w-5 text-center">${item.quantity}</span>
            <button class="ci-plus text-slate-400 hover:text-slate-800" data-idx="${idx}">+</button>
          </div>
          <a href="${buyHref}" target="_blank" rel="noopener noreferrer" class="text-[11px] font-bold text-emerald-700 hover:text-emerald-600 inline-flex items-center gap-1">Buy on store
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
          <button class="ci-remove ml-auto text-slate-300 hover:text-rose-500" data-idx="${idx}" aria-label="Remove">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <span class="font-mono text-sm font-bold text-slate-800 shrink-0">${money(item.price * item.quantity)}</span>`;
    wrap.appendChild(line);
  });

  wrap.querySelectorAll('.ci-plus').forEach((b) => b.onclick = () => { const c = getCart(); c[+b.dataset.idx].quantity++; saveCart(c); });
  wrap.querySelectorAll('.ci-minus').forEach((b) => b.onclick = () => { const c = getCart(); const i = +b.dataset.idx; if (c[i].quantity > 1) { c[i].quantity--; saveCart(c); } });
  wrap.querySelectorAll('.ci-remove').forEach((b) => b.onclick = () => { const c = getCart(); c.splice(+b.dataset.idx, 1); saveCart(c); });
}

function renderSummary() {
  const cart = getCart();
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  document.getElementById('sum-subtotal').textContent = money(subtotal);
  document.getElementById('sum-total').textContent = money(subtotal);
  document.getElementById('sum-count').textContent = count;

  const note = document.getElementById('proceed-note');
  const distinct = cart.length;
  if (note) {
    note.textContent = distinct > 1
      ? 'Multiple items open on our secure store, where each is confirmed and paid.'
      : 'You’ll be taken to our secure store to complete payment.';
  }
}

async function renderAccount() {
  const body = document.getElementById('account-body');
  if (!body) return;
  if (!isSupabaseEnabled()) {
    body.innerHTML = 'Guest checkout — your order is processed on our secure store.';
    return;
  }
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      body.innerHTML = `Signed in as <span class="font-semibold text-slate-700">${data.user.email}</span>. This order will be linked to your account.
        <button id="acct-signout" class="ml-2 text-emerald-700 font-semibold hover:underline">Sign out</button>`;
      const so = document.getElementById('acct-signout');
      if (so) so.onclick = () => supabase.auth.signOut();
    } else {
      body.innerHTML = `<span>Sign in to save this order and sync your cart across devices.</span>
        <button id="acct-signin" class="mt-2 block bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Sign in / Create account</button>
        <span class="block mt-1.5 text-[11px] text-slate-400">Optional — you can check out as a guest.</span>`;
      const si = document.getElementById('acct-signin');
      if (si) si.onclick = () => window.pciOpenAuth && window.pciOpenAuth();
    }
  } catch {
    body.innerHTML = 'Guest checkout — sign-in is temporarily unavailable.';
  }
}

function render() {
  renderItems();
  renderSummary();
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  renderAccount();

  const proceed = document.getElementById('proceed-btn');
  if (proceed) proceed.onclick = () => {
    const cart = getCart();
    if (!cart.length) return;
    if (cart.length === 1) {
      window.open(shopUrl(productFor(cart[0].code)), '_blank', 'noopener');
    } else {
      // Squarespace can't ingest an external multi-item cart — open each product
      // page on the secure store so the buyer confirms and pays for each.
      cart.forEach((it) => window.open(shopUrl(productFor(it.code)), '_blank', 'noopener'));
    }
  };

  if (isSupabaseEnabled()) {
    supabase.auth.onAuthStateChange(() => renderAccount());
  }
  window.addEventListener('pci-cart-synced', render);
});
