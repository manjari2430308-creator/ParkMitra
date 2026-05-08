const User = require('../models/User');
const ParkingSpace = require('../models/ParkingSpace');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalLandowners, totalSpaces, pendingSpaces, totalBookings, totalPayments] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'landowner' }),
      ParkingSpace.countDocuments({ status: 'approved' }),
      ParkingSpace.countDocuments({ status: 'pending' }),
      Booking.countDocuments(),
      Payment.aggregate([{ $match: { status: 'succeeded' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    const revenue = totalPayments.length > 0 ? totalPayments[0].total : 0;

    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('parkingSpace', 'name')
      .sort({ createdAt: -1 }).limit(10);

    res.json({ success: true, data: { totalUsers, totalLandowners, totalSpaces, pendingSpaces, totalBookings, revenue, recentBookings } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllParkingSpaces = async (req, res) => {
  try {
    const spaces = await ParkingSpace.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: spaces.length, data: spaces });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSpaceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const space = await ParkingSpace.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!space) return res.status(404).json({ success: false, message: 'Space not found' });
    res.json({ success: true, data: space });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('parkingSpace', 'name address')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
