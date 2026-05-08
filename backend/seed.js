/**
 * ParkMitra — Database Seed Script
 * Run: node seed.js
 * Creates demo users, parking spaces, and sample bookings
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parkmitra';

// ── Inline schemas (to avoid circular deps) ──────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true },
  password: String, phone: String,
  role: { type: String, default: 'user' }, isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const parkingSchema = new mongoose.Schema({
  owner: mongoose.Schema.Types.ObjectId,
  name: String, description: String, address: String,
  location: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  totalSlots: Number, availableSlots: Number, pricePerHour: Number,
  amenities: [String], vehicleTypes: [String],
  status: { type: String, default: 'approved' },
  averageRating: { type: Number, default: 0 },
  operatingHours: { open: String, close: String },
  totalEarnings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
parkingSchema.index({ location: '2dsphere' });
const ParkingSpace = mongoose.model('ParkingSpace', parkingSchema);

const bookingSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  parkingSpace: mongoose.Schema.Types.ObjectId,
  vehicleNumber: String, vehicleType: String,
  startTime: Date, endTime: Date, duration: Number,
  totalAmount: Number, status: String, paymentStatus: String,
  slotNumber: String, createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

// ── Seed Data ─────────────────────────────────────────────────────────────────
const KANPUR = { lat: 26.4499, lng: 80.3319 };

const demoSpaces = [
  { name: 'Civil Lines Premium Parking', address: 'Civil Lines, Kanpur, UP 208001', lat: 26.455, lng: 80.330, slots: 30, price: 40, amenities: ['CCTV', 'Security Guard', 'Covered'], vehicles: ['car', 'bike'] },
  { name: 'Mall Road Parking Hub', address: 'Mall Road, Kanpur, UP 208001', lat: 26.448, lng: 80.338, slots: 50, price: 25, amenities: ['CCTV', '24/7'], vehicles: ['car', 'bike', 'truck'] },
  { name: 'Station Road Parking', address: 'Railway Station Road, Kanpur, UP 208004', lat: 26.452, lng: 80.325, slots: 80, price: 20, amenities: ['24/7'], vehicles: ['car', 'bike', 'truck'] },
  { name: 'Birhana Market Parking', address: 'Birhana Road, Kanpur, UP 208001', lat: 26.442, lng: 80.335, slots: 20, price: 35, amenities: ['CCTV', 'Covered'], vehicles: ['car', 'bike'] },
  { name: 'Z Square Mall Parking', address: 'Z Square Mall, Kanpur, UP 208001', lat: 26.460, lng: 80.322, slots: 120, price: 30, amenities: ['CCTV', 'EV Charging', 'Covered', 'Security Guard'], vehicles: ['car', 'bike'] },
  { name: 'Green Park Society Parking', address: 'Green Park, Kanpur, UP 208016', lat: 26.458, lng: 80.342, slots: 15, price: 50, amenities: ['CCTV', 'Covered'], vehicles: ['car'] },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany({}), ParkingSpace.deleteMany({}), Booking.deleteMany({})]);
    console.log('🗑️  Cleared existing data');

    const salt = await bcrypt.genSalt(10);
    const hashPw = (pw) => bcrypt.hash(pw, salt);

    // Create users
    const [adminUser, ownerUser, regularUser] = await Promise.all([
      User.create({ name: 'Admin ParkMitra', email: 'admin@parkmitra.com', password: await hashPw('admin1234'), role: 'admin', phone: '+91 9999000001' }),
      User.create({ name: 'Ramesh Gupta', email: 'owner@demo.com', password: await hashPw('demo1234'), role: 'landowner', phone: '+91 9876543210' }),
      User.create({ name: 'Priya Sharma', email: 'user@demo.com', password: await hashPw('demo1234'), role: 'user', phone: '+91 9123456789' }),
    ]);
    console.log('👥 Created 3 demo users');

    // Create parking spaces
    const spaces = await Promise.all(demoSpaces.map(sp =>
      ParkingSpace.create({
        owner: ownerUser._id,
        name: sp.name, description: `Premium parking at ${sp.name}. Secure and convenient.`,
        address: sp.address,
        location: { type: 'Point', coordinates: [sp.lng, sp.lat] },
        totalSlots: sp.slots,
        availableSlots: Math.floor(sp.slots * 0.6),
        pricePerHour: sp.price,
        amenities: sp.amenities,
        vehicleTypes: sp.vehicles,
        status: 'approved',
        averageRating: (3.5 + Math.random() * 1.5).toFixed(1),
        operatingHours: { open: '06:00', close: '22:00' }
      })
    ));
    console.log(`🅿  Created ${spaces.length} parking spaces`);

    // Create sample bookings
    const now = new Date();
    const bookingData = [
      { status: 'completed', paymentStatus: 'paid', daysAgo: 5, hours: 2, space: spaces[0], amount: 80 },
      { status: 'completed', paymentStatus: 'paid', daysAgo: 3, hours: 3, space: spaces[1], amount: 75 },
      { status: 'confirmed', paymentStatus: 'paid', daysAgo: 0, hours: 2, space: spaces[2], amount: 40 },
      { status: 'cancelled', paymentStatus: 'failed', daysAgo: 7, hours: 4, space: spaces[3], amount: 140 },
      { status: 'completed', paymentStatus: 'paid', daysAgo: 10, hours: 1, space: spaces[4], amount: 30 },
    ];

    await Promise.all(bookingData.map(b => {
      const start = new Date(now.getTime() - b.daysAgo * 86400000);
      const end = new Date(start.getTime() + b.hours * 3600000);
      return Booking.create({
        user: regularUser._id,
        parkingSpace: b.space._id,
        vehicleNumber: 'UP78AB1234',
        vehicleType: 'car',
        startTime: start, endTime: end,
        duration: b.hours,
        totalAmount: b.amount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        slotNumber: `S${Math.ceil(Math.random() * 10)}`
      });
    }));
    console.log('📋 Created 5 sample bookings');

    console.log('\n🎉 Seed complete! Demo accounts:');
    console.log('   👤 User     → user@demo.com     / demo1234');
    console.log('   🏢 Owner    → owner@demo.com    / demo1234');
    console.log('   ⚙️  Admin    → admin@parkmitra.com / admin1234\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
