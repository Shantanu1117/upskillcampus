// ============================================================
// FOODIE — SHARED CART ENGINE (cart-storage.js)
// Single source of truth for the cart, used by every page.
// Talks directly to the MongoDB-backed cart API.
// Load this BEFORE any page-specific script.
// ============================================================

'use strict';

const CartStorage = (function () {
  // Change this to your deployed API URL in production
  // (e.g. via a <meta> tag or a build-time env var).
  const API_BASE  = 'http://localhost:5000/api/cart';
  const ORDER_KEY = 'foodie_last_order_v1'; // order snapshot only — not cart data

  // In-memory cache of the last cart we fetched from the server.
  // This is what powers synchronous UI reads like getItemQty()/getCount().
  let cartCache = { items: [], pricing: {}, restaurant: null };

  // ---- auth helpers -------------------------------------------
  function getToken() {
    return localStorage.getItem('token');
  }

  function isLoggedIn() {
    return !!getToken();
  }

  // ---- low-level API request helper ----------------------------
  async function apiRequest(endpoint, options = {}, isRetry = false) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    // Access token expired — try a silent refresh once, then retry the
    // original request. If that also fails, the session is really over.
    if (res.status === 401 && !isRetry) {
      const refreshed = await tryRefreshToken();
      if (refreshed) return apiRequest(endpoint, options, true);

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      throw new Error('Your session expired — please log in again');
    }

    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body is fine */ }

    if (!res.ok) {
      const message = data && data.message ? data.message : `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  async function tryRefreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();
      if (!res.ok || !data.success) return false;

      localStorage.setItem('token', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---- id helper (backend may return menuItem populated or as a raw id) ----
  function extractId(menuItemField) {
    if (!menuItemField) return null;
    return typeof menuItemField === 'object' ? String(menuItemField._id) : String(menuItemField);
  }

  function slugify(str) {
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ---- cache sync -----------------------------------------------
  function updateCacheFromCart(cart) {
    cartCache.items      = (cart && cart.items)      ? cart.items      : [];
    cartCache.pricing    = (cart && cart.pricing)    ? cart.pricing    : {};
    cartCache.restaurant = (cart && cart.restaurant) ? cart.restaurant : null;
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cartCache } }));
  }

  // ---- reads (hit the backend) -----------------------------------
  async function refreshCart() {
    if (!isLoggedIn()) {
      updateCacheFromCart(null);
      return null;
    }
    try {
      const result = await apiRequest('/'); // GET /api/cart
      const cart = result.data ? result.data.cart : null;
      updateCacheFromCart(cart);
      return cart;
    } catch (err) {
      console.error('Failed to load cart:', err);
      updateCacheFromCart(null);
      return null;
    }
  }

  // ---- mutations (all hit the backend, then refresh the cache) ----
  async function addItem(menuItemId, quantity = 1) {
    if (!menuItemId) throw new Error('Missing menu item id');
    const result = await apiRequest('/add', {
      method: 'POST',
      body: JSON.stringify({ menuItemId, quantity })
    });
    updateCacheFromCart(result.data.cart);
    return result;
  }

  async function increaseQty(menuItemId) {
    const currentQty = getItemQty(menuItemId);
    const result = await apiRequest('/update', {
      method: 'PUT',
      body: JSON.stringify({ menuItemId, quantity: currentQty + 1 })
    });
    updateCacheFromCart(result.data.cart);
    return result;
  }

  async function decreaseQty(menuItemId) {
    const currentQty = getItemQty(menuItemId);
    if (currentQty <= 1) {
      return removeItem(menuItemId);
    }
    const result = await apiRequest('/update', {
      method: 'PUT',
      body: JSON.stringify({ menuItemId, quantity: currentQty - 1 })
    });
    updateCacheFromCart(result.data.cart);
    return result;
  }

  async function removeItem(menuItemId) {
    const result = await apiRequest(`/remove/${menuItemId}`, { method: 'DELETE' });
    updateCacheFromCart(result.data ? result.data.cart : null);
    return result;
  }

  async function clearCart() {
    const result = await apiRequest('/clear', { method: 'DELETE' });
    updateCacheFromCart(null);
    return result;
  }

  async function getCart() {
    return refreshCart();
  }

  // ---- synchronous reads from the in-memory cache ------------------
  function getItems() {
    return cartCache.items || [];
  }

  function getItemQty(menuItemId) {
    const found = getItems().find(i => extractId(i.menuItem) === String(menuItemId));
    return found ? found.quantity : 0;
  }

  function getCount() {
    return getItems().reduce((sum, i) => sum + i.quantity, 0);
  }

  function getSubtotal() {
    // Prefer the server-calculated total so it always matches checkout math.
    if (cartCache.pricing && typeof cartCache.pricing.itemTotal === 'number') {
      return cartCache.pricing.itemTotal;
    }
    return getItems().reduce((sum, i) => sum + i.quantity * (i.price || 0), 0);
  }

  function getRestaurant() {
    return cartCache.restaurant || null;
  }

  // ---- order snapshot (used by checkout -> confirmation -> tracking) ----
  // This is NOT the cart itself, just a local receipt of the last placed
  // order so the confirmation/tracking pages can render without a refetch.
  function saveOrderSnapshot(order) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  }

  function getOrderSnapshot() {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearOrderSnapshot() {
    localStorage.removeItem(ORDER_KEY);
  }

  // ---- active order id (used by checkout -> confirmation -> tracking) ----
  // This is the REAL MongoDB Order._id returned by POST /api/orders — the
  // Track Order page uses this (not local mock data) to fetch live status
  // and join the correct Socket.IO room.
  const ACTIVE_ORDER_KEY = 'foodie_active_order_id_v1';

  function setActiveOrderId(orderId) {
    if (orderId) localStorage.setItem(ACTIVE_ORDER_KEY, String(orderId));
  }

  function getActiveOrderId() {
    return localStorage.getItem(ACTIVE_ORDER_KEY);
  }

  return {
    isLoggedIn,
    refreshCart,
    addItem, increaseQty, decreaseQty, removeItem, clearCart, getCart,
    getItems, getItemQty, getCount, getSubtotal, getRestaurant,
    getMenuItemId: extractId,
    slugify,
    saveOrderSnapshot, getOrderSnapshot, clearOrderSnapshot,
    setActiveOrderId, getActiveOrderId
  };
})();