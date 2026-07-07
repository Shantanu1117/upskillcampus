// ============================================================
// FOODIE — RESTAURANT LISTING PAGE JS (mega4.js)
// Restaurants are fetched LIVE from GET /api/restaurants.
// Cards carry a real data-id (Restaurant._id); clicking one opens
// an in-page menu quick-view modal (GET /api/menu/restaurant/:id)
// where individual MenuItems get real Add to Cart buttons.
// There's no separate restaurant-detail page in this project
// (mega6.html is Checkout), so the modal lives right here.
// Requires cart-storage.js to be loaded BEFORE this file.
// ============================================================

'use strict';

const API_BASE = 'http://localhost:5000/api';

// ============================================================
// 1. THEME TOGGLE (persistent via localStorage)
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
// 3. HAMBURGER MOBILE MENU
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
// 4. NAV LINK ROUTING (unchanged — same destinations)
// ============================================================
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const map = {
      'Home':        'mega1.html',
      'Restaurants': 'mega4.html',
      'Categories':  'mega11.html',
      'Offers':      'mega9.html',
      'Track Order': 'mega8.html',
      'My Orders':   'myorders.html',
      'Contact':     'mega10.html'
    };
    const dest = map[link.textContent.trim()];
    if (dest) window.location.href = dest;
  });
});

// ============================================================
// 5. LOGIN BUTTON — real auth state (was a static redirect-only
//    button; every other page already got this, this one was
//    missed in that pass)
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
    showToast('Logged out 👋');
  } else {
    window.location.href = 'mega2.html';
  }
}

if (loginBtn) loginBtn.addEventListener('click', handleAuthNavClick);
refreshAuthNav();

// ============================================================
// 6. TOAST NOTIFICATION
// ============================================================
const toast = document.getElementById('statusToast');
let toastTimer = null;

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

// ============================================================
// 7. DEBOUNCE UTILITY
// ============================================================
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================
// 8. FETCH RESTAURANTS FROM THE BACKEND
//    GET /api/restaurants is assumed public (same pattern as
//    menuRoutes.js, where GET routes sit before router.use(protect)).
//
//    NOTE: the exact shape of a paginated response depends on
//    your utils/responseUtils.js `sendPaginated` implementation,
//    which wasn't shared. This parses defensively — it checks a
//    few common shapes. If none match, open devtools > Network >
//    the /api/restaurants request > Response, and adjust the
//    `extractList()` function below to match your real shape.
// ============================================================

let allRestaurants = []; // normalized restaurant objects currently rendered

function extractList(json) {
  if (Array.isArray(json.data)) return json.data;
  if (json.data && Array.isArray(json.data.restaurants)) return json.data.restaurants;
  if (Array.isArray(json.restaurants)) return json.restaurants;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

function normalizeRestaurant(r) {
  return {
    id: r._id,
    name: r.name || 'Unnamed Restaurant',
    image: r.coverImage || (Array.isArray(r.images) && r.images[0]) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
    cuisines: Array.isArray(r.cuisines) ? r.cuisines : [],
    city: (r.address && r.address.city) ? r.address.city : '',
    rating: typeof r.rating === 'number' ? r.rating : 0,
    deliveryMin: r.deliveryTime && r.deliveryTime.min != null ? r.deliveryTime.min : null,
    deliveryMax: r.deliveryTime && r.deliveryTime.max != null ? r.deliveryTime.max : null,
    isOpen: r.isOpen !== false
  };
}

async function fetchRestaurants() {
  const loadingState = document.getElementById('loadingState');
  const errorState    = document.getElementById('errorState');
  const errorMessage  = document.getElementById('errorMessage');

  if (loadingState) loadingState.removeAttribute('hidden');
  if (errorState)   errorState.setAttribute('hidden', '');

  try {
    const res = await fetch(`${API_BASE}/restaurants?limit=50&sort=rating`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json.message || `Request failed (${res.status})`);
    }

    const list = extractList(json).map(normalizeRestaurant);
    allRestaurants = list;

    if (loadingState) loadingState.setAttribute('hidden', '');
    renderRestaurantCards(list);
    syncFavouriteHearts();

    const statTotal = document.getElementById('totalRestaurantsStat');
    if (statTotal) statTotal.textContent = list.length + (list.length === 50 ? '+' : '');

  } catch (err) {
    console.error('Failed to load restaurants:', err);
    if (loadingState) loadingState.setAttribute('hidden', '');
    if (errorState) errorState.removeAttribute('hidden');
    if (errorMessage) errorMessage.textContent = err.message || 'Something went wrong.';
  }
}

const retryBtn = document.getElementById('retryBtn');
if (retryBtn) retryBtn.addEventListener('click', fetchRestaurants);

// ============================================================
// 9. RENDER RESTAURANT CARDS
//    No cart controls here — a restaurant isn't a cart-able
//    thing. Clicking a card goes to the menu page (mega6.html).
// ============================================================

const restaurantGrid = document.getElementById('restaurantGrid');

function cardHTML(r) {
  const ratingLabel = r.rating ? r.rating.toFixed(1) : '—';
  const timeLabel = (r.deliveryMin != null && r.deliveryMax != null)
    ? `${r.deliveryMin}–${r.deliveryMax} min`
    : 'Delivery time N/A';
  const cuisineLabel = r.cuisines.length ? r.cuisines.join(' · ') : 'Multi-cuisine';

  return `
    <article class="restaurant-card" role="listitem" tabindex="0"
      data-id="${r.id}"
      data-location="${r.city}"
      data-cuisine="${r.cuisines.join(',')}"
      data-rating="${r.rating}"
      data-name="${r.name}"
      aria-label="${r.name} restaurant">
      <div class="card-image">
        <img src="${r.image}" alt="${r.name}" loading="lazy">
        <button class="heart" aria-label="Save to favourites" aria-pressed="false">♡</button>
        <span class="rating-badge">★ ${ratingLabel}</span>
      </div>
      <div class="card-content">
        <h3>${r.name}</h3>
        <p class="cuisine-tag">${cuisineLabel}</p>
        <div class="bottom-row">
          <span><i class="ri-time-line" aria-hidden="true"></i> ${timeLabel}</span>
          <span class="price-tag">${r.city || ''}</span>
        </div>
      </div>
    </article>`;
}

async function syncFavouriteHearts() {
  if (!CartStorage.isLoggedIn()) return;

  try {
    const res = await fetch(`${API_BASE}/users/favourites`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) return;

    const favouriteIds = new Set(
      (data.data.favourites || []).map(r => r._id || r)
    );

    document.querySelectorAll('.restaurant-card').forEach(card => {
      const heart = card.querySelector('.heart');
      if (heart && favouriteIds.has(card.dataset.id)) {
        heart.setAttribute('aria-pressed', 'true');
        heart.textContent = '♥';
      }
    });
  } catch (err) {
    console.error('Failed to sync favourites:', err);
  }
}

function renderRestaurantCards(list) {
  if (!restaurantGrid) return;
  restaurantGrid.innerHTML = list.map(cardHTML).join('');

  restaurantGrid.querySelectorAll('.restaurant-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.heart')) return;
      openMenuModal(card.dataset.id, card.dataset.name);
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenuModal(card.dataset.id, card.dataset.name);
      }
    });

    const heart = card.querySelector('.heart');
    if (heart) {
      heart.addEventListener('click', async e => {
        e.stopPropagation();

        if (!CartStorage.isLoggedIn()) {
          showToast('Please login to save favourites');
          setTimeout(() => { window.location.href = 'mega2.html'; }, 900);
          return;
        }

        const pressed = heart.getAttribute('aria-pressed') === 'true';
        const restaurantId = card.dataset.id;

        // Optimistic UI update
        heart.setAttribute('aria-pressed', String(!pressed));
        heart.textContent = pressed ? '♡' : '♥';
        heart.style.transform = 'scale(1.4)';
        setTimeout(() => { heart.style.transform = ''; }, 300);
        heart.disabled = true;

        try {
          const res = await fetch(`${API_BASE}/users/favourites/${encodeURIComponent(restaurantId)}`, {
            method: pressed ? 'DELETE' : 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();

          if (!res.ok || !data.success) throw new Error(data.message || 'Could not update favourites');

          showToast(pressed ? 'Removed from favourites' : 'Added to favourites ❤️');

        } catch (err) {
          // Revert the optimistic update on failure
          heart.setAttribute('aria-pressed', String(pressed));
          heart.textContent = pressed ? '♥' : '♡';
          showToast(err.message || "Can't reach the server. Is the backend running?", 'error');
        } finally {
          heart.disabled = false;
        }
      });
    }

    revealObserver.observe(card);
  });

  applyFilters();
}

// ============================================================
// 10. SCROLL REVEAL (Intersection Observer)
// ============================================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('show'), i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.stat-card, .footer-links').forEach(el => {
  revealObserver.observe(el);
});

document.querySelectorAll('.cuisine').forEach((chip, i) => {
  setTimeout(() => chip.classList.add('show'), 100 + i * 60);
});

document.querySelectorAll('.offer-card').forEach((card, i) => {
  setTimeout(() => card.classList.add('show'), 200 + i * 160);
});

// ============================================================
// 10b. RESTAURANT MENU QUICK-VIEW MODAL
//      GET /api/menu/restaurant/:id → render grouped items with
//      real Add to Cart buttons wired to cart-storage.js, which
//      itself talks to the real /api/cart endpoints.
// ============================================================
const menuModalOverlay = document.getElementById('menuModalOverlay');
const menuModalClose   = document.getElementById('menuModalClose');
const menuModalImg     = document.getElementById('menuModalImg');
const menuModalName    = document.getElementById('menuModalRestName');
const menuModalMeta    = document.getElementById('menuModalRestMeta');
const menuModalLoading = document.getElementById('menuModalLoading');
const menuModalError   = document.getElementById('menuModalError');
const menuModalList    = document.getElementById('menuModalList');

function closeMenuModal() {
  if (!menuModalOverlay) return;
  menuModalOverlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

if (menuModalClose)  menuModalClose.addEventListener('click', closeMenuModal);
if (menuModalOverlay) {
  menuModalOverlay.addEventListener('click', (e) => {
    if (e.target === menuModalOverlay) closeMenuModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuModalOverlay && !menuModalOverlay.hasAttribute('hidden')) {
    closeMenuModal();
  }
});

function menuItemRowHTML(item) {
  const price = item.discountedPrice > 0 ? item.discountedPrice : item.price;
  const qty = CartStorage.getItemQty(item._id);

  return `
    <div class="menu-item-row" data-item-id="${item._id}">
      <img class="menu-item-img" src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80'}" alt="${item.name}" loading="lazy">
      <div class="menu-item-info">
        <span class="menu-item-name">
          <span class="veg-dot${item.isVeg ? '' : ' nonveg'}"></span>
          ${item.name}
        </span>
        <div class="menu-item-price">₹${price}</div>
      </div>
      <div class="menu-item-cart-control" data-qty-control>
        ${qty > 0 ? qtyStepperHTML(qty) : `<button class="menu-add-btn" data-add>ADD</button>`}
      </div>
    </div>`;
}

function qtyStepperHTML(qty) {
  return `
    <div class="menu-qty-stepper">
      <button data-decrease aria-label="Decrease quantity">−</button>
      <span>${qty}</span>
      <button data-increase aria-label="Increase quantity">+</button>
    </div>`;
}

function bindMenuItemControls() {
  menuModalList.querySelectorAll('.menu-item-row').forEach(row => {
    const itemId = row.dataset.itemId;
    const control = row.querySelector('[data-qty-control]');

    function rerenderControl() {
      const qty = CartStorage.getItemQty(itemId);
      control.innerHTML = qty > 0 ? qtyStepperHTML(qty) : `<button class="menu-add-btn" data-add>ADD</button>`;
      bindRowEvents();
    }

    function bindRowEvents() {
      const addBtn = control.querySelector('[data-add]');
      const incBtn = control.querySelector('[data-increase]');
      const decBtn = control.querySelector('[data-decrease]');

      if (addBtn) addBtn.addEventListener('click', async () => {
        if (!CartStorage.isLoggedIn()) {
          showToast('Please login to add items to your cart');
          setTimeout(() => { window.location.href = 'mega2.html'; }, 900);
          return;
        }
        addBtn.disabled = true;
        try {
          await CartStorage.addItem(itemId, 1);
          rerenderControl();
        } catch (err) {
          showToast(err.message || 'Could not add item', true);
          addBtn.disabled = false;
        }
      });

      if (incBtn) incBtn.addEventListener('click', async () => {
        try { await CartStorage.increaseQty(itemId); rerenderControl(); }
        catch (err) { showToast(err.message || 'Could not update item', true); }
      });

      if (decBtn) decBtn.addEventListener('click', async () => {
        try { await CartStorage.decreaseQty(itemId); rerenderControl(); }
        catch (err) { showToast(err.message || 'Could not update item', true); }
      });
    }

    bindRowEvents();
  });
}

async function openMenuModal(restaurantId, restaurantName) {
  if (!restaurantId || !menuModalOverlay) return;

  const r = allRestaurants.find(x => x.id === restaurantId);

  menuModalName.textContent = restaurantName || (r && r.name) || 'Restaurant';
  menuModalImg.src = (r && r.image) || '';
  menuModalImg.alt = restaurantName || '';
  menuModalMeta.textContent = r
    ? `${r.cuisines.length ? r.cuisines.join(' · ') : 'Multi-cuisine'} · ${r.city || ''}`
    : '';

  menuModalList.innerHTML = '';
  menuModalError.setAttribute('hidden', '');
  menuModalLoading.removeAttribute('hidden');
  menuModalOverlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(`${API_BASE}/menu/restaurant/${encodeURIComponent(restaurantId)}`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);

    const grouped = (json.data && json.data.menu) || {};
    const categories = Object.keys(grouped);

    menuModalLoading.setAttribute('hidden', '');

    if (!categories.length) {
      menuModalList.innerHTML = '<p style="text-align:center;color:var(--text-sec);padding:30px 10px;">This restaurant hasn\'t added any menu items yet.</p>';
      return;
    }

    menuModalList.innerHTML = categories.map(cat => `
      <div class="menu-modal-category">${cat}</div>
      ${grouped[cat].map(menuItemRowHTML).join('')}
    `).join('');

    bindMenuItemControls();

  } catch (err) {
    console.error('Failed to load menu:', err);
    menuModalLoading.setAttribute('hidden', '');
    menuModalError.removeAttribute('hidden');
    menuModalError.textContent = err.message || 'Could not load this menu. Is the backend running?';
  }
}

// ============================================================
// 11. FILTER SYSTEM (adapted for dynamically-rendered cards
//     and multi-cuisine restaurants)
// ============================================================
const locationFilter  = document.getElementById('locationFilter');
const cuisineFilter   = document.getElementById('Cuusinesdom');
const ratingFilter    = document.getElementById('ratingFilter');
const applyBtn        = document.querySelector('.filter-btn');
const cuisineButtons  = document.querySelectorAll('.cuisine');
const restaurantCount = document.getElementById('restaurantCount');
const emptyState      = document.getElementById('emptyState');
const resetBtn        = document.getElementById('resetFiltersBtn');
const restSearch      = document.getElementById('restaurantSearch');
const itemSearch      = document.getElementById('itemSearch');

let selectedCuisineBtn = 'All';

function applyFilters() {
  if (!restaurantGrid) return;
  const cards = Array.from(restaurantGrid.querySelectorAll('.restaurant-card'));

  const loc       = locationFilter ? locationFilter.value : 'All';
  const cuisine   = cuisineFilter ? cuisineFilter.value : 'All';
  const rating    = ratingFilter ? ratingFilter.value : 'All';
  const restQuery = (restSearch ? restSearch.value : '').toLowerCase().trim();
  const itemQuery = (itemSearch ? itemSearch.value : '').toLowerCase().trim();

  let visible = 0;

  cards.forEach(card => {
    const cardLoc      = card.dataset.location  || '';
    const cardCuisines = (card.dataset.cuisine  || '').split(',').map(c => c.trim()).filter(Boolean);
    const cardRating   = parseFloat(card.dataset.rating) || 0;
    const cardName     = (card.dataset.name || '').toLowerCase();

    let show = true;

    if (loc !== 'All' && cardLoc !== loc) show = false;
    if (cuisine !== 'All' && !cardCuisines.includes(cuisine)) show = false;
    if (selectedCuisineBtn !== 'All' && !cardCuisines.includes(selectedCuisineBtn)) show = false;
    if (rating !== 'All' && cardRating < parseFloat(rating)) show = false;
    if (restQuery && !cardName.includes(restQuery) && !cardCuisines.join(' ').toLowerCase().includes(restQuery)) show = false;
    if (itemQuery && !cardCuisines.join(' ').toLowerCase().includes(itemQuery) && !cardName.includes(itemQuery)) show = false;

    if (show) {
      card.style.display = '';
      card.classList.remove('show');
      setTimeout(() => card.classList.add('show'), 50);
      visible++;
    } else {
      card.style.display = 'none';
    }
  });

  if (restaurantCount) restaurantCount.textContent = visible;

  if (emptyState) {
    if (visible === 0) {
      emptyState.removeAttribute('hidden');
    } else {
      emptyState.setAttribute('hidden', '');
    }
  }
}

if (applyBtn)   applyBtn.addEventListener('click', applyFilters);
if (restSearch) restSearch.addEventListener('input', debounce(applyFilters, 300));
if (itemSearch) itemSearch.addEventListener('input', debounce(applyFilters, 300));

cuisineButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    cuisineButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const raw = btn.textContent.trim();
    const text = raw.replace(/[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27FF}]/gu, '').trim();
    selectedCuisineBtn = (!text || text === 'All') ? 'All' : text;

    applyFilters();
  });
});

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (locationFilter) locationFilter.value = 'All';
    if (cuisineFilter)  cuisineFilter.value  = 'All';
    if (ratingFilter)   ratingFilter.value   = 'All';
    if (restSearch)     restSearch.value     = '';
    if (itemSearch)     itemSearch.value     = '';
    selectedCuisineBtn = 'All';

    cuisineButtons.forEach(b => b.classList.remove('active'));
    const firstChip = document.querySelector('.cuisine');
    if (firstChip) firstChip.classList.add('active');

    applyFilters();
  });
}

// ============================================================
// 12. SORT
// ============================================================
const sortFilter = document.getElementById('sortFilter');

function sortRestaurants() {
  if (!sortFilter || !restaurantGrid) return;
  const val   = sortFilter.value;
  const cards = Array.from(restaurantGrid.querySelectorAll('.restaurant-card'));

  if (val === 'high') {
    cards.sort((a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating));
  } else if (val === 'low') {
    cards.sort((a, b) => parseFloat(a.dataset.rating) - parseFloat(b.dataset.rating));
  }

  cards.forEach(card => restaurantGrid.appendChild(card));
}

if (sortFilter) sortFilter.addEventListener('change', sortRestaurants);

// ============================================================
// 13. BUTTON RIPPLE
// ============================================================
document.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  const rect = btn.getBoundingClientRect();
  ripple.style.left = (e.clientX - rect.left - 40) + 'px';
  ripple.style.top  = (e.clientY - rect.top  - 40) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ============================================================
// 14. FOOD EMOJI RAIN (decorative, on page load — unchanged)
// ============================================================
window.addEventListener('load', () => {
  const foods = ['🍕','🍔','🍟','🌮','🍩','🍗','🥤','🌭','🍜','🍰'];
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
      position: absolute;
      left: ${Math.random() * 100}vw;
      top: -60px;
      font-size: ${18 + Math.random() * 22}px;
      opacity: 0.9;
      animation: foodFall ${1.5 + Math.random() * 2}s ${Math.random() * 0.6}s linear forwards;
    `;
    rain.appendChild(food);
  }

  setTimeout(() => rain.remove(), 4000);
});

// ============================================================
// 15. HERO VIDEO — graceful fallback if the file isn't found
// ============================================================
const heroVideo = document.getElementById('heroVideo');
const heroVideoWrap = document.querySelector('.hero-video-wrap');

if (heroVideo) {
  heroVideo.addEventListener('error', () => {
    if (heroVideoWrap) {
      heroVideoWrap.style.background =
        'linear-gradient(115deg, #2a1c0f, #1a1208 60%, #120c08)';
    }
    heroVideo.style.display = 'none';
  }, true);
}

// ============================================================
// 16. CART BADGE / STICKY VIEW-CART BAR
//     (no add-to-cart on this page, but a user may already have
//     items in their cart from a previous visit — reflect that)
// ============================================================
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = CartStorage.getCount();
  badge.textContent = count;
  badge.hidden = count === 0;
  badge.style.transform = 'scale(1.35)';
  setTimeout(() => { badge.style.transform = ''; }, 220);
}

const viewCartBar      = document.getElementById('viewCartBar');
const viewCartCount    = document.getElementById('viewCartCount');
const viewCartPlural   = document.getElementById('viewCartPlural');
const viewCartSubtotal = document.getElementById('viewCartSubtotal');
const viewCartBtn      = document.getElementById('viewCartBtn');

function updateViewCartBar() {
  if (!viewCartBar) return;
  const count = CartStorage.getCount();
  const subtotal = CartStorage.getSubtotal();

  if (count === 0) {
    viewCartBar.setAttribute('hidden', '');
    return;
  }

  viewCartBar.removeAttribute('hidden');
  if (viewCartCount)    viewCartCount.textContent = count;
  if (viewCartPlural)   viewCartPlural.textContent = count === 1 ? '' : 's';
  if (viewCartSubtotal) viewCartSubtotal.textContent = '₹' + subtotal;
}

if (viewCartBtn) viewCartBtn.addEventListener('click', () => { window.location.href = 'mega5.html'; });

const cartBtn = document.getElementById('cartBtn');
if (cartBtn) cartBtn.addEventListener('click', () => { window.location.href = 'mega5.html'; });

document.addEventListener('cart:updated', () => {
  updateCartBadge();
  updateViewCartBar();
});

// ============================================================
// 17. BOOT
// ============================================================
async function boot() {
  await CartStorage.refreshCart();
  updateCartBadge();
  updateViewCartBar();
  await fetchRestaurants();
  applyUrlParams();
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cuisine = params.get('cuisine');
  const search = params.get('search');

  if (cuisine) {
    selectedCuisineBtn = cuisine;
    cuisineButtons.forEach(b => {
      const text = b.textContent.replace(/[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27FF}]/gu, '').trim();
      b.classList.toggle('active', text === cuisine);
    });
  }

  if (search && restSearch) {
    restSearch.value = search;
  }

  if (cuisine || search) applyFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}