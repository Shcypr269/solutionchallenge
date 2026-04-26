const express = require('express');
const router = express.Router();
const { getGeocode, getDirections } = require('../controllers/mapsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/geocode', protect, getGeocode);
router.get('/directions', protect, getDirections);

module.exports = router;
