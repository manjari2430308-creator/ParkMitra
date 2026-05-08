const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats, getAllUsers, toggleUserStatus, getAllParkingSpaces, updateSpaceStatus, getAllBookings } = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/spaces', getAllParkingSpaces);
router.patch('/spaces/:id/status', updateSpaceStatus);
router.get('/bookings', getAllBookings);

module.exports = router;
