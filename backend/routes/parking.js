const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getNearby, getAllApproved, getOne, create, update, getMySpaces, updateAvailability
} = require('../controllers/parkingController');

router.get('/nearby', getNearby);
router.get('/', getAllApproved);
router.get('/my', protect, authorize('landowner'), getMySpaces);
router.get('/:id', getOne);
router.post('/', protect, authorize('landowner'), create);
router.put('/:id', protect, update);
router.patch('/:id/availability', protect, authorize('landowner'), updateAvailability);

module.exports = router;
