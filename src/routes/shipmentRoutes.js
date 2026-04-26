const express = require('express');
const router = express.Router();
const { getShipments, getShipmentById } = require('../controllers/shipmentController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getShipments);
router.get('/:id', protect, getShipmentById);

module.exports = router;
