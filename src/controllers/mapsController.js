const axios = require('axios');

// @desc    Get Geocoding from Google Maps
// @route   GET /api/maps/geocode
const getGeocode = async (req, res) => {
    try {
        const { address } = req.query;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!address) return res.status(400).json({ message: 'Address is required' });

        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: { address, key: apiKey }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching geocode data' });
    }
};

// @desc    Get Directions from Google Maps
// @route   GET /api/maps/directions
const getDirections = async (req, res) => {
    try {
        const { origin, destination } = req.query;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!origin || !destination) {
            return res.status(400).json({ message: 'Origin and destination are required' });
        }

        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: { origin, destination, key: apiKey }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching directions data' });
    }
};

module.exports = { getGeocode, getDirections };
