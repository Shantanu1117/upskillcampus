// ============================================================
// FOODIE — CART PAGE JS (mega5.js)
// Fully data-driven: renders whatever is actually in CartStorage.
// Requires cart-storage.js to be loaded BEFORE this file.
// ============================================================

'use strict';

// ============================================================
// 1. THEME TOGGLE
// ============================================================
const themeBtn = document.getElementById('themeToggle');

function applyTheme(dark) {
  if (dark) {
    document.body.classList.add('dark');
    if (themeBtn) themeBtn.querySelector('i').className = 'ri-sun-line';
  } else {
    document.body.classList.remove('dark');
    if (themeBtn) themeBtn.querySelector('i').className = 'fa-solid fa-moon';
  }
}

applyTheme(localStorage.getItem('theme') === 'dark');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    applyTheme(!isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });
}

// ============================================================
// 2. NAVBAR SCROLL EFFECT
// ============================================================
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ============================================================
// 3. HAMBURGER MENU
// ============================================================
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============================================================
// 4. NAV ROUTING
// ============================================================
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const map = {
      'Home': 'mega1.html', 'Restaurants': 'mega4.html',
      'Categories': 'mega11.html', 'Offers': 'mega9.html',
      'Track Order': 'mega8.html', 'My Orders': 'myorders.html',
      'Contact': 'mega10.html'
    };
    const dest = map[link.textContent.trim()];
    if (dest) window.location.href = dest;
  });
});

const API_BASE = 'http://localhost:5000/api';
const loginBtn = document.querySelector('.login-btn');

function refreshAuthNav() {
  if (!loginBtn) return;
  const token = localStorage.getItem('token');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) {}

  if (token && user) {
    loginBtn.textContent = `Hi, ${(user.name || '').split(' ')[0] || 'there'}`;
    loginBtn.dataset.mode = 'logout';
  } else {
    loginBtn.textContent = 'Login';
    loginBtn.dataset.mode = 'login';
  }
}

async function handleAuthNavClick() {
  if (loginBtn.dataset.mode === 'logout') {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    refreshAuthNav();
  } else {
    window.location.href = 'mega2.html';
  }
}

if (loginBtn) loginBtn.addEventListener('click', handleAuthNavClick);
refreshAuthNav();

const cartBtn = document.getElementById('cartBtn');
if (cartBtn) cartBtn.addEventListener('click', () => { window.location.href = 'mega5.html'; });

// ============================================================
// 5. CART BADGE (navbar)
// ============================================================
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = CartStorage.getCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}

// ============================================================
// 6. CHECKOUT / CONTINUE SHOPPING ROUTING
// ============================================================
const checkoutBtn = document.getElementById('checkoutBtn');
const continueBtn = document.getElementById('continueBtn');
const browseRestaurantsBtn = document.getElementById('browseRestaurantsBtn');

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (CartStorage.getCount() === 0) {
      showToast('Your cart is empty — add something tasty first!', 'error');
      return;
    }
    window.location.href = 'mega6.html';
  });
}

if (continueBtn) {
  continueBtn.addEventListener('click', () => { window.location.href = 'mega4.html'; });
}

if (browseRestaurantsBtn) {
  browseRestaurantsBtn.addEventListener('click', () => { window.location.href = 'mega4.html'; });
}

// ============================================================
// 7. DYNAMIC CART RENDERING
// ============================================================
const DELIVERY_FEE  = 40;
const PACKAGING_FEE = 20;

function formatCurrency(n) { return '₹' + Math.max(0, Math.round(n)); }

function buildCartItemHTML(item) {
  const id = CartStorage.getMenuItemId(item.menuItem);
  return `
    <div class="cart-item show" data-id="${id}" role="article" aria-label="${item.name} cart item">
      <div class="food-image">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
      </div>

      <div class="food-details">
        <div class="food-badge">Foodie</div>
        <h3>${item.name}</h3>
        <p class="food-restaurant"><i class="ri-store-2-line"></i> ${(CartStorage.getRestaurant() && CartStorage.getRestaurant().name) || 'Foodie Restaurant'}</p>
        <span class="price">₹${item.price}</span>
      </div>

      <div class="item-controls">
        <div class="quantity-box" role="group" aria-label="Quantity for ${item.name}">
          <button class="qty-btn" data-action="decrease" data-id="${id}" aria-label="Decrease quantity">
            <i class="ri-subtract-line"></i>
          </button>
          <span class="qty-display" aria-live="polite">${item.quantity}</span>
          <button class="qty-btn" data-action="increase" data-id="${id}" aria-label="Increase quantity">
            <i class="ri-add-line"></i>
          </button>
        </div>
        <button class="delete-btn" data-id="${id}" aria-label="Remove ${item.name} from cart">
          <i class="ri-delete-bin-6-line"></i>
        </button>
      </div>
    </div>`;
}

function attachCartItemHandlers() {
  document.querySelectorAll('#cartItemsList .qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === 'increase') {
        CartStorage.increaseQty(id);
      } else {
        CartStorage.decreaseQty(id);
      }
      renderCart();
    });
  });

  document.querySelectorAll('#cartItemsList .delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const el = btn.closest('.cart-item');
      const name = el ? el.querySelector('h3')?.textContent : 'Item';

      if (el) {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(-40px)';
      }

      setTimeout(() => {
        CartStorage.removeItem(id);
        renderCart();
        showToast(`${name || 'Item'} removed from cart`);
      }, 250);
    });
  });
}

function recalcSummary() {
  const subtotal   = CartStorage.getSubtotal();
  const hasItems   = subtotal > 0;
  const delivery   = hasItems ? DELIVERY_FEE : 0;
  const packaging  = hasItems ? PACKAGING_FEE : 0;
  const total      = subtotal + delivery + packaging;

  const itemTotalEl  = document.getElementById('summaryItemTotal');
  const deliveryEl   = document.getElementById('summaryDelivery');
  const packagingEl  = document.getElementById('summaryPackaging');
  const totalEl      = document.getElementById('summaryTotal');
  const savedBox     = document.getElementById('savedBox');
  const restNameEl   = document.getElementById('summaryRestaurantName');

  if (itemTotalEl) itemTotalEl.textContent = formatCurrency(subtotal);
  if (deliveryEl)  deliveryEl.textContent  = formatCurrency(delivery);
  if (packagingEl) packagingEl.textContent = formatCurrency(packaging);
  if (totalEl)     totalEl.textContent     = formatCurrency(total);
  if (savedBox)     savedBox.hidden        = !hasItems;

  if (restNameEl) {
    const restaurant = CartStorage.getRestaurant();
    restNameEl.textContent = (restaurant && restaurant.name) || 'Foodie Restaurant';
  }
}

function renderCart() {
  const items      = CartStorage.getItems();
  const listEl      = document.getElementById('cartItemsList');
  const emptyEl      = document.getElementById('emptyCartState');
  const voucher      = document.querySelector('.voucher-card');
  const instructions = document.getElementById('instructionsCard');
  const summaryPanel = document.getElementById('summaryPanel');

  if (!items.length) {
    if (listEl) listEl.innerHTML = '';
    if (emptyEl) emptyEl.removeAttribute('hidden');
    if (voucher) voucher.style.display = 'none';
    if (instructions) instructions.style.display = 'none';
    if (summaryPanel) summaryPanel.style.display = 'none';
    updateCartBadge();
    return;
  }

  if (emptyEl) emptyEl.setAttribute('hidden', '');
  if (voucher) voucher.style.display = '';
  if (instructions) instructions.style.display = '';
  if (summaryPanel) summaryPanel.style.display = '';

  if (listEl) listEl.innerHTML = items.map(buildCartItemHTML).join('');

  attachCartItemHandlers();
  recalcSummary();
  updateCartBadge();
}

// React to cart changes (e.g. from another tab)
document.addEventListener('cart:updated', renderCart);

// ============================================================
// 8. APPLY COUPON BUTTON
// ============================================================
const applyCouponBtn = document.getElementById('applyCouponBtn');
if (applyCouponBtn) {
  applyCouponBtn.addEventListener('click', () => {
    showToast('Enter a coupon code to apply savings 🎟️');
  });
}

// ============================================================
// 9. RIPPLE EFFECT
// ============================================================
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = this.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left - 40) + 'px';
    ripple.style.top  = (e.clientY - rect.top  - 40) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// ============================================================
// 10. FOOD EMOJI RAIN
// ============================================================
window.addEventListener('load', () => {
  const foods = ['🍕','🍔','🍟','🌭','🥤','🍗','🌮','🍩'];
  const rain  = document.createElement('div');
  rain.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:8888;overflow:hidden;';
  document.body.appendChild(rain);

  if (!document.getElementById('foodFallStyle')) {
    const style = document.createElement('style');
    style.id = 'foodFallStyle';
    style.textContent = `
      @keyframes foodFall {
        0%   { transform: translateY(-60px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }`;
    document.head.appendChild(style);
  }

  for (let i = 0; i < 28; i++) {
    const food = document.createElement('span');
    food.textContent = foods[Math.floor(Math.random() * foods.length)];
    food.style.cssText = `
      position:absolute;
      left:${Math.random() * 100}vw;
      top:-60px;
      font-size:${18 + Math.random() * 22}px;
      animation:foodFall ${1.5 + Math.random() * 2}s ${Math.random() * 0.5}s linear forwards;
    `;
    rain.appendChild(food);
  }

  setTimeout(() => rain.remove(), 4000);
});

// ============================================================
// 11. TOAST
// ============================================================
const toast = document.getElementById('statusToast');
let toastTimer = null;

function showToast(msg, type) {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.borderLeftColor = type === 'error' ? '#e53e3e' : 'var(--brand)';
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

// ============================================================
// 12. BOOT
// ============================================================
async function bootCartPage() {
  if (!CartStorage.isLoggedIn()) {
    showToast('Please login to view your cart');
    setTimeout(() => { window.location.href = 'mega2.html'; }, 900);
    return;
  }
  await CartStorage.refreshCart();
  renderCart();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootCartPage);
} else {
  bootCartPage();
}