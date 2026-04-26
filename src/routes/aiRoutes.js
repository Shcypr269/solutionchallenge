const express = require('express');
const router = express.Router();
const { analyzeShipment, optimizeTransport, predictDisruption } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/analyze', protect, analyzeShipment);
router.post('/optimize', protect, optimizeTransport);
router.post('/predict', protect, predictDisruption);

module.exports = router;
