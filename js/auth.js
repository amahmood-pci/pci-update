// Lightweight email login widget (magic link) — self-injecting.
//
// Renders a small account control. If an element with id="pci-account-slot"
// exists it mounts there; otherwise it floats in the top-right corner so it
// works on every page without editing each header.
//
// Login uses Supabase "magic link" (passwordless): the user types their email,
// gets a one-tap sign-in link, and is returned to the same page logged in.
// No passwords stored, no password UI to build.

import { supabase, isSupabaseEnabled } from './supabase.js';

if (isSupabaseEnabled()) {
  initAuthWidget();
}

function initAuthWidget() {
  const mount = document.getElementById('pci-account-slot') || navMount() || floatingMount();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pci-account-btn';
  mount.appendChild(btn);

  injectStyles();
  const modal = buildModal();

  // Let other pages (e.g. checkout) open the sign-in modal.
  window.pciOpenAuth = () => openModal(modal);

  // Insert a submitted-order row for the signed-in user (surfaced on Your Orders).
  window.pciLogOrder = async ({ items, subtotal, currency = 'USD', reference = null }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const { data: row, error } = await supabase
      .from('orders')
      .insert({ user_id: data.user.id, items, subtotal, currency, reference, status: 'submitted' })
      .select().single();
    if (error) console.warn('order log failed', error);
    return row;
  };

  // Gate checkout on signed-in + email verified. Returns a Promise<boolean>.
  window.pciRequireVerifiedUser = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      openModal(modal);
      toast('Sign in to continue to checkout');
      return false;
    }
    if (!user.email_confirmed_at && !user.confirmed_at) {
      openVerifyModal(user.email);
      return false;
    }
    return true;
  };

  const render = (user) => {
    if (user) {
      btn.textContent = accountLabel(user.email);
      btn.title = user.email;
      btn.onclick = () => openMenu(user);
    } else {
      btn.textContent = 'Sign in';
      btn.onclick = () => openModal(modal);
    }
  };

  // Initial state + live updates.
  supabase.auth.getUser().then(({ data }) => render(data.user));
  supabase.auth.onAuthStateChange((event, session) => {
    render(session?.user || null);
    if (event === 'SIGNED_IN' && session?.user) {
      toast(`Signed in as ${session.user.email}`);
    }
  });

  function openMenu(user) {
    openAccountPopover(btn, user);
  }
}

function openVerifyModal(email) {
  document.querySelectorAll('.pci-verify-overlay').forEach((n) => n.remove());
  const overlay = document.createElement('div');
  overlay.className = 'pci-auth-overlay pci-verify-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="pci-auth-modal" role="dialog" aria-modal="true" style="max-width:420px">
      <button class="pci-auth-close" aria-label="Close">&times;</button>
      <div class="pci-verify-icon">✉</div>
      <h3 class="pci-auth-title">Verify your email to check out</h3>
      <p class="pci-auth-sub">We sent a confirmation link to <b>${escapeHtml(email)}</b>. Open it, then come back here to complete your order.</p>
      <button type="button" class="pci-auth-submit pci-verify-resend">Resend verification email</button>
      <button type="button" class="pci-verify-check">I've verified — continue</button>
      <p class="pci-auth-msg" hidden></p>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('.pci-auth-close').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  const msg = overlay.querySelector('.pci-auth-msg');
  const show = (t, ok) => { msg.hidden = false; msg.textContent = t; msg.className = 'pci-auth-msg ' + (ok ? 'pci-auth-ok' : 'pci-auth-err'); };
  overlay.querySelector('.pci-verify-resend').onclick = async () => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin } });
      if (error) show(error.message, false);
      else show('Verification email sent. Check your inbox.', true);
    } catch { show("Can't reach the login service right now.", false); }
  };
  overlay.querySelector('.pci-verify-check').onclick = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user?.email_confirmed_at || data.user?.confirmed_at) {
      close();
      toast('Email verified — you can check out now');
    } else {
      show('Not verified yet. Please click the link in the email first.', false);
    }
  };
}

function openAccountPopover(anchor, user) {
  document.querySelectorAll('.pci-acct-pop').forEach((n) => n.remove());
  const rect = anchor.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'pci-acct-pop';
  pop.style.top = (rect.bottom + 8) + 'px';
  pop.style.right = Math.max(16, window.innerWidth - rect.right) + 'px';
  const verified = !!(user.email_confirmed_at || user.confirmed_at || user.app_metadata?.provider === 'google');
  pop.innerHTML = `
    <div class="pci-acct-hd">
      <div class="pci-acct-avatar">${(user.email || '?')[0].toUpperCase()}</div>
      <div class="pci-acct-info">
        <div class="pci-acct-name">Hello, ${escapeHtml((user.user_metadata?.name || user.email.split('@')[0]).split(' ')[0])}</div>
        <div class="pci-acct-email">${escapeHtml(user.email)}</div>
        <div class="pci-acct-status ${verified ? 'ok' : 'warn'}">${verified ? 'Verified account' : 'Email not verified'}</div>
      </div>
    </div>
    <a class="pci-acct-item" href="account.html">
      <span class="pci-acct-icon"><svg viewBox="0 0 448 512" fill="currentColor"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/></svg></span>
      <div><div class="pci-acct-label">Your Account</div><div class="pci-acct-desc">Profile and settings</div></div>
    </a>
    <a class="pci-acct-item" href="account.html#orders">
      <span class="pci-acct-icon"><svg viewBox="0 0 448 512" fill="currentColor"><path d="M50.7 58.5L0 160l208 0 0-128L93.7 32C75.5 32 58.9 42.3 50.7 58.5zM240 160l208 0L397.3 58.5C389.1 42.3 372.5 32 354.3 32L240 32l0 128zm208 32L0 192 0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-224z"/></svg></span>
      <div><div class="pci-acct-label">Your Orders</div><div class="pci-acct-desc">Track, return, or reorder</div></div>
    </a>
    <a class="pci-acct-item" href="account.html#address">
      <span class="pci-acct-icon"><svg viewBox="0 0 384 512" fill="currentColor"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg></span>
      <div><div class="pci-acct-label">Your Addresses</div><div class="pci-acct-desc">Shipping details</div></div>
    </a>
    <a class="pci-acct-item" href="account.html#security">
      <span class="pci-acct-icon"><svg viewBox="0 0 448 512" fill="currentColor"><path d="M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z"/></svg></span>
      <div><div class="pci-acct-label">Security</div><div class="pci-acct-desc">Password and verification</div></div>
    </a>
    <div class="pci-acct-sep"></div>
    <button type="button" class="pci-acct-signout">Sign out</button>`;
  document.body.appendChild(pop);
  const off = (e) => {
    if (!pop.contains(e.target) && e.target !== anchor) {
      pop.remove();
      document.removeEventListener('mousedown', off);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', off), 0);
  pop.querySelector('.pci-acct-signout').onclick = async () => {
    pop.remove();
    await supabase.auth.signOut();
    toast('Signed out');
    if (window.location.pathname.includes('account.html')) window.location.href = 'index.html';
  };
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'pci-toast';
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('pci-toast-in'));
  setTimeout(() => {
    el.classList.remove('pci-toast-in');
    setTimeout(() => el.remove(), 240);
  }, 2600);
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function accountLabel(email) {
  const name = (email || '').split('@')[0];
  return name.length > 12 ? name.slice(0, 12) + '…' : name;
}

// Prefer mounting inside the site navbar so the button sits inline with the
// nav links instead of floating over the header.
function navMount() {
  const nav = document.querySelector('#main-navbar nav');
  if (!nav) return null;
  const slot = document.createElement('div');
  slot.id = 'pci-account-slot';
  slot.className = 'flex items-center';
  nav.appendChild(slot);
  return slot;
}

function floatingMount() {
  const el = document.createElement('div');
  el.id = 'pci-account-slot';
  el.style.cssText =
    'position:fixed;top:92px;right:16px;z-index:40;';
  document.body.appendChild(el);
  return el;
}

function buildModal() {
  const overlay = document.createElement('div');
  overlay.className = 'pci-auth-overlay';
  overlay.innerHTML = `
    <div class="pci-auth-modal" role="dialog" aria-modal="true">
      <button class="pci-auth-close" aria-label="Close">&times;</button>
      <h3 class="pci-auth-title">Sign in to PCI</h3>
      <p class="pci-auth-sub">Access your account, saved carts, and order history.</p>
      <button type="button" class="pci-auth-google">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>
      <div class="pci-auth-divider"><span>or</span></div>
      <form class="pci-auth-form">
        <div class="pci-auth-signup-fields" hidden>
          <input type="text" placeholder="Full name" class="pci-auth-input pci-auth-name" autocomplete="name" />
          <input type="tel" placeholder="Phone (e.g. +1 713 555 0100)" class="pci-auth-input pci-auth-phone" autocomplete="tel" />
          <input type="text" placeholder="Street address" class="pci-auth-input pci-auth-addr1" autocomplete="address-line1" />
          <div class="pci-auth-row">
            <input type="text" placeholder="City" class="pci-auth-input pci-auth-city" autocomplete="address-level2" />
            <input type="text" placeholder="State" class="pci-auth-input pci-auth-state" autocomplete="address-level1" style="max-width:80px" />
            <input type="text" placeholder="ZIP" class="pci-auth-input pci-auth-zip" autocomplete="postal-code" style="max-width:90px" />
          </div>
        </div>
        <input type="email" required placeholder="you@lab.org" class="pci-auth-input pci-auth-email" autocomplete="email" />
        <input type="password" required placeholder="Password" class="pci-auth-input pci-auth-pass" autocomplete="current-password" minlength="6" />
        <button type="submit" class="pci-auth-submit">Sign in</button>
      </form>
      <p class="pci-auth-msg" hidden></p>
      <p class="pci-auth-toggle">New to PCI? <a href="#" class="pci-auth-switch">Create an account</a></p>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => (overlay.style.display = 'none');
  overlay.querySelector('.pci-auth-close').onclick = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };

  const form = overlay.querySelector('.pci-auth-form');
  const msg = overlay.querySelector('.pci-auth-msg');
  const title = overlay.querySelector('.pci-auth-title');
  const sub = overlay.querySelector('.pci-auth-sub');
  const submit = form.querySelector('.pci-auth-submit');
  const passInput = form.querySelector('.pci-auth-pass');
  const toggle = overlay.querySelector('.pci-auth-toggle');

  const signupFields = overlay.querySelector('.pci-auth-signup-fields');
  let mode = 'signin'; // or 'signup'
  const applyMode = () => {
    if (mode === 'signin') {
      title.textContent = 'Sign in to PCI';
      sub.textContent = 'Access your account, saved carts, and order history.';
      submit.textContent = 'Sign in';
      passInput.setAttribute('autocomplete', 'current-password');
      toggle.innerHTML = 'New to PCI? <a href="#" class="pci-auth-switch">Create an account</a>';
      signupFields.hidden = true;
    } else {
      title.textContent = 'Create your PCI account';
      sub.textContent = 'Sign up to save carts and track orders across devices.';
      submit.textContent = 'Create account';
      passInput.setAttribute('autocomplete', 'new-password');
      toggle.innerHTML = 'Already have an account? <a href="#" class="pci-auth-switch">Sign in</a>';
      signupFields.hidden = false;
    }
    wireSwitch();
    msg.hidden = true;
  };
  const wireSwitch = () => {
    overlay.querySelector('.pci-auth-switch').onclick = (e) => {
      e.preventDefault();
      mode = mode === 'signin' ? 'signup' : 'signin';
      applyMode();
    };
  };
  wireSwitch();

  const show = (text, ok) => {
    msg.hidden = false;
    msg.textContent = text;
    msg.className = 'pci-auth-msg ' + (ok ? 'pci-auth-ok' : 'pci-auth-err');
  };

  // Google OAuth
  overlay.querySelector('.pci-auth-google').onclick = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) show(error.message, false);
    } catch (err) {
      show("Can't reach the login service right now. Please try again shortly.", false);
    }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = form.querySelector('.pci-auth-email').value.trim();
    const password = passInput.value;
    if (!email || !password) return;
    submit.disabled = true;
    const busy = mode === 'signin' ? 'Signing in…' : 'Creating…';
    submit.textContent = busy;
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) show(error.message, false);
        else { show('Signed in.', true); setTimeout(close, 600); }
      } else {
        const name = form.querySelector('.pci-auth-name').value.trim();
        const phone = form.querySelector('.pci-auth-phone').value.trim();
        const addr1 = form.querySelector('.pci-auth-addr1').value.trim();
        const city = form.querySelector('.pci-auth-city').value.trim();
        const state = form.querySelector('.pci-auth-state').value.trim();
        const zip = form.querySelector('.pci-auth-zip').value.trim();
        if (!name || !phone || !addr1 || !city || !state || !zip) {
          show('Please fill in your name, phone, and full address.', false);
          submit.disabled = false;
          submit.textContent = 'Create account';
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name, phone, address: { line1: addr1, city, state, zip } } },
        });
        if (error) show(error.message, false);
        else if (data.session) { show('Account created — you\'re in.', true); setTimeout(close, 700); }
        else show('Account created. Check your email to confirm, then sign in.', true);
      }
    } catch (err) {
      show("Can't reach the login service right now. Please try again shortly.", false);
    }
    submit.disabled = false;
    submit.textContent = mode === 'signin' ? 'Sign in' : 'Create account';
  };

  return overlay;
}

function openModal(overlay) {
  overlay.style.display = 'flex';
  overlay.querySelector('.pci-auth-input').focus();
}

function injectStyles() {
  if (document.getElementById('pci-auth-styles')) return;
  const s = document.createElement('style');
  s.id = 'pci-auth-styles';
  s.textContent = `
    .pci-account-btn{font:600 13px/1 "Inter",sans-serif;color:#012b1a;background:rgba(255,255,255,.9);
      border:1px solid #10b981;border-radius:9999px;padding:8px 16px;cursor:pointer;
      box-shadow:0 2px 8px rgba(1,43,26,.12);transition:all .15s}
    .pci-account-btn:hover{background:#10b981;color:#fff}
    .pci-auth-overlay{display:none;position:fixed;inset:0;z-index:300;background:rgba(1,43,26,.45);
      backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px}
    .pci-auth-modal{position:relative;background:#fff;border-radius:24px;max-width:400px;width:100%;
      padding:32px;box-shadow:0 24px 60px rgba(1,43,26,.28);font-family:"Inter",sans-serif}
    .pci-auth-modal h3{font:700 22px/1.2 "Sora","Inter",sans-serif;color:#012b1a;margin:0 0 8px}
    .pci-auth-sub{font-size:13px;color:#475569;margin:0 0 20px}
    .pci-auth-form{display:flex;flex-direction:column;gap:10px}
    .pci-auth-signup-fields{display:flex;flex-direction:column;gap:10px}
    .pci-auth-row{display:flex;gap:8px}
    .pci-auth-row .pci-auth-input{flex:1;min-width:0}
    .pci-auth-input{border:1px solid #cbd5e1;border-radius:12px;padding:12px 14px;font-size:14px;outline:none}
    .pci-auth-input:focus{border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.15)}
    .pci-auth-submit{background:#012b1a;color:#fff;border:none;border-radius:12px;padding:12px;
      font:700 14px "Inter",sans-serif;cursor:pointer;transition:background .15s}
    .pci-auth-submit:hover{background:#044e35}
    .pci-auth-submit:disabled{opacity:.6;cursor:default}
    .pci-auth-close{position:absolute;top:14px;right:16px;border:none;background:none;font-size:26px;
      line-height:1;color:#94a3b8;cursor:pointer}
    .pci-auth-msg{font-size:13px;margin:14px 0 0}
    .pci-auth-ok{color:#059669}
    .pci-auth-err{color:#e11d48}
    .pci-auth-toggle{font-size:13px;color:#475569;margin:16px 0 0;text-align:center}
    .pci-auth-switch{color:#059669;font-weight:600;text-decoration:none}
    .pci-auth-switch:hover{text-decoration:underline}
    .pci-auth-google{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;
      background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:11px;font:600 14px "Inter",sans-serif;
      color:#334155;cursor:pointer;transition:background .15s,border-color .15s}
    .pci-auth-google:hover{background:#f8fafc;border-color:#94a3b8}
    .pci-auth-divider{display:flex;align-items:center;gap:12px;margin:16px 0;color:#94a3b8;font-size:12px}
    .pci-auth-divider::before,.pci-auth-divider::after{content:"";flex:1;height:1px;background:#e2e8f0}
    .pci-acct-pop{position:fixed;z-index:310;background:#fff;border:1px solid #e2e8f0;border-radius:14px;
      box-shadow:0 20px 48px rgba(1,43,26,.20);min-width:280px;padding:10px;font-family:"Inter",sans-serif;
      animation:pciPopIn .16s ease-out both}
    @keyframes pciPopIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
    .pci-acct-hd{display:flex;align-items:center;gap:12px;padding:10px 10px 14px;border-bottom:1px solid #f1f5f9;margin-bottom:6px}
    .pci-acct-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#10b981,#012b1a);
      color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0}
    .pci-acct-info{min-width:0;flex:1}
    .pci-acct-name{font-weight:700;font-size:14px;color:#012b1a;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .pci-acct-email{font-size:11px;color:#64748b;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}
    .pci-acct-status{font-size:10px;line-height:1.3;margin-top:3px;font-weight:600}
    .pci-acct-status.ok{color:#059669}
    .pci-acct-status.warn{color:#d97706}
    .pci-acct-item{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:8px;
      color:#012b1a;text-decoration:none;transition:background .12s}
    .pci-acct-item:hover{background:#f0fdf4}
    .pci-acct-icon{width:28px;height:28px;display:flex;align-items:center;justify-content:center;
      background:#f1f5f9;border-radius:8px;flex-shrink:0;color:#475569}
    .pci-acct-icon svg{width:14px;height:14px}
    .pci-acct-item:hover .pci-acct-icon{background:#10b981;color:#fff}
    .pci-acct-label{font-size:13px;font-weight:600;color:#012b1a;line-height:1.2}
    .pci-acct-desc{font-size:11px;color:#64748b;line-height:1.3;margin-top:1px}
    .pci-acct-sep{height:1px;background:#f1f5f9;margin:6px 4px}
    .pci-acct-signout{width:100%;background:#fff;color:#012b1a;border:1px solid #cbd5e1;border-radius:10px;
      padding:9px;font:600 13px "Inter",sans-serif;cursor:pointer;transition:all .15s}
    .pci-acct-signout:hover{background:#012b1a;color:#fff;border-color:#012b1a}
    .pci-toast{position:fixed;bottom:24px;left:50%;transform:translate(-50%,20px);z-index:400;
      background:#012b1a;color:#fff;padding:12px 20px;border-radius:12px;font:500 13px "Inter",sans-serif;
      box-shadow:0 12px 32px rgba(1,43,26,.35);opacity:0;transition:opacity .24s,transform .24s;max-width:90vw}
    .pci-toast.pci-toast-in{opacity:1;transform:translate(-50%,0)}
    .pci-verify-overlay .pci-verify-icon{width:56px;height:56px;border-radius:50%;
      background:linear-gradient(135deg,#10b981,#012b1a);color:#fff;display:flex;
      align-items:center;justify-content:center;font-size:26px;margin:0 auto 16px}
    .pci-verify-overlay .pci-auth-title,.pci-verify-overlay .pci-auth-sub{text-align:center}
    .pci-verify-resend{margin-top:6px}
    .pci-verify-check{width:100%;margin-top:8px;background:#fff;color:#012b1a;
      border:1px solid #cbd5e1;border-radius:12px;padding:12px;font:600 14px "Inter",sans-serif;cursor:pointer}
    .pci-verify-check:hover{background:#f8fafc;border-color:#012b1a}`;
  document.head.appendChild(s);
}
