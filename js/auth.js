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
  supabase.auth.onAuthStateChange((_e, session) => render(session?.user || null));

  function openMenu(user) {
    if (confirm(`Signed in as ${user.email}\n\nSign out?`)) {
      supabase.auth.signOut();
    }
  }
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

  let mode = 'signin'; // or 'signup'
  const applyMode = () => {
    if (mode === 'signin') {
      title.textContent = 'Sign in to PCI';
      sub.textContent = 'Access your account, saved carts, and order history.';
      submit.textContent = 'Sign in';
      passInput.setAttribute('autocomplete', 'current-password');
      toggle.innerHTML = 'New to PCI? <a href="#" class="pci-auth-switch">Create an account</a>';
    } else {
      title.textContent = 'Create your PCI account';
      sub.textContent = 'Sign up to save carts and track orders across devices.';
      submit.textContent = 'Create account';
      passInput.setAttribute('autocomplete', 'new-password');
      toggle.innerHTML = 'Already have an account? <a href="#" class="pci-auth-switch">Sign in</a>';
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
        const { data, error } = await supabase.auth.signUp({ email, password });
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
    .pci-auth-divider::before,.pci-auth-divider::after{content:"";flex:1;height:1px;background:#e2e8f0}`;
  document.head.appendChild(s);
}
