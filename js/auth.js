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
  const mount = document.getElementById('pci-account-slot') || floatingMount();

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

function floatingMount() {
  const el = document.createElement('div');
  el.id = 'pci-account-slot';
  el.style.cssText =
    'position:fixed;top:14px;right:16px;z-index:200;';
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
    .pci-auth-switch:hover{text-decoration:underline}`;
  document.head.appendChild(s);
}
