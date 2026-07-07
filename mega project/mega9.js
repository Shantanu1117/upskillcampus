// ============================================================
// FOODIE — OFFERS PAGE (mega9.js)
// Premium Dark Luxury Edition — Professional Pass
// ============================================================

// ============================================================
// 1. PAGE ENTRANCE ANIMATION
// ============================================================
window.addEventListener("load", () => {
  document.body.style.opacity = "0";
  document.body.style.transform = "scale(0.98)";

  requestAnimationFrame(() => {
    document.body.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    document.body.style.opacity = "1";
    document.body.style.transform = "scale(1)";
  });
});

// ============================================================
// 2. THEME TOGGLE (persistent via localStorage)
// Dark is the default look (body carries no extra class).
// Light mode is applied via the `.light-mode` class.
// ============================================================
const themeBtn = document.getElementById("themeToggle");
const themeIcon = themeBtn ? themeBtn.querySelector("i") : null;

function applyTheme(isLight) {
  if (isLight) {
    document.body.classList.add("light-mode");
    document.body.classList.remove("dark");
    if (themeIcon) {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
    }
  } else {
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark");
    if (themeIcon) {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
    }
  }
}

// Restore saved theme (defaults to premium dark experience)
const savedTheme = localStorage.getItem("theme");
applyTheme(savedTheme === "light");

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-mode");
    applyTheme(!isLight);
    localStorage.setItem("theme", isLight ? "dark" : "light");
  });
}

// ============================================================
// 3. NAVBAR SCROLL EFFECT
// ============================================================
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  if (navbar) {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  }
}, { passive: true });

// ============================================================
// 4. HAMBURGER MOBILE MENU
// ============================================================
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

// ============================================================
// 5. NAV LINK ROUTING
// Routes are already set as real hrefs in the markup so the
// page works even before JS loads; this just keeps navigation
// consistent with the rest of the site's single-page-ish feel.
// ============================================================
const ROUTES = {
  "Home":        "mega1.html",
  "Restaurants": "mega4.html",
  "Categories":  "mega11.html",
  "Offers":      "mega9.html",
  "Track Order": "mega8.html",
  "Contact":     "mega10.html",
  "Cart":        "mega5.html"
};

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", (e) => {
    const text = link.textContent.trim();
    const dest = ROUTES[text];
    if (dest) {
      e.preventDefault();
      window.location.href = dest;
    }
    // otherwise let the anchor's own href (footer links, etc.) handle it
  });
});

// ============================================================
// 6. LOGIN + CART ROUTING
// ============================================================
const loginBtn = document.querySelector(".login-btn");

function refreshAuthNav() {
  if (!loginBtn) return;
  const token = localStorage.getItem("token");
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch (e) {}

  if (token && user) {
    loginBtn.textContent = `Hi, ${(user.name || "").split(" ")[0] || "there"}`;
    loginBtn.dataset.mode = "logout";
  } else {
    loginBtn.textContent = "Login";
    loginBtn.dataset.mode = "login";
  }
}

async function handleAuthNavClick() {
  if (loginBtn.dataset.mode === "logout") {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    refreshAuthNav();
  } else {
    window.location.href = "mega2.html";
  }
}

if (loginBtn) loginBtn.addEventListener("click", handleAuthNavClick);
refreshAuthNav();

const cartBtn   = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");

function refreshCartCount() {
  if (!cartCount) return;
  try {
    const raw = localStorage.getItem("foodie_cart");
    const items = raw ? JSON.parse(raw) : [];
    const count = Array.isArray(items)
      ? items.reduce((sum, it) => sum + (it.qty || 1), 0)
      : 0;
    cartCount.textContent = String(count);
    cartCount.style.display = count > 0 ? "flex" : "none";
  } catch {
    cartCount.style.display = "none";
  }
}

refreshCartCount();

if (cartBtn) {
  cartBtn.addEventListener("click", () => {
    window.location.href = "mega5.html";
  });
}

// ============================================================
// 7. SCROLL REVEAL — Intersection Observer
// ============================================================
const revealEls = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add("active");
      }, i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

// ============================================================
// 8. FILTER TABS — category switching
// ============================================================
const tabs = document.querySelectorAll(".offer-tab");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => {
      t.classList.remove("active-tab");
      t.setAttribute("aria-pressed", "false");
    });
    tab.classList.add("active-tab");
    tab.setAttribute("aria-pressed", "true");

    const filter = tab.dataset.filter || "all";
    filterOffers(filter);
  });
});

function filterOffers(filter) {
  const allCards = document.querySelectorAll(
    ".offer-card, .wallet-card, .combo-card"
  );

  allCards.forEach(card => {
    const categories = (card.dataset.category || "").split(" ");
    const match = filter === "all" || categories.includes(filter);

    card.style.transition = "opacity 0.25s ease, transform 0.25s ease";

    if (match) {
      card.style.opacity = "";
      card.style.transform = "";
      card.style.display  = "";
    } else {
      card.style.opacity   = "0.25";
      card.style.transform = "scale(0.97)";
    }
  });
}

// ============================================================
// 9. OFFER SEARCH — live filter across all offer cards
// ============================================================
const offersSearchInput = document.getElementById("offersSearch");

function searchOffers(query) {
  const q = query.toLowerCase().trim();
  const allCards = document.querySelectorAll(".offer-card");

  allCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const match = !q || text.includes(q);
    card.style.display = match ? "" : "none";
  });
}

if (offersSearchInput) {
  offersSearchInput.addEventListener("input", debounce((e) => {
    searchOffers(e.target.value);
  }, 250));
}

// ============================================================
// 10. COPY COUPON CODE — copy to clipboard
// ============================================================
document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const code = btn.dataset.code;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      showToast(`Copied: ${code} 📋`);

      const icon = btn.querySelector("i");
      if (icon) {
        icon.className = "ri-check-line";
        setTimeout(() => { icon.className = "ri-file-copy-line"; }, 1500);
      }
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      el.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
      showToast(`Copied: ${code} 📋`);
    }
  });
});

// ============================================================
// 11. WISH / SAVE BUTTON TOGGLE
// ============================================================
document.querySelectorAll(".wish-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const pressed = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", String(!pressed));
    btn.textContent = pressed ? "♡" : "♥";
    showToast(pressed ? "Removed from saved offers" : "Saved offer ❤️");
  });
});

// ============================================================
// 12. COLLECT OFFER BUTTONS
// ============================================================
document.querySelectorAll(".collect-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const offer = btn.dataset.offer || "Offer";
    const originalText = btn.textContent;

    btn.textContent = "✓ Collected!";
    btn.style.background = "var(--col-green)";
    btn.disabled = true;

    showToast(`${offer} collected! 🎉`);

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
      btn.disabled = false;
    }, 2500);
  });
});

// ============================================================
// 13. ADD COMBO TO CART — persists to the shared cart storage
// key used across the site, then hands off to the Cart page.
// ============================================================
document.querySelectorAll(".add-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const card = btn.closest(".combo-card");
    const name = btn.dataset.item || card?.querySelector("h4")?.textContent || "Item";

    try {
      const raw = localStorage.getItem("foodie_cart");
      const items = raw ? JSON.parse(raw) : [];
      const existing = items.find(it => it.name === name);
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        items.push({ name, qty: 1 });
      }
      localStorage.setItem("foodie_cart", JSON.stringify(items));
      refreshCartCount();
    } catch {
      /* storage unavailable — still show feedback below */
    }

    showToast(`${name} added to cart 🛒`);

    btn.style.transform = "scale(1.3)";
    setTimeout(() => { btn.style.transform = ""; }, 220);
  });
});

// ============================================================
// 14. APPLY COUPON — hero coupon bar (real backend validation)
// ============================================================
const API_BASE = "http://localhost:5000/api";
const couponInput  = document.getElementById("couponInput");
const applyCouponBtn = document.getElementById("applyCouponBtn");

async function applyCoupon() {
  if (!couponInput) return;
  const code = couponInput.value.trim().toUpperCase();

  if (!code) {
    showToast("Please enter a promo code", "error");
    couponInput.focus();
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    showToast("Please login to apply a coupon", "error");
    setTimeout(() => { window.location.href = "mega2.html"; }, 900);
    return;
  }

  const originalText = applyCouponBtn ? applyCouponBtn.textContent : "";
  if (applyCouponBtn) { applyCouponBtn.disabled = true; applyCouponBtn.textContent = "Checking…"; }

  try {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`${data.data.coupon.description || code + " applied!"} 🎉`);
      couponInput.value = "";
      couponInput.style.borderColor = "var(--col-green)";
      setTimeout(() => { couponInput.style.borderColor = ""; }, 2000);
    } else {
      showToast(data.message || "Invalid or expired code", "error");
      couponInput.select();
    }
  } catch (error) {
    console.error("Coupon validation error:", error);
    showToast("Can't reach the server. Is the backend running?", "error");
  } finally {
    if (applyCouponBtn) { applyCouponBtn.disabled = false; applyCouponBtn.textContent = originalText; }
  }
}

if (applyCouponBtn) applyCouponBtn.addEventListener("click", applyCoupon);
if (couponInput) {
  couponInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyCoupon();
    requestAnimationFrame(() => {
      couponInput.value = couponInput.value.toUpperCase();
    });
  });
}

// ============================================================
// 15. SUBSCRIBE BUTTON
// ============================================================
const subscribeBtn = document.getElementById("subscribeBtn");
const emailInput   = document.getElementById("emailInput");

if (subscribeBtn && emailInput) {
  subscribeBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      showToast("Please enter your email address", "error");
      emailInput.focus();
      return;
    }

    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address", "error");
      emailInput.focus();
      return;
    }

    showToast(`Subscribed! Check ${email} for offers 🎉`);
    emailInput.value = "";
  });

  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") subscribeBtn.click();
  });
}

// ============================================================
// 16. COUNTDOWN TIMER — Flash Sale
// ============================================================
function startCountdown() {
  const now   = new Date();
  const end   = new Date(now);
  end.setHours(23, 59, 59, 0);

  const hoursEl = document.getElementById("cdHours");
  const minsEl  = document.getElementById("cdMins");
  const secsEl  = document.getElementById("cdSecs");

  if (!hoursEl || !minsEl || !secsEl) return;

  function update() {
    const diff = end - new Date();
    if (diff <= 0) {
      hoursEl.textContent = "00";
      minsEl.textContent  = "00";
      secsEl.textContent  = "00";
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    hoursEl.textContent = String(h).padStart(2, "0");
    minsEl.textContent  = String(m).padStart(2, "0");
    secsEl.textContent  = String(s).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

startCountdown();

// ============================================================
// 17. BUTTON RIPPLE EFFECT
// ============================================================
document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    const rect = this.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left - 40) + "px";
    ripple.style.top  = (e.clientY - rect.top  - 40) + "px";
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// ============================================================
// 18. TOAST NOTIFICATION
// ============================================================
const toast = document.getElementById("statusToast");
let toastTimer = null;

function showToast(msg, type) {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.borderLeftColor = type === "error" ? "#e53e3e" : "var(--brand)";
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

// ============================================================
// 19. DEBOUNCE UTILITY
// ============================================================
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================
// 20. HERO / VIDEO-BREAK VIDEO ENHANCEMENT
// Gracefully falls back to a static image if a video source
// is missing, unsupported, or fails to play (e.g. placeholder
// paths like videos/offers-hero.mp4 not yet uploaded).
// ============================================================
function enhanceVideo(video) {
  if (!video) return;
  const fallback = video.parentElement.querySelector("img.hero-fallback, img.vb-fallback");

  const showFallback = () => {
    video.style.display = "none";
    if (fallback) fallback.style.display = "block";
  };

  video.addEventListener("error", showFallback, { once: true });

  const stalledTimer = setTimeout(() => {
    if (video.readyState === 0) showFallback();
  }, 4000);

  video.addEventListener("loadeddata", () => clearTimeout(stalledTimer), { once: true });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    video.pause();
  }

  // Pause offscreen videos to save resources, resume when visible
  const vidObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.1 });

  vidObserver.observe(video);
}

document.querySelectorAll(".hero-media video, .video-break video").forEach(enhanceVideo);

// ============================================================
// 21. HERO PARALLAX — subtle depth on scroll + pointer move
// GPU-accelerated, rAF-throttled, passive listeners only.
// ============================================================
(function heroParallax() {
  const heroMedia = document.getElementById("heroMedia");
  const hcMain     = document.getElementById("hcMain");
  const hero       = document.querySelector(".offers-hero");
  if (!hero) return;

  let scrollY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let ticking  = false;

  function render() {
    if (heroMedia) {
      const depth = Math.min(scrollY * 0.2, 100);
      heroMedia.style.transform = `translate3d(0, ${depth}px, 0)`;
    }
    if (hcMain) {
      const rotateY = pointerX * 5;
      const rotateX = pointerY * -5;
      hcMain.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(render);
      ticking = true;
    }
  }

  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
    requestTick();
  }, { passive: true });

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    requestTick();
  }, { passive: true });

  hero.addEventListener("mouseleave", () => {
    pointerX = 0;
    pointerY = 0;
    requestTick();
  }, { passive: true });
})();

// ============================================================
// 22. STAGGERED CARD REVEAL GROUPS
// Adds a slight extra stagger within each grid so cards in the
// same row/section cascade in rather than firing all at once.
// ============================================================
(function staggerGroups() {
  const groups = [
    document.querySelectorAll("#offersGrid .offer-card"),
    document.querySelectorAll(".bank-grid .wallet-card"),
    document.querySelectorAll(".combo-grid .combo-card")
  ];

  groups.forEach(group => {
    group.forEach((el, i) => {
      el.style.transitionDelay = `${i * 60}ms`;
    });
  });
})();

// ============================================================
// 23. CARD CLICK → RESTAURANTS PAGE
// Clicking a food/offer/combo item takes the user to browse
// that item on the Restaurants page (mega4.html). Clicks on
// interactive controls inside the card (buttons, links, inputs)
// are excluded so copy/wish/collect/add still work normally.
// The Cart itself lives at mega5.html — reached via the cart
// icon in the navbar or after adding a combo to cart.
// ============================================================
document.querySelectorAll(".offer-card, .combo-card, .hc-main, .hc-mini").forEach(card => {
  card.style.cursor = "pointer";

  card.addEventListener("click", (e) => {
    if (e.target.closest("button, a, input")) return;
    window.location.href = "mega4.html";
  });
});