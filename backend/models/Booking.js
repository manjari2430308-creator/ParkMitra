const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parkingSpace: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpace', required: true },
  vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
  vehicleType: { type: String, enum: ['car', 'bike', 'truck', 'cycle'], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number }, // in hours
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId: { type: String },
  slotNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bookingSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    this.duration = (this.endTime - this.startTime) / (1000 * 60 * 60);
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
