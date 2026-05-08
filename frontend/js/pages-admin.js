// ─── ADMIN SIDEBAR ────────────────────────────────
function adminSidebar(active = '') {
  return `<div class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">Admin Panel</div>
      <div class="sidebar-item ${active === 'admin-dashboard' ? 'active' : ''}" onclick="go('admin-dashboard')"><span class="icon">📊</span> Dashboard</div>
      <div class="sidebar-item ${active === 'admin-users' ? 'active' : ''}" onclick="go('admin-users')"><span class="icon">👥</span> Users</div>
      <div class="sidebar-item ${active === 'admin-spaces' ? 'active' : ''}" onclick="go('admin-spaces')"><span class="icon">🅿</span> Parking Spaces</div>
      <div class="sidebar-item ${active === 'admin-bookings' ? 'active' : ''}" onclick="go('admin-bookings')"><span class="icon">📋</span> All Bookings</div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Account</div>
      <div class="sidebar-item" onclick="logout()"><span class="icon">🚪</span> Logout</div>
    </div>
  </div>`;
}

// ─── ADMIN DASHBOARD ──────────────────────────────
async function pages_adminDashboard(container) {
  container.innerHTML = `
    <div class="layout">
      ${adminSidebar('admin-dashboard')}
      <div class="main-content page">
        <div style="margin-bottom:28px">
          <h1 style="font-family:Syne;font-size:28px;font-weight:800">Admin Dashboard ⚙️</h1>
          <p style="color:var(--text-muted);margin-top:4px">Platform overview and management</p>
        </div>
        <div id="admin-stats"><div class="spinner" style="display:block;margin:40px auto"></div></div>
        <div style="margin-top:32px">
          <h2 style="font-family:Syne;font-size:20px;font-weight:700;margin-bottom:16px">Recent Bookings</h2>
          <div id="admin-recent"></div>
        </div>
      </div>
    </div>`;

  try {
    const res = await api.get('/admin/dashboard');
    const d = res.data;

    document.getElementById('admin-stats').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${d.totalUsers}</div><div class="stat-label">Total Users</div><div class="stat-icon">👤</div></div>
        <div class="stat-card"><div class="stat-value">${d.totalLandowners}</div><div class="stat-label">Land Owners</div><div class="stat-icon">🏢</div></div>
        <div class="stat-card"><div class="stat-value">${d.totalSpaces}</div><div class="stat-label">Active Spaces</div><div class="stat-icon">🅿</div></div>
        <div class="stat-card" style="border-color:rgba(245,158,11,0.3)"><div class="stat-value" style="color:var(--warning)">${d.pendingSpaces}</div><div class="stat-label">Pending Approval</div><div class="stat-icon">⏳</div></div>
        <div class="stat-card"><div class="stat-value">${d.totalBookings}</div><div class="stat-label">Total Bookings</div><div class="stat-icon">📋</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent)">${fmt.currency(d.revenue)}</div><div class="stat-label">Platform Revenue</div><div class="stat-icon">💰</div></div>
      </div>`;

    const bookings = d.recentBookings || [];
    document.getElementById('admin-recent').innerHTML = bookings.length > 0 ? `
      <div class="table-container">
        <table>
          <thead><tr><th>User</th><th>Space</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            ${bookings.map(b => `<tr>
              <td>${b.user?.name || 'N/A'}</td>
              <td>${b.parkingSpace?.name || 'N/A'}</td>
              <td>${fmt.date(b.createdAt)}</td>
              <td style="color:var(--accent);font-weight:600">${fmt.currency(b.totalAmount)}</td>
              <td>${fmt.statusBadge(b.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<div style="text-align:center;padding:40px;color:var(--text-muted)">No recent bookings</div>`;
  } catch (err) {
    document.getElementById('admin-stats').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// ─── ADMIN USERS ──────────────────────────────────
async function pages_adminUsers(container) {
  container.innerHTML = `
    <div class="layout">
      ${adminSidebar('admin-users')}
      <div class="main-content page">
        <div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
          <h1 style="font-family:Syne;font-size:28px;font-weight:800">Manage Users</h1>
          <input id="user-search" class="input" placeholder="Search users..." style="width:240px" oninput="filterTable('users-tbody', this.value)">
        </div>
        <div id="admin-users-list"><div class="spinner" style="display:block;margin:40px auto"></div></div>
      </div>
    </div>`;

  try {
    const res = await api.get('/admin/users');
    document.getElementById('admin-users-list').innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
          <tbody id="users-tbody">
            ${res.data.map(u => `<tr data-search="${u.name} ${u.email}">
              <td style="font-weight:600">${u.name}</td>
              <td style="color:var(--text-muted)">${u.email}</td>
              <td>${u.phone || '—'}</td>
              <td><span class="badge badge-${u.role === 'admin' ? 'error' : u.role === 'landowner' ? 'info' : 'success'}">${u.role}</span></td>
              <td>${fmt.date(u.createdAt)}</td>
              <td><span class="badge badge-${u.isActive ? 'success' : 'error'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
              <td><button class="btn btn-${u.isActive ? 'danger' : 'secondary'} btn-sm" onclick="toggleUser('${u._id}', this)">${u.isActive ? 'Deactivate' : 'Activate'}</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    document.getElementById('admin-users-list').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

window.toggleUser = async (userId, btn) => {
  try {
    await api.patch(`/admin/users/${userId}/toggle`);
    toast.success('User status updated');
    go('admin-users');
  } catch (err) { toast.error(err.message); }
};

// ─── ADMIN SPACES ─────────────────────────────────
async function pages_adminSpaces(container) {
  container.innerHTML = `
    <div class="layout">
      ${adminSidebar('admin-spaces')}
      <div class="main-content page">
        <div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
          <h1 style="font-family:Syne;font-size:28px;font-weight:800">Parking Spaces</h1>
          <div style="display:flex;gap:8px">
            <select id="status-filter" class="select" style="width:160px" onchange="filterByStatus()">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div id="admin-spaces-list"><div class="spinner" style="display:block;margin:40px auto"></div></div>
      </div>
    </div>`;

  try {
    const res = await api.get('/admin/spaces');
    window._adminSpaces = res.data;
    renderAdminSpaces(res.data);
  } catch (err) {
    document.getElementById('admin-spaces-list').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderAdminSpaces(spaces) {
  document.getElementById('admin-spaces-list').innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr><th>Name</th><th>Owner</th><th>Address</th><th>Price</th><th>Slots</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${spaces.map(s => `<tr data-status="${s.status}">
            <td style="font-weight:600">${s.name}</td>
            <td>${s.owner?.name || 'N/A'}<br><small style="color:var(--text-muted)">${s.owner?.email || ''}</small></td>
            <td style="max-width:200px;font-size:13px;color:var(--text-muted)">${s.address.substring(0,50)}...</td>
            <td style="color:var(--accent);font-weight:700">₹${s.pricePerHour}/hr</td>
            <td>${s.availableSlots}/${s.totalSlots}</td>
            <td>${fmt.statusBadge(s.status)}</td>
            <td>
              <div style="display:flex;gap:6px">
                ${s.status !== 'approved' ? `<button class="btn btn-sm" style="background:var(--success);color:white;font-size:12px" onclick="updateSpaceStatus('${s._id}','approved')">✓ Approve</button>` : ''}
                ${s.status !== 'rejected' ? `<button class="btn btn-danger btn-sm" style="font-size:12px" onclick="updateSpaceStatus('${s._id}','rejected')">✕ Reject</button>` : ''}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

window.filterByStatus = () => {
  const filter = document.getElementById('status-filter').value;
  const spaces = window._adminSpaces || [];
  renderAdminSpaces(filter ? spaces.filter(s => s.status === filter) : spaces);
};

window.updateSpaceStatus = async (id, status) => {
  try {
    await api.patch(`/admin/spaces/${id}/status`, { status });
    toast.success(`Space ${status}`);
    go('admin-spaces');
  } catch (err) { toast.error(err.message); }
};

// ─── ADMIN BOOKINGS ───────────────────────────────
async function pages_adminBookings(container) {
  container.innerHTML = `
    <div class="layout">
      ${adminSidebar('admin-bookings')}
      <div class="main-content page">
        <h1 style="font-family:Syne;font-size:28px;font-weight:800;margin-bottom:24px">All Bookings</h1>
        <div id="admin-bookings-list"><div class="spinner" style="display:block;margin:40px auto"></div></div>
      </div>
    </div>`;

  try {
    const res = await api.get('/admin/bookings');
    const el = document.getElementById('admin-bookings-list');

    el.innerHTML = `
      <div style="margin-bottom:16px;font-size:14px;color:var(--text-muted)">Total: <b>${res.count}</b> bookings</div>
      <div class="table-container">
        <table>
          <thead><tr><th>Booking ID</th><th>User</th><th>Space</th><th>Duration</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
          <tbody>
            ${res.data.map(b => `<tr>
              <td style="font-family:monospace;font-size:11px">${b._id.slice(-8).toUpperCase()}</td>
              <td><div style="font-weight:600">${b.user?.name || 'N/A'}</div><div style="font-size:11px;color:var(--text-muted)">${b.user?.email || ''}</div></td>
              <td>${b.parkingSpace?.name || 'N/A'}</td>
              <td>${b.duration?.toFixed(1)}h</td>
              <td style="color:var(--accent);font-weight:700">${fmt.currency(b.totalAmount)}</td>
              <td>${fmt.statusBadge(b.status)}</td>
              <td>${fmt.statusBadge(b.paymentStatus)}</td>
              <td>${fmt.date(b.createdAt)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    document.getElementById('admin-bookings-list').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// ─── TABLE FILTER UTIL ────────────────────────────
window.filterTable = (tbodyId, query) => {
  const rows = document.querySelectorAll(`#${tbodyId} tr`);
  rows.forEach(row => {
    const text = (row.dataset.search || row.textContent).toLowerCase();
    row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
  });
};
