# 🅿 ParkMitra — Smart Parking Platform

> A full-stack web application connecting drivers with parking spaces — book, pay, and park in seconds.

---

## 🚀 Features

### 👤 User (Driver)
- Register / Login with JWT authentication
- Auto-detect location via GPS
- Search nearby parking on interactive Leaflet map
- View price/hour, availability, distance, ratings
- Book slots with date & time selection
- Stripe payment (test mode)
- Booking history with cancel option

### 🏢 Land Owner
- Register as land owner
- Add parking spaces with map pin
- Set price, slots, vehicle types, amenities, hours
- Update availability in real time
- View all bookings on their spaces
- Earnings dashboard with monthly chart

### ⚙️ Admin
- Full platform dashboard
- Approve / reject parking listings
- Manage users (activate/deactivate)
- Monitor all bookings and transactions
- Revenue analytics

---

## 🏗️ Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | HTML5, CSS3, Vanilla JavaScript   |
| Backend     | Node.js, Express.js (MVC)         |
| Database    | MongoDB + Mongoose                |
| Auth        | JWT (role-based: user/landowner/admin) |
| Maps        | Leaflet.js + OpenStreetMap (free) |
| Payments    | Stripe (test mode)                |
| Python      | Flask microservice (Haversine nearest-parking) |
| Container   | Docker + Docker Compose           |

---

## 📁 Project Structure

```
parkmitra/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── parkingController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js             # JWT + role guard
│   ├── models/
│   │   ├── User.js
│   │   ├── ParkingSpace.js
│   │   ├── Booking.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── parking.js
│   │   ├── booking.js
│   │   ├── payment.js
│   │   └── admin.js
│   ├── server.js               # Express entry point
│   ├── seed.js                 # Demo data seeder
│   ├── .env.sample
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── css/
│   │   └── style.css           # Full design system
│   ├── js/
│   │   ├── api.js              # Fetch wrapper + auth + toast
│   │   ├── app.js              # Router + Navbar
│   │   ├── pages-home-auth.js  # Home, Login, Register
│   │   ├── pages-user.js       # User dashboard + booking
│   │   ├── pages-landowner.js  # Owner dashboard
│   │   └── pages-admin.js      # Admin panel
│   └── index.html              # SPA entry point
│
├── python_service/
│   ├── app.py                  # Flask: Haversine nearest parking
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Python 3.9+ (for Python service)
- npm

---

### Step 1 — Clone & Setup

```bash
git clone <your-repo-url>
cd parkmitra
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.sample .env
# Edit .env with your values (see below)

# Start the server
npm run dev
```

**Edit `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/parkmitra
JWT_SECRET=your_very_long_secret_key_here
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_your_key_from_stripe_dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_from_stripe_dashboard
PYTHON_SERVICE_URL=http://localhost:8001
NODE_ENV=development
```

---

### Step 3 — Seed Demo Data

```bash
cd backend
node seed.js
```

This creates:
- 3 demo accounts (user, landowner, admin)
- 6 parking spaces in Kanpur
- 5 sample bookings

---

### Step 4 — Python Service (Optional but recommended)

```bash
cd python_service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python app.py
# Runs on http://localhost:8001
```

> The backend gracefully falls back if the Python service is unavailable.

---

### Step 5 — Open the App

The backend serves the frontend automatically:

```
http://localhost:5000
```

**Demo Login Credentials:**

| Role        | Email                    | Password   |
|-------------|--------------------------|------------|
| 👤 User     | user@demo.com            | demo1234   |
| 🏢 Owner    | owner@demo.com           | demo1234   |
| ⚙️ Admin    | admin@parkmitra.com      | admin1234  |

---

## 🐳 Docker Setup (Full Stack)

```bash
# From project root
docker-compose up --build

# App: http://localhost:5000
# Python: http://localhost:8001
# MongoDB: localhost:27017
```

To seed demo data in Docker:
```bash
docker exec parkmitra-backend node seed.js
```

---

## 🔌 API Reference

### Auth
```
POST /api/auth/register     — Register user/landowner
POST /api/auth/login        — Login
GET  /api/auth/me           — Get current user (🔒)
PUT  /api/auth/profile      — Update profile (🔒)
```

### Parking
```
GET  /api/parking                          — All approved spaces
GET  /api/parking/nearby?lat=&lng=&radius= — Nearby spaces
GET  /api/parking/my                       — Owner's spaces (🔒 landowner)
GET  /api/parking/:id                      — Single space
POST /api/parking                          — Add space (🔒 landowner)
PUT  /api/parking/:id                      — Update space (🔒)
PATCH /api/parking/:id/availability        — Update slots (🔒 landowner)
```

### Bookings
```
POST  /api/bookings              — Create booking (🔒 user)
GET   /api/bookings/my           — My bookings (🔒)
GET   /api/bookings/landowner    — Space bookings (🔒 landowner)
GET   /api/bookings/:id          — Single booking (🔒)
PATCH /api/bookings/:id/cancel   — Cancel booking (🔒)
```

### Payments
```
POST /api/payments/create-intent  — Create Stripe intent (🔒)
POST /api/payments/confirm        — Confirm payment (🔒)
GET  /api/payments/history        — Payment history (🔒)
```

### Admin
```
GET   /api/admin/dashboard         — Stats (🔒 admin)
GET   /api/admin/users             — All users (🔒 admin)
PATCH /api/admin/users/:id/toggle  — Toggle user (🔒 admin)
GET   /api/admin/spaces            — All spaces (🔒 admin)
PATCH /api/admin/spaces/:id/status — Approve/reject (🔒 admin)
GET   /api/admin/bookings          — All bookings (🔒 admin)
```

### Python Service
```
POST /nearest        — Rank spaces by composite score (dist + price + availability)
POST /distance       — Calculate Haversine distance between two points
POST /analytics/heatmap — Booking density heatmap data
GET  /health         — Service health check
```

---

## 💳 Stripe Setup (Test Mode)

1. Create a free account at [stripe.com](https://stripe.com)
2. Go to **Developers → API Keys**
3. Copy `Publishable key` and `Secret key`
4. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
5. Use test card: `4242 4242 4242 4242` (any future expiry, any CVV)

---

## 🗺️ Maps Setup

ParkMitra uses **Leaflet.js + OpenStreetMap** by default — **completely free, no API key needed**.

**Optional: Switch to Google Maps**
1. Get a Google Maps API key with Maps JavaScript API enabled
2. Add to `.env`: `GOOGLE_MAPS_API_KEY=your_key`
3. Update the tile layer in `pages-user.js` and `pages-home-auth.js`

---

## 🔐 Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with expiry
- Role-based access control (user / landowner / admin)
- Input validation on all API endpoints
- CORS configured
- Rate limiting ready to add via `express-rate-limit`

---

## 🧩 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/parkmitra` |
| `JWT_SECRET` | Secret key for JWT signing | `super_secret_key` |
| `JWT_EXPIRE` | Token expiry | `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret (test) | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable (test) | `pk_test_...` |
| `PYTHON_SERVICE_URL` | Python microservice URL | `http://localhost:8001` |
| `NODE_ENV` | Environment | `development` |

---

## 📸 Pages Overview

| Page | Route | Access |
|------|-------|--------|
| Home | `#home` | Public |
| Login | `#login` | Public |
| Register | `#register` | Public |
| Find Parking | `#user-dashboard` | User |
| Booking History | `#booking-history` | User |
| Owner Dashboard | `#landowner-dashboard` | Landowner |
| Add Space | `#add-space` | Landowner |
| My Spaces | `#my-spaces` | Landowner |
| Earnings | `#earnings` | Landowner |
| Admin Dashboard | `#admin-dashboard` | Admin |
| Manage Users | `#admin-users` | Admin |
| Manage Spaces | `#admin-spaces` | Admin |
| All Bookings | `#admin-bookings` | Admin |

---

## 🛣️ Roadmap / Future Enhancements

- [ ] Real-time slot updates via WebSocket
- [ ] SMS/Email notifications (Twilio/SendGrid)
- [ ] QR code entry system
- [ ] Mobile app (React Native)
- [ ] Monthly subscription plans
- [ ] AI-powered pricing recommendations
- [ ] Multi-city support with geofencing

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

Built with ❤️ for smarter cities · **ParkMitra © 2025**
