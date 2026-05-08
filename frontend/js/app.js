// ─── ROUTER ───────────────────────────────────────
const router = {
  currentPage: null,

  init() {
    const hash = window.location.hash.slice(1) || 'home';
    this.navigate(hash);
    window.addEventListener('hashchange', () => {
      this.navigate(window.location.hash.slice(1) || 'home');
    });
  },

  navigate(page) {
    if (!page) page = 'home';

    // Auth guards
    if (['user-dashboard', 'booking-history'].includes(page)) {
      if (!auth.isLoggedIn() || auth.getRole() !== 'user') { window.location.hash = 'login'; return; }
    }
    if (['landowner-dashboard', 'add-space', 'my-spaces', 'landowner-bookings', 'earnings'].includes(page)) {
      if (!auth.isLoggedIn() || auth.getRole() !== 'landowner') { window.location.hash = 'login'; return; }
    }
    if (page.startsWith('admin')) {
      if (!auth.isLoggedIn() || auth.getRole() !== 'admin') { window.location.hash = 'login'; return; }
    }

    this.currentPage = page;
    this.render(page);
    this.updateNav();
  },

  render(page) {
    const app = document.getElementById('app');
    app.innerHTML = '';

    const pages = {
      'home': pages_home,
      'login': pages_login,
      'register': pages_register,
      'user-dashboard': pages_userDashboard,
      'booking-history': pages_bookingHistory,
      'landowner-dashboard': pages_landownerDashboard,
      'add-space': pages_addSpace,
      'my-spaces': pages_mySpaces,
      'landowner-bookings': pages_landownerBookings,
      'earnings': pages_earnings,
      'admin-dashboard': pages_adminDashboard,
      'admin-users': pages_adminUsers,
      'admin-spaces': pages_adminSpaces,
      'admin-bookings': pages_adminBookings,
    };

    const fn = pages[page];
    if (fn) fn(app);
    else { app.innerHTML = `<div style="padding:64px;text-align:center"><h2>Page not found</h2><a href="#home" class="btn btn-primary" style="margin-top:24px">Go Home</a></div>`; }
  },

  updateNav() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === this.currentPage);
    });
  }
};

// ─── NAVBAR ───────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('navbar');
  const user = auth.getUser();
  const role = auth.getRole();

  let roleLinks = '';
  if (!auth.isLoggedIn()) {
    roleLinks = `
      <span class="nav-link" onclick="go('login')" data-page="login">Login</span>
      <a href="#register" class="btn btn-primary btn-sm">Get Started</a>`;
  } else if (role === 'user') {
    roleLinks = `
      <span class="nav-link" onclick="go('user-dashboard')" data-page="user-dashboard">Find Parking</span>
      <span class="nav-link" onclick="go('booking-history')" data-page="booking-history">My Bookings</span>
      <span class="nav-link" onclick="logout()">Logout (${user.name.split(' ')[0]})</span>`;
  } else if (role === 'landowner') {
    roleLinks = `
      <span class="nav-link" onclick="go('landowner-dashboard')" data-page="landowner-dashboard">Dashboard</span>
      <span class="nav-link" onclick="go('my-spaces')" data-page="my-spaces">My Spaces</span>
      <span class="nav-link" onclick="go('earnings')" data-page="earnings">Earnings</span>
      <span class="nav-link" onclick="logout()">Logout</span>`;
  } else if (role === 'admin') {
    roleLinks = `
      <span class="nav-link" onclick="go('admin-dashboard')" data-page="admin-dashboard">Dashboard</span>
      <span class="nav-link" onclick="go('admin-users')" data-page="admin-users">Users</span>
      <span class="nav-link" onclick="go('admin-spaces')" data-page="admin-spaces">Spaces</span>
      <span class="nav-link" onclick="logout()">Logout</span>`;
  }

  nav.innerHTML = `
    <div class="nav-logo" onclick="go('home')" style="cursor:pointer">🅿 ParkMitra</div>
    <div class="nav-links" id="nav-links">${roleLinks}</div>`;
}

function go(page) { window.location.hash = page; }
function logout() { auth.clearSession(); toast.info('Logged out'); renderNav(); go('home'); }

// ─── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  router.init();
});
