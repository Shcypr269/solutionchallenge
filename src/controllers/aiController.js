const aiService = require('../services/aiService');
const AgentHistory = require('../models/AgentHistory');

const analyzeShipment = async (req, res) => {
    try {
        const shipmentData = req.body;
        const result = await aiService.getAnomalyDetection(shipmentData);

        // Save history
        await AgentHistory.create({
            user: req.user._id,
            prompt: 'Analyze shipment for anomalies',
            response: JSON.stringify(result),
            actionType: 'ANOMALY_DETECTION',
            context: shipmentData,
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const optimizeTransport = async (req, res) => {
    try {
        const { origin, destination, waypoints } = req.body;
        const result = await aiService.optimizeRoute(origin, destination, waypoints);

        await AgentHistory.create({
            user: req.user._id,
            prompt: `Optimize route from ${origin} to ${destination}`,
            response: JSON.stringify(result),
            actionType: 'REROUTE',
            context: { origin, destination, waypoints },
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const predictDisruption = async (req, res) => {
    try {
        const context = req.body;
        const result = await aiService.getDisruptionPrediction(context);

        await AgentHistory.create({
            user: req.user._id,
            prompt: `Predict disruption for context`,
            response: JSON.stringify(result),
            actionType: 'RISK_ANALYSIS',
            context: context,
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { analyzeShipment, optimizeTransport, predictDisruption };
