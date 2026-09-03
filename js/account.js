// PCI account page — profile, orders, addresses, security.
// All data is scoped per-user via Supabase RLS.

import { supabase, isSupabaseEnabled } from './supabase.js';

if (!isSupabaseEnabled()) {
  document.getElementById('acct-signed-out').classList.remove('hidden');
} else {
  init();
}

async function init() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    document.getElementById('acct-signed-out').classList.remove('hidden');
    document.getElementById('acct-signin-btn').addEventListener('click', () => {
      if (window.pciOpenAuth) window.pciOpenAuth();
    });
    supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) window.location.reload();
    });
    return;
  }

  document.getElementById('acct-signed-in').classList.remove('hidden');
  renderHeader(user);
  setupTabs();
  fillProfile(user);
  fillAddress(user);
  fillSecurity(user);
  loadOrders(user);
  wireProfile(user);
  wireAddress(user);
  wirePassword();
  wireResendVerify(user);

  document.getElementById('acct-signout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  });
}

function renderHeader(user) {
  const name = user.user_metadata?.name || user.email.split('@')[0];
  document.getElementById('acct-greeting').textContent = `Hello, ${name.split(' ')[0]}`;
  document.getElementById('acct-email').textContent = user.email;
  const verified = !!user.email_confirmed_at;
  const badge = document.getElementById('acct-verified-badge');
  if (verified) {
    badge.textContent = '✓ Verified';
    badge.classList.add('bg-emerald-50', 'text-emerald-700');
  } else {
    badge.textContent = '⚠ Unverified';
    badge.classList.add('bg-amber-50', 'text-amber-700');
  }

  // Snapshot cards
  const statStatus = document.getElementById('stat-status');
  const statSince = document.getElementById('stat-since');
  if (statStatus) statStatus.textContent = verified ? 'Verified' : 'Needs verification';
  if (statSince && user.created_at) {
    statSince.textContent = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.acct-tab');
  const panels = document.querySelectorAll('.acct-panel');
  const activate = (name) => {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
  };
  tabs.forEach((t) => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      activate(t.dataset.tab);
      history.replaceState(null, '', '#' + t.dataset.tab);
    });
  });
  const initial = (window.location.hash || '#profile').replace('#', '');
  activate(document.querySelector(`.acct-tab[data-tab="${initial}"]`) ? initial : 'profile');
}

function fillProfile(user) {
  const f = document.getElementById('acct-profile-form');
  f.name.value = user.user_metadata?.name || '';
  f.phone.value = user.user_metadata?.phone || '';
  f.email.value = user.email;
}

function fillAddress(user) {
  const f = document.getElementById('acct-address-form');
  const a = user.user_metadata?.address || {};
  f.line1.value = a.line1 || '';
  f.city.value = a.city || '';
  f.state.value = a.state || '';
  f.zip.value = a.zip || '';
}

function fillSecurity(user) {
  const verified = !!user.email_confirmed_at;
  if (!verified) document.getElementById('acct-verify-block').classList.remove('hidden');
}

function showMsg(form, text, ok) {
  const el = form.querySelector('.acct-msg');
  el.textContent = text;
  el.classList.remove('hidden');
  el.style.color = ok ? '#059669' : '#e11d48';
  setTimeout(() => el.classList.add('hidden'), 3200);
}

function wireProfile(user) {
  const f = document.getElementById('acct-profile-form');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const meta = { ...(user.user_metadata || {}) };
    meta.name = f.name.value.trim();
    meta.phone = f.phone.value.trim();
    const { error } = await supabase.auth.updateUser({ data: meta });
    if (error) showMsg(f, error.message, false);
    else showMsg(f, 'Profile saved', true);
  });
}

function wireAddress(user) {
  const f = document.getElementById('acct-address-form');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const meta = { ...(user.user_metadata || {}) };
    meta.address = {
      line1: f.line1.value.trim(),
      city: f.city.value.trim(),
      state: f.state.value.trim(),
      zip: f.zip.value.trim(),
    };
    const { error } = await supabase.auth.updateUser({ data: meta });
    if (error) showMsg(f, error.message, false);
    else showMsg(f, 'Address saved', true);
  });
}

function wirePassword() {
  const f = document.getElementById('acct-password-form');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = f.password.value;
    if (!password || password.length < 6) return;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) showMsg(f, error.message, false);
    else { showMsg(f, 'Password updated', true); f.reset(); }
  });
}

function wireResendVerify(user) {
  const btn = document.getElementById('acct-resend-verify');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email, options: { emailRedirectTo: window.location.origin } });
      btn.textContent = error ? 'Send failed — try again' : 'Verification email sent';
    } catch { btn.textContent = 'Send failed — try again'; }
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Resend verification email'; }, 3000);
  });
}

async function loadOrders(user) {
  const list = document.getElementById('acct-orders-list');
  const statOrders = document.getElementById('stat-orders');
  const emptyState = `
    <div class="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
      <div class="w-12 h-12 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
        <svg class="w-6 h-6" viewBox="0 0 448 512" fill="currentColor"><path d="M50.7 58.5L0 160l208 0 0-128L93.7 32C75.5 32 58.9 42.3 50.7 58.5zM240 160l208 0L397.3 58.5C389.1 42.3 372.5 32 354.3 32L240 32l0 128zm208 32L0 192 0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-224z"/></svg>
      </div>
      <p class="font-semibold text-gray-700 text-sm">No orders yet</p>
      <p class="text-xs text-gray-400 mt-1">Orders appear here as soon as you check out.</p>
      <a href="products.html" class="inline-block mt-4 bg-forest hover:bg-forest-light text-white text-xs font-semibold px-4 py-2 rounded-lg">Browse the catalog</a>
    </div>`;
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      // Missing table / schema not yet applied → treat as empty, keep UI clean
      console.warn('orders load:', error.message);
      list.innerHTML = emptyState;
      if (statOrders) statOrders.textContent = '0';
      return;
    }
    if (!data || data.length === 0) {
      list.innerHTML = emptyState;
      if (statOrders) statOrders.textContent = '0';
      return;
    }
    list.innerHTML = data.map((o) => orderCard(o)).join('');
    if (statOrders) statOrders.textContent = String(data.length);
  } catch (err) {
    console.warn('orders load exception:', err);
    list.innerHTML = emptyState;
    if (statOrders) statOrders.textContent = '0';
  }
}

function orderCard(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  const date = new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const total = o.subtotal != null ? `$${Number(o.subtotal).toFixed(2)}` : '';
  const statusColor = { submitted: 'bg-blue-50 text-blue-700', paid: 'bg-emerald-50 text-emerald-700', shipped: 'bg-indigo-50 text-indigo-700', completed: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-gray-100 text-gray-500' }[o.status] || 'bg-gray-100 text-gray-700';
  return `
    <div class="border border-gray-200 rounded-xl overflow-hidden">
      <div class="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between text-xs">
        <div class="flex gap-6">
          <div><div class="text-gray-500 uppercase font-semibold tracking-wider text-[10px]">Order placed</div><div class="text-gray-800 font-mono">${date}</div></div>
          <div><div class="text-gray-500 uppercase font-semibold tracking-wider text-[10px]">Total</div><div class="text-gray-800 font-mono">${total}</div></div>
          <div><div class="text-gray-500 uppercase font-semibold tracking-wider text-[10px]">Order #</div><div class="text-gray-800 font-mono">${o.id.slice(0, 8)}</div></div>
        </div>
        <span class="px-2.5 py-1 rounded-full font-mono uppercase font-semibold tracking-wider text-[10px] ${statusColor}">${escapeHtml(o.status)}</span>
      </div>
      <div class="px-5 py-4 space-y-2">
        ${items.map((i) => `
          <div class="flex items-center justify-between text-sm">
            <div class="text-gray-800">${escapeHtml(i.name || i.code)} <span class="text-gray-400">× ${i.quantity}</span></div>
            <div class="text-gray-500 font-mono">${i.price != null ? '$' + Number(i.price * i.quantity).toFixed(2) : ''}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
