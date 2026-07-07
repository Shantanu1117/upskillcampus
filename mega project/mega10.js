// ============================================================
// FOODIE — CONTACT PAGE JS (mega10.js)
// Production-Quality JavaScript
// ============================================================

'use strict';

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
// 4. NAV ROUTING
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
// 5. SCROLL PROGRESS BAR
// ============================================================
const progressBar = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
  if (!progressBar) return;
  const total   = document.documentElement.scrollHeight - window.innerHeight;
  const current = total > 0 ? (window.scrollY / total) * 100 : 0;
  progressBar.style.width = current + '%';
}, { passive: true });

// ============================================================
// 6. SCROLL REVEAL — Intersection Observer
// ============================================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('show'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal, .faq-card').forEach(el => {
  revealObserver.observe(el);
});

// ============================================================
// 7. CATEGORY CHIPS SELECTION
// ============================================================
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

// ============================================================
// 8. TEXTAREA CHARACTER COUNT
// ============================================================
const messageArea = document.getElementById('contactMessage');
const charCount   = document.getElementById('charCount');
const MAX_CHARS   = 500;

if (messageArea && charCount) {
  messageArea.addEventListener('input', () => {
    const len = messageArea.value.length;
    charCount.textContent = `${len} / ${MAX_CHARS}`;

    charCount.classList.remove('warn', 'limit');
    if (len >= MAX_CHARS) {
      charCount.classList.add('limit');
      messageArea.value = messageArea.value.substring(0, MAX_CHARS);
    } else if (len >= MAX_CHARS * 0.8) {
      charCount.classList.add('warn');
    }
  });
}

// ============================================================
// 9. FORM INPUT FOCUS GLOW
// ============================================================
document.querySelectorAll('.input-box input, .textarea-wrap textarea').forEach(field => {
  field.addEventListener('focus', () => {
    field.closest('.input-box, .textarea-wrap')?.classList.add('focused');
  });
  field.addEventListener('blur', () => {
    field.closest('.input-box, .textarea-wrap')?.classList.remove('focused');
  });
});

// ============================================================
// 10. FORM SUBMISSION WITH VALIDATION
// ============================================================
const contactForm = document.getElementById('contactForm');
const sendBtn     = document.getElementById('sendBtn');

function getField(id) {
  return document.getElementById(id);
}

function markError(input, isError) {
  if (!input) return;
  const box = input.closest('.input-box, .textarea-wrap');
  if (box) {
    box.style.borderColor = isError ? '#e53e3e' : '';
    box.style.boxShadow   = isError ? '0 0 0 3px rgba(229,62,62,0.12)' : '';
  }
}

function clearErrors() {
  document.querySelectorAll('.input-box, .textarea-wrap').forEach(box => {
    box.style.borderColor = '';
    box.style.boxShadow   = '';
  });
}

function validateForm() {
  let valid = true;
  clearErrors();

  const name    = getField('contactName');
  const email   = getField('contactEmail');
  const subject = getField('contactSubject');
  const message = getField('contactMessage');

  if (!name?.value.trim()) { markError(name, true); valid = false; }
  if (!email?.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    markError(email, true); valid = false;
  }
  if (!subject?.value.trim()) { markError(subject, true); valid = false; }
  if (!message?.value.trim() || message.value.trim().length < 10) {
    markError(message, true); valid = false;
  }

  return valid;
}

const API_BASE = 'http://localhost:5000/api';

if (contactForm && sendBtn) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fill in all required fields correctly.', 'error');
      return;
    }

    // Loading state
    const originalBtnHTML = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin 0.8s linear infinite"></i> Sending…';
    sendBtn.disabled  = true;

    // Inject spin keyframe once
    if (!document.getElementById('spinStyle')) {
      const style = document.createElement('style');
      style.id = 'spinStyle';
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: getField('contactName').value.trim(),
          email: getField('contactEmail').value.trim(),
          subject: getField('contactSubject').value.trim(),
          message: getField('contactMessage').value.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not send your message');
      }

      sendBtn.innerHTML = '<i class="ri-check-double-line"></i> Message Sent!';
      sendBtn.classList.add('success');
      sendBtn.disabled  = false;

      showToast('✅ Message sent successfully! We\'ll reply within 24 hours.', 'success');

      // Reset form
      contactForm.reset();
      clearErrors();
      if (charCount) charCount.textContent = '0 / 500';

      // Reset chips
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      const firstChip = document.querySelector('.chip');
      if (firstChip) firstChip.classList.add('active');

      // Reset button after delay
      setTimeout(() => {
        sendBtn.innerHTML = '<i class="ri-send-plane-fill"></i> Send Message';
        sendBtn.classList.remove('success');
      }, 4000);

    } catch (error) {
      console.error('Contact form error:', error);
      showToast(error.message || "Can't reach the server. Is the backend running?", 'error');
      sendBtn.innerHTML = originalBtnHTML;
      sendBtn.disabled = false;
    }
  });
}

// ============================================================
// 11. TILT EFFECT ON CARDS
// ============================================================
document.querySelectorAll('.info-card, .form-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;

    card.style.transform = `
      perspective(1000px)
      rotateX(${y * -5}deg)
      rotateY(${x * 5}deg)
      translateZ(4px)
    `;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
  });
});

// ============================================================
// 12. MAGNETIC BUTTON EFFECT (subtle, on large screens)
// ============================================================
if (window.innerWidth > 768) {
  document.querySelectorAll('.send-btn, .login-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x    = e.clientX - rect.left - rect.width  / 2;
      const y    = e.clientY - rect.top  - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ============================================================
// 13. HERO VIDEO — pause when off-screen (performance)
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

  // Graceful fallback if the video source fails to load
  heroVideo.addEventListener('error', () => {
    const media = document.querySelector('.hero-media');
    if (media) media.classList.add('video-fallback');
  });
}

// ============================================================
// 14. RIPPLE EFFECT ON BUTTONS
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
// 15. CTA PILLS — smooth scroll to form
// ============================================================
document.querySelectorAll('.cta-pill').forEach(pill => {
  pill.addEventListener('click', e => {
    const href = pill.getAttribute('href') || '';
    if (href.startsWith('tel:') || href.startsWith('mailto:')) return; // let default action fire
    e.preventDefault();
    document.querySelector('.contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ============================================================
// 16. INFO BOX — click-to-action toasts
// ============================================================
const phoneBox = document.querySelector('.info-box:nth-child(3)');
if (phoneBox) {
  phoneBox.style.cursor = 'pointer';
  phoneBox.addEventListener('click', () => {
    showToast('📞 Calling +91 98765 43210…');
  });
}

const emailBox = document.querySelector('.info-box:nth-child(4)');
if (emailBox) {
  emailBox.style.cursor = 'pointer';
  emailBox.addEventListener('click', () => {
    showToast('📧 Opening email client…');
  });
}

// ============================================================
// 17. TOAST NOTIFICATION
// ============================================================
const toast = document.getElementById('statusToast');
let toastTimer = null;

function showToast(msg, type = 'success') {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.borderLeftColor = type === 'error' ? '#e53e3e' : 'var(--brand)';
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}