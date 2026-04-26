const mongoose = require('mongoose');

const agentHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    response: {
        type: String,
        required: true,
    },
    actionType: {
        type: String,
        enum: ['REROUTE', 'ANOMALY_DETECTION', 'GENERAL_QUERY', 'RISK_ANALYSIS'],
        default: 'GENERAL_QUERY',
    },
    context: {
        type: mongoose.Schema.Types.Mixed, // Stores JSON data relevant to the action (e.g. shipmentId, location)
    }
}, { timestamps: true });

module.exports = mongoose.model('AgentHistory', agentHistorySchema);
