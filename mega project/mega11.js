// ============================================================
// FOODIE — CATEGORIES PAGE (mega11.js)
// Production-quality JS matching mega1.js architecture
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    // ============================================================
    // 0. REAL CATEGORY COUNTS — replace the hardcoded data-count
    //    values (128, 96, 156...) with actual counts from the
    //    backend, using the same category→cuisine mapping this
    //    page already uses for routing to mega4.html. Must run
    //    before the count-up observer below is set up, so the
    //    animation counts up to a real number.
    // ============================================================
    const API_BASE_CATS = "http://localhost:5000/api";

    const CATEGORY_TO_CUISINE_COUNTS = {
        pizza: "Pizza",
        burger: "Burger",
        indian: "North Indian",
        chinese: "Chinese",
        desserts: "Desserts",
        beverages: "Drinks",
        healthy: "Healthy",
        street: "Street Food",
        pasta: "Italian",
        sandwich: "Continental",
        coffee: "Drinks"
    };

    async function loadRealCategoryCounts() {
        try {
            const res = await fetch(`${API_BASE_CATS}/restaurants?limit=100`);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return;

            const list = Array.isArray(json.data) ? json.data
                : Array.isArray(json.data?.restaurants) ? json.data.restaurants
                : [];

            if (!list.length) return; // backend unreachable or empty — keep placeholder numbers rather than show 0 everywhere

            document.querySelectorAll(".category-card").forEach(card => {
                const category = card.dataset.category || "";
                const cuisine = CATEGORY_TO_CUISINE_COUNTS[category] || category;

                const count = list.filter(r =>
                    Array.isArray(r.cuisines) &&
                    r.cuisines.some(c => c.toLowerCase() === cuisine.toLowerCase())
                ).length;

                const countEl = card.querySelector(".rest-count[data-count]");
                if (countEl) {
                    countEl.dataset.count = String(count);
                    countEl.textContent = `${count} Restaurant${count === 1 ? "" : "s"}`;
                }
                card.dataset.count = String(count);
                card.setAttribute("aria-label", `${card.querySelector("h3")?.textContent || category} – ${count} Restaurants`);
            });
        } catch (err) {
            console.error("Failed to load real category counts:", err);
            // Keep the existing placeholder numbers rather than break the page
        }
    }

    await loadRealCategoryCounts();

    // ============================================================
    // 1. SCROLL REVEAL (Intersection Observer — matches mega1.js)
    // ============================================================

    const revealTargets = document.querySelectorAll(
        ".category-card, .feature-box, .delivery-banner, .footer-col, .cat-hero-inner, .promo-inner, .stat-chip"
    );

    revealTargets.forEach(el => el.classList.add("hidden"));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add("show");
                }, i * 60);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.10 });

    revealTargets.forEach(el => revealObserver.observe(el));



    // ============================================================
    // 2. NAVBAR SCROLL EFFECT
    // ============================================================

    const navbar = document.querySelector(".navbar");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }, { passive: true });



    // ============================================================
    // 3. HAMBURGER MENU
    // ============================================================

    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.getElementById("navLinks");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            const open = navLinks.classList.toggle("open");
            hamburger.classList.toggle("open", open);
            hamburger.setAttribute("aria-expanded", open.toString());
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
    // 4. BUTTON RIPPLE EFFECT
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
    // 5. FILTER PILLS
    // ============================================================

    const pills       = document.querySelectorAll(".pill");
    const cards       = document.querySelectorAll(".category-card");
    const emptyState  = document.getElementById("emptyState");
    const resultCount = document.getElementById("resultCount");
    const catSearch   = document.getElementById("catSearch");

    let activeFilter = "all";
    let searchQuery  = "";

    function applyFilters() {
        let visible = 0;

        cards.forEach(card => {
            const category = card.dataset.category || "";
            const name     = (card.dataset.name || "").toLowerCase();
            const heading  = (card.querySelector("h3")?.textContent || "").toLowerCase();

            const matchesFilter = activeFilter === "all" || category === activeFilter;
            const matchesSearch = searchQuery === "" ||
                name.includes(searchQuery) ||
                heading.includes(searchQuery);

            if (matchesFilter && matchesSearch) {
                card.classList.remove("hidden-filter");
                card.classList.add("fade-in");
                // Remove fade-in class after animation so it can retrigger
                card.addEventListener("animationend", () => {
                    card.classList.remove("fade-in");
                }, { once: true });
                visible++;
            } else {
                card.classList.add("hidden-filter");
                card.classList.remove("fade-in");
            }
        });

        // Update result count
        if (resultCount) {
            resultCount.textContent =
                visible === 0
                    ? "No categories found"
                    : `Showing ${visible} ${visible === 1 ? "category" : "categories"}`;
        }

        // Show / hide empty state
        if (emptyState) {
            emptyState.hidden = visible > 0;
        }
    }

    // Pill click
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            pills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            activeFilter = pill.dataset.filter || "all";
            applyFilters();
        });
    });

    // Reset button (inside empty state)
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            activeFilter = "all";
            searchQuery  = "";
            if (catSearch) catSearch.value = "";
            showClearButton(false);

            pills.forEach(p => p.classList.remove("active"));
            const allPill = document.querySelector('.pill[data-filter="all"]');
            if (allPill) allPill.classList.add("active");

            applyFilters();
        });
    }



    // ============================================================
    // 6. SEARCH FUNCTIONALITY
    // ============================================================

    const clearBtn = document.getElementById("clearSearch");

    function showClearButton(show) {
        if (clearBtn) clearBtn.hidden = !show;
    }

    let searchDebounce;

    if (catSearch) {
        catSearch.addEventListener("input", () => {
            searchQuery = catSearch.value.trim().toLowerCase();
            showClearButton(searchQuery.length > 0);

            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(applyFilters, 220);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (catSearch) catSearch.value = "";
            searchQuery = "";
            showClearButton(false);
            applyFilters();
            catSearch?.focus();
        });
    }



    // ============================================================
    // 7. COUNT-UP ANIMATION
    // ============================================================

    const countEls = document.querySelectorAll(".rest-count[data-count]");

    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el       = entry.target;
            const target   = parseInt(el.dataset.count, 10);
            if (isNaN(target)) return;

            let current = 0;
            const step  = Math.max(1, Math.floor(target / 40));

            const tick = () => {
                current += step;
                if (current >= target) {
                    el.textContent = target + " Restaurants";
                    return;
                }
                el.textContent = current + " Restaurants";
                requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
            countObserver.unobserve(el);
        });
    }, { threshold: 0.5 });

    countEls.forEach(el => countObserver.observe(el));



    // ============================================================
    // 8. CATEGORY CARD — KEYBOARD NAVIGATION & CLICK
    // ============================================================

    // mega4.html reads a `cuisine` URL param (not `category`), matched
    // against the real Restaurant.cuisines enum values from the backend.
    // This page's category keys are marketing labels, so map them across.
    const CATEGORY_TO_CUISINE = {
        pizza: "Pizza",
        burger: "Burger",
        indian: "North Indian",
        chinese: "Chinese",
        desserts: "Desserts",
        beverages: "Drinks",
        healthy: "Healthy",
        street: "Street Food",
        pasta: "Italian",
        sandwich: "Continental",
        coffee: "Drinks"
    };

    function categoryToUrl(category) {
        const cuisine = CATEGORY_TO_CUISINE[category] || category;
        return `mega4.html?cuisine=${encodeURIComponent(cuisine)}`;
    }

    cards.forEach(card => {
        // Keyboard: Enter or Space triggers navigation
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.click();
            }
        });

        // Click: navigate to restaurants page (preserves routing)
        card.addEventListener("click", (e) => {
            // Don't double-fire if the arrow button was clicked
            if (e.target.closest(".card-arrow")) return;
            window.location.href = categoryToUrl(card.dataset.category || "");
        });

        // Arrow button also navigates
        const arrow = card.querySelector(".card-arrow");
        if (arrow) {
            arrow.addEventListener("click", (e) => {
                e.stopPropagation();
                window.location.href = categoryToUrl(card.dataset.category || "");
            });
        }
    });



    // ============================================================
    // 9. CARD 3D TILT ON HOVER
    // ============================================================

    cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect    = card.getBoundingClientRect();
            const x       = e.clientX - rect.left;
            const y       = e.clientY - rect.top;
            const rotateY = (x - rect.width  / 2) / 18;
            const rotateX = -(y - rect.height / 2) / 18;
            card.style.transform =
                `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });



    // ============================================================
    // 10. SORT DROPDOWN
    // ============================================================

    const sortSelect = document.getElementById("sortSelect");

    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            const value        = sortSelect.value;
            const grid         = document.getElementById("categoryGrid");
            const allCards     = [...grid.querySelectorAll(".category-card")];

            const sorted = allCards.sort((a, b) => {
                if (value === "most") {
                    return parseInt(b.dataset.count || 0) - parseInt(a.dataset.count || 0);
                }
                if (value === "rated") {
                    return parseFloat(b.dataset.rating || 0) - parseFloat(a.dataset.rating || 0);
                }
                // Default: popular (DOM order preserved by returning 0)
                return 0;
            });

            sorted.forEach(card => grid.appendChild(card));
            showToast("Sorted successfully ✓");
        });
    }



    // ============================================================
    // 11. PROMO BANNER CTA
    // ============================================================

    const ctaBtn = document.querySelector(".cta-btn");
    if (ctaBtn) {
        ctaBtn.addEventListener("click", () => {
            window.location.href = categoryToUrl("indian");
        });
    }



    // ============================================================
    // 12. ORDER NOW BANNER BUTTON
    // ============================================================

    const bannerBtn = document.querySelector(".banner-left button");
    if (bannerBtn) {
        bannerBtn.addEventListener("click", () => {
            bannerBtn.innerHTML = "🍔 Order Confirmed!";
            bannerBtn.style.background = "#22c55e";
            setTimeout(() => {
                bannerBtn.innerHTML = "Order Now";
                bannerBtn.style.background = "";
            }, 2800);
        });
    }



    // ============================================================
    // 13. TOAST HELPER
    // ============================================================

    function showToast(message, duration = 2500) {
        const toast = document.getElementById("statusToast");
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("visible");

        setTimeout(() => {
            toast.classList.remove("visible");
        }, duration);
    }



    // ============================================================
    // 14. LOGIN BUTTON — NAVIGATE TO mega2.html
    // ============================================================

const API_BASE = "http://localhost:5000/api";
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



    // ============================================================
    // 15. CAT-HERO VIDEO — PARALLAX + FALLBACK
    // ============================================================

    const catHero      = document.querySelector(".cat-hero");
    const catHeroVideo = document.getElementById("catHeroVideo");

    if (catHeroVideo && catHero) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Fallback to the original gradient hero if the video file is missing/broken
        catHeroVideo.addEventListener("error", () => {
            catHero.classList.add("video-fallback");
        });

        // Scroll-based parallax (skipped for reduced-motion users)
        if (!reduceMotion) {
            window.addEventListener("scroll", () => {
                const rect = catHero.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > window.innerHeight) return;
                const offset = rect.top * 0.15;
                catHeroVideo.style.transform =
                    `translate(-50%, calc(-50% + ${offset}px)) scale(1.06)`;
            }, { passive: true });
        } else {
            catHeroVideo.pause();
        }
    }



    // ============================================================
    // 16. INIT: apply filters on load (all visible by default)
    // ============================================================

    applyFilters();

}); // end DOMContentLoaded



// ============================================================
// THEME TOGGLE (outside DOMContentLoaded — same pattern as mega1.js)
// ============================================================

const themeBtn = document.getElementById("themeToggle");

if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {
            themeBtn.innerHTML = '<i class="ri-sun-line"></i>';
            localStorage.setItem("theme", "dark");
        } else {
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem("theme", "light");
        }
    });
}

// Restore saved theme on load
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    if (themeBtn) themeBtn.innerHTML = '<i class="ri-sun-line"></i>';
}



// ============================================================
// FOOD RAIN (on window load — matches mega1.js exactly)
// ============================================================

window.addEventListener("load", () => {
    const foods = ["🍕", "🍔", "🍟", "🌭", "🥤", "🍗", "🌮", "🍩", "🍛", "🍦"];

    const rainContainer = document.createElement("div");
    rainContainer.classList.add("food-rain");
    rainContainer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden;";
    document.body.appendChild(rainContainer);

    for (let i = 0; i < 40; i++) {
        const food = document.createElement("span");
        food.classList.add("food-item");
        food.innerText             = foods[Math.floor(Math.random() * foods.length)];
        food.style.left            = Math.random() * 100 + "vw";
        food.style.animationDuration = (1.5 + Math.random() * 2) + "s";
        food.style.fontSize        = (22 + Math.random() * 22) + "px";
        food.style.animationDelay  = Math.random() * 0.6 + "s";
        rainContainer.appendChild(food);
    }

    setTimeout(() => rainContainer.remove(), 3200);
});



// ============================================================
// PAGE NAVIGATION — Nav links (same routing map as mega1.js)
// ============================================================

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const text = link.textContent.trim();
        const map = {
            "Home":        "mega1.html",
            "Restaurants": "mega4.html",
            "Categories":  "mega11.html",
            "Offers":      "mega9.html",
            "Track Order": "mega8.html",
            "My Orders":   "myorders.html",
              "Contact":     "mega10.html"
        };
        if (map[text]) window.location.href = map[text];
    });
});