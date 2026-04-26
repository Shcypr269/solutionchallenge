const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const mapsRoutes = require('./routes/mapsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shipments', shipmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

module.exports = app;
