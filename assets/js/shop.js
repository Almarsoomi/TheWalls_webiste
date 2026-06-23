/* ─────────────────────────────────────────────────────────────
   The Walls — Shop (catalog render + cart + checkout)
   Static page logic. Prices shown are display-only; the charged
   amount is always enforced server-side by Stripe / save-order.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var FN_BASE = 'https://xpdfohzjjomrbzfatkpy.supabase.co/functions/v1';
  var CART_KEY = 'tw_cart';
  var WA_NUMBER = '971544996788';

  var PRODUCTS = [];          // loaded from products.json
  var PRODUCT_BY_ID = {};

  /* ── helpers ───────────────────────────────────────────── */
  function lang() { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en'; }
  function isAr() { return lang() === 'ar'; }
  function money(n) { return 'AED ' + Number(n).toLocaleString('en-AE'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function setCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }
  function cartCount() { return getCart().reduce(function (s, l) { return s + l.qty; }, 0); }
  function cartTotal() {
    return getCart().reduce(function (s, l) {
      var p = PRODUCT_BY_ID[l.id];
      return s + (p ? p.price_aed * l.qty : 0);
    }, 0);
  }

  /* ── product grid ──────────────────────────────────────── */
  function renderProducts(filter) {
    var grid = document.getElementById('shopGrid');
    if (!grid) return;
    var list = PRODUCTS.filter(function (p) { return !filter || filter === 'all' || p.category === filter; });
    if (!list.length) {
      grid.innerHTML = '<div class="shop-loading"><span class="en-only">No products in this category yet.</span>' +
        '<span class="ar-only">لا توجد منتجات في هذه الفئة بعد.</span></div>';
      return;
    }
    grid.innerHTML = list.map(function (p) {
      var out = !p.in_stock;
      return '' +
        '<article class="shop-card' + (out ? ' is-out' : '') + '">' +
          '<div class="shop-card-img">' +
            '<img src="' + esc(p.image) + '" alt="' + esc(p.name_en) + '" loading="lazy" decoding="async" ' +
              'onerror="this.style.opacity=0"/>' +
            (out ? '<span class="shop-badge"><span class="en-only">Sold out</span><span class="ar-only">نفد</span></span>' : '') +
          '</div>' +
          '<div class="shop-card-body">' +
            '<h3 class="shop-card-name"><span class="en-only">' + esc(p.name_en) + '</span>' +
              '<span class="ar-only">' + esc(p.name_ar) + '</span></h3>' +
            '<p class="shop-card-desc"><span class="en-only">' + esc(p.desc_en) + '</span>' +
              '<span class="ar-only">' + esc(p.desc_ar) + '</span></p>' +
            '<div class="shop-card-foot">' +
              '<span class="shop-card-price">' + money(p.price_aed) + '</span>' +
              (out
                ? '<button class="shop-add" disabled><span class="en-only">Sold out</span><span class="ar-only">نفد</span></button>'
                : '<button class="shop-add" onclick="addToCart(\'' + esc(p.id) + '\')">' +
                    '<span class="en-only">Add to cart</span><span class="ar-only">أضف إلى السلة</span></button>') +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  window.filterProducts = function (category, btn) {
    document.querySelectorAll('#shopFilters .filter-btn').forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderProducts(category);
  };

  /* ── cart mutations ────────────────────────────────────── */
  window.addToCart = function (id) {
    if (!PRODUCT_BY_ID[id] || !PRODUCT_BY_ID[id].in_stock) return;
    var c = getCart();
    var line = c.find(function (l) { return l.id === id; });
    if (line) line.qty += 1; else c.push({ id: id, qty: 1 });
    setCart(c);
    renderCart();
    openCart();
  };
  window.changeQty = function (id, delta) {
    var c = getCart();
    var line = c.find(function (l) { return l.id === id; });
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) c = c.filter(function (l) { return l.id !== id; });
    setCart(c);
    renderCart();
  };
  window.removeFromCart = function (id) {
    setCart(getCart().filter(function (l) { return l.id !== id; }));
    renderCart();
  };

  /* ── cart drawer render ────────────────────────────────── */
  function renderCart() {
    var badge = document.getElementById('cartBadge');
    var count = cartCount();
    if (badge) { badge.textContent = count; badge.hidden = count === 0; }

    var body = document.getElementById('cartBody');
    var empty = document.getElementById('cartEmpty');
    var foot = document.getElementById('cartFoot');
    if (!body) return;

    var cart = getCart();
    if (!cart.length) {
      body.innerHTML = '';
      if (empty) empty.hidden = false;
      if (foot) foot.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (foot) foot.hidden = false;

    body.innerHTML = cart.map(function (l) {
      var p = PRODUCT_BY_ID[l.id];
      if (!p) return '';
      var name = isAr() ? p.name_ar : p.name_en;
      return '' +
        '<div class="cart-line">' +
          '<div class="cart-line-img"><img src="' + esc(p.image) + '" alt="" onerror="this.style.opacity=0"/></div>' +
          '<div class="cart-line-info">' +
            '<div class="cart-line-name">' + esc(name) + '</div>' +
            '<div class="cart-line-price">' + money(p.price_aed) + '</div>' +
            '<div class="cart-qty">' +
              '<button onclick="changeQty(\'' + esc(p.id) + '\',-1)" aria-label="Decrease">−</button>' +
              '<span>' + l.qty + '</span>' +
              '<button onclick="changeQty(\'' + esc(p.id) + '\',1)" aria-label="Increase">+</button>' +
            '</div>' +
          '</div>' +
          '<button class="cart-line-remove" onclick="removeFromCart(\'' + esc(p.id) + '\')" aria-label="Remove">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>';
    }).join('');

    var sub = document.getElementById('cartSubtotal');
    if (sub) sub.textContent = money(cartTotal());
  }
  window.renderCart = renderCart;

  /* ── drawer open/close ─────────────────────────────────── */
  window.openCart = function () {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('show');
    document.getElementById('cartDrawer').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  window.closeCart = function () {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('show');
    document.getElementById('cartDrawer').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  /* ── COD form toggle ───────────────────────────────────── */
  window.showCodForm = function () {
    document.getElementById('checkoutChoice').hidden = true;
    document.getElementById('codForm').hidden = false;
  };
  window.hideCodForm = function () {
    document.getElementById('codForm').hidden = true;
    document.getElementById('checkoutChoice').hidden = false;
  };

  /* ── Stripe online checkout ────────────────────────────── */
  window.payOnline = function () {
    var cart = getCart();
    if (!cart.length) return;
    var items = cart.map(function (l) {
      return { stripePriceId: PRODUCT_BY_ID[l.id].stripePriceId, qty: l.qty };
    });
    var btn = document.getElementById('btnPayOnline');
    btn.disabled = true;
    btn.dataset.label = btn.innerHTML;
    btn.textContent = isAr() ? 'جارٍ التحويل…' : 'Redirecting…';
    fetch(FN_BASE + '/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.url) { window.location = data.url; }
        else { throw new Error(data && data.error ? data.error : 'No checkout URL'); }
      })
      .catch(function (e) {
        console.warn('Checkout error:', e);
        btn.disabled = false;
        btn.innerHTML = btn.dataset.label;
        alert(isAr() ? 'تعذّر بدء الدفع. حاول مرة أخرى أو اطلب بالدفع عند الاستلام.'
                     : 'Could not start payment. Please try again or order with cash on delivery.');
      });
  };

  /* ── Cash on delivery submit ───────────────────────────── */
  window.submitCod = function (ev) {
    ev.preventDefault();
    var cart = getCart();
    if (!cart.length) return;

    var status = document.getElementById('codStatus');
    var token = document.querySelector('#codForm [name="cf-turnstile-response"]')
             || document.querySelector('[name="cf-turnstile-response"]');
    token = token ? token.value : '';
    if (!token) {
      status.className = 'cod-status error';
      status.textContent = isAr() ? 'يرجى إكمال التحقق من أنك لست روبوتاً.' : 'Please complete the verification check.';
      return;
    }

    var customer = {
      name: document.getElementById('codName').value.trim(),
      phone: document.getElementById('codPhone').value.trim(),
      email: document.getElementById('codEmail').value.trim(),
      address: document.getElementById('codAddress').value.trim(),
      emirate: document.getElementById('codEmirate').value
    };
    var items = cart.map(function (l) {
      var p = PRODUCT_BY_ID[l.id];
      return { stripePriceId: p.stripePriceId, id: p.id, name_en: p.name_en, price_aed: p.price_aed, qty: l.qty };
    });

    var btn = document.getElementById('btnCodSubmit');
    btn.disabled = true;
    status.className = 'cod-status';
    status.textContent = isAr() ? 'جارٍ إرسال طلبك…' : 'Placing your order…';

    fetch(FN_BASE + '/save-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken: token, customer: customer, items: items })
    })
      .then(function (r) { return r.ok ? r.json() : r.json().then(function (j) { throw new Error(j.error || 'failed'); }); })
      .then(function (data) {
        // fire-and-forget team + customer email
        var emailData = {
          name: customer.name, phone: customer.phone, email: customer.email,
          address: customer.address, emirate: customer.emirate,
          items: items, total_aed: data.total_aed, order_id: data.orderId
        };
        fetch(FN_BASE + '/notify-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'order', data: emailData })
        }).catch(function () {});

        openWhatsApp(customer, items, data.total_aed != null ? data.total_aed : cartTotal());
        setCart([]);
        renderCart();
        status.className = 'cod-status ok';
        status.textContent = isAr() ? 'تم استلام طلبك! سنتواصل معك لتأكيد التوصيل.'
                                    : 'Order received! We\'ll contact you to confirm delivery.';
      })
      .catch(function (e) {
        console.warn('COD error:', e);
        btn.disabled = false;
        status.className = 'cod-status error';
        status.textContent = isAr() ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.';
        if (window.turnstile) try { turnstile.reset(); } catch (x) {}
      });
  };

  function openWhatsApp(customer, items, total) {
    var sep = '──────────────────';
    var lines = items.map(function (it) {
      return '• ' + it.name_en + ' ×' + it.qty + '  (' + money(it.price_aed * it.qty) + ')';
    }).join('\n');
    var text = 'Hello The Walls, I\'d like to place a Cash-on-Delivery order:\n\n' +
      lines + '\n\n' + sep + '\n' +
      'Total (excl. delivery): ' + money(total) + '\n' + sep + '\n' +
      'Name:  ' + customer.name + '\n' +
      'Phone: ' + customer.phone + '\n' +
      'Email: ' + customer.email + '\n' +
      'Address: ' + customer.address + ', ' + customer.emirate + '\n' + sep + '\n' +
      'Sent from The Walls shop';
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank');
  }

  /* ── boot ──────────────────────────────────────────────── */
  fetch('../assets/data/products.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      PRODUCTS = Array.isArray(data) ? data : [];
      PRODUCTS.forEach(function (p) { PRODUCT_BY_ID[p.id] = p; });
      renderProducts('all');
      renderCart();
    })
    .catch(function (e) {
      console.warn('Failed to load products:', e);
      var grid = document.getElementById('shopGrid');
      if (grid) grid.innerHTML = '<div class="shop-loading"><span class="en-only">Could not load products. Please refresh.</span>' +
        '<span class="ar-only">تعذّر تحميل المنتجات. يرجى التحديث.</span></div>';
    });
})();
