// ─── HOME PAGE ────────────────────────────────────
function pages_home(container) {
  container.innerHTML = `
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-grid">
        <div>
          <div class="badge badge-info" style="margin-bottom:20px">🚀 Smart Parking Platform</div>
          <h1 class="hero-title">
            Find Your <span class="highlight">Perfect Spot</span> in Seconds
          </h1>
          <p class="hero-sub">
            ParkMitra connects drivers with available parking spaces in real time. 
            Book, pay, and park — all from your phone. No more circling the block.
          </p>
          <div class="hero-actions">
            <a href="#register" class="btn btn-primary btn-lg">🚗 Find Parking Now</a>
            <a href="#register?role=landowner" class="btn btn-secondary btn-lg">🏢 List Your Space</a>
          </div>
          <div style="display:flex;gap:32px;margin-top:40px">
            <div><div style="font-family:Syne;font-size:28px;font-weight:800;color:var(--accent)">2.4K+</div><div style="font-size:13px;color:var(--text-muted)">Parking Spaces</div></div>
            <div><div style="font-family:Syne;font-size:28px;font-weight:800;color:var(--accent)">18K+</div><div style="font-size:13px;color:var(--text-muted)">Happy Drivers</div></div>
            <div><div style="font-family:Syne;font-size:28px;font-weight:800;color:var(--accent)">99%</div><div style="font-size:13px;color:var(--text-muted)">Uptime</div></div>
          </div>
        </div>
        <div class="hero-map-preview">
          <div id="hero-map"></div>
        </div>
      </div>
    </section>

    <section style="padding:0 64px 96px;max-width:1200px;margin:0 auto">
      <div class="section-title">How It <span style="color:var(--accent)">Works</span></div>
      <p style="color:var(--text-muted);font-size:16px">Three simple steps to stress-free parking</p>
      <div class="features-grid" style="margin-top:48px">
        <div class="feature-card">
          <div class="feature-icon">📍</div>
          <div class="feature-title">Share Location</div>
          <div class="feature-desc">Allow location access and instantly see all available parking spots near you on an interactive map.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <div class="feature-title">Choose & Book</div>
          <div class="feature-desc">Compare prices, distance, and amenities. Book your slot in advance and get instant confirmation.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💳</div>
          <div class="feature-title">Pay & Park</div>
          <div class="feature-desc">Secure online payment via Stripe. Arrive at your reserved spot and park without any hassle.</div>
        </div>
      </div>
    </section>

    <section style="padding:64px;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
      <div style="max-width:1200px;margin:0 auto">
        <div class="section-title">For <span style="color:var(--accent)">Land Owners</span></div>
        <p style="color:var(--text-muted);font-size:16px;margin-bottom:32px">Turn your unused space into passive income</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px">
          <div class="card"><div style="font-size:28px;margin-bottom:12px">📋</div><h3 style="font-family:Syne;margin-bottom:8px">List for Free</h3><p style="color:var(--text-muted);font-size:14px">Register and list your parking space in under 5 minutes. No hidden fees.</p></div>
          <div class="card"><div style="font-size:28px;margin-bottom:12px">📊</div><h3 style="font-family:Syne;margin-bottom:8px">Track Bookings</h3><p style="color:var(--text-muted);font-size:14px">Monitor all reservations, manage availability, and see real-time updates.</p></div>
          <div class="card"><div style="font-size:28px;margin-bottom:12px">💰</div><h3 style="font-family:Syne;margin-bottom:8px">Earn Daily</h3><p style="color:var(--text-muted);font-size:14px">Get paid directly. Set your own price and hours. You're in full control.</p></div>
        </div>
        <div style="margin-top:32px">
          <a href="#register" class="btn btn-primary" onclick="document.getElementById('role-select') && (document.getElementById('role-select').value='landowner')">Start Earning →</a>
        </div>
      </div>
    </section>

    <footer style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px;border-top:1px solid var(--border)">
      © 2025 ParkMitra · Built with ❤️ for smarter cities
    </footer>`;

  // Hero map
  setTimeout(() => {
    const heroMap = L.map('hero-map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([26.4499, 80.3319], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 19
    }).addTo(heroMap);

    // Demo markers
    const demoSpots = [
      [26.455, 80.330, 'City Center Parking', 40, 8],
      [26.448, 80.338, 'Mall Road Parking', 25, 3],
      [26.452, 80.325, 'Station Parking', 60, 15],
      [26.442, 80.335, 'Market Parking', 35, 2],
    ];
    demoSpots.forEach(([lat, lng, name, price, slots]) => {
      const icon = L.divIcon({
        html: `<div style="background:var(--grad,linear-gradient(135deg,#00d4aa,#0099ff));color:#000;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.4)">₹${price}/hr · ${slots} slots</div>`,
        className: '', iconAnchor: [40, 15]
      });
      L.marker([lat, lng], { icon }).addTo(heroMap).bindPopup(`<b>${name}</b><br>₹${price}/hr · ${slots} slots`);
    });
  }, 100);
}

// ─── LOGIN PAGE ───────────────────────────────────
function pages_login(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-box">
        <div class="auth-logo">🅿 ParkMitra</div>
        <div class="auth-tagline">Smart parking at your fingertips</div>
        <div id="login-alert"></div>
        <div class="form-group" style="margin-bottom:16px">
          <label>Email</label>
          <input id="login-email" class="input" type="email" placeholder="you@example.com">
        </div>
        <div class="form-group" style="margin-bottom:24px">
          <label>Password</label>
          <input id="login-password" class="input" type="password" placeholder="••••••••">
        </div>
        <button class="btn btn-primary btn-full btn-lg" onclick="doLogin()">
          <span id="login-btn-text">Login</span>
          <span id="login-spinner" class="spinner hidden"></span>
        </button>
        <p style="text-align:center;margin-top:20px;font-size:14px;color:var(--text-muted)">
          Don't have an account? <a href="#register" style="color:var(--accent)">Register</a>
        </p>
        <div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border)">
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px">Demo Accounts</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="fillDemo('user@demo.com','demo1234')">👤 User Demo</button>
            <button class="btn btn-ghost btn-sm" onclick="fillDemo('owner@demo.com','demo1234')">🏢 Land Owner Demo</button>
            <button class="btn btn-ghost btn-sm" onclick="fillDemo('admin@parkmitra.com','admin1234')">⚙️ Admin Demo</button>
          </div>
        </div>
      </div>
    </div>`;
}

window.fillDemo = (email, pass) => {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = pass;
};

window.doLogin = async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const alertEl = document.getElementById('login-alert');
  const spinner = document.getElementById('login-spinner');
  const btnText = document.getElementById('login-btn-text');

  if (!email || !password) { alertEl.innerHTML = `<div class="alert alert-error">Please fill all fields</div>`; return; }

  spinner.classList.remove('hidden');
  btnText.textContent = 'Logging in...';

  try {
    const res = await api.post('/auth/login', { email, password });
    auth.setSession(res.token, res.user);
    toast.success(`Welcome back, ${res.user.name}!`);
    renderNav();
    const role = res.user.role;
    if (role === 'admin') go('admin-dashboard');
    else if (role === 'landowner') go('landowner-dashboard');
    else go('user-dashboard');
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    spinner.classList.add('hidden');
    btnText.textContent = 'Login';
  }
};

// ─── REGISTER PAGE ────────────────────────────────
function pages_register(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-box">
        <div class="auth-logo">🅿 ParkMitra</div>
        <div class="auth-tagline">Join thousands of smart parkers</div>
        <div id="reg-alert"></div>
        <div class="form-group" style="margin-bottom:16px">
          <label>Full Name</label>
          <input id="reg-name" class="input" type="text" placeholder="Rahul Sharma">
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label>Email</label>
          <input id="reg-email" class="input" type="email" placeholder="you@example.com">
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label>Phone</label>
          <input id="reg-phone" class="input" type="tel" placeholder="+91 9876543210">
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label>Password</label>
          <input id="reg-password" class="input" type="password" placeholder="Min 6 characters">
        </div>
        <div class="form-group" style="margin-bottom:24px">
          <label>Account Type</label>
          <select id="reg-role" class="select">
            <option value="user">🚗 Driver (Find Parking)</option>
            <option value="landowner">🏢 Land Owner (List Parking)</option>
          </select>
        </div>
        <button class="btn btn-primary btn-full btn-lg" onclick="doRegister()">
          <span id="reg-btn-text">Create Account</span>
          <span id="reg-spinner" class="spinner hidden"></span>
        </button>
        <p style="text-align:center;margin-top:20px;font-size:14px;color:var(--text-muted)">
          Already have an account? <a href="#login" style="color:var(--accent)">Login</a>
        </p>
      </div>
    </div>`;
}

window.doRegister = async () => {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const alertEl = document.getElementById('reg-alert');

  if (!name || !email || !password) { alertEl.innerHTML = `<div class="alert alert-error">Please fill all required fields</div>`; return; }

  document.getElementById('reg-spinner').classList.remove('hidden');
  document.getElementById('reg-btn-text').textContent = 'Creating...';

  try {
    const res = await api.post('/auth/register', { name, email, phone, password, role });
    auth.setSession(res.token, res.user);
    toast.success('Account created successfully!');
    renderNav();
    if (role === 'landowner') go('landowner-dashboard');
    else go('user-dashboard');
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    document.getElementById('reg-spinner').classList.add('hidden');
    document.getElementById('reg-btn-text').textContent = 'Create Account';
  }
};
