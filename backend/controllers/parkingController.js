const ParkingSpace = require('../models/ParkingSpace');
const axios = require('axios');

// Get nearby parking spaces using MongoDB geospatial query
exports.getNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, vehicleType } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Latitude and longitude required' });

    const query = {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      },
      status: 'approved',
      availableSlots: { $gt: 0 }
    };
    if (vehicleType) query.vehicleTypes = vehicleType;

    const spaces = await ParkingSpace.find(query).populate('owner', 'name phone').limit(20);

    // Try Python service for enhanced sorting (fallback gracefully)
    try {
      const pyRes = await axios.post(`${process.env.PYTHON_SERVICE_URL}/nearest`, {
        user_lat: parseFloat(lat), user_lng: parseFloat(lng),
        spaces: spaces.map(s => ({ id: s._id, lat: s.location.coordinates[1], lng: s.location.coordinates[0], price: s.pricePerHour, slots: s.availableSlots }))
      }, { timeout: 2000 });
      if (pyRes.data && pyRes.data.ranked) {
        const ranked = pyRes.data.ranked;
        spaces.sort((a, b) => ranked.indexOf(a._id.toString()) - ranked.indexOf(b._id.toString()));
      }
    } catch (pyErr) { /* Python service optional */ }

    res.json({ success: true, count: spaces.length, data: spaces });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllApproved = async (req, res) => {
  try {
    const spaces = await ParkingSpace.find({ status: 'approved' }).populate('owner', 'name');
    res.json({ success: true, count: spaces.length, data: spaces });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const space = await ParkingSpace.findById(req.params.id).populate('owner', 'name phone email');
    if (!space) return res.status(404).json({ success: false, message: 'Parking space not found' });
    res.json({ success: true, data: space });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, address, lat, lng, totalSlots, pricePerHour, vehicleTypes, amenities, operatingHours } = req.body;
    const space = await ParkingSpace.create({
      owner: req.user._id,
      name, description, address,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      totalSlots: parseInt(totalSlots),
      availableSlots: parseInt(totalSlots),
      pricePerHour: parseFloat(pricePerHour),
      vehicleTypes: vehicleTypes || ['car'],
      amenities: amenities || [],
      operatingHours: operatingHours || { open: '00:00', close: '23:59' }
    });
    res.status(201).json({ success: true, data: space });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    let space = await ParkingSpace.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Not found' });
    if (space.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    space = await ParkingSpace.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: space });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMySpaces = async (req, res) => {
  try {
    const spaces = await ParkingSpace.find({ owner: req.user._id });
    res.json({ success: true, count: spaces.length, data: spaces });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { availableSlots } = req.body;
    const space = await ParkingSpace.findOne({ _id: req.params.id, owner: req.user._id });
    if (!space) return res.status(404).json({ success: false, message: 'Not found' });
    space.availableSlots = availableSlots;
    await space.save();
    res.json({ success: true, data: space });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
