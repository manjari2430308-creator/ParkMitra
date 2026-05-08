// ─── LANDOWNER SIDEBAR ────────────────────────────
function landownerSidebar(active = '') {
  return `<div class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">Dashboard</div>
      <div class="sidebar-item ${active === 'landowner-dashboard' ? 'active' : ''}" onclick="go('landowner-dashboard')"><span class="icon">📊</span> Overview</div>
      <div class="sidebar-item ${active === 'my-spaces' ? 'active' : ''}" onclick="go('my-spaces')"><span class="icon">🅿</span> My Spaces</div>
      <div class="sidebar-item ${active === 'add-space' ? 'active' : ''}" onclick="go('add-space')"><span class="icon">➕</span> Add Space</div>
      <div class="sidebar-item ${active === 'landowner-bookings' ? 'active' : ''}" onclick="go('landowner-bookings')"><span class="icon">📋</span> Bookings</div>
      <div class="sidebar-item ${active === 'earnings' ? 'active' : ''}" onclick="go('earnings')"><span class="icon">💰</span> Earnings</div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Account</div>
      <div class="sidebar-item" onclick="logout()"><span class="icon">🚪</span> Logout</div>
    </div>
  </div>`;
}

// ─── LANDOWNER DASHBOARD ──────────────────────────
async function pages_landownerDashboard(container) {
  const user = auth.getUser();
  container.innerHTML = `
    <div class="layout">
      ${landownerSidebar('landowner-dashboard')}
      <div class="main-content page">
        <div style="margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
          <div>
            <h1 style="font-family:Syne;font-size:28px;font-weight:800">Owner Dashboard</h1>
            <p style="color:var(--text-muted);margin-top:4px">Welcome back, ${user.name}!</p>
          </div>
          <button class="btn btn-primary" onclick="go('add-space')">+ Add New Space</button>
        </div>
        <div id="owner-stats"><div class="spinner" style="display:block;margin:40px auto"></div></div>
        <div style="margin-top:32px">
          <h2 style="font-family:Syne;font-size:20px;font-weight:700;margin-bottom:16px">Recent Bookings</h2>
          <div id="owner-recent-bookings"><div class="spinner" style="display:block;margin:20px auto"></div></div>
        </div>
      </div>
    </div>`;

  try {
    const [spacesRes, bookingsRes] = await Promise.all([api.get('/parking/my'), api.get('/bookings/landowner')]);
    const spaces = spacesRes.data;
    const bookings = bookingsRes.data;

    const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
    const activeSlots = spaces.reduce((s, sp) => s + sp.availableSlots, 0);
    const totalSlots = spaces.reduce((s, sp) => s + sp.totalSlots, 0);

    document.getElementById('owner-stats').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${spaces.length}</div><div class="stat-label">Total Spaces</div><div class="stat-icon">🅿</div></div>
        <div class="stat-card"><div class="stat-value">${bookings.length}</div><div class="stat-label">Total Bookings</div><div class="stat-icon">📋</div></div>
        <div class="stat-card"><div class="stat-value">${activeSlots}/${totalSlots}</div><div class="stat-label">Available Slots</div><div class="stat-icon">🚗</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent)">${fmt.currency(totalRevenue)}</div><div class="stat-label">Total Earnings</div><div class="stat-icon">💰</div></div>
      </div>`;

    const recent = bookings.slice(0, 5);
    document.getElementById('owner-recent-bookings').innerHTML = recent.length > 0 ? `
      <div class="table-container">
        <table>
          <thead><tr><th>User</th><th>Space</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            ${recent.map(b => `<tr>
              <td>${b.user?.name || 'N/A'}</td>
              <td>${b.parkingSpace?.name || 'N/A'}</td>
              <td>${fmt.date(b.createdAt)}</td>
              <td style="color:var(--accent);font-weight:600">${fmt.currency(b.totalAmount)}</td>
              <td>${fmt.statusBadge(b.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<div style="text-align:center;padding:40px;color:var(--text-muted)">No bookings yet</div>`;
  } catch (err) {
    toast.error('Failed to load dashboard: ' + err.message);
  }
}

// ─── ADD SPACE ────────────────────────────────────
let addSpaceMap = null;
let selectedLatLng = null;

function pages_addSpace(container) {
  container.innerHTML = `
    <div class="layout">
      ${landownerSidebar('add-space')}
      <div class="main-content page">
        <div style="margin-bottom:28px;display:flex;align-items:center;gap:16px">
          <button class="btn btn-ghost" onclick="go('my-spaces')">← Back</button>
          <h1 style="font-family:Syne;font-size:28px;font-weight:800">Add Parking Space</h1>
        </div>

        <div id="add-alert"></div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          <div style="display:flex;flex-direction:column;gap:16px">
            <div class="form-group"><label>Space Name *</label><input id="sp-name" class="input" placeholder="e.g. Civil Lines Parking Zone A"></div>
            <div class="form-group"><label>Address *</label><input id="sp-address" class="input" placeholder="Full address of parking space"></div>
            <div class="form-group"><label>Description</label><textarea id="sp-desc" class="textarea" placeholder="Describe your parking space..."></textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><label>Total Slots *</label><input id="sp-slots" class="input" type="number" min="1" placeholder="10"></div>
              <div class="form-group"><label>Price/Hour (₹) *</label><input id="sp-price" class="input" type="number" min="1" placeholder="40"></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><label>Opens At</label><input id="sp-open" class="input" type="time" value="06:00"></div>
              <div class="form-group"><label>Closes At</label><input id="sp-close" class="input" type="time" value="22:00"></div>
            </div>
            <div class="form-group">
              <label>Vehicle Types</label>
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px">
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer"><input type="checkbox" id="vt-car" checked> 🚗 Car</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer"><input type="checkbox" id="vt-bike"> 🏍 Bike</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer"><input type="checkbox" id="vt-truck"> 🚛 Truck</label>
              </div>
            </div>
            <div class="form-group">
              <label>Amenities</label>
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px">
                ${['CCTV', 'Security Guard', 'EV Charging', 'Covered', '24/7'].map(a => `<label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer"><input type="checkbox" id="am-${a.replace(/\s/g,'')}"> ${a}</label>`).join('')}
              </div>
            </div>
            <button class="btn btn-primary btn-lg" onclick="submitSpace()">
              <span id="sp-btn-text">List My Parking Space</span>
              <span id="sp-spinner" class="spinner hidden"></span>
            </button>
          </div>

          <div>
            <div class="form-group" style="margin-bottom:12px">
              <label>Pin Location on Map *</label>
              <p style="font-size:13px;color:var(--text-muted);margin-top:4px">Click on the map to select your parking location</p>
            </div>
            <div id="add-space-map" style="height:400px;border-radius:var(--radius);border:1px solid var(--border)"></div>
            <div id="selected-coords" style="margin-top:12px;padding:12px;background:var(--surface2);border-radius:10px;font-size:13px;color:var(--text-muted)">
              📍 No location selected — click on map to pin
            </div>
          </div>
        </div>
      </div>
    </div>`;

  setTimeout(() => {
    addSpaceMap = L.map('add-space-map').setView([26.4499, 80.3319], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© CARTO' }).addTo(addSpaceMap);

    let pinMarker = null;
    addSpaceMap.on('click', (e) => {
      selectedLatLng = e.latlng;
      if (pinMarker) addSpaceMap.removeLayer(pinMarker);
      pinMarker = L.marker(e.latlng).addTo(addSpaceMap);
      document.getElementById('selected-coords').innerHTML = `📍 Selected: <b>${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}</b>`;
    });
  }, 100);
}

window.submitSpace = async () => {
  const name = document.getElementById('sp-name').value.trim();
  const address = document.getElementById('sp-address').value.trim();
  const desc = document.getElementById('sp-desc').value.trim();
  const totalSlots = document.getElementById('sp-slots').value;
  const pricePerHour = document.getElementById('sp-price').value;
  const open = document.getElementById('sp-open').value;
  const close = document.getElementById('sp-close').value;

  if (!name || !address || !totalSlots || !pricePerHour) {
    document.getElementById('add-alert').innerHTML = `<div class="alert alert-error">Please fill all required fields</div>`;
    return;
  }
  if (!selectedLatLng) {
    document.getElementById('add-alert').innerHTML = `<div class="alert alert-error">Please pin your location on the map</div>`;
    return;
  }

  const vehicleTypes = ['car', 'bike', 'truck'].filter(v => document.getElementById(`vt-${v}`)?.checked);
  const amenities = ['CCTV', 'Security Guard', 'EV Charging', 'Covered', '24/7'].filter(a => document.getElementById(`am-${a.replace(/\s/g,'')}`)?.checked);

  document.getElementById('sp-spinner').classList.remove('hidden');
  document.getElementById('sp-btn-text').textContent = 'Listing...';

  try {
    await api.post('/parking', {
      name, address, description: desc,
      lat: selectedLatLng.lat, lng: selectedLatLng.lng,
      totalSlots, pricePerHour, vehicleTypes, amenities,
      operatingHours: { open, close }
    });
    toast.success('Space listed! Awaiting admin approval.');
    go('my-spaces');
  } catch (err) {
    document.getElementById('add-alert').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    document.getElementById('sp-spinner').classList.add('hidden');
    document.getElementById('sp-btn-text').textContent = 'List My Parking Space';
  }
};

// ─── MY SPACES ────────────────────────────────────
async function pages_mySpaces(container) {
  container.innerHTML = `
    <div class="layout">
      ${landownerSidebar('my-spaces')}
      <div class="main-content page">
        <div style="margin-bottom:28px;display:flex;justify-content:space-between;align-items:center">
          <h1 style="font-family:Syne;font-size:28px;font-weight:800">My Parking Spaces</h1>
          <button class="btn btn-primary" onclick="go('add-space')">+ Add Space</button>
        </div>
        <div id="my-spaces-list"><div class="spinner" style="display:block;margin:40px auto"></div></div>
      </div>
    </div>`;

  try {
    const res = await api.get('/parking/my');
    const el = document.getElementById('my-spaces-list');

    if (!res.data.length) {
      el.innerHTML = `<div style="text-align:center;padding:80px;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">🅿</div><p>No spaces listed yet</p><button class="btn btn-primary" onclick="go('add-space')" style="margin-top:20px">Add Your First Space</button></div>`;
      return;
    }

    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px">
      ${res.data.map(space => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div>
              <div style="font-family:Syne;font-size:18px;font-weight:700">${space.name}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px">📍 ${space.address.substring(0,40)}...</div>
            </div>
            ${fmt.statusBadge(space.status)}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
            <div style="background:var(--surface2);padding:10px;border-radius:8px;text-align:center"><div style="font-size:20px;font-weight:800;font-family:Syne;color:var(--accent)">₹${space.pricePerHour}</div><div style="font-size:10px;color:var(--text-muted)">PER HOUR</div></div>
            <div style="background:var(--surface2);padding:10px;border-radius:8px;text-align:center"><div style="font-size:20px;font-weight:800;font-family:Syne">${space.availableSlots}</div><div style="font-size:10px;color:var(--text-muted)">AVAILABLE</div></div>
            <div style="background:var(--surface2);padding:10px;border-radius:8px;text-align:center"><div style="font-size:20px;font-weight:800;font-family:Syne">${space.totalSlots}</div><div style="font-size:10px;color:var(--text-muted)">TOTAL</div></div>
          </div>
          <div style="display:flex;gap:8px">
            <input type="number" id="slots-${space._id}" class="input" value="${space.availableSlots}" min="0" max="${space.totalSlots}" style="flex:1">
            <button class="btn btn-secondary btn-sm" onclick="updateSlots('${space._id}', ${space.totalSlots})">Update Slots</button>
          </div>
        </div>`).join('')}
    </div>`;
  } catch (err) {
    document.getElementById('my-spaces-list').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

window.updateSlots = async (spaceId, totalSlots) => {
  const val = parseInt(document.getElementById(`slots-${spaceId}`).value);
  if (isNaN(val) || val < 0 || val > totalSlots) { toast.error('Invalid slot count'); return; }
  try {
    await api.patch(`/parking/${spaceId}/availability`, { availableSlots: val });
    toast.success('Availability updated!');
  } catch (err) { toast.error(err.message); }
};

// ─── LANDOWNER BOOKINGS ───────────────────────────
async function pages_landownerBookings(container) {
  container.innerHTML = `
    <div class="layout">
      ${landownerSidebar('landowner-bookings')}
      <div class="main-content page">
        <h1 style="font-family:Syne;font-size:28px;font-weight:800;margin-bottom:24px">Bookings on My Spaces</h1>
        <div id="lo-bookings"><div class="spinner" style="display:block;margin:40px auto"></div></div>
      </div>
    </div>`;

  try {
    const res = await api.get('/bookings/landowner');
    const el = document.getElementById('lo-bookings');
    if (!res.data.length) { el.innerHTML = `<div style="text-align:center;padding:80px;color:var(--text-muted)">No bookings yet on your spaces</div>`; return; }

    el.innerHTML = `<div class="table-container"><table>
      <thead><tr><th>Customer</th><th>Phone</th><th>Space</th><th>Vehicle</th><th>Start</th><th>End</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>
        ${res.data.map(b => `<tr>
          <td><div style="font-weight:600">${b.user?.name}</div><div style="font-size:12px;color:var(--text-muted)">${b.user?.email}</div></td>
          <td>${b.user?.phone || 'N/A'}</td>
          <td>${b.parkingSpace?.name}</td>
          <td><b>${b.vehicleNumber}</b><br><small style="color:var(--text-muted)">${b.vehicleType}</small></td>
          <td>${fmt.datetime(b.startTime)}</td>
          <td>${fmt.datetime(b.endTime)}</td>
          <td style="color:var(--accent);font-weight:700">${fmt.currency(b.totalAmount)}</td>
          <td>${fmt.statusBadge(b.status)}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
  } catch (err) {
    document.getElementById('lo-bookings').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// ─── EARNINGS ─────────────────────────────────────
async function pages_earnings(container) {
  container.innerHTML = `
    <div class="layout">
      ${landownerSidebar('earnings')}
      <div class="main-content page">
        <h1 style="font-family:Syne;font-size:28px;font-weight:800;margin-bottom:24px">Earnings 💰</h1>
        <div id="earnings-content"><div class="spinner" style="display:block;margin:40px auto"></div></div>
      </div>
    </div>`;

  try {
    const bookingsRes = await api.get('/bookings/landowner');
    const bookings = bookingsRes.data;
    const paid = bookings.filter(b => b.paymentStatus === 'paid');
    const totalRevenue = paid.reduce((s, b) => s + b.totalAmount, 0);

    // Monthly grouping
    const monthly = {};
    paid.forEach(b => {
      const key = new Date(b.createdAt).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      monthly[key] = (monthly[key] || 0) + b.totalAmount;
    });
    const monthKeys = Object.keys(monthly).slice(-6);
    const monthVals = monthKeys.map(k => monthly[k]);
    const maxVal = Math.max(...monthVals, 1);

    document.getElementById('earnings-content').innerHTML = `
      <div class="stats-grid" style="margin-bottom:32px">
        <div class="stat-card"><div class="stat-value" style="color:var(--accent)">${fmt.currency(totalRevenue)}</div><div class="stat-label">Total Earnings</div></div>
        <div class="stat-card"><div class="stat-value">${paid.length}</div><div class="stat-label">Paid Bookings</div></div>
        <div class="stat-card"><div class="stat-value">${bookings.length > 0 ? fmt.currency(totalRevenue / Math.max(paid.length, 1)) : '₹0'}</div><div class="stat-label">Avg Per Booking</div></div>
      </div>

      <div class="card">
        <h3 style="font-family:Syne;font-size:18px;font-weight:700;margin-bottom:20px">Monthly Revenue</h3>
        ${monthKeys.length > 0 ? `
          <div class="earnings-chart">
            ${monthKeys.map((k, i) => `
              <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:8px">
                <div style="font-size:11px;color:var(--text-muted)">${fmt.currency(monthly[k])}</div>
                <div class="earnings-bar" style="width:100%;height:${(monthVals[i] / maxVal) * 100}%"></div>
                <div style="font-size:11px;color:var(--text-muted)">${k}</div>
              </div>`).join('')}
          </div>` : `<div style="text-align:center;padding:40px;color:var(--text-muted)">No earnings data yet</div>`}
      </div>`;
  } catch (err) {
    document.getElementById('earnings-content').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}
