document.addEventListener('DOMContentLoaded', () => {
  // 1. STICKY NAV AND SCROLL EFFECT
  const navbar = document.getElementById('main-navbar');
  const navLinks = navbar ? navbar.querySelectorAll('.nav-link') : [];
  const launchBtn = document.getElementById('btn-viewer-launch');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  let isNavbarHovered = false;

  const updateNavbarState = () => {
    if (!navbar) return;
    const isScrolled = window.scrollY > 20;
    const shouldBeWhite = isScrolled || isNavbarHovered;

    const logoText = document.getElementById('nav-logo-text');

    if (shouldBeWhite) {
      navbar.className = "fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-md h-20";
      
      if (logoText) {
        logoText.src = "FONT1.png";
      }

      navLinks.forEach(link => {
        if (link.classList.contains('active')) {
          link.className = "nav-link active text-emerald-600 text-sm font-semibold transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-emerald-600";
        } else {
          link.className = "nav-link text-gray-600 text-sm font-medium transition-colors hover:text-emerald-600";
        }
      });
      if (launchBtn) {
        launchBtn.className = "bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all duration-150 flex items-center gap-1.5";
      }
      if (mobileMenuBtn) {
        mobileMenuBtn.className = "text-gray-600 hover:text-emerald-600 focus:outline-none p-2 rounded-lg hover:bg-gray-100";
      }
      const cartToggle = document.getElementById('cart-toggle-btn');
      if (cartToggle) cartToggle.classList.replace('text-white/85', 'text-gray-600');
    } else {
      navbar.className = "fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-black/15 backdrop-blur-md border-b border-white/10 h-20";
      
      if (logoText) {
        logoText.src = "FONT2.png";
      }

      navLinks.forEach(link => {
        if (link.classList.contains('active')) {
          link.className = "nav-link active text-white text-sm font-semibold transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-white";
        } else {
          link.className = "nav-link text-white/85 text-sm font-medium transition-colors hover:text-white";
        }
      });
      if (launchBtn) {
        launchBtn.className = "bg-transparent hover:bg-white hover:text-black text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/40 transition-all duration-150 flex items-center gap-1.5";
      }
      if (mobileMenuBtn) {
        mobileMenuBtn.className = "text-white hover:text-pci-blue-light focus:outline-none p-2 rounded-lg hover:bg-white/10";
      }
      const cartToggle = document.getElementById('cart-toggle-btn');
      if (cartToggle) cartToggle.classList.replace('text-gray-600', 'text-white/85');
    }
  };

  if (navbar) {
    window.addEventListener('scroll', updateNavbarState);
    navbar.addEventListener('mouseenter', () => {
      isNavbarHovered = true;
      updateNavbarState();
    });
    navbar.addEventListener('mouseleave', () => {
      isNavbarHovered = false;
      updateNavbarState();
    });
    updateNavbarState();
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.add('hidden');
      } else {
        mobileMenu.classList.remove('hidden');
      }
    });
  }

  // 2. RENDER DYNAMIC CATALOG CARDS
  const grid = document.getElementById('products-catalog-grid');
  const products = window.pciProducts || [];
  
  // Clean clinical SVG vector blueprints replacing AI-generated image assets
  const blockImgUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' rx='24' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='4'/><rect x='100' y='80' width='400' height='340' rx='16' fill='%23fef9c3' stroke='%23fef08a' stroke-width='6'/><rect x='150' y='120' width='300' height='260' rx='8' fill='%23fefef0' stroke='%23eab308' stroke-width='3' stroke-dasharray='6 4'/><circle cx='250' cy='210' r='24' fill='%230f172a' fill-opacity='0.15' stroke='%23475569' stroke-width='3'/><circle cx='350' cy='210' r='24' fill='%230f172a' fill-opacity='0.6' stroke='%23475569' stroke-width='3'/><circle cx='250' cy='290' r='24' fill='%230f172a' fill-opacity='0.85' stroke='%23475569' stroke-width='3'/><circle cx='350' cy='290' r='24' fill='%230f172a' fill-opacity='0.35' stroke='%23475569' stroke-width='3'/><text x='300' y='470' font-family='sans-serif' font-size='20' font-weight='bold' fill='%231e293b' text-anchor='middle'>PCI FFPE REFERENCE BLOCK</text><text x='300' y='505' font-family='monospace' font-size='14' fill='%2364748b' text-anchor='middle'>CROSS-SECTIONAL PLUG CONFIGURATION</text></svg>";
  
  const slideImgUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' rx='24' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='4'/><rect x='80' y='180' width='440' height='180' rx='10' fill='%23ffffff' stroke='%2394a3b8' stroke-width='4'/><rect x='80' y='180' width='120' height='180' rx='6' fill='%23e2e8f0'/><rect x='100' y='220' width='80' height='10' fill='%2394a3b8' rx='2'/><rect x='100' y='245' width='80' height='10' fill='%2394a3b8' rx='2'/><rect x='100' y='270' width='60' height='10' fill='%2394a3b8' rx='2'/><circle cx='260' cy='270' r='22' fill='%2310b981' fill-opacity='0.15' stroke='%23059669' stroke-width='2'/><circle cx='340' cy='270' r='22' fill='%2310b981' fill-opacity='0.5' stroke='%23059669' stroke-width='2'/><circle cx='420' cy='270' r='22' fill='%2310b981' fill-opacity='0.85' stroke='%23059669' stroke-width='2'/><text x='300' y='470' font-family='sans-serif' font-size='20' font-weight='bold' fill='%231e293b' text-anchor='middle'>PCI IHC CONTROL SLIDE</text><text x='300' y='505' font-family='monospace' font-size='14' fill='%2364748b' text-anchor='middle'>LINEAR REPLICATED CELL PLUGS</text></svg>";

  const renderProducts = (filter = 'all') => {
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = products.filter(p => {
      if (filter === 'all') return true;
      if (filter === 'block') return p.media.toLowerCase().includes('block');
      if (filter === 'slide') return p.media.toLowerCase().includes('slide');
      if (filter === 'single') return p.type.toLowerCase().includes('single');
      if (filter === 'dual') return p.type.toLowerCase().includes('dual');
      if (filter === 'tri') return p.type.toLowerCase().includes('tri');
      if (filter === 'quad') return p.type.toLowerCase().includes('quad');
      return true;
    });

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = "product-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:scale-[1.02] hover:shadow-md transition-all duration-300 animate-fade-in";
      
      const badgeColor = item.type.includes('Tri') 
        ? 'bg-indigo-50 text-indigo-600' 
        : item.type.includes('Dual') 
          ? 'bg-amber-50 text-amber-600'
          : item.type.includes('Quad')
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-slate-100 text-slate-700';

      const thumbSrc = item.image ? item.image : (item.imageType === 'block' ? blockImgUrl : slideImgUrl);

      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-4">
            <span class="badge-pci ${badgeColor} font-mono text-[9px] uppercase tracking-wider">${item.type}</span>
            <span class="badge-pci bg-slate-50 text-slate-600 font-mono text-[9px] uppercase tracking-wider">${item.media}</span>
          </div>
          
          <!-- Image Box -->
          <a href="product.html?code=${item.code}" class="block aspect-video w-full flex items-center justify-center p-3 border border-slate-100 rounded-xl bg-slate-50/50 mb-4 group overflow-hidden">
            <img src="${thumbSrc}" alt="${item.name}" class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110" referrerPolicy="no-referrer">
          </a>

          <h3 class="text-base font-bold text-gray-900 mb-1 leading-tight hover:text-emerald-700 transition-colors">
            <a href="product.html?code=${item.code}">${item.name}</a>
          </h3>
          <p class="text-[10px] text-gray-400 mb-3 font-mono">${item.code}</p>
          <p class="text-xs text-gray-500 leading-relaxed mb-6 line-clamp-2">${item.shortDesc}</p>
        </div>
        
        <div>
          <a href="product.html?code=${item.code}" class="flex items-center text-xs text-emerald-700 hover:text-emerald-600 font-semibold mb-4 transition-colors">
            View Details & Order →
          </a>
          <div class="pt-5 border-t border-slate-100 flex items-center justify-between">
            <span class="text-base font-bold text-slate-900 font-mono">$${item.price.toLocaleString('en-US')}</span>
            <button class="add-to-cart-quick-btn bg-slate-800 hover:bg-slate-950 text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-all active:scale-[0.97]" data-code="${item.code}">Add to Cart</button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Wire up quick add buttons
    grid.querySelectorAll('.add-to-cart-quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = btn.getAttribute('data-code');
        const product = products.find(p => p.code === code);
        if (product) {
          quickAddProduct(product);
        }
      });
    });
  };

  // 3. FILTER BUTTONS HANDLING
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active', 'bg-emerald-600', 'text-white'));
      filterBtns.forEach(b => b.classList.add('bg-white', 'text-gray-600'));
      
      btn.classList.add('active', 'bg-emerald-600', 'text-white');
      btn.classList.remove('bg-white', 'text-gray-600');

      const filter = btn.getAttribute('data-filter');
      renderProducts(filter);
    });
  });

  // Render initial products list
  renderProducts();

  // 4. SHOPPING CART ENGINE
  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem('pci_cart')) || [];
    } catch {
      return [];
    }
  };

  const saveCart = (cart) => {
    localStorage.setItem('pci_cart', JSON.stringify(cart));
    updateCartBadges();
  };

  const updateCartBadges = () => {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const badges = [
      document.getElementById('cart-badge'),
      document.getElementById('cart-badge-mobile')
    ];

    badges.forEach(badge => {
      if (badge) {
        if (totalItems > 0) {
          badge.textContent = totalItems;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    });
  };

  const updateCartDrawerItems = () => {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');
    const subtotalEl = document.getElementById('cart-subtotal');
    
    if (cart.length === 0) {
      container.innerHTML = '';
      container.appendChild(emptyState);
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      return;
    }

    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
      const itemCost = item.price * item.quantity;
      subtotal += itemCost;

      const itemEl = document.createElement('div');
      itemEl.className = "flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative animate-fade-in";
      
      const thumbSrc = item.image ? item.image : (item.imageType === 'block' ? blockImgUrl : slideImgUrl);

      itemEl.innerHTML = `
        <img src="${thumbSrc}" alt="${item.name}" class="w-12 h-12 rounded-lg object-contain bg-white border p-1" referrerPolicy="no-referrer">
        <div class="flex-1 space-y-1">
          <h4 class="text-xs font-bold text-slate-800 leading-tight pr-6">${item.name}</h4>
          <p class="text-[10px] font-mono text-slate-400 uppercase">${item.code}</p>
          <div class="flex items-center justify-between pt-2">
            <!-- Mini Selector -->
            <div class="flex items-center gap-2.5 border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs font-bold">
              <button class="cart-qty-minus text-slate-400 hover:text-slate-800 focus:outline-none" data-idx="${index}">-</button>
              <span class="font-mono text-slate-700">${item.quantity}</span>
              <button class="cart-qty-plus text-slate-400 hover:text-slate-800 focus:outline-none" data-idx="${index}">+</button>
            </div>
            <span class="font-mono text-xs font-bold text-slate-800">$${itemCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <!-- Remove -->
        <button class="cart-remove-btn absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors focus:outline-none" data-idx="${index}">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      `;

      container.appendChild(itemEl);
    });

    if (subtotalEl) {
      subtotalEl.textContent = `$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    // Attach drawer control event listeners
    container.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (cart[idx].quantity > 1) {
          cart[idx].quantity--;
          saveCart(cart);
          updateCartDrawerItems();
        }
      });
    });

    container.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        cart[idx].quantity++;
        saveCart(cart);
        updateCartDrawerItems();
      });
    });

    container.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        cart.splice(idx, 1);
        saveCart(cart);
        updateCartDrawerItems();
      });
    });
  };

  const toggleCartDrawer = (forceOpen = false) => {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    
    if (!drawer || !overlay) return;

    const isOpen = drawer.classList.contains('translate-x-0');

    if (isOpen && !forceOpen) {
      drawer.classList.replace('translate-x-0', 'translate-x-full');
      overlay.classList.add('pointer-events-none');
      overlay.classList.replace('opacity-100', 'opacity-0');
    } else {
      updateCartDrawerItems();
      drawer.classList.replace('translate-x-full', 'translate-x-0');
      overlay.classList.remove('pointer-events-none');
      overlay.classList.replace('opacity-0', 'opacity-100');
    }
  };

  const quickAddProduct = (item) => {
    const cart = getCart();
    const existing = cart.find(c => c.code === item.code);

    if (existing) {
      existing.quantity++;
    } else {
      cart.push({
        code: item.code,
        name: item.name,
        price: item.price,
        imageType: item.imageType,
        quantity: 1
      });
    }

    saveCart(cart);

    // Smoothly open the drawer
    setTimeout(() => {
      toggleCartDrawer(true);
    }, 200);
  };

  // Attach navbar toggles
  document.getElementById('cart-toggle-btn').addEventListener('click', (e) => {
    e.preventDefault();
    toggleCartDrawer();
  });

  const cartMobile = document.getElementById('cart-toggle-btn-mobile');
  if (cartMobile) {
    cartMobile.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCartDrawer();
    });
  }

  document.getElementById('cart-close-btn').addEventListener('click', () => toggleCartDrawer());
  document.getElementById('cart-drawer-overlay').addEventListener('click', () => toggleCartDrawer());
  
  const btnCartCont = document.getElementById('btn-cart-continue');
  if (btnCartCont) {
    btnCartCont.addEventListener('click', () => toggleCartDrawer());
  }

  // Checkout Success triggers
  document.getElementById('cart-checkout-btn').addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) return;

    toggleCartDrawer();

    const modalOverlay = document.getElementById('checkout-modal-overlay');
    const modal = document.getElementById('checkout-modal');
    
    if (modalOverlay && modal) {
      modalOverlay.classList.remove('pointer-events-none');
      modalOverlay.classList.replace('opacity-0', 'opacity-100');
      modal.classList.replace('scale-95', 'scale-100');
    }

    saveCart([]);
  });

  document.getElementById('checkout-modal-close-btn').addEventListener('click', () => {
    const modalOverlay = document.getElementById('checkout-modal-overlay');
    const modal = document.getElementById('checkout-modal');
    
    if (modalOverlay && modal) {
      modalOverlay.classList.add('pointer-events-none');
      modalOverlay.classList.replace('opacity-100', 'opacity-0');
      modal.classList.replace('scale-100', 'scale-95');
    }
  });

  updateCartBadges();
});
