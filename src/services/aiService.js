const axios = require('axios');

class AIService {
    constructor() {
        this.agentUrl = process.env.AI_AGENT_URL || 'http://localhost:8000';
    }

    async getAnomalyDetection(shipmentData) {
        try {
            const response = await axios.post(`${this.agentUrl}/api/ml/anomaly-detect`, shipmentData);
            return response.data;
        } catch (error) {
            console.error('Error connecting to AI Agent for Anomaly Detection:', error.message);
            throw new Error('Failed to get anomaly detection from AI agent');
        }
    }

    async optimizeRoute(origin, destination, waypoints) {
        try {
            const response = await axios.post(`${this.agentUrl}/api/routing/optimize`, { origin, destination, waypoints });
            return response.data;
        } catch (error) {
            console.error('Error connecting to AI Agent for Route Optimization:', error.message);
            throw new Error('Failed to optimize route with AI agent');
        }
    }

    async getDisruptionPrediction(context) {
        try {
            const response = await axios.post(`${this.agentUrl}/api/disruptions/predict`, context);
            return response.data;
        } catch (error) {
            console.error('Error connecting to AI Agent for Disruption Prediction:', error.message);
            throw new Error('Failed to get disruption prediction from AI agent');
        }
    }
}

module.exports = new AIService();
