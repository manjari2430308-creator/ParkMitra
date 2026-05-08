const mongoose = require('mongoose');

const parkingSpaceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  totalSlots: { type: Number, required: true, min: 1 },
  availableSlots: { type: Number, required: true, min: 0 },
  pricePerHour: { type: Number, required: true, min: 0 },
  amenities: [{ type: String }],
  images: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'inactive'], default: 'pending' },
  vehicleTypes: [{ type: String, enum: ['car', 'bike', 'truck', 'cycle'] }],
  operatingHours: {
    open: { type: String, default: '00:00' },
    close: { type: String, default: '23:59' }
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

parkingSpaceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ParkingSpace', parkingSpaceSchema);
