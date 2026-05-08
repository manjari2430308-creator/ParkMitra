// ─── USER DASHBOARD ───────────────────────────────
let userMap = null;
let userMarkers = [];

function pages_userDashboard(container) {
  const user = auth.getUser();
  container.innerHTML = `
    <div class="layout">
      ${userSidebar()}
      <div class="main-content page">
        <div style="margin-bottom:28px">
          <h1 style="font-family:Syne;font-size:28px;font-weight:800">Find Parking 🔍</h1>
          <p style="color:var(--text-muted);margin-top:4px">Hello, ${user.name.split(' ')[0]}! Tap "Use My Location" to find spots near you.</p>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:flex-end">
          <div style="flex:1;min-width:200px">
            <input id="search-address" class="input" placeholder="Search by area (e.g. Kanpur Civil Lines)..." style="height:44px">
          </div>
          <select id="filter-vehicle" class="select" style="width:160px;height:44px">
            <option value="">All Vehicles</option>
            <option value="car">🚗 Car</option>
            <option value="bike">🏍 Bike</option>
            <option value="truck">🚛 Truck</option>
          </select>
          <button class="btn btn-primary" onclick="getUserLocation()">📍 Use My Location</button>
          <button class="btn btn-secondary" onclick="searchNearby()">🔍 Search</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 380px;gap:20px;min-height:500px" id="map-grid">
          <div>
            <div id="user-map" style="height:480px;border-radius:var(--radius);border:1px solid var(--border)"></div>
          </div>
          <div>
            <div style="margin-bottom:12px;font-size:13px;font-weight:600;color:var(--text-muted)" id="results-label">Searching nearby spaces...</div>
            <div id="parking-list" style="display:flex;flex-direction:column;gap:12px;max-height:460px;overflow-y:auto">
              <div style="text-align:center;padding:40px;color:var(--text-muted)">
                <div style="font-size:40px;margin-bottom:12px">📍</div>
                <p>Allow location access or search to see nearby parking spots</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  setTimeout(initUserMap, 100);
}

function userSidebar() {
  return `<div class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">Navigation</div>
      <div class="sidebar-item active" onclick="go('user-dashboard')"><span class="icon">🗺</span> Find Parking</div>
      <div class="sidebar-item" onclick="go('booking-history')"><span class="icon">📋</span> My Bookings</div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Account</div>
      <div class="sidebar-item" onclick="logout()"><span class="icon">🚪</span> Logout</div>
    </div>
  </div>`;
}

function initUserMap() {
  if (userMap) { userMap.remove(); userMap = null; }
  userMap = L.map('user-map').setView([26.4499, 80.3319], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO'
  }).addTo(userMap);
  getUserLocation();
}

window.getUserLocation = async () => {
  try {
    const pos = await geo.getCurrentPosition();
    if (userMap) {
      userMap.setView([pos.lat, pos.lng], 15);
      const userIcon = L.divIcon({ html: `<div style="background:#00d4aa;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(0,212,170,0.2)"></div>`, className: '', iconAnchor: [8, 8] });
      L.marker([pos.lat, pos.lng], { icon: userIcon }).addTo(userMap).bindPopup('📍 You are here');
    }
    await fetchNearbySpaces(pos.lat, pos.lng);
  } catch (err) {
    toast.error('Location access denied. Please search manually.');
    // Load all approved spaces
    fetchAllSpaces();
  }
};

async function fetchNearbySpaces(lat, lng) {
  try {
    const vehicle = document.getElementById('filter-vehicle')?.value || '';
    let url = `/nearby?lat=${lat}&lng=${lng}&radius=5000`;
    if (vehicle) url += `&vehicleType=${vehicle}`;
    const res = await api.get(`/parking${url}`);
    renderParkingList(res.data);
    renderMapMarkers(res.data);
    const label = document.getElementById('results-label');
    if (label) label.textContent = `${res.count} spaces found nearby`;
  } catch (err) {
    toast.error('Failed to fetch parking spaces');
  }
}

async function fetchAllSpaces() {
  try {
    const res = await api.get('/parking');
    renderParkingList(res.data);
    renderMapMarkers(res.data);
    const label = document.getElementById('results-label');
    if (label) label.textContent = `${res.count} total spaces available`;
  } catch (err) { /* ignore */ }
}

window.searchNearby = async () => {
  const address = document.getElementById('search-address').value.trim();
  if (!address) { getUserLocation(); return; }
  // Use OpenStreetMap Nominatim for geocoding
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
    const data = await res.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      if (userMap) userMap.setView([parseFloat(lat), parseFloat(lon)], 15);
      fetchNearbySpaces(parseFloat(lat), parseFloat(lon));
    } else { toast.error('Location not found'); }
  } catch (err) { toast.error('Geocoding failed'); }
};

function renderMapMarkers(spaces) {
  if (!userMap) return;
  userMarkers.forEach(m => userMap.removeLayer(m));
  userMarkers = [];

  spaces.forEach(space => {
    if (!space.location?.coordinates) return;
    const [lng, lat] = space.location.coordinates;
    const icon = L.divIcon({
      html: `<div style="background:${space.availableSlots > 0 ? 'linear-gradient(135deg,#00d4aa,#0099ff)' : '#ef4444'};color:#000;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.5);cursor:pointer">₹${space.pricePerHour}/hr</div>`,
      className: '', iconAnchor: [40, 14]
    });
    const marker = L.marker([lat, lng], { icon }).addTo(userMap);
    marker.bindPopup(`
      <div style="min-width:200px">
        <b style="font-size:14px">${space.name}</b><br>
        <small style="color:#aaa">${space.address}</small><br><br>
        <b style="color:#00d4aa">₹${space.pricePerHour}/hr</b> · ${space.availableSlots} slots<br><br>
        <button onclick="openBookingModal('${space._id}')" style="background:linear-gradient(135deg,#00d4aa,#0099ff);border:none;color:#000;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer;width:100%">Book Now</button>
      </div>`);
    userMarkers.push(marker);
  });
}

function renderParkingList(spaces) {
  const list = document.getElementById('parking-list');
  if (!list) return;

  if (!spaces.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:40px;margin-bottom:12px">🅿</div><p>No parking spaces found in this area</p></div>`;
    return;
  }

  list.innerHTML = spaces.map(space => {
    const fillPct = space.totalSlots > 0 ? ((space.availableSlots / space.totalSlots) * 100) : 0;
    const avail = space.availableSlots > 0;
    return `
      <div class="parking-card" onclick="openBookingModal('${space._id}')">
        <div class="parking-card-header">
          <div>
            <div class="parking-name">${space.name}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">📍 ${space.address.substring(0, 40)}...</div>
          </div>
          <div style="text-align:right">
            <div class="parking-price">₹${space.pricePerHour}<span>/hr</span></div>
            <span class="badge badge-${avail ? 'success' : 'error'}" style="margin-top:4px">${avail ? 'Available' : 'Full'}</span>
          </div>
        </div>
        <div class="parking-meta">
          <span class="parking-meta-item">🅿 ${space.availableSlots}/${space.totalSlots} slots</span>
          <span class="parking-meta-item">⭐ ${space.averageRating > 0 ? space.averageRating.toFixed(1) : 'New'}</span>
        </div>
        <div class="slots-bar"><div class="slots-fill" style="width:${fillPct}%;background:${fillPct > 50 ? 'var(--grad)' : fillPct > 20 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'var(--error)'}"></div></div>
      </div>`;
  }).join('');
}

window.openBookingModal = async (spaceId) => {
  const user = auth.getUser();
  if (!user) { go('login'); return; }

  try {
    const res = await api.get(`/parking/${spaceId}`);
    const space = res.data;
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 60000).toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 150 * 60000).toISOString().slice(0, 16);

    modal.show(`Book: ${space.name}`,
      `<div style="display:flex;flex-direction:column;gap:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="card card-sm"><div style="color:var(--text-muted);font-size:12px">Price</div><div style="font-weight:800;color:var(--accent);font-size:18px;font-family:Syne">₹${space.pricePerHour}/hr</div></div>
          <div class="card card-sm"><div style="color:var(--text-muted);font-size:12px">Available</div><div style="font-weight:800;font-size:18px;font-family:Syne">${space.availableSlots} slots</div></div>
        </div>
        <div class="form-group"><label>Vehicle Number</label><input id="bk-vehicle-no" class="input" placeholder="UP78AB1234" style="text-transform:uppercase"></div>
        <div class="form-group"><label>Vehicle Type</label>
          <select id="bk-vehicle-type" class="select"><option value="car">🚗 Car</option><option value="bike">🏍 Bike</option><option value="truck">🚛 Truck</option></select>
        </div>
        <div class="form-group"><label>Start Time</label><input id="bk-start" class="input" type="datetime-local" value="${start}"></div>
        <div class="form-group"><label>End Time</label><input id="bk-end" class="input" type="datetime-local" value="${end}"></div>
        <div id="bk-estimate" style="background:var(--surface2);border-radius:10px;padding:14px;font-size:14px;color:var(--text-muted)">Select times to see price estimate</div>
      </div>`,
      `<button class="btn btn-secondary" onclick="modal.hide()">Cancel</button>
       <button class="btn btn-primary" onclick="confirmBooking('${space._id}', ${space.pricePerHour})">Confirm Booking</button>`
    );

    // Live estimate
    ['bk-start', 'bk-end'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        const s = new Date(document.getElementById('bk-start').value);
        const e = new Date(document.getElementById('bk-end').value);
        if (e > s) {
          const hrs = ((e - s) / 3600000).toFixed(1);
          const total = Math.ceil(hrs * space.pricePerHour);
          document.getElementById('bk-estimate').innerHTML = `⏱ <b>${hrs} hours</b> · Total: <b style="color:var(--accent)">${fmt.currency(total)}</b>`;
        }
      });
    });
  } catch (err) { toast.error('Failed to load parking details'); }
};

window.confirmBooking = async (spaceId, pricePerHour) => {
  const vehicleNumber = document.getElementById('bk-vehicle-no').value.trim().toUpperCase();
  const vehicleType = document.getElementById('bk-vehicle-type').value;
  const startTime = document.getElementById('bk-start').value;
  const endTime = document.getElementById('bk-end').value;

  if (!vehicleNumber || !startTime || !endTime) { toast.error('Please fill all fields'); return; }
  if (new Date(endTime) <= new Date(startTime)) { toast.error('End time must be after start time'); return; }

  try {
    loader.show('Creating booking...');
    const res = await api.post('/bookings', { parkingSpaceId: spaceId, vehicleNumber, vehicleType, startTime, endTime });
    modal.hide();
    loader.hide();
    showPaymentModal(res.data);
  } catch (err) {
    loader.hide();
    toast.error(err.message);
  }
};

function showPaymentModal(booking) {
  modal.show('💳 Complete Payment',
    `<div style="display:flex;flex-direction:column;gap:16px">
      <div class="alert alert-info">Test mode — no real payment will be charged</div>
      <div class="card" style="background:var(--surface2)">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-muted)">Booking ID</span><span style="font-family:monospace;font-size:12px">${booking._id.slice(-8).toUpperCase()}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-muted)">Duration</span><span>${booking.duration?.toFixed(1)} hours</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-muted)">Vehicle</span><span>${booking.vehicleNumber}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;font-family:Syne;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><span>Total</span><span style="color:var(--accent)">${fmt.currency(booking.totalAmount)}</span></div>
      </div>
      <div class="form-group"><label>Card Number (test: 4242 4242 4242 4242)</label><input class="input" placeholder="4242 4242 4242 4242" value="4242 4242 4242 4242"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>Expiry</label><input class="input" placeholder="12/26" value="12/26"></div>
        <div class="form-group"><label>CVV</label><input class="input" placeholder="123" value="123"></div>
      </div>
    </div>`,
    `<button class="btn btn-secondary" onclick="modal.hide()">Cancel</button>
     <button class="btn btn-primary" onclick="processPayment('${booking._id}')">💳 Pay ${fmt.currency(booking.totalAmount)}</button>`
  );
}

window.processPayment = async (bookingId) => {
  try {
    loader.show('Processing payment...');
    const piRes = await api.post('/payments/create-intent', { bookingId });
    await new Promise(r => setTimeout(r, 1500)); // Simulate processing
    await api.post('/payments/confirm', { paymentId: piRes.paymentId, paymentIntentId: piRes.clientSecret });
    loader.hide();
    modal.hide();
    toast.success('🎉 Payment successful! Your slot is confirmed.');
    setTimeout(() => go('booking-history'), 1500);
  } catch (err) {
    loader.hide();
    toast.error('Payment failed: ' + err.message);
  }
};

// ─── BOOKING HISTORY ──────────────────────────────
async function pages_bookingHistory(container) {
  container.innerHTML = `
    <div class="layout">
      ${userSidebar()}
      <div class="main-content page">
        <h1 style="font-family:Syne;font-size:28px;font-weight:800;margin-bottom:24px">My Bookings 📋</h1>
        <div id="bookings-content"><div class="spinner" style="margin:40px auto;display:block"></div></div>
      </div>
    </div>`;

  try {
    const res = await api.get('/bookings/my');
    const bookings = res.data;
    const el = document.getElementById('bookings-content');

    if (!bookings.length) {
      el.innerHTML = `<div style="text-align:center;padding:80px;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">📭</div><p style="font-size:18px">No bookings yet</p><a href="#user-dashboard" class="btn btn-primary" style="margin-top:20px">Find Parking</a></div>`;
      return;
    }

    el.innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr><th>Parking Space</th><th>Vehicle</th><th>Start</th><th>End</th><th>Duration</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td><div style="font-weight:600">${b.parkingSpace?.name || 'N/A'}</div><div style="font-size:12px;color:var(--text-muted)">${b.parkingSpace?.address?.substring(0,30) || ''}...</div></td>
                <td><div style="font-weight:600">${b.vehicleNumber}</div><div style="font-size:12px;color:var(--text-muted)">${b.vehicleType}</div></td>
                <td>${fmt.datetime(b.startTime)}</td>
                <td>${fmt.datetime(b.endTime)}</td>
                <td>${b.duration?.toFixed(1)}h</td>
                <td style="color:var(--accent);font-weight:700">${fmt.currency(b.totalAmount)}</td>
                <td>${fmt.statusBadge(b.status)}</td>
                <td>${['pending','confirmed'].includes(b.status) ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b._id}')">Cancel</button>` : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    document.getElementById('bookings-content').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

window.cancelBooking = async (id) => {
  if (!confirm('Cancel this booking?')) return;
  try {
    await api.patch(`/bookings/${id}/cancel`);
    toast.success('Booking cancelled');
    go('booking-history');
  } catch (err) { toast.error(err.message); }
};
