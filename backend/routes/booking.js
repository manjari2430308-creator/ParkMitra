const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createBooking, getMyBookings, getBookingById, cancelBooking, getLandownerBookings } = require('../controllers/bookingController');

router.post('/', protect, authorize('user'), createBooking);
router.get('/my', protect, getMyBookings);
router.get('/landowner', protect, authorize('landowner'), getLandownerBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
