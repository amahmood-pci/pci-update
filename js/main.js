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
      // White bar state
      navbar.className = "fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-md h-20";
      
      if (logoText) {
        logoText.src = "FONT1.png";
      }

      // Update link colors
      navLinks.forEach(link => {
        if (link.classList.contains('active')) {
          link.className = "nav-link active text-pci-blue text-sm font-semibold transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-pci-blue";
        } else {
          link.className = "nav-link text-gray-600 text-sm font-medium transition-colors hover:text-pci-blue";
        }
      });

      // Update button
      if (launchBtn) {
        launchBtn.className = "bg-pci-blue hover:bg-pci-blue-light text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all duration-150 flex items-center gap-1.5";
      }

      // Update hamburger button
      if (mobileMenuBtn) {
        mobileMenuBtn.className = "text-gray-600 hover:text-pci-blue focus:outline-none p-2 rounded-lg hover:bg-gray-100";
      }
    } else {
      // Dark transparent state (matches attached image)
      navbar.className = "fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-black/15 backdrop-blur-md border-b border-white/10 h-20";
      
      if (logoText) {
        logoText.src = "FONT2.png";
      }

      // Update link colors
      navLinks.forEach(link => {
        if (link.classList.contains('active')) {
          link.className = "nav-link active text-white text-sm font-semibold transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-white";
        } else {
          link.className = "nav-link text-white/85 text-sm font-medium transition-colors hover:text-white";
        }
      });

      // Update button
      if (launchBtn) {
        launchBtn.className = "bg-transparent hover:bg-white hover:text-black text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/40 transition-all duration-150 flex items-center gap-1.5";
      }

      // Update hamburger button
      if (mobileMenuBtn) {
        mobileMenuBtn.className = "text-white hover:text-pci-blue-light focus:outline-none p-2 rounded-lg hover:bg-white/10";
      }
    }
  };

  if (navbar) {
    window.addEventListener('scroll', updateNavbarState);
    
    // Mouse hover events
    navbar.addEventListener('mouseenter', () => {
      isNavbarHovered = true;
      updateNavbarState();
    });
    
    navbar.addEventListener('mouseleave', () => {
      isNavbarHovered = false;
      updateNavbarState();
    });

    updateNavbarState(); // Run initially
  }

  // 2. MOBILE MENU HAMBURGER MODAL
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      } else {
        mobileMenu.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
    });

    // Close menu when clicking nav link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      });
    });
  }

  // 3. SCROLL REVEAL ENGINE
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); // Trigger only once
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // 4. STATS COUNT-UP ANIMATION
  const statNumbers = document.querySelectorAll('.counter');
  if (statNumbers.length > 0) {
    const countUp = (element) => {
      const target = parseFloat(element.getAttribute('data-target'));
      const duration = 2000; // ms
      const countSpeed = target / (duration / 16); // 60 FPS
      let current = 0;

      const updateCount = () => {
        current += countSpeed;
        if (current >= target) {
          element.textContent = element.getAttribute('data-prefix') + target + element.getAttribute('data-suffix');
        } else {
          // Format based on integer or float
          if (Number.isInteger(target)) {
            element.textContent = element.getAttribute('data-prefix') + Math.floor(current) + element.getAttribute('data-suffix');
          } else {
            element.textContent = element.getAttribute('data-prefix') + current.toFixed(1) + element.getAttribute('data-suffix');
          }
          requestAnimationFrame(updateCount);
        }
      };
      requestAnimationFrame(updateCount);
    };

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            statNumbers.forEach(num => countUp(num));
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      statsObserver.observe(statsSection);
    }
  }

  // 5. PRODUCT CATALOG FILTERING
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  if (filterBtns.length > 0 && productCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active class on buttons
        filterBtns.forEach(b => b.classList.remove('active', 'bg-pci-blue', 'text-white'));
        filterBtns.forEach(b => b.classList.add('bg-white', 'text-gray-600'));
        btn.classList.add('active', 'bg-pci-blue', 'text-white');
        btn.classList.remove('bg-white', 'text-gray-600');

        const filter = btn.getAttribute('data-filter').toLowerCase();

        productCards.forEach(card => {
          const tags = card.getAttribute('data-tags').toLowerCase().split(' ');
          if (filter === 'all' || tags.includes(filter)) {
            card.classList.remove('hidden');
            // Re-apply transitions
            card.style.opacity = '0';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
              card.classList.add('hidden');
            }, 200);
          }
        });
      });
    });

    // Product Learn More expand functionality
    const expandLinks = document.querySelectorAll('.expand-link');
    expandLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cardId = link.getAttribute('data-card-id');
        const detailPanel = document.getElementById(`details-${cardId}`);
        const expandText = link.querySelector('.expand-text');
        
        if (detailPanel) {
          if (detailPanel.classList.contains('hidden')) {
            detailPanel.classList.remove('hidden');
            detailPanel.style.maxHeight = '0px';
            detailPanel.style.opacity = '0';
            setTimeout(() => {
              detailPanel.style.maxHeight = '200px';
              detailPanel.style.opacity = '1';
            }, 10);
            if (expandText) expandText.textContent = 'Collapse Details';
          } else {
            detailPanel.style.maxHeight = '0px';
            detailPanel.style.opacity = '0';
            setTimeout(() => {
              detailPanel.classList.add('hidden');
            }, 300);
            if (expandText) expandText.textContent = 'Learn More';
          }
        }
      });
    });
  }

  // 6. FAQ ACCORDION ENGINE
  const accordionHeaders = document.querySelectorAll('.faq-header');
  if (accordionHeaders.length > 0) {
    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const icon = header.querySelector('.faq-icon');
        const content = item.querySelector('.faq-content');
        const isOpen = item.classList.contains('active');

        // Close all other accordions
        document.querySelectorAll('.faq-item').forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherIcon = otherItem.querySelector('.faq-icon');
            const otherContent = otherItem.querySelector('.faq-content');
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            if (otherContent) otherContent.style.maxHeight = null;
          }
        });

        if (isOpen) {
          item.classList.remove('active');
          if (icon) icon.style.transform = 'rotate(0deg)';
          if (content) content.style.maxHeight = null;
        } else {
          item.classList.add('active');
          if (icon) icon.style.transform = 'rotate(180deg)';
          if (content) content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }

  // 7. MULTI-MAGNIFICATION SLIDE VIEWER PREVIEW & SIMULATOR
  const viewerContainer = document.getElementById('slide-viewer-viewport');
  if (viewerContainer) {
    const slideCanvas = document.getElementById('slide-canvas');
    const zoomValDisplay = document.getElementById('mag-value');
    const xCoordDisplay = document.getElementById('coord-x');
    const yCoordDisplay = document.getElementById('coord-y');
    const minimapIndicator = document.getElementById('minimap-indicator');
    
    let currentZoom = 1; // 1x=0.5, 5x=1.0, 10x=1.5, 20x=2.5, 40x=4.0
    let zoomText = "1x";
    let isDragging = false;
    let startX, startY;
    let scrollXVal = 0, scrollYVal = 0;
    
    // Zoom control buttons click events
    const zoomBtns = document.querySelectorAll('.zoom-ctrl-btn');
    const applyZoom = (zoom, text) => {
      currentZoom = zoom;
      zoomText = text;

      // Update Active Button
      zoomBtns.forEach(btn => {
        if (btn.getAttribute('data-zoom-text') === text) {
          btn.classList.add('bg-pci-blue', 'text-white');
          btn.classList.remove('bg-gray-800', 'text-gray-300', 'hover:bg-gray-700');
        } else {
          btn.classList.remove('bg-pci-blue', 'text-white');
          btn.classList.add('bg-gray-800', 'text-gray-300', 'hover:bg-gray-700');
        }
      });

      // Update magnification text
      if (zoomValDisplay) zoomValDisplay.textContent = text;

      // Update slide canvas scaling and offset
      let scale = 1;
      if (text === '1x') scale = 1.0;
      else if (text === '5x') scale = 1.5;
      else if (text === '10x') scale = 2.2;
      else if (text === '20x') scale = 3.5;
      else if (text === '40x') scale = 5.5;

      if (slideCanvas) {
        slideCanvas.style.transform = `translate(${scrollXVal}px, ${scrollYVal}px) scale(${scale})`;
      }

      // Update navigator minimap red indicator dimensions (smaller as zoom increases)
      if (minimapIndicator) {
        const indScale = 1 / scale;
        minimapIndicator.style.transform = `translate(-50%, -50%) scale(${indScale})`;
      }
    };

    zoomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const zValue = parseFloat(btn.getAttribute('data-zoom-scale'));
        const zText = btn.getAttribute('data-zoom-text');
        applyZoom(zValue, zText);
      });
    });

    // Panning & dragging simulation on canvas
    const handleDragStart = (e) => {
      isDragging = true;
      slideCanvas?.classList.add('cursor-grabbing');
      slideCanvas?.classList.remove('cursor-grab');
      
      const event = e.touches ? e.touches[0] : e;
      startX = event.clientX - scrollXVal;
      startY = event.clientY - scrollYVal;
    };

    const handleDragMove = (e) => {
      if (!isDragging) return;
      
      const event = e.touches ? e.touches[0] : e;
      scrollXVal = event.clientX - startX;
      scrollYVal = event.clientY - startY;

      // Constrain dragging bounds slightly
      const maxDrag = 400 * currentZoom;
      scrollXVal = Math.max(-maxDrag, Math.min(maxDrag, scrollXVal));
      scrollYVal = Math.max(-maxDrag, Math.min(maxDrag, scrollYVal));

      let scale = 1;
      if (zoomText === '1x') scale = 1.0;
      else if (zoomText === '5x') scale = 1.5;
      else if (zoomText === '10x') scale = 2.2;
      else if (zoomText === '20x') scale = 3.5;
      else if (zoomText === '40x') scale = 5.5;

      if (slideCanvas) {
        slideCanvas.style.transform = `translate(${scrollXVal}px, ${scrollYVal}px) scale(${scale})`;
      }

      // Calculate pseudo coordinates (X, Y) based on pan positions
      if (xCoordDisplay && yCoordDisplay) {
        const calcX = Math.round(52140 + scrollXVal * 3.5);
        const calcY = Math.round(28400 + scrollYVal * 3.5);
        xCoordDisplay.textContent = calcX;
        yCoordDisplay.textContent = calcY;
      }

      // Update minimap red outer boundaries positioning
      if (minimapIndicator) {
        // Inverse coordinate mapping
        const minimapX = 32 - (scrollXVal * 0.05); // half size
        const minimapY = 32 - (scrollYVal * 0.05);
        minimapIndicator.style.left = `${minimapX}px`;
        minimapIndicator.style.top = `${minimapY}px`;
      }
    };

    const handleDragEnd = () => {
      isDragging = false;
      slideCanvas?.classList.remove('cursor-grabbing');
      slideCanvas?.classList.add('cursor-grab');
    };

    if (slideCanvas) {
      slideCanvas.addEventListener('mousedown', handleDragStart);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);

      slideCanvas.addEventListener('touchstart', handleDragStart);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    // Auto-cycle slide feature / Overlay toggle
    const overlayToggle = document.getElementById('ai-overlay-toggle');
    if (overlayToggle) {
      overlayToggle.addEventListener('change', () => {
        const overlayCells = document.querySelectorAll('.ai-detection-cell');
        const heatmap = document.querySelector('.ai-heatmap-layer');
        if (overlayToggle.checked) {
          overlayCells.forEach(cell => cell.classList.remove('opacity-0'));
          heatmap?.classList.remove('opacity-0');
        } else {
          overlayCells.forEach(cell => cell.classList.add('opacity-0'));
          heatmap?.classList.add('opacity-0');
        }
      });
    }

    // Interactive Drag and Drop whole slide file simulator
    const dropzone = document.getElementById('dropzone-area');
    const fileSelectorInput = document.getElementById('slide-file-selector');
    const uploaderStatusText = document.getElementById('uploader-status-text');
    const originalGuideText = uploaderStatusText ? uploaderStatusText.innerHTML : '';

    const simulateUploadAndRender = (fileName) => {
      if (uploaderStatusText) {
        uploaderStatusText.innerHTML = `
          <div class="flex flex-col items-center justify-center p-4">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-pci-blue mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm font-semibold text-gray-900">Uploading and Decoding whole-slide structure...</p>
            <p class="text-xs text-gray-500 font-mono mt-1">${fileName} (${(Math.random() * 4 + 1.2).toFixed(2)} GB)</p>
          </div>
        `;
      }

      // After 2.5s simulated upload
      setTimeout(() => {
        if (uploaderStatusText) {
          uploaderStatusText.innerHTML = `
            <div class="flex flex-col items-center justify-center p-3 text-center">
              <div class="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-1">
                <svg class="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-xs font-semibold text-gray-900">${fileName.substring(0, 20)}... successfully loaded</p>
              <p class="text-[10px] text-emerald-600 font-mono">OpenSlide parsed successfully | Tiled 40x Resolution Ready</p>
              <button id="reset-slide-upload" class="mt-2 text-xs text-pci-blue underline font-semibold focus:outline-none">Clear Slide</button>
            </div>
          `;

          // Change background pattern of the canvas to simulate a different whole slide!
          if (slideCanvas) {
            slideCanvas.style.background = `url('https://images.unsplash.com/photo-1559757175-5700def83bad?auto=format&fit=crop&q=80&w=1000') no-repeat center`;
            slideCanvas.style.backgroundSize = 'cover';
          }

          document.getElementById('reset-slide-upload')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (slideCanvas) {
              slideCanvas.style.background = `url('https://images.unsplash.com/photo-1579165466511-71012166551b?auto=format&fit=crop&q=80&w=1000') no-repeat center`;
              slideCanvas.style.backgroundSize = 'cover';
            }
            if (uploaderStatusText) {
              uploaderStatusText.innerHTML = originalGuideText;
            }
          });
        }
      }, 2500);
    };

    if (dropzone) {
      dropzone.addEventListener('click', () => {
        fileSelectorInput?.click();
      });

      fileSelectorInput?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          simulateUploadAndRender(e.target.files[0].name);
        }
      });

      // Drag over styles
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-pci-blue', 'bg-blue-50/50');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-pci-blue', 'bg-blue-50/50');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-pci-blue', 'bg-blue-50/50');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          simulateUploadAndRender(e.dataTransfer.files[0].name);
        }
      });
    }
  }

  // Contact page interactive thank you submit simulation
  const contactFormSubmit = document.getElementById('pci-contact-form') || document.getElementById('contact-us-form');
  if (contactFormSubmit) {
    contactFormSubmit.addEventListener('submit', (e) => {
      e.preventDefault();
      const formContainer = contactFormSubmit.parentElement;
      if (formContainer) {
        formContainer.innerHTML = `
          <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-md text-center reveal active animate-fade-in">
            <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0y" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Message Received</h3>
            <p class="text-gray-600 mb-6 max-w-sm mx-auto">Thank you for contacting Precision Cellular Immunology. Our technical assessment team in Houston will review your request and reach out within 24 hours.</p>
            <a href="index.html" class="inline-flex items-center justify-center bg-pci-blue hover:bg-pci-blue-light text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200">
              Return Home
            </a>
          </div>
        `;
      }
    });
  }

  // Interactive Newsletter popup thank you simulation
  const emailSignupForm = document.getElementById('newsletter-signup-form');
  if (emailSignupForm) {
    emailSignupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const signupContainer = emailSignupForm.parentElement;
      const emailInput = emailSignupForm.querySelector('input[type="email"]');
      if (signupContainer && emailInput) {
        signupContainer.innerHTML = `
          <div class="p-6 bg-emerald-50/20 border border-emerald-500/20 rounded-xl text-center reveal active animate-fade-in">
            <p class="text-sm font-semibold text-emerald-400 mb-1">✓ Check your inbox</p>
            <p class="text-xs text-gray-300">We've sent an invite link to ${emailInput.value} for our beta testing cohort.</p>
          </div>
        `;
      }
    });
  }
});
