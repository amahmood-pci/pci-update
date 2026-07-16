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
      // Update cart toggler colors
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

  // Mobile navigation drawer toggle
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

  // 2. PARSE PRODUCT DATA FROM URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code') || '';
  const products = window.pciProducts || [];
  const product = products.find(p => p.code.toLowerCase() === code.toLowerCase());

  const grid = document.getElementById('product-content-grid');
  const specSection = document.getElementById('specifications-section');
  const errorState = document.getElementById('product-error-state');

  if (!product) {
    if (grid) grid.classList.add('hidden');
    if (specSection) specSection.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    return;
  }

  // 3. RENDER PRODUCT DETAILS
  document.title = `${product.name} — Precision Cellular Immunology`;
  document.getElementById('breadcrumb-current-product').textContent = product.name;
  document.getElementById('product-type-badge').textContent = product.type;
  document.getElementById('product-media-badge').textContent = product.media;
  document.getElementById('product-title').textContent = product.name;
  document.getElementById('product-code').textContent = `CODE: ${product.code}`;
  document.getElementById('product-price').textContent = `$${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  document.getElementById('product-short-desc').textContent = product.shortDesc;
  document.getElementById('product-long-desc').textContent = product.longDesc;

  // Specifications table
  document.getElementById('spec-biomarker').textContent = product.biomarker;
  document.getElementById('spec-media').textContent = product.media;
  document.getElementById('spec-type').textContent = product.type;
  document.getElementById('spec-cell-lines').textContent = product.cellLines.filter(c => c !== "-").join(', ');
  document.getElementById('spec-code').textContent = product.code;
  
  const extLink = document.getElementById('spec-external-url');
  if (extLink) extLink.href = product.url;

  // Set real QR code via Google Charts / QR Server API pointing to their actual Squarespace page
  const qrImg = document.getElementById('product-qr-code');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=022c22&data=${encodeURIComponent(product.url)}`;
  }
  const qrCap = document.getElementById('qr-caption-code');
  if (qrCap) qrCap.textContent = product.code;

  // 4. IMAGE GALLERY SYSTEM
  // Clean clinical SVG vector blueprints replacing AI-generated image assets
  const blockImgUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' rx='24' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='4'/><rect x='100' y='80' width='400' height='340' rx='16' fill='%23fef9c3' stroke='%23fef08a' stroke-width='6'/><rect x='150' y='120' width='300' height='260' rx='8' fill='%23fefef0' stroke='%23eab308' stroke-width='3' stroke-dasharray='6 4'/><circle cx='250' cy='210' r='24' fill='%230f172a' fill-opacity='0.15' stroke='%23475569' stroke-width='3'/><circle cx='350' cy='210' r='24' fill='%230f172a' fill-opacity='0.6' stroke='%23475569' stroke-width='3'/><circle cx='250' cy='290' r='24' fill='%230f172a' fill-opacity='0.85' stroke='%23475569' stroke-width='3'/><circle cx='350' cy='290' r='24' fill='%230f172a' fill-opacity='0.35' stroke='%23475569' stroke-width='3'/><text x='300' y='470' font-family='sans-serif' font-size='20' font-weight='bold' fill='%231e293b' text-anchor='middle'>PCI FFPE REFERENCE BLOCK</text><text x='300' y='505' font-family='monospace' font-size='14' fill='%2364748b' text-anchor='middle'>CROSS-SECTIONAL PLUG CONFIGURATION</text></svg>";
  
  const slideImgUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' rx='24' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='4'/><rect x='80' y='180' width='440' height='180' rx='10' fill='%23ffffff' stroke='%2394a3b8' stroke-width='4'/><rect x='80' y='180' width='120' height='180' rx='6' fill='%23e2e8f0'/><rect x='100' y='220' width='80' height='10' fill='%2394a3b8' rx='2'/><rect x='100' y='245' width='80' height='10' fill='%2394a3b8' rx='2'/><rect x='100' y='270' width='60' height='10' fill='%2394a3b8' rx='2'/><circle cx='260' cy='270' r='22' fill='%2310b981' fill-opacity='0.15' stroke='%23059669' stroke-width='2'/><circle cx='340' cy='270' r='22' fill='%2310b981' fill-opacity='0.5' stroke='%23059669' stroke-width='2'/><circle cx='420' cy='270' r='22' fill='%2310b981' fill-opacity='0.85' stroke='%23059669' stroke-width='2'/><text x='300' y='470' font-family='sans-serif' font-size='20' font-weight='bold' fill='%231e293b' text-anchor='middle'>PCI IHC CONTROL SLIDE</text><text x='300' y='505' font-family='monospace' font-size='14' fill='%2364748b' text-anchor='middle'>LINEAR REPLICATED CELL PLUGS</text></svg>";
  
  const blockZoomImgUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' rx='24' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='4'/><circle cx='300' cy='260' r='180' fill='%230f172a' fill-opacity='0.05' stroke='%2310b981' stroke-width='4'/><circle cx='300' cy='260' r='140' fill='none' stroke='%2310b981' stroke-width='2' stroke-dasharray='8 6'/><circle cx='240' cy='200' r='12' fill='%2310b981' fill-opacity='0.7'/><circle cx='260' cy='220' r='10' fill='%2310b981' fill-opacity='0.5'/><circle cx='280' cy='180' r='14' fill='%2310b981' fill-opacity='0.8'/><circle cx='340' cy='240' r='11' fill='%2310b981' fill-opacity='0.6'/><circle cx='310' cy='310' r='13' fill='%2310b981' fill-opacity='0.75'/><circle cx='360' cy='290' r='10' fill='%2310b981' fill-opacity='0.4'/><line x1='100' y1='260' x2='500' y2='260' stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.5'/><line x1='300' y1='60' x2='300' y2='460' stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.5'/><text x='300' y='490' font-family='sans-serif' font-size='20' font-weight='bold' fill='%231e293b' text-anchor='middle'>MICROSCOPIC CORES RESOLUTION</text><text x='300' y='525' font-family='monospace' font-size='14' fill='%2364748b' text-anchor='middle'>VERIFIED REPRODUCIBILITY @ 40X MAGNIFICATION</text></svg>";

  const slideZoomImgUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' rx='24' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='4'/><rect x='80' y='80' width='440' height='360' rx='12' fill='%23ffffff' stroke='%23e2e8f0' stroke-width='2'/><circle cx='180' cy='180' r='45' fill='%2334d399' fill-opacity='0.25' stroke='%2310b981' stroke-width='2'/><circle cx='180' cy='180' r='18' fill='%23065f46' fill-opacity='0.85'/><circle cx='420' cy='180' r='50' fill='%2334d399' fill-opacity='0.25' stroke='%2310b981' stroke-width='2'/><circle cx='420' cy='180' r='22' fill='%23065f46' fill-opacity='0.85'/><circle cx='300' cy='320' r='55' fill='%2334d399' fill-opacity='0.25' stroke='%2310b981' stroke-width='2'/><circle cx='300' cy='320' r='25' fill='%23065f46' fill-opacity='0.85'/><path d='M150 350 Q 220 380 320 360' fill='none' stroke='%2364748b' stroke-width='2' stroke-dasharray='4 4'/><text x='300' y='490' font-family='sans-serif' font-size='20' font-weight='bold' fill='%231e293b' text-anchor='middle'>NUCLEAR DAB METRICS</text><text x='300' y='525' font-family='monospace' font-size='14' fill='%2364748b' text-anchor='middle'>EXPECTED CRITICAL IHC INTENSITY SCHEMATIC</text></svg>";

  const packageQcImgUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' rx='24' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='4'/><rect x='150' y='100' width='300' height='300' rx='12' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='4'/><rect x='180' y='130' width='240' height='150' rx='8' fill='%23f1f5f9' stroke='%2394a3b8' stroke-width='2'/><line x1='200' y1='160' x2='400' y2='160' stroke='%2310b981' stroke-width='3'/><line x1='200' y1='190' x2='360' y2='190' stroke='%2394a3b8' stroke-width='2'/><line x1='200' y1='220' x2='300' y2='220' stroke='%2394a3b8' stroke-width='2'/><circle cx='300' cy='340' r='30' fill='%23d1fae5' stroke='%2310b981' stroke-width='3'/><path d='M290 340 L297 347 L312 332' stroke='%2310b981' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='300' y='470' font-family='sans-serif' font-size='20' font-weight='bold' fill='%231e293b' text-anchor='middle'>QUALITY ASSURANCE PACKAGING</text><text x='300' y='505' font-family='monospace' font-size='14' fill='%2364748b' text-anchor='middle'>SECURE CLINICAL SHIPMENT PROTOCOLS</text></svg>";

  const barcodeCheckImgUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' rx='24' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='4'/><rect x='120' y='140' width='360' height='180' rx='8' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='3'/><rect x='150' y='170' width='10' height='120' fill='%231e293b'/><rect x='170' y='170' width='20' height='120' fill='%231e293b'/><rect x='200' y='170' width='5' height='120' fill='%231e293b'/><rect x='215' y='170' width='15' height='120' fill='%231e293b'/><rect x='240' y='170' width='30' height='120' fill='%231e293b'/><rect x='280' y='170' width='10' height='120' fill='%231e293b'/><rect x='300' y='170' width='5' height='120' fill='%231e293b'/><rect x='315' y='170' width='25' height='120' fill='%231e293b'/><rect x='350' y='170' width='15' height='120' fill='%231e293b'/><rect x='375' y='170' width='20' height='120' fill='%231e293b'/><rect x='405' y='170' width='5' height='120' fill='%231e293b'/><rect x='420' y='170' width='30' height='120' fill='%231e293b'/><text x='300' y='340' font-family='monospace' font-size='18' font-weight='bold' fill='%231e293b' text-anchor='middle'>LIMS SECURE BARCODE</text><text x='300' y='470' font-family='sans-serif' font-size='20' font-weight='bold' fill='%231e293b' text-anchor='middle'>FULL PATHOLOGY TRACEABILITY</text><text x='300' y='505' font-family='monospace' font-size='14' fill='%2364748b' text-anchor='middle'>INSTITUTIONAL BIOREPOSITORY RECORDS</text></svg>";

  const baseImg = product.image ? product.image : (product.imageType === "block" ? blockImgUrl : slideImgUrl);

  // Create four views for gallery slide list
  const galleryImages = [
    baseImg,
    product.imageType === "block" ? blockZoomImgUrl : slideZoomImgUrl,
    packageQcImgUrl,
    barcodeCheckImgUrl
  ];

  let currentImageIndex = 0;
  const mainImageEl = document.getElementById('main-product-image');
  const thumbContainer = document.getElementById('product-gallery-thumbnails');

  const updateMainImage = (index) => {
    currentImageIndex = index;
    if (mainImageEl) {
      mainImageEl.classList.add('opacity-0');
      setTimeout(() => {
        mainImageEl.src = galleryImages[currentImageIndex];
        mainImageEl.classList.remove('opacity-0');
      }, 100);
    }
    
    // Highlight thumbnail
    const thumbs = thumbContainer.querySelectorAll('.thumb-item');
    thumbs.forEach((thumb, tIndex) => {
      if (tIndex === index) {
        thumb.className = "thumb-item w-14 h-14 md:w-full aspect-square bg-white rounded-xl border-2 border-emerald-600 p-1 cursor-pointer transition-all shrink-0 flex items-center justify-center";
      } else {
        thumb.className = "thumb-item w-14 h-14 md:w-full aspect-square bg-white rounded-xl border border-slate-200 hover:border-slate-400 p-1 cursor-pointer transition-all shrink-0 flex items-center justify-center";
      }
    });
  };

  // Build gallery thumbnails
  thumbContainer.innerHTML = '';
  galleryImages.forEach((imgUrl, idx) => {
    const btn = document.createElement('div');
    btn.className = `thumb-item w-14 h-14 md:w-full aspect-square bg-white rounded-xl border p-1 cursor-pointer transition-all shrink-0 flex items-center justify-center ${idx === 0 ? 'border-2 border-emerald-600' : 'border-slate-200 hover:border-slate-400'}`;
    btn.innerHTML = `<img src="${imgUrl}" alt="Gallery Thumbnail ${idx+1}" class="max-w-full max-h-full object-contain rounded-lg" referrerPolicy="no-referrer">`;
    btn.addEventListener('click', () => updateMainImage(idx));
    thumbContainer.appendChild(btn);
  });

  updateMainImage(0); // init

  // Gallery Navigation arrows
  document.getElementById('gallery-prev').addEventListener('click', () => {
    let prev = currentImageIndex - 1;
    if (prev < 0) prev = galleryImages.length - 1;
    updateMainImage(prev);
  });

  document.getElementById('gallery-next').addEventListener('click', () => {
    let next = currentImageIndex + 1;
    if (next >= galleryImages.length) next = 0;
    updateMainImage(next);
  });

  // 5. QUANTITY SELECTOR
  let quantity = 1;
  const qtyDisplay = document.getElementById('qty-display');
  
  document.getElementById('qty-minus').addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyDisplay.textContent = quantity;
    }
  });

  document.getElementById('qty-plus').addEventListener('click', () => {
    quantity++;
    qtyDisplay.textContent = quantity;
  });

  // 6. SHOPPING CART ENGINE
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
      // Close
      drawer.classList.replace('translate-x-0', 'translate-x-full');
      overlay.classList.add('pointer-events-none');
      overlay.classList.replace('opacity-100', 'opacity-0');
    } else {
      // Open
      updateCartDrawerItems();
      drawer.classList.replace('translate-x-full', 'translate-x-0');
      overlay.classList.remove('pointer-events-none');
      overlay.classList.replace('opacity-0', 'opacity-100');
    }
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

  // Add to cart main click handler
  document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    const cart = getCart();
    const existing = cart.find(item => item.code === product.code);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        code: product.code,
        name: product.name,
        price: product.price,
        imageType: product.imageType,
        quantity: quantity
      });
    }

    saveCart(cart);

    // Show inline success toast
    const toast = document.getElementById('cart-toast');
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 5000);
    }

    // Reset selector to 1
    quantity = 1;
    qtyDisplay.textContent = 1;

    // Smoothly open the drawer
    setTimeout(() => {
      toggleCartDrawer(true);
    }, 400);
  });

  // 7. CHECKOUT ACTION
  document.getElementById('cart-checkout-btn').addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) return;

    // Toggle drawer closed
    toggleCartDrawer();

    // Trigger Success Checkout Modal
    const modalOverlay = document.getElementById('checkout-modal-overlay');
    const modal = document.getElementById('checkout-modal');
    
    if (modalOverlay && modal) {
      modalOverlay.classList.remove('pointer-events-none');
      modalOverlay.classList.replace('opacity-0', 'opacity-100');
      modal.classList.replace('scale-95', 'scale-100');
    }

    // Empty local storage cart
    saveCart([]);
  });

  // Close checkout modal
  document.getElementById('checkout-modal-close-btn').addEventListener('click', () => {
    const modalOverlay = document.getElementById('checkout-modal-overlay');
    const modal = document.getElementById('checkout-modal');
    
    if (modalOverlay && modal) {
      modalOverlay.classList.add('pointer-events-none');
      modalOverlay.classList.replace('opacity-100', 'opacity-0');
      modal.classList.replace('scale-100', 'scale-95');
    }
  });

  // 8. RENDER RELATED PRODUCTS CAROUSEL
  const relatedGrid = document.getElementById('related-products-grid');
  if (relatedGrid) {
    // Find up to 3 products of the same type/media, excluding self
    const related = products
      .filter(p => p.code !== product.code && (p.media === product.media || p.type === product.type))
      .slice(0, 3);

    relatedGrid.innerHTML = '';
    
    related.forEach(item => {
      const card = document.createElement('div');
      card.className = "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:scale-[1.02] hover:shadow-md transition-all";
      
      const badgeColor = item.type.includes('Tri') ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600';
      const thumbSrc = item.image ? item.image : (item.imageType === 'block' ? blockImgUrl : slideImgUrl);

      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-4">
            <span class="badge-pci ${badgeColor} font-mono text-[9px] uppercase">${item.type}</span>
            <span class="badge-pci bg-slate-50 text-slate-600 font-mono text-[9px] uppercase">${item.media}</span>
          </div>
          <div class="aspect-video w-full flex items-center justify-center p-3 border border-slate-100 rounded-xl bg-slate-50/50 mb-4">
            <img src="${thumbSrc}" alt="${item.name}" class="max-h-full object-contain max-w-full" referrerPolicy="no-referrer">
          </div>
          <h3 class="text-sm font-bold text-gray-900 mb-1 leading-snug">${item.name}</h3>
          <p class="text-[10px] text-gray-400 mb-2 font-mono">${item.code}</p>
          <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">${item.shortDesc}</p>
        </div>
        <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span class="text-sm font-bold text-gray-900 font-mono">$${item.price.toLocaleString('en-US')}</span>
          <a href="product.html?code=${item.code}" class="bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-colors">Details →</a>
        </div>
      `;

      relatedGrid.appendChild(card);
    });
  }

  // Init badging on load
  updateCartBadges();
});
