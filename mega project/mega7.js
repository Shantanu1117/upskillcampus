// ============================================================
// FOODIE — CONFIRMATION PAGE JS (mega7.js)
// Reads the order snapshot saved by checkout (mega6.js) and
// renders the actual items, totals and address the user ordered.
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
// 2. NAVBAR SCROLL
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

// ============================================================
// 5. TRACK ORDER / HOME BUTTONS
// ============================================================
const trackOrderBtn = document.getElementById('trackOrderBtn');
const homeBtn       = document.getElementById('homeBtn');

if (trackOrderBtn) {
  trackOrderBtn.addEventListener('click', () => { window.location.href = 'mega8.html'; });
}

if (homeBtn) {
  homeBtn.addEventListener('click', () => { window.location.href = 'mega4.html'; });
}

// ============================================================
// 6. RENDER THE ACTUAL PLACED ORDER
// ============================================================
function buildFoodItemHTML(item) {
  return `
    <div class="food-item">
      <img src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="food-item-info">
        <h4>${item.name}</h4>
        <span class="qty-pill">× ${item.quantity}</span>
      </div>
      <span class="food-item-price">₹${item.price * item.quantity}</span>
    </div>`;
}

function renderOrder(order) {
  const pricing = order.pricing || {};

  const listEl = document.getElementById('confirmFoodItems');
  if (listEl) listEl.innerHTML = (order.items || []).map(buildFoodItemHTML).join('');

  const itemTotalEl = document.getElementById('confirmItemTotal');
  if (itemTotalEl) itemTotalEl.textContent = '₹' + (pricing.itemTotal ?? 0);

  const deliveryEl = document.getElementById('confirmDelivery');
  if (deliveryEl) deliveryEl.textContent = '₹' + (pricing.deliveryFee ?? 0);

  const packagingEl = document.getElementById('confirmPackaging');
  if (packagingEl) packagingEl.textContent = '₹' + (pricing.packagingFee ?? 0);

  const tipRow = document.getElementById('confirmTipRow');
  const tipEl  = document.getElementById('confirmTip');
  if (pricing.tip > 0) {
    if (tipRow) tipRow.hidden = false;
    if (tipEl)  tipEl.textContent = '₹' + pricing.tip;
  }

  const totalEl = document.getElementById('confirmTotal');
  if (totalEl) totalEl.textContent = '₹' + (pricing.total ?? 0);

  const orderIdPill = document.getElementById('orderIdPill');
  if (orderIdPill) orderIdPill.textContent = '#' + (order.orderId || order._id || '');

  const restaurantPill = document.getElementById('orderRestaurantPill');
  if (restaurantPill) {
    restaurantPill.textContent = (order.restaurant && order.restaurant.name) || 'Foodie Kitchen';
  }

  // Reward points: 1 point per ₹10 spent, rounded down.
  const rewardEl = document.getElementById('rewardPointsText');
  if (rewardEl) rewardEl.textContent = `+${Math.max(1, Math.floor((pricing.total ?? 0) / 10))} Points Earned!`;

  if (order.deliveryAddress) {
    const addr = order.deliveryAddress;

    const nameEl = document.getElementById('confirmAddrName');
    if (nameEl) nameEl.textContent = addr.name || 'Guest';

    const addrText = document.getElementById('confirmAddrText');
    if (addrText) {
      addrText.innerHTML = `${addr.street || ''}<br>${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}`;
    }

    const phoneEl = document.getElementById('confirmAddrPhone');
    if (phoneEl) phoneEl.textContent = addr.phone || '—';
  }

  const orderDateEl = document.getElementById('orderDate');
  const confirmedTimeEl = document.getElementById('confirmedTime');
  const placedAt = order.createdAt ? new Date(order.createdAt) : new Date();

  if (orderDateEl) {
    orderDateEl.textContent = placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (confirmedTimeEl) {
    confirmedTimeEl.textContent = placedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}

function bootConfirmationPage() {
  const order = CartStorage.getOrderSnapshot();

  if (!order || !order.items || !order.items.length) {
    // Nobody placed an order in this session — nothing to confirm.
    window.location.href = 'mega4.html';
    return;
  }

  renderOrder(order);
}

bootConfirmationPage();

// ============================================================
// 7. SUCCESS ICON ANIMATION (Web Animations API)
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  const successIcon = document.querySelector('.success-icon');
  if (successIcon) {
    successIcon.animate(
      [
        { transform: 'scale(0.5)', opacity: '0' },
        { transform: 'scale(1.15)', opacity: '1' },
        { transform: 'scale(1)',   opacity: '1' }
      ],
      { duration: 700, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
    );
  }
});

// ============================================================
// 8. STAGGER ANIMATE CARDS ON LOAD
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  const elements = [
    document.querySelector('.success-hero'),
    document.querySelector('.order-summary-card'),
    document.querySelector('.right-cards'),
    document.querySelector('.tracking-card'),
    document.querySelector('.footer')
  ];

  elements.forEach((el, i) => {
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transform = i % 2 === 0 ? 'translateY(40px)' : 'translateX(40px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';

    setTimeout(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translate(0, 0)';
    }, 100 + i * 200);
  });
});

// ============================================================
// 9. CONFETTI CELEBRATION (lightweight canvas confetti)
// ============================================================
window.addEventListener('load', () => {
  launchConfetti();
});

function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none; z-index: 9999;
  `;
  document.body.appendChild(canvas);

  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors   = ['#FF7A00', '#FFB347', '#16A34A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];
  const pieces   = [];
  const count    = 120;

  for (let i = 0; i < count; i++) {
    pieces.push({
      x:      Math.random() * canvas.width,
      y:      Math.random() * -canvas.height,
      r:      4 + Math.random() * 6,
      color:  colors[Math.floor(Math.random() * colors.length)],
      speed:  2 + Math.random() * 4,
      swing:  Math.random() * 4 - 2,
      tilt:   Math.random() * 10 - 5,
      tiltInc: Math.random() * 0.1 - 0.05,
      alpha:  0.8 + Math.random() * 0.2
    });
  }

  let frame   = 0;
  const maxFrames = 160;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach(p => {
      p.y     += p.speed;
      p.x     += p.swing * Math.sin(frame * 0.05);
      p.tilt  += p.tiltInc;
      p.alpha -= 0.004;

      if (p.alpha <= 0 || p.y > canvas.height) return;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tilt);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle   = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 2);
      ctx.restore();
    });

    frame++;
    if (frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      setTimeout(() => canvas.remove(), 500);
    }
  }

  requestAnimationFrame(draw);
}

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
    style.textContent = `@keyframes foodFall {
      0%   { transform: translateY(-60px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
    }`;
    document.head.appendChild(style);
  }

  for (let i = 0; i < 24; i++) {
    const food = document.createElement('span');
    food.textContent = foods[Math.floor(Math.random() * foods.length)];
    food.style.cssText = `
      position:absolute;left:${Math.random() * 100}vw;top:-60px;
      font-size:${18 + Math.random() * 22}px;
      animation:foodFall ${1.5 + Math.random() * 2}s ${Math.random() * 0.5}s linear forwards;
    `;
    rain.appendChild(food);
  }

  setTimeout(() => rain.remove(), 4000);
});

// ============================================================
// 11. RIPPLE EFFECT
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
// 12. TOAST
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