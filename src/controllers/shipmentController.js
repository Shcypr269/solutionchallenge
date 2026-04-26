// Mock data based on the flutter app (solapp1)
const shipmentsData = [
    {"id": "SHP-001", "origin": "Mumbai", "destination": "Delhi", "lat": 23.26, "lng": 77.41, "partner": "Delhivery", "vehicle": "Truck", "delay_risk": 0.82, "risk_level": "HIGH", "eta": "Apr 22, 10:00 AM", "weather": "Clear", "distance": 1400},
    {"id": "SHP-002", "origin": "Bangalore", "destination": "Chennai", "lat": 12.97, "lng": 77.59, "partner": "Shadowfax", "vehicle": "EV Van", "delay_risk": 0.91, "risk_level": "HIGH", "eta": "Apr 21, 6:00 PM", "weather": "Rainy", "distance": 350},
    {"id": "SHP-003", "origin": "Kolkata", "destination": "Patna", "lat": 23.81, "lng": 86.44, "partner": "XpressBees", "vehicle": "Bike", "delay_risk": 0.15, "risk_level": "LOW", "eta": "Apr 21, 2:00 PM", "weather": "Clear", "distance": 580},
    {"id": "SHP-004", "origin": "Jaipur", "destination": "Lucknow", "lat": 27.02, "lng": 76.36, "partner": "DHL", "vehicle": "Truck", "delay_risk": 0.97, "risk_level": "CRITICAL", "eta": "Apr 22, 8:00 PM", "weather": "Stormy", "distance": 560},
    {"id": "SHP-005", "origin": "Hyderabad", "destination": "Vizag", "lat": 16.50, "lng": 79.52, "partner": "Delhivery", "vehicle": "EV Van", "delay_risk": 0.33, "risk_level": "LOW", "eta": "Apr 21, 4:00 PM", "weather": "Clear", "distance": 620},
];

// @desc    Get all active shipments
// @route   GET /api/shipments
const getShipments = (req, res) => {
    // In a real app, fetch from DB
    res.json(shipmentsData);
};

// @desc    Get single shipment
// @route   GET /api/shipments/:id
const getShipmentById = (req, res) => {
    const shipment = shipmentsData.find(s => s.id === req.params.id);
    if (shipment) {
        res.json(shipment);
    } else {
        res.status(404).json({ message: 'Shipment not found' });
    }
};

module.exports = { getShipments, getShipmentById };
