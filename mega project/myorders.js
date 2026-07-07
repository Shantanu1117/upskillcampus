// ================================
// FOODIE — MY ORDERS PAGE
// ================================

const API_BASE = 'http://localhost:5000/api';
let currentPage = 1;
let totalPages = 1;

// ============================================================
// SCROLL PROGRESS
// ============================================================
window.addEventListener('scroll', () => {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  bar.style.width = scrolled + '%';
});

// ============================================================
// HAMBURGER MENU
// ============================================================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const expanded = navLinks.classList.contains('open');
    hamburger.setAttribute('aria-expanded', String(expanded));
  });
}

// ============================================================
// THEME TOGGLE
// ============================================================
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, isError = false) {
  const toast = document.getElementById('statusToast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = isError ? '#e5484d' : '';
  toast.classList.add('visible');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ============================================================
// AUTH NAV STATE
// ============================================================
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
    window.location.href = 'mega1.html';
  } else {
    window.location.href = 'mega2.html';
  }
}

if (loginBtn) loginBtn.addEventListener('click', handleAuthNavClick);
refreshAuthNav();

// ============================================================
// ORDER HISTORY — GET /api/orders/my
// ============================================================
const STATUS_LABELS = {
  PLACED: 'Placed', CONFIRMED: 'Confirmed', PREPARING: 'Preparing',
  READY: 'Ready', ASSIGNED: 'Driver Assigned', PICKED_UP: 'Picked Up',
  ON_THE_WAY: 'On The Way', DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled', REJECTED: 'Rejected'
};

function statusBadgeClass(status) {
  if (status === 'DELIVERED') return 'status-delivered';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'status-cancelled';
  return 'status-active';
}

function buildOrderCardHTML(order) {
  const restaurant = order.restaurant || {};
  const items = order.items || [];
  const itemsSummary = items.map(i => `${i.quantity}× ${i.name}`).join(', ');
  const placedAt = order.createdAt ? new Date(order.createdAt) : null;
  const dateLabel = placedAt
    ? placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const isDelivered = order.status === 'DELIVERED';
  const isFinal = isDelivered || order.status === 'CANCELLED' || order.status === 'REJECTED';

  return `
    <div class="order-card" data-order-id="${order._id}">
      <div class="order-card-top">
        <div class="order-restaurant">
          <img src="${restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80'}" alt="${restaurant.name || 'Restaurant'}">
          <div>
            <h3>${restaurant.name || 'Foodie Restaurant'}</h3>
            <p>#${order.orderId || order._id} · ${dateLabel}</p>
          </div>
        </div>
        <span class="order-status-badge ${statusBadgeClass(order.status)}">${STATUS_LABELS[order.status] || order.status}</span>
      </div>

      <div class="order-items-summary">${itemsSummary || 'No items'}</div>

      <div class="order-card-bottom">
        <div class="order-total">
          ₹${order.pricing ? order.pricing.total : 0}
          <span>${items.length} item${items.length === 1 ? '' : 's'}</span>
        </div>
        <div class="order-actions">
          ${isDelivered ? `<button class="reorder-btn" data-action="reorder">Reorder</button>` : ''}
          ${!isFinal ? `<button class="track-btn primary" data-action="track">Track Order</button>` : ''}
        </div>
      </div>
    </div>`;
}

async function reorderItems(order) {
  if (!CartStorage.isLoggedIn()) {
    showToast('Please login to reorder');
    setTimeout(() => { window.location.href = 'mega2.html'; }, 900);
    return;
  }

  try {
    for (const item of (order.items || [])) {
      const menuItemId = item.menuItem && (item.menuItem._id || item.menuItem);
      if (menuItemId) await CartStorage.addItem(menuItemId, item.quantity);
    }
    showToast('Items added to your cart 🛒');
    setTimeout(() => { window.location.href = 'mega5.html'; }, 900);
  } catch (err) {
    showToast(err.message || 'Could not reorder — try again', true);
  }
}

function trackOrder(order) {
  CartStorage.setActiveOrderId(order._id);
  window.location.href = 'mega8.html';
}

async function loadOrders(page = 1) {
  const loading = document.getElementById('ordersLoading');
  const errorEl = document.getElementById('ordersError');
  const emptyEl = document.getElementById('ordersEmpty');
  const listEl = document.getElementById('ordersList');
  const paginationEl = document.getElementById('ordersPagination');

  if (!CartStorage.isLoggedIn()) {
    showToast('Please login to view your orders');
    setTimeout(() => { window.location.href = 'mega2.html'; }, 900);
    return;
  }

  loading.hidden = false;
  errorEl.hidden = true;
  emptyEl.hidden = true;
  listEl.innerHTML = '';
  paginationEl.hidden = true;

  try {
    const res = await fetch(`${API_BASE}/orders/my?page=${page}&limit=8`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message || 'Could not load your orders');

    loading.hidden = true;

    const orders = data.data || [];
    currentPage = (data.pagination && data.pagination.currentPage) || 1;
    totalPages = (data.pagination && data.pagination.totalPages) || 1;

    if (!orders.length) {
      emptyEl.hidden = false;
      return;
    }

    listEl.innerHTML = orders.map(buildOrderCardHTML).join('');

    listEl.querySelectorAll('.order-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 60}ms`;
      const order = orders[i];

      const reorderBtn = card.querySelector('[data-action="reorder"]');
      if (reorderBtn) reorderBtn.addEventListener('click', () => reorderItems(order));

      const trackBtn = card.querySelector('[data-action="track"]');
      if (trackBtn) trackBtn.addEventListener('click', () => trackOrder(order));
    });

    if (totalPages > 1) {
      paginationEl.hidden = false;
      document.getElementById('pageIndicator').textContent = `Page ${currentPage} of ${totalPages}`;
      document.getElementById('prevPageBtn').disabled = currentPage <= 1;
      document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;
    }

  } catch (err) {
    console.error('Failed to load orders:', err);
    loading.hidden = true;
    errorEl.hidden = false;
    errorEl.textContent = err.message || "Can't reach the server. Is the backend running?";
  }
}

const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) loadOrders(currentPage - 1); });
if (nextPageBtn) nextPageBtn.addEventListener('click', () => { if (currentPage < totalPages) loadOrders(currentPage + 1); });

const browseRestaurantsBtn = document.getElementById('browseRestaurantsBtn');
if (browseRestaurantsBtn) browseRestaurantsBtn.addEventListener('click', () => { window.location.href = 'mega4.html'; });

// ============================================================
// HERO VIDEO — pause when off-screen (performance), same
// pattern as mega10/Contact
// ============================================================
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        heroVideo.play().catch(() => {});
      } else {
        heroVideo.pause();
      }
    });
  }, { threshold: 0.15 });
  videoObserver.observe(heroVideo);

  heroVideo.addEventListener('error', () => {
    const media = document.querySelector('.hero-media');
    if (media) media.classList.add('video-fallback');
  });
}

loadOrders(1);