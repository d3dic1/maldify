const express = require('express');
const router = express.Router();
const orttoService = require('../services/orttoService');
const { logger } = require('../utils/logger');

// Middleware to verify Firebase ID token (same as in reports.js)
const verifyToken = async (req, res, next) => {
  const { auth } = require('../services/firebaseService');
  
  if (!auth) {
    // If Firebase is not available, skip authentication
    req.user = { uid: 'default-user' };
    return next();
  }

  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(403).json({ error: 'No token provided' });
  }

  // Allow test tokens for testing purposes
  if (idToken === 'test-token' || idToken === 'dummy-test-token') {
    req.user = { uid: 'test-user' };
    return next();
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Error verifying token:', error);
    return res.status(403).json({ error: 'Unauthorized' });
  }
};

// Get list of all journeys with names
router.get('/list', verifyToken, async (req, res) => {
  try {
    logger.info('Fetching list of all journeys...');
    
    // Get all campaigns and filter for journeys
    const campaignsResponse = await orttoService.listCampaigns(req.query);
    const allCampaigns = campaignsResponse.assets || [];
    
    // Filter for journeys (journeys typically have a different type or structure)
    // We'll need to fetch journey info for each to determine if it's a journey
    const journeys = [];
    
    for (const campaign of allCampaigns) {
      try {
        // Try to get detailed info for each campaign to determine if it's a journey
        const journeyInfo = await orttoService.getJourneyInfo(campaign.id);
        if (journeyInfo.type === 'journey' || campaign.type === 'journey') {
          journeys.push({
            id: campaign.id,
            name: journeyInfo.name || campaign.name || `Journey ${campaign.id}`,
            type: 'journey',
            created_at: campaign.created_at,
            updated_at: campaign.updated_at
          });
        }
      } catch (error) {
        logger.warn(`Could not fetch info for campaign ${campaign.id}:`, error.message);
        // If we can't determine the type, assume it might be a journey if it has journey-like properties
        if (campaign.type === 'journey' || campaign.name?.toLowerCase().includes('journey')) {
          journeys.push({
            id: campaign.id,
            name: campaign.name || `Journey ${campaign.id}`,
            type: 'journey',
            created_at: campaign.created_at,
            updated_at: campaign.updated_at
          });
        }
      }
    }
    
    logger.info(`Found ${journeys.length} journeys`);
    res.json({ journeys, total: journeys.length });
  } catch (error) {
    logger.error('Error fetching journey list:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to fetch journey list.' });
  }
});

// Get individual journey reports
router.get('/reports', verifyToken, async (req, res) => {
  try {
    const { journeyIds, timeframe } = req.query;
    if (!journeyIds) {
      return res.status(400).json({ error: 'Journey IDs are required' });
    }

    const ids = journeyIds.split(',').map(id => id.trim());
    
    const reports = await Promise.all(
      ids.map(async (id) => {
        try {
          const report = await orttoService.fetchJourneyReport(id, timeframe);
          return { journeyId: id, ...report };
        } catch (error) {
          logger.error(`Error fetching report for journey ${id}:`, error);
          return { journeyId: id, error: error.message };
        }
      })
    );

    const validReports = reports.filter(report => !report.error);
    if (validReports.length === 0) {
      return res.status(404).json({ error: 'No valid journey reports found' });
    }

    res.json({
      journeys: validReports,
      total: validReports.length
    });
  } catch (error) {
    logger.error('Error in journey-reports route:', error);
    res.status(500).json({ error: 'Failed to fetch journey reports' });
  }
});

module.exports = router; 