// ============================================================
// FOODIE APP — PREMIUM PRODUCTION JS
// ============================================================

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // 1. SCROLL REVEAL ANIMATION (Intersection Observer)
    // ============================================================

    const revealEls = document.querySelectorAll(
        ".cat-card, .rest-card, .feature-box, .delivery-banner, .footer-col, .left, .right"
    );

    revealEls.forEach(el => el.classList.add("hidden"));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger each element slightly
                setTimeout(() => {
                    entry.target.classList.add("show");
                }, i * 60);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealEls.forEach(el => revealObserver.observe(el));



    // ============================================================
    // 2. NAVBAR SCROLL EFFECT
    // ============================================================

    const navbar = document.querySelector(".navbar");

    const handleNavScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
            // Adapt to dark mode too
            if (!document.body.classList.contains("dark")) {
                navbar.style.background = "";
            }
        } else {
            navbar.classList.remove("scrolled");
        }
    };

    window.addEventListener("scroll", handleNavScroll, { passive: true });



    // ============================================================
    // 3. BUTTON RIPPLE EFFECT
    // ============================================================

    document.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", function(e) {
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
    // 4. HERO IMAGE FLOATING (CSS animation fallback)
    // ============================================================

    const heroImage = document.querySelector(".image");

    if (heroImage && !prefersReducedMotion) {
        let dir = 1;
        setInterval(() => {
            heroImage.style.transition = "transform 2s ease";
            heroImage.style.transform  = dir === 1
                ? "translateY(-12px) rotate(1deg)"
                : "translateY(0px) rotate(-1deg)";
            dir = dir === 1 ? 0 : 1;
        }, 2200);
    }



    // ============================================================
    // 5. WORD-BY-WORD HERO TITLE REVEAL
    // ============================================================

    const title = document.querySelector(".hero-title");

    if (title) {
        if (prefersReducedMotion) {
            title.innerHTML = `Delicious Food,<br>Delivered <span>Fast</span>`;
        } else {
            const lines = [
                { words: ["Delicious", "Food,"] },
                { words: ["Delivered"], highlight: "Fast" }
            ];
            title.innerHTML = "";
            let delay = 0;

            lines.forEach((line, li) => {
                line.words.forEach(word => {
                    const span = document.createElement("span");
                    span.className = "word-reveal";
                    span.textContent = word + " ";
                    span.style.animationDelay = delay + "s";
                    title.appendChild(span);
                    delay += 0.12;
                });
                if (line.highlight) {
                    const hSpan = document.createElement("span");
                    hSpan.className = "word-reveal";
                    hSpan.style.animationDelay = delay + "s";
                    const inner = document.createElement("span");
                    inner.textContent = line.highlight;
                    hSpan.appendChild(inner);
                    title.appendChild(hSpan);
                    delay += 0.12;
                }
                if (li === 0) title.appendChild(document.createElement("br"));
            });
        }
    }



    // ============================================================
    // 6. COUNT-UP ANIMATION (Category restaurant counts)
    // ============================================================

    const catCards = document.querySelectorAll(".cat-card");

    catCards.forEach(card => {
        const pEl = card.querySelector("p");
        if (!pEl) return;

        const match = pEl.innerText.match(/(\d+)/);
        if (!match) return;

        const finalNum = parseInt(match[1]);
        const unit     = pEl.innerText.replace(finalNum, "").trim();
        let current    = 0;

        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const step = Math.max(1, Math.floor(finalNum / 40));
                const tick = () => {
                    current += step;
                    if (current >= finalNum) {
                        pEl.innerText = finalNum + "+ " + unit.replace("+ ", "");
                        return;
                    }
                    pEl.innerText = current + "+ " + unit.replace("+ ", "");
                    requestAnimationFrame(tick);
                };

                requestAnimationFrame(tick);
                countObserver.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        countObserver.observe(card);
    });



    // ============================================================
    // 7. SEARCH BAR GLOW EFFECT
    // ============================================================

    const searchBox   = document.querySelector(".search-box");
    const searchInput = document.querySelector(".search-box input");

    if (searchInput && searchBox) {
        searchInput.addEventListener("focus",  () =>
            searchBox.style.boxShadow = "0 0 0 4px rgba(255,122,0,0.15), 0 8px 24px rgba(0,0,0,0.08)");
        searchInput.addEventListener("blur",   () =>
            searchBox.style.boxShadow = "");
    }



    // ============================================================
    // 8. CATEGORY CARD 3D HOVER TILT
    // ============================================================

    if (!prefersReducedMotion) {
        document.querySelectorAll(".cat-card").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect    = card.getBoundingClientRect();
                const x       = e.clientX - rect.left;
                const y       = e.clientY - rect.top;
                const rotateY = (x - rect.width  / 2) / 14;
                const rotateX = -(y - rect.height / 2) / 14;
                card.style.transform =
                    `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = "";
            });
        });
    }



    // ============================================================
    // 9. DISCOUNT CARD (Appended to .right)
    // ============================================================

    const rightEl = document.querySelector(".right");

    if (rightEl && !rightEl.querySelector(".discount-card")) {
        const discountCard       = document.createElement("div");
        discountCard.classList.add("discount-card");
        discountCard.innerHTML   = `
            <p>🔥 Special Offer</p>
            <h3>50%</h3>
            <span>OFF First Order</span>
        `;
        rightEl.appendChild(discountCard);
    }



    // ============================================================
    // 10. LIVE DELIVERY STATUS TOAST
    // ============================================================

    const statuses = [
        "🚴 Rider Assigned",
        "🍔 Preparing Food",
        "📦 Packed & Ready",
        "🛵 On The Way",
        "✅ Delivered!"
    ];

    let statusIndex = 0;
    const toast = document.getElementById("statusToast");

    if (toast) {
        toast.textContent = statuses[0];

        setInterval(() => {
            statusIndex = (statusIndex + 1) % statuses.length;

            toast.style.opacity   = "0";
            toast.style.transform = "translateY(8px)";

            setTimeout(() => {
                toast.textContent     = statuses[statusIndex];
                toast.style.opacity   = "1";
                toast.style.transform = "translateY(0)";
            }, 300);
        }, 3200);
    }



    // ============================================================
    // 11. PARALLAX HERO IMAGE + FLOATING INGREDIENTS (mouse move)
    // ============================================================

    const floatItems = document.querySelectorAll(".float-item");

    if (!prefersReducedMotion) {
        window.addEventListener("mousemove", (e) => {
            const x = (window.innerWidth  / 2 - e.pageX) / 55;
            const y = (window.innerHeight / 2 - e.pageY) / 55;

            if (heroImage) {
                heroImage.style.transform = `translate(${x}px, ${y}px)`;
            }

            floatItems.forEach((item, i) => {
                const depth = (i + 1) * 0.6;
                item.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
            });
        }, { passive: true });
    }



    // ============================================================
    // 12. AUTO IMAGE SCALE PULSE
    // ============================================================

    if (heroImage && !prefersReducedMotion) {
        setInterval(() => {
            heroImage.style.transition = "transform 2.2s ease";
            heroImage.style.scale      = "1.04";
            setTimeout(() => { heroImage.style.scale = "1"; }, 2200);
        }, 5000);
    }



    // ============================================================
    // 13. ORDER NOW BUTTON — CONFIRMATION FEEDBACK
    // ============================================================

    const orderBtn = document.querySelector(".banner-left button");

    if (orderBtn) {
        orderBtn.addEventListener("click", () => {
            // Navigate (from existing logic below) takes priority;
            // visual feedback before redirect
            orderBtn.innerHTML   = "🍔 Order Confirmed!";
            orderBtn.style.background = "#22c55e";

            setTimeout(() => {
                orderBtn.innerHTML        = "Order Now";
                orderBtn.style.background = "";
            }, 2800);
        });
    }



    // ============================================================
    // 14. FEATURE HOVER (hero features)
    // ============================================================

    document.querySelectorAll(".feature").forEach(feature => {
        feature.addEventListener("mouseenter", () => {
            feature.style.transform  = "translateY(-8px)";
            feature.style.transition = "transform 0.35s ease";
        });
        feature.addEventListener("mouseleave", () => {
            feature.style.transform = "translateY(0)";
        });
    });



    // ============================================================
    // 15. FOOD EMOJI RAIN (decorative, throttled)
    // ============================================================

   window.addEventListener("load", () => {

    if (prefersReducedMotion) return;

    const foods = ["🍕","🍔","🍟","🌭","🥤","🍗","🌮","🍩"];

    const rainContainer = document.createElement("div");
    rainContainer.classList.add("food-rain");

    document.body.appendChild(rainContainer);

    for(let i = 0; i < 40; i++){

        const food = document.createElement("span");

        food.classList.add("food-item");

        food.innerText =
            foods[Math.floor(Math.random() * foods.length)];

        food.style.left = Math.random() * 100 + "vw";

        food.style.animationDuration =
            (1 + Math.random() * 2) + "s";

        food.style.fontSize =
            (25 + Math.random() * 25) + "px";

        food.style.animationDelay =
            Math.random() * 0.5 + "s";

        rainContainer.appendChild(food);
    }

    setTimeout(() => {
        rainContainer.remove();
    }, 3000);

});



    // ============================================================
    // 16. MOBILE HAMBURGER MENU
    // ============================================================

    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.getElementById("navLinks");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            const open = navLinks.classList.toggle("open");
            hamburger.classList.toggle("open", open);
            hamburger.setAttribute("aria-expanded", open.toString());
        });

        // Close on link click
        navLinks.querySelectorAll("a").forEach(a => {
            a.addEventListener("click", () => {
                navLinks.classList.remove("open");
                hamburger.classList.remove("open");
                hamburger.setAttribute("aria-expanded", "false");
            });
        });
    }



    // ============================================================
    // 17. SCROLL PROGRESS BAR
    // ============================================================

    const progressBar = document.getElementById("scrollProgress");

    if (progressBar) {
        const updateProgress = () => {
            const scrollTop    = window.scrollY;
            const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
            const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = pct + "%";
        };
        window.addEventListener("scroll", updateProgress, { passive: true });
        updateProgress();
    }



    // ============================================================
    // 18. CUSTOM CURSOR (desktop only)
    // ============================================================

    const cursorDot  = document.getElementById("cursorDot");
    const cursorRing = document.getElementById("cursorRing");
    const isTouch    = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    if (cursorDot && cursorRing && !isTouch && !prefersReducedMotion) {
        let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;

        window.addEventListener("mousemove", (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        }, { passive: true });

        const animateRing = () => {
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animateRing);
        };
        animateRing();

        document.querySelectorAll("a, button, .cat-card, .rest-card, input").forEach(el => {
            el.addEventListener("mouseenter", () => cursorRing.classList.add("grow"));
            el.addEventListener("mouseleave", () => cursorRing.classList.remove("grow"));
        });
    } else if (cursorDot && cursorRing) {
        cursorDot.style.display = "none";
        cursorRing.style.display = "none";
    }



    // ============================================================
    // 19. MAGNETIC BUTTONS
    // ============================================================

    if (!prefersReducedMotion) {
        document.querySelectorAll(".magnetic").forEach(btn => {
            btn.addEventListener("mousemove", (e) => {
                const rect = btn.getBoundingClientRect();
                const mx = (e.clientX - rect.left - rect.width / 2) * 0.25;
                const my = (e.clientY - rect.top - rect.height / 2) * 0.35;
                btn.style.setProperty("--mx", mx + "px");
                btn.style.setProperty("--my", my + "px");
            });
            btn.addEventListener("mouseleave", () => {
                btn.style.setProperty("--mx", "0px");
                btn.style.setProperty("--my", "0px");
            });
        });
    }



    // ============================================================
    // 20. HERO VIDEO — SCROLL PARALLAX + FALLBACK
    // ============================================================

    const heroVideo = document.querySelector(".hero-video");

    if (heroVideo) {
        // If the video can't load/play, fall back to the warm gradient backdrop
        heroVideo.addEventListener("error", () => {
            heroVideo.style.display = "none";
        });

        if (!prefersReducedMotion) {
            window.addEventListener("scroll", () => {
                const scrollY = window.scrollY;
                const scale   = 1.02 + Math.min(scrollY / 4000, 0.08);
                const shiftY  = scrollY * 0.15;
                heroVideo.style.transform = `translate(-50%, calc(-50% + ${shiftY}px)) scale(${scale})`;
            }, { passive: true });
        }

        // Nudge playback on browsers that need it
        const playPromise = heroVideo.play();
        if (playPromise) {
            playPromise.catch(() => {
                heroVideo.muted = true;
                heroVideo.play().catch(() => {
                    heroVideo.style.display = "none";
                });
            });
        }
    }

});



// ============================================================
// THEME TOGGLE (outside DOMContentLoaded to match original)
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

// Restore saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    if (themeBtn) themeBtn.innerHTML = '<i class="ri-sun-line"></i>';
}



// ============================================================
// PAGE NAVIGATION — Login button → mega2.html, or user's name /
// Logout once a real session exists (see AUTH NAV STATE below)
// ============================================================

const loginBtn = document.querySelector(".login-btn");
if (loginBtn) {
    loginBtn.dataset.authBound = "true";
    loginBtn.addEventListener("click", () => {
        if (loginBtn.dataset.mode === "logout") {
            handleLogout();
        } else {
            window.location.href = "mega2.html";
        }
    });
}



// ============================================================
// PAGE NAVIGATION — Category cards (.box3) → mega4.html?cuisine=…
// "More" card → mega11.html (Browse Categories)
// ============================================================

document.querySelectorAll(".box3 .cat-card").forEach(card => {
    card.addEventListener("click", () => {
        const cuisine = card.dataset.cuisine;
        window.location.href = cuisine
            ? `mega4.html?cuisine=${encodeURIComponent(cuisine)}`
            : "mega11.html";
    });
});



// ============================================================
// PAGE NAVIGATION — Search button → mega4.html?search=…
// ============================================================

const searchBtn = document.querySelector(".search-box button");
if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        const query = document.querySelector(".search-box input").value;
        window.location.href = `mega4.html?search=${encodeURIComponent(query)}`;
    });
}



// ============================================================
// PAGE NAVIGATION — Banner "Order Now" → mega4.html
// ============================================================

const bannerBtn = document.querySelector(".banner-left button");
if (bannerBtn) {
    bannerBtn.addEventListener("click", () => {
        window.location.href = "mega4.html";
    });
}


// ============================================================
// PAGE NAVIGATION — Nav links map
// ============================================================

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const text = link.textContent.trim();
        const map  = {
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

// ============================================================
// BACKEND INTEGRATION — API base + shared helpers
// ============================================================

const API_BASE = "http://localhost:5000/api";

function getToken() {
    return localStorage.getItem("token");
}

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

function showStatusToast(msg) {
    const toast = document.getElementById("statusToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("visible");
    clearTimeout(showStatusToast._t);
    showStatusToast._t = setTimeout(() => toast.classList.remove("visible"), 2800);
}

// ============================================================
// AUTH NAV STATE — swap "Login" for the user's name once a
// token exists, and let it log the user out on click.
// ============================================================

function refreshAuthNav() {
    const btn = document.querySelector(".login-btn");
    if (!btn) return;

    const user = getStoredUser();

    if (user && getToken()) {
        btn.textContent = `Hi, ${user.name?.split(" ")[0] || "there"}`;
        btn.dataset.mode = "logout";
        btn.setAttribute("aria-label", "Log out of Foodie");
    } else {
        btn.textContent = "Login";
        btn.dataset.mode = "login";
        btn.setAttribute("aria-label", "Login or sign up");
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            }
        });
    } catch (err) {
        console.error("Logout request failed:", err);
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showStatusToast("Logged out 👋");
        refreshAuthNav();
    }
}

refreshAuthNav();

// ============================================================
// LIVE RESTAURANTS — GET /api/restaurants, rendered into the
// existing .box4 grid (#homeRestGrid). Same card markup/classes
// as the original static cards, so styling is untouched. The
// 6th "See All" card always stays and always links to mega4.html.
// Falls back to the original static markup already in the HTML
// if the request fails (e.g. backend not running).
// ============================================================

function normalizeHomeRestaurant(r) {
    return {
        id: r._id,
        name: r.name || "Unnamed Restaurant",
        image: r.coverImage || (Array.isArray(r.images) && r.images[0]) ||
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
        area: (r.address && (r.address.area || r.address.city)) || "",
        rating: typeof r.rating === "number" ? r.rating : 0,
        deliveryMin: r.deliveryTime?.min ?? null,
        deliveryMax: r.deliveryTime?.max ?? null,
        deliveryFee: typeof r.deliveryFee === "number" ? r.deliveryFee : null
    };
}

function homeRestaurantCardHTML(r, containerClass) {
    const ratingLabel = r.rating ? r.rating.toFixed(1) : "New";
    const timeLabel = (r.deliveryMin != null && r.deliveryMax != null)
        ? `${r.deliveryMin}–${r.deliveryMax} min`
        : "20–30 min";
    const feeLabel = r.deliveryFee != null
        ? (r.deliveryFee === 0 ? "₹0 delivery" : `₹${r.deliveryFee} delivery`)
        : "";

    return `
        <article class="${containerClass} rest-card" role="listitem" tabindex="0"
            data-id="${r.id}" aria-label="${r.name}">
            <div class="rest-img-wrap">
                <img src="${r.image}" alt="${r.name}" loading="lazy">
                <span class="rest-badge">${ratingLabel} ⭐</span>
            </div>
            <div class="rest-info">
                <h3>${r.name}</h3>
                <p>${r.area}</p>
                <span class="rest-meta">${timeLabel} · ${feeLabel}</span>
            </div>
        </article>`;
}

const SEE_ALL_CARD_HTML = `
        <article class="container6 rest-card see-more-card" role="listitem" tabindex="0">
            <div class="rest-img-wrap more-img">
                <i class="fa-solid fa-store"></i>
            </div>
            <div class="rest-info">
                <h3>See All</h3>
                <p>More Restaurants</p>
            </div>
        </article>`;

function bindHomeRestaurantCards(grid) {
    grid.querySelectorAll(".rest-card").forEach(card => {
        card.addEventListener("click", () => {
            if (card.classList.contains("see-more-card") || !card.dataset.id) {
                window.location.href = "mega4.html";
            } else {
                window.location.href = `mega6.html?id=${encodeURIComponent(card.dataset.id)}`;
            }
        });
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.click();
            }
        });
    });

    // Match the page's existing scroll-reveal pattern for freshly
    // injected cards (the DOMContentLoaded observer above already
    // ran before this async data arrived).
    if (!prefersReducedMotion) {
        const lateObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add("show"), i * 80);
                    lateObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        grid.querySelectorAll(".rest-card").forEach(card => {
            card.classList.add("hidden");
            lateObserver.observe(card);
        });
    }
}

async function loadHomeRestaurants() {
    const grid = document.getElementById("homeRestGrid");
    if (!grid) return;

    const containerClasses = ["container1", "container2", "container3", "container4", "container5"];

    try {
        const res = await fetch(`${API_BASE}/restaurants?limit=5&sort=rating`);
        const json = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);

        const list = Array.isArray(json.data) ? json.data
            : Array.isArray(json.data?.restaurants) ? json.data.restaurants
            : [];

        if (!list.length) return; // keep the static fallback cards already in the HTML

        const cardsHTML = list
            .slice(0, 5)
            .map((r, i) => homeRestaurantCardHTML(normalizeHomeRestaurant(r), containerClasses[i]))
            .join("");

        grid.innerHTML = cardsHTML + SEE_ALL_CARD_HTML;
        bindHomeRestaurantCards(grid);

    } catch (err) {
        console.error("Failed to load restaurants for home page:", err);
        // Static fallback cards already in the HTML stay as-is; just
        // make sure their click handlers still work.
        bindHomeRestaurantCards(grid);
    }
}

loadHomeRestaurants();