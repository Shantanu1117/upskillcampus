// ================================
// FOODIE — SHARED NOTIFICATIONS BELL WIDGET
// Include after cart-storage.js and the Socket.IO client script.
// Expects #notifBell, #notifBadge, #notifPanel, #notifPanelList,
// #notifMarkAllBtn in the page's navbar markup.
// Uses its own API base constant name to avoid colliding with the
// page's own `const API_BASE` declaration (shared global scope
// across plain <script> tags).
// ================================

const NOTIF_API_BASE = 'http://localhost:5000/api';

function notifTimeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notifItemHTML(n) {
  return `
    <div class="notif-item${n.isRead ? '' : ' unread'}" data-id="${n._id}">
      <div class="notif-item-title">${n.title}</div>
      <div class="notif-item-message">${n.message}</div>
      <div class="notif-item-time">${notifTimeAgo(n.createdAt)}</div>
    </div>`;
}

async function notifFetchList() {
  const listEl = document.getElementById('notifPanelList');
  const badgeEl = document.getElementById('notifBadge');
  if (!listEl) return;

  if (typeof CartStorage === 'undefined' || !CartStorage.isLoggedIn()) {
    listEl.innerHTML = '<div class="notif-empty">Login to see your notifications</div>';
    if (badgeEl) badgeEl.hidden = true;
    return;
  }

  try {
    const res = await fetch(`${NOTIF_API_BASE}/users/notifications?limit=15`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Could not load notifications');

    const notifications = data.data || [];
    const unreadCount = (data.pagination && data.pagination.unreadCount) || 0;

    if (badgeEl) {
      if (unreadCount > 0) {
        badgeEl.hidden = false;
        badgeEl.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
      } else {
        badgeEl.hidden = true;
      }
    }

    listEl.innerHTML = notifications.length
      ? notifications.map(notifItemHTML).join('')
      : '<div class="notif-empty">No notifications yet</div>';

    listEl.querySelectorAll('.notif-item.unread').forEach(item => {
      item.addEventListener('click', () => notifMarkRead(item.dataset.id, item));
    });

  } catch (err) {
    console.error('Failed to load notifications:', err);
    listEl.innerHTML = '<div class="notif-empty">Could not load notifications</div>';
  }
}

async function notifMarkRead(id, itemEl) {
  try {
    const res = await fetch(`${NOTIF_API_BASE}/users/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) return;
    if (itemEl) itemEl.classList.remove('unread');

    const badgeEl = document.getElementById('notifBadge');
    if (badgeEl && !badgeEl.hidden) {
      const current = parseInt(badgeEl.textContent, 10) || 0;
      const next = Math.max(0, current - 1);
      if (next === 0) badgeEl.hidden = true;
      else badgeEl.textContent = String(next);
    }
  } catch (err) {
    console.error('Failed to mark notification read:', err);
  }
}

async function notifMarkAllRead() {
  try {
    const res = await fetch(`${NOTIF_API_BASE}/users/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) return;

    document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
    const badgeEl = document.getElementById('notifBadge');
    if (badgeEl) badgeEl.hidden = true;
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
  }
}

function notifSetupBell() {
  const bell = document.getElementById('notifBell');
  const panel = document.getElementById('notifPanel');
  const markAllBtn = document.getElementById('notifMarkAllBtn');
  if (!bell || !panel) return;

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    bell.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) notifFetchList();
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== bell) {
      panel.hidden = true;
      bell.setAttribute('aria-expanded', 'false');
    }
  });

  if (markAllBtn) markAllBtn.addEventListener('click', notifMarkAllRead);
}

// Shared singleton socket — any page/feature that needs a live connection
// (this notifications widget, mega8's order tracking, etc.) should call
// getFoodieSocket() instead of creating its own `io(...)` connection, so
// there's only ever one socket per tab instead of one per feature.
let _foodieSocket = null;

function getFoodieSocket() {
  if (typeof io === 'undefined') return null;
  if (typeof CartStorage === 'undefined' || !CartStorage.isLoggedIn()) return null;

  if (!_foodieSocket) {
    _foodieSocket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });
    _foodieSocket.on('connect_error', (err) => {
      console.error('Socket connection failed:', err.message);
    });
  }
  return _foodieSocket;
}

// Real-time: any authenticated socket auto-joins its own user_<id> room
// server-side, so a plain connection is enough to receive new notifications.
function notifConnectSocket() {
  const socket = getFoodieSocket();
  if (!socket) return;

  socket.on('notification:new', () => {
    // Re-fetch rather than trying to splice in the raw payload — keeps
    // read/unread state and ordering consistent with the server.
    notifFetchList();
  });
}

function notifInit() {
  notifSetupBell();
  notifFetchList();
  notifConnectSocket();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', notifInit);
} else {
  notifInit();
}