require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { setupRoutes } = require('./routes');
const { setupScheduledTasks } = require('./services/scheduler');
const { logger } = require('./utils/logger');
const pacingRoutes = require('./routes/pacing');
const journeyRoutes = require('./routes/journeys');
const authRoutes = require('./routes/auth');
const leadScoringRoutes = require('./routes/leadScoring');
const installTrackingRoutes = require('./routes/installTracking');
const orttoService = require('./services/orttoService');

const app = express();
const port = process.env.PORT || 5001;
const httpsPort = process.env.HTTPS_PORT || 5002;

// Pre-fetch campaigns and journeys at startup
orttoService.fetchCampaignsAndJourneys()
  .then(() => logger.info('Successfully pre-fetched and cached campaigns and journeys.'))
  .catch(err => logger.error('Failed to pre-fetch campaigns and journeys at startup:', err));

// Also pre-fetch journey names for better name resolution
orttoService.fetchAndCacheJourneyNames()
  .then(() => logger.info('Successfully pre-fetched and cached journey names.'))
  .catch(err => logger.error('Failed to pre-fetch journey names at startup:', err));

// Middleware
app.use(cors({
  origin: [
    'http://10.11.22.214:3000',
    'https://10.11.22.214:3000',
    'http://localhost:3000',
    'https://localhost:3000',
    'https://marketingdashboard-cdab5.web.app',
    'https://marketingdashboard-cdab5.firebaseapp.com',
    'https://maldifys.netlify.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  next();
});

// Setup routes
app.use('/api', setupRoutes(express.Router()));
app.use('/api/pacing', pacingRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/lead-scoring', leadScoringRoutes);
app.use('/api/install-tracking', installTrackingRoutes);

// 404 handler
app.use((req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error details:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    response: err.response?.data
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    details: process.env.NODE_ENV === 'development' ? err.response?.data : undefined
  });
});

// HTTPS configuration
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../ssl/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../ssl/cert.pem'))
};

// Start HTTPS server
const httpsServer = https.createServer(httpsOptions, app);
httpsServer.listen(httpsPort, () => {
  logger.info(`HTTPS Server running on port ${httpsPort}`);
});

// Start HTTP server (for development)
app.listen(port, () => {
  logger.info(`HTTP Server running on port ${port}`);
  
  // Setup scheduled tasks
  setupScheduledTasks();
});

module.exports = app; 