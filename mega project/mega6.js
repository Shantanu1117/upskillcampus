// ============================================================
// FOODIE — CHECKOUT PAGE JS (mega6.js)
// Renders the real cart, computes real totals, and hands a
// snapshot of the placed order to the confirmation/tracking pages.
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
// 5. BACK BUTTON → Cart
// ============================================================
const backBtn = document.getElementById('backBtn');
if (backBtn) {
  backBtn.addEventListener('click', () => { window.location.href = 'mega5.html'; });
}

// ============================================================
// 6. LOAD REAL CART → RENDER ORDER SUMMARY
// ============================================================
const API_BASE = 'http://localhost:5000/api';
const DELIVERY_FEE  = 40;
const PACKAGING_FEE = 20;

let cartItems  = [];
let subtotal   = 0;
let currentTip = 10;

const grandTotal = document.getElementById('grandTotal');
const tipDisplay = document.getElementById('tipDisplay');

function buildOrderItemHTML(item) {
  return `
    <div class="order-item">
      <img src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="order-item-info">
        <h4>${item.name}</h4>
        <span class="qty-pill">× ${item.quantity}</span>
      </div>
      <span class="order-item-price">₹${item.price * item.quantity}</span>
    </div>`;
}

function updateTotal() {
  const total = subtotal + DELIVERY_FEE + PACKAGING_FEE + currentTip;
  if (grandTotal) grandTotal.textContent = '₹' + total;
  if (tipDisplay) tipDisplay.textContent = currentTip === 0 ? '₹0' : '₹' + currentTip;
}

async function loadCartAndRender() {
  if (!CartStorage.isLoggedIn()) {
    showToast('Please login to checkout');
    setTimeout(() => { window.location.href = 'mega2.html'; }, 900);
    return;
  }

  await CartStorage.refreshCart();
  cartItems = CartStorage.getItems();

  if (!cartItems.length) {
    // Nothing to check out — send the user back to browse restaurants.
    window.location.href = 'mega4.html';
    return;
  }

  subtotal = CartStorage.getSubtotal();

  const listEl = document.getElementById('orderItemsList');
  if (listEl) listEl.innerHTML = cartItems.map(buildOrderItemHTML).join('');

  const itemTotalEl = document.getElementById('checkoutItemTotal');
  if (itemTotalEl) itemTotalEl.textContent = '₹' + subtotal;

  const deliveryEl = document.getElementById('checkoutDelivery');
  if (deliveryEl) deliveryEl.textContent = '₹' + DELIVERY_FEE;

  const packagingEl = document.getElementById('checkoutPackaging');
  if (packagingEl) packagingEl.textContent = '₹' + PACKAGING_FEE;

  updateTotal();
}

loadCartAndRender();

// ============================================================
// 7. PLACE ORDER → mega7.html (validates, snapshots order, clears cart)
// ============================================================
const placeOrderBtn = document.getElementById('placeOrderBtn');

function validateForm() {
  const name    = document.getElementById('fullName');
  const phone   = document.getElementById('phone');
  const address = document.getElementById('address');
  const city    = document.getElementById('city');
  const pincode = document.getElementById('pincode');

  const fields = [name, phone, address, city, pincode];
  let valid = true;

  fields.forEach(field => {
    if (!field) return;
    if (!field.value.trim()) {
      field.closest('.input-wrap').style.borderColor = '#e53e3e';
      field.style.borderColor = '#e53e3e';
      valid = false;
    } else {
      field.style.borderColor = '';
    }
  });

  return valid;
}

let placedOrder = null; // set once the Order document actually exists server-side

function proceedToConfirmation(order) {
  CartStorage.setActiveOrderId(order._id);
  CartStorage.saveOrderSnapshot({
    _id: order._id,
    orderId: order.orderId,
    status: order.status,
    items: order.items,
    pricing: order.pricing,
    paymentMethod: order.paymentMethod,
    deliveryAddress: order.deliveryAddress,
    restaurant: order.restaurant,
    createdAt: order.createdAt
  });

  placeOrderBtn.innerHTML = '<i class="ri-check-double-line"></i> Order Placed!';
  placeOrderBtn.style.background = '#16A34A';

  setTimeout(() => {
    window.location.href = 'mega7.html';
  }, 700);
}

// Real Razorpay checkout — used for UPI/CARD/WALLET. COD skips this
// entirely (the backend itself rejects payment-order creation for COD).
function launchRazorpay(order) {
  return new Promise(async (resolve, reject) => {
    if (typeof Razorpay === 'undefined') {
      reject(new Error('Payment gateway failed to load. Check your connection and try again.'));
      return;
    }

    let payData;
    try {
      const res = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ orderId: order._id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not start payment');
      payData = data.data;
    } catch (err) {
      reject(err);
      return;
    }

    try {
      const rzp = new Razorpay({
        key: payData.keyId,
        amount: payData.amount,
        currency: payData.currency,
        order_id: payData.razorpayOrderId,
        name: 'Foodie',
        description: `Order #${order.orderId}`,
        prefill: {
          name: order.deliveryAddress?.name || '',
          contact: order.deliveryAddress?.phone || ''
        },
        theme: { color: '#ff8a00' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) resolve();
            else reject(new Error(verifyData.message || 'Payment verification failed'));
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment was not completed'))
        }
      });

      rzp.on('payment.failed', (resp) => {
        reject(new Error(resp.error?.description || 'Payment failed'));
      });

      rzp.open();
    } catch (sdkErr) {
      // The Razorpay checkout.js SDK itself can throw cryptic internal
      // errors (seen in practice) — log the real one, show a clean one.
      console.error('Razorpay SDK error:', sdkErr);
      reject(new Error('Payment gateway failed to open. Please try again or use Cash on Delivery.'));
    }
  });
}

if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', async () => {
    if (!cartItems.length) {
      showToast('Your cart is empty', 'error');
      return;
    }

    // Order already exists (an earlier payment attempt was cancelled/failed) —
    // retry payment for that SAME order instead of creating a duplicate one.
    if (placedOrder) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML = '<i class="ri-loader-4-line"></i> Opening payment…';
      try {
        await launchRazorpay(placedOrder);
        proceedToConfirmation(placedOrder);
      } catch (err) {
        showToast(err.message || 'Payment not completed — you can retry', 'error');
        placeOrderBtn.innerHTML = 'Retry Payment';
        placeOrderBtn.disabled = false;
      }
      return;
    }

    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const name    = document.getElementById('fullName').value.trim();
    const phone   = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const city    = document.getElementById('city').value.trim();
    const state   = document.getElementById('state').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    const paymentEl = document.querySelector('input[name="payment"]:checked');
    if (!paymentEl) {
      showToast('Please select a payment method', 'error');
      return;
    }
    const paymentMethod = paymentEl.value.toUpperCase();

    const originalText = placeOrderBtn.innerHTML;
    placeOrderBtn.innerHTML = '<i class="ri-loader-4-line"></i> Placing Order…';
    placeOrderBtn.disabled  = true;

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deliveryAddress: { name, phone, street: address, city, state, pincode },
          paymentMethod,
          tip: currentTip
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not place your order');
      }

      const order = data.data.order;
      placedOrder = order;

      // The backend already cleared the server-side cart; sync the local cache.
      await CartStorage.refreshCart();

      if (paymentMethod === 'COD') {
        proceedToConfirmation(order);
        return;
      }

      placeOrderBtn.innerHTML = '<i class="ri-loader-4-line"></i> Opening payment…';
      try {
        await launchRazorpay(order);
        proceedToConfirmation(order);
      } catch (payErr) {
        showToast(payErr.message || 'Payment not completed — you can retry', 'error');
        placeOrderBtn.innerHTML = 'Retry Payment';
        placeOrderBtn.disabled = false;
      }

    } catch (error) {
      console.error('Place order error:', error);
      showToast(error.message || "Can't reach the server. Is the backend running?", 'error');
      placeOrderBtn.innerHTML = originalText;
      placeOrderBtn.disabled = false;
    }
  });
}

// ============================================================
// 8. PAYMENT OPTION SELECTION
// ============================================================
document.querySelectorAll('.payment-option').forEach(option => {
  const radio = option.querySelector('input[type="radio"]');

  option.addEventListener('click', () => {
    if (!radio || radio.disabled) return;
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
    radio.checked = true;
  });

  if (radio && radio.checked) option.classList.add('selected');
});

// ============================================================
// 9. TIP SELECTION
// ============================================================
const tipBtns = document.querySelectorAll('.tip-btn');

tipBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tipBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTip = parseInt(btn.dataset.amount, 10) || 0;
    updateTotal();
    showToast(currentTip > 0 ? `₹${currentTip} tip added 🙏` : 'Tip removed');
  });
});

// ============================================================
// 10. INPUT FOCUS ENHANCEMENT
// ============================================================
document.querySelectorAll('.input-wrap input').forEach(input => {
  input.addEventListener('focus', () => {
    const wrap = input.closest('.input-wrap');
    if (wrap) { wrap.style.borderColor = ''; }
    input.style.borderColor = '';
  });
});

// ============================================================
// 11. TYPING EFFECT FOR HEADING
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  const heading = document.querySelector('.checkout-heading h1');
  if (!heading) return;
  const text = heading.textContent.trim();
  heading.textContent = '';
  let i = 0;
  const type = () => {
    if (i < text.length) {
      heading.textContent += text.charAt(i++);
      setTimeout(type, 60);
    }
  };
  setTimeout(type, 400);
});

// ============================================================
// 12. RIPPLE EFFECT
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
// 14. TOAST
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