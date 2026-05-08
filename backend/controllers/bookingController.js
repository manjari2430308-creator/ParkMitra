const Booking = require('../models/Booking');
const ParkingSpace = require('../models/ParkingSpace');

exports.createBooking = async (req, res) => {
  try {
    const { parkingSpaceId, vehicleNumber, vehicleType, startTime, endTime } = req.body;
    const space = await ParkingSpace.findById(parkingSpaceId);
    if (!space) return res.status(404).json({ success: false, message: 'Parking space not found' });
    if (space.status !== 'approved') return res.status(400).json({ success: false, message: 'Parking space not available' });
    if (space.availableSlots < 1) return res.status(400).json({ success: false, message: 'No slots available' });

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) return res.status(400).json({ success: false, message: 'End time must be after start time' });

    const durationHours = (end - start) / (1000 * 60 * 60);
    const totalAmount = Math.ceil(durationHours * space.pricePerHour);

    const booking = await Booking.create({
      user: req.user._id,
      parkingSpace: parkingSpaceId,
      vehicleNumber, vehicleType,
      startTime: start, endTime: end,
      duration: durationHours,
      totalAmount,
      slotNumber: `S${Math.floor(Math.random() * space.totalSlots) + 1}`
    });

    // Decrease available slots
    space.availableSlots = Math.max(0, space.availableSlots - 1);
    await space.save();

    await booking.populate('parkingSpace', 'name address pricePerHour');
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('parkingSpace', 'name address pricePerHour location')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('parkingSpace', 'name address pricePerHour')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });
    }
    booking.status = 'cancelled';
    await booking.save();

    // Restore slot
    await ParkingSpace.findByIdAndUpdate(booking.parkingSpace, { $inc: { availableSlots: 1 } });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLandownerBookings = async (req, res) => {
  try {
    const spaces = await ParkingSpace.find({ owner: req.user._id }).select('_id');
    const spaceIds = spaces.map(s => s._id);
    const bookings = await Booking.find({ parkingSpace: { $in: spaceIds } })
      .populate('user', 'name email phone')
      .populate('parkingSpace', 'name address')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
