// ============================================================
// FOODIE — TRACK ORDER PAGE JS (mega8.js)
// Reads the same order snapshot used by the confirmation page,
// so tracking always reflects what was actually ordered.
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
// 5. FETCH THE REAL ORDER (GET /api/orders/:id) + RENDER
// ============================================================
const API_BASE = 'http://localhost:5000/api';
let activeOrder = null;

function buildOrderItemHTML(item) {
  return `
    <div class="order-item">
      <img src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="order-item-info">
        <h4>${item.name}</h4>
        <span class="qty-tag">× ${item.quantity}</span>
      </div>
      <span class="item-price">₹${item.price * item.quantity}</span>
    </div>`;
}

function renderOrder(order) {
  const pricing = order.pricing || {};

  const listEl = document.getElementById('trackOrderItems');
  if (listEl) listEl.innerHTML = (order.items || []).map(buildOrderItemHTML).join('');

  const itemTotalEl = document.getElementById('trackItemTotal');
  if (itemTotalEl) itemTotalEl.textContent = '₹' + (pricing.itemTotal ?? 0);

  const deliveryEl = document.getElementById('trackDelivery');
  if (deliveryEl) deliveryEl.textContent = '₹' + (pricing.deliveryFee ?? 0);

  const packagingEl = document.getElementById('trackPackaging');
  if (packagingEl) packagingEl.textContent = '₹' + (pricing.packagingFee ?? 0);

  const tipRow = document.getElementById('trackTipRow');
  const tipEl  = document.getElementById('trackTip');
  if (pricing.tip > 0) {
    if (tipRow) tipRow.hidden = false;
    if (tipEl)  tipEl.textContent = '₹' + pricing.tip;
  }

  const totalEl = document.getElementById('trackTotal');
  if (totalEl) totalEl.textContent = '₹' + (pricing.total ?? 0);

  const orderIdEl = document.getElementById('trackOrderId');
  if (orderIdEl) orderIdEl.textContent = '#' + (order.orderId || order._id || '');

  const mapRestaurantName = document.getElementById('mapRestaurantName');
  if (mapRestaurantName) mapRestaurantName.textContent = (order.restaurant && order.restaurant.name) || 'Foodie Kitchen';

  if (order.deliveryAddress) {
    const addr = order.deliveryAddress;

    const nameEl = document.getElementById('trackAddrName');
    if (nameEl) nameEl.textContent = addr.name || 'Guest';

    const addrText = document.getElementById('trackAddrText');
    if (addrText) {
      addrText.innerHTML = `${addr.street || ''}<br>${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}`;
    }

    const phoneEl = document.getElementById('trackAddrPhone');
    if (phoneEl) phoneEl.textContent = addr.phone || '—';

    const mapCustomerName = document.getElementById('mapCustomerName');
    if (mapCustomerName) mapCustomerName.textContent = addr.name || 'You';

    const mapCustomerAddress = document.getElementById('mapCustomerAddress');
    if (mapCustomerAddress) mapCustomerAddress.textContent = addr.street || 'Delivering to your address';
  }

  const confirmedTimeEl = document.getElementById('confirmedTime');
  if (confirmedTimeEl) {
    const placedAt = order.createdAt ? new Date(order.createdAt) : new Date();
    confirmedTimeEl.textContent = placedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  renderDriver(order.driver);
  applyStatus(order.status);
}

function renderDriver(driver) {
  const nameEl     = document.querySelector('.partner-info h3');
  const subtitleEl = document.querySelector('.partner-info p');
  const callBtn    = document.querySelector('.call-btn');
  const chatBtn    = document.querySelector('.chat-btn');

  if (driver && driver.name) {
    if (nameEl) nameEl.textContent = driver.name;
    if (subtitleEl) subtitleEl.textContent = `On the way to you${driver.phone ? ' • ' + driver.phone : ''}`;
    if (callBtn) callBtn.disabled = false;
    if (chatBtn) chatBtn.disabled = false;
  } else {
    if (nameEl) nameEl.textContent = 'Assigning soon…';
    if (subtitleEl) subtitleEl.textContent = "You'll see partner details once assigned";
    if (callBtn) callBtn.disabled = true;
    if (chatBtn) chatBtn.disabled = true;
  }
}

// Real backend statuses (Order.status enum) mapped to this page's 4 UI steps.
const STATUS_STEP_MAP = {
  PLACED: 0, CONFIRMED: 0,
  PREPARING: 1, READY: 1,
  ASSIGNED: 2, PICKED_UP: 2, ON_THE_WAY: 2,
  DELIVERED: 3,
  CANCELLED: -1, REJECTED: -1
};

const STEP_SUBTEXT = {
  0: ['Confirmed', 'In the kitchen now', 'Pending', 'Almost there!'],
  1: ['Confirmed', 'In the kitchen now', 'Pending', 'Almost there!'],
  2: ['Confirmed', 'Ready, on the way', 'On the way to you', 'Almost there!'],
  3: ['Confirmed', 'Prepared', 'Delivered to you', 'Delivered 🎉']
};

function applyStatus(status) {
  const stepIndex = STATUS_STEP_MAP[status] ?? 0;
  const steps = document.querySelectorAll('.track-step');
  const bodies = document.querySelectorAll('.step-body p');

  if (status === 'CANCELLED' || status === 'REJECTED') {
    const sub = document.querySelector('.track-sub');
    if (sub) sub.textContent = status === 'CANCELLED' ? 'This order was cancelled.' : 'This order was declined by the restaurant.';
    return;
  }

  steps.forEach((step, i) => {
    const circle = step.querySelector('.step-circle');
    const line = step.querySelector('.step-line');

    step.classList.toggle('active', i <= stepIndex);
    if (circle) circle.classList.toggle('cooking', i === 1 && stepIndex === 1);
    if (line) line.classList.toggle('active-line', i < stepIndex);
    if (bodies[i] && STEP_SUBTEXT[stepIndex] && STEP_SUBTEXT[stepIndex][i]) {
      bodies[i].textContent = i <= stepIndex ? STEP_SUBTEXT[stepIndex][i] : bodies[i].textContent;
    }
  });

  const etaEl = document.getElementById('etaTime');
  if (etaEl) {
    const etaLabels = { 0: '30–40 min', 1: '25–35 min', 2: '10–15 min', 3: 'Delivered!' };
    etaEl.textContent = etaLabels[stepIndex] || '30–40 min';
  }

  document.querySelectorAll('.partner-btn').forEach(btn => {
    if (stepIndex >= 2) btn.disabled = false;
  });

  if (stepIndex === 3) {
    showToast('🎉 Your order has been delivered!');
    maybeShowReviewPrompt();
  }
}

async function fetchOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Order not found');
  return data.data.order;
}

async function bootTrackPage() {
  if (!CartStorage.isLoggedIn()) {
    showToast('Please login to track your order');
    setTimeout(() => { window.location.href = 'mega2.html'; }, 900);
    return;
  }

  const orderId = CartStorage.getActiveOrderId() || new URLSearchParams(window.location.search).get('id');

  if (!orderId) {
    // Nothing has been ordered/tracked in this session — nothing to track.
    window.location.href = 'mega4.html';
    return;
  }

  try {
    activeOrder = await fetchOrder(orderId);
    renderOrder(activeOrder);
    connectTrackingSocket(orderId);
  } catch (err) {
    console.error('Failed to load order:', err);
    showToast(err.message || "Can't reach the server. Is the backend running?", 'error');
  }
}

bootTrackPage();

// ============================================================
// 6. LIVE UPDATES — Socket.IO (real order_status_updated events,
//    no more fake countdowns or simulated progress)
// ============================================================
function connectTrackingSocket(orderId) {
  const socket = typeof getFoodieSocket === 'function' ? getFoodieSocket() : null;

  if (!socket) {
    console.warn('Socket.IO not available — falling back to a single fetch, no live updates.');
    return;
  }

  // The shared socket may already be connected (e.g. the notifications
  // widget connected first) — handle both the "already connected" and
  // "about to connect" cases so we don't miss joining the order room.
  if (socket.connected) {
    socket.emit('customer:track_order', orderId);
  } else {
    socket.on('connect', () => {
      socket.emit('customer:track_order', orderId);
    });
  }

  socket.on('order_status_updated', (payload) => {
    if (String(payload.orderId) !== String(orderId)) return;
    activeOrder = activeOrder ? { ...activeOrder, status: payload.status } : activeOrder;
    applyStatus(payload.status);
    showToast(`Order status: ${payload.status.replace(/_/g, ' ')}`);
  });

  socket.on('driver:location_updated', () => {
    // A real map isn't wired up on this page yet; at minimum, reflect
    // that the driver is actively en route.
    const subtitleEl = document.querySelector('.partner-info p');
    if (subtitleEl && !subtitleEl.textContent.includes('en route')) {
      subtitleEl.textContent = 'On the way — en route now';
    }
  });

  socket.on('connect_error', (err) => {
    console.error('Tracking socket connection failed:', err.message);
  });

  window.addEventListener('beforeunload', () => {
    socket.emit('customer:stop_tracking', orderId);
  });
}

// ============================================================
// 8. NOTIFY ME BUTTON
// ============================================================
const notifyBtn = document.querySelector('.notify-btn');
if (notifyBtn) {
  notifyBtn.addEventListener('click', () => {
    notifyBtn.innerHTML = '<i class="ri-check-line"></i> Watching!';
    notifyBtn.style.color       = '#39d353';
    notifyBtn.style.borderColor = '#39d353';
    showToast("This page updates live — keep it open and you'll see every status change 📲");
    notifyBtn.disabled = true;
  });
}

// ============================================================
// 9. QUICK ACTION BUTTONS
// ============================================================
const reorderBtn = document.getElementById('reorderBtn');
const helpBtn    = document.getElementById('helpBtn');

// ============================================================
// 6b. RATE YOUR ORDER — shown once status is really DELIVERED,
//     since POST /api/reviews only accepts reviews for delivered
//     orders. No mock success — this hits the real endpoint.
// ============================================================
const reviewModalOverlay = document.getElementById('reviewModalOverlay');
const reviewModalClose   = document.getElementById('reviewModalClose');
const reviewModalRestName = document.getElementById('reviewModalRestName');
const foodStarPicker      = document.getElementById('foodStarPicker');
const deliveryStarPicker  = document.getElementById('deliveryStarPicker');
const reviewComment       = document.getElementById('reviewComment');
const reviewSubmitBtn     = document.getElementById('reviewSubmitBtn');

let foodRating = 0;
let deliveryRating = 0;
let reviewAlreadyShown = false;

function setupStarPicker(picker, onSelect) {
  if (!picker) return;
  const buttons = picker.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = Number(btn.dataset.value);
      onSelect(value);
      buttons.forEach(b => b.classList.toggle('active', Number(b.dataset.value) <= value));
    });
  });
}

setupStarPicker(foodStarPicker, (v) => { foodRating = v; });
setupStarPicker(deliveryStarPicker, (v) => { deliveryRating = v; });

function closeReviewModal() {
  if (reviewModalOverlay) reviewModalOverlay.setAttribute('hidden', '');
}

if (reviewModalClose) reviewModalClose.addEventListener('click', closeReviewModal);
if (reviewModalOverlay) {
  reviewModalOverlay.addEventListener('click', (e) => {
    if (e.target === reviewModalOverlay) closeReviewModal();
  });
}

function maybeShowReviewPrompt() {
  if (reviewAlreadyShown || !reviewModalOverlay || !activeOrder) return;
  reviewAlreadyShown = true;

  if (reviewModalRestName) {
    reviewModalRestName.textContent = (activeOrder.restaurant && activeOrder.restaurant.name) || 'your order';
  }

  setTimeout(() => reviewModalOverlay.removeAttribute('hidden'), 1200);
}

if (reviewSubmitBtn) {
  reviewSubmitBtn.addEventListener('click', async () => {
    if (!foodRating) {
      showToast('Please rate the food at least', 'error');
      return;
    }

    const originalText = reviewSubmitBtn.textContent;
    reviewSubmitBtn.disabled = true;
    reviewSubmitBtn.textContent = 'Submitting…';

    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: activeOrder._id,
          foodRating,
          deliveryRating: deliveryRating || undefined,
          comment: reviewComment ? reviewComment.value.trim() : ''
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Could not submit review');

      showToast('Thanks for the feedback! 🌟');
      closeReviewModal();

    } catch (err) {
      // "already reviewed" is an expected, non-error outcome from the user's
      // point of view — just close quietly instead of showing a scary error.
      if (err.message && err.message.toLowerCase().includes('already reviewed')) {
        closeReviewModal();
      } else {
        showToast(err.message || "Can't reach the server. Is the backend running?", 'error');
        reviewSubmitBtn.disabled = false;
        reviewSubmitBtn.textContent = originalText;
      }
    }
  });
}

if (reorderBtn) {
  reorderBtn.addEventListener('click', async () => {
    if (activeOrder && activeOrder.items && activeOrder.items.length) {
      try {
        for (const item of activeOrder.items) {
          const menuItemId = CartStorage.getMenuItemId(item.menuItem);
          if (menuItemId) await CartStorage.addItem(menuItemId, item.quantity);
        }
        showToast('Items added to cart for reorder! 🛒');
        setTimeout(() => { window.location.href = 'mega5.html'; }, 1000);
      } catch (err) {
        showToast(err.message || 'Could not reorder — try again', 'error');
      }
    } else {
      showToast('No previous order found', 'error');
    }
  });
}

if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    showToast('Connecting you to support… 💬');
  });
}

// ============================================================
// 10. PARTNER CALL / CHAT BUTTONS
// ============================================================
document.querySelector('.call-btn')?.addEventListener('click', () => {
  showToast('Calling your delivery partner… 📞');
});

document.querySelector('.chat-btn')?.addEventListener('click', () => {
  showToast('Opening chat with delivery partner… 💬');
});

// ============================================================
// 11. SCROLL REVEAL — staggered cards
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll(
    '.tracking-card, .map-card, .partner-card, .order-detail-card, .address-detail-card, .quick-actions'
  );

  cards.forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    setTimeout(() => {
      card.style.opacity   = '1';
      card.style.transform = 'translateY(0)';
    }, 100 + i * 120);
  });
});

// ============================================================
// 12. TYPING EFFECT FOR PAGE TITLE
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.track-header-left h1');
  if (!title) return;

  // Save original HTML to preserve <span>
  const original = title.innerHTML;
  title.innerHTML = '';

  // Strip tags for plain text typing then restore
  const temp = document.createElement('div');
  temp.innerHTML = original;
  const text = temp.textContent;

  let i = 0;
  const type = () => {
    if (i < text.length) {
      title.textContent += text.charAt(i++);
      setTimeout(type, 60);
    } else {
      // Restore styled HTML after typing
      setTimeout(() => { title.innerHTML = original; }, 50);
    }
  };

  setTimeout(type, 300);
});

// ============================================================
// 13. FOOD EMOJI RAIN
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
// 14. RIPPLE EFFECT
// ============================================================
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', function(e) {
    if (this.disabled) return;
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
// 15. TOAST
// ============================================================
const toast = document.getElementById('statusToast');
let toastTimer = null;

function showToast(msg, type) {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.borderLeftColor = type === 'error' ? '#e53e3e' : 'var(--brand)';
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}