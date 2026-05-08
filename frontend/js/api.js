// ─── CONFIG ──────────────────────────────────────
const API_BASE = '/api';

// ─── HTTP HELPER ──────────────────────────────────
const api = {
  async request(method, endpoint, data = null) {
    const token = auth.getToken();
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (data) opts.body = JSON.stringify(data);

    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
  },
  get: (ep) => api.request('GET', ep),
  post: (ep, d) => api.request('POST', ep, d),
  put: (ep, d) => api.request('PUT', ep, d),
  patch: (ep, d) => api.request('PATCH', ep, d),
  delete: (ep) => api.request('DELETE', ep),
};

// ─── AUTH ─────────────────────────────────────────
const auth = {
  getToken: () => localStorage.getItem('pm_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('pm_user')); } catch { return null; } },
  setSession(token, user) { localStorage.setItem('pm_token', token); localStorage.setItem('pm_user', JSON.stringify(user)); },
  clearSession() { localStorage.removeItem('pm_token'); localStorage.removeItem('pm_user'); },
  isLoggedIn: () => !!localStorage.getItem('pm_token'),
  getRole: () => { const u = auth.getUser(); return u ? u.role : null; },
};

// ─── TOAST ────────────────────────────────────────
const toast = {
  show(message, type = 'info', duration = 3500) {
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
  },
  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  info: (msg) => toast.show(msg, 'info'),
};

// ─── LOADING ──────────────────────────────────────
const loader = {
  show(msg = 'Loading...') {
    let el = document.getElementById('global-loader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'global-loader';
      el.className = 'loading-overlay';
      el.innerHTML = `<div class="spinner"></div><span style="color:var(--text-muted);font-size:14px">${msg}</span>`;
      document.body.appendChild(el);
    }
  },
  hide() { document.getElementById('global-loader')?.remove(); }
};

// ─── MODAL ────────────────────────────────────────
const modal = {
  show(title, content, actions = '') {
    this.hide();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'global-modal';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="modal.hide()">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        ${actions ? `<div class="modal-footer" style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end">${actions}</div>` : ''}
      </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.hide(); });
    document.body.appendChild(overlay);
  },
  hide() { document.getElementById('global-modal')?.remove(); }
};

// ─── FORMAT HELPERS ───────────────────────────────
const fmt = {
  currency: (n) => `₹${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
  date: (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  datetime: (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  statusBadge: (s) => {
    const map = { confirmed: 'success', active: 'info', completed: 'success', cancelled: 'error', pending: 'pending', approved: 'success', rejected: 'error' };
    return `<span class="badge badge-${map[s] || 'info'}">${s}</span>`;
  }
};

// ─── GEO ──────────────────────────────────────────
const geo = {
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  }
};
