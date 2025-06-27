const express = require('express');
const InstallTrackingService = require('../services/installTrackingService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Initialize Install Tracking service
let installTrackingService;
try {
  installTrackingService = new InstallTrackingService();
} catch (error) {
  logger.error('Failed to initialize InstallTrackingService:', error.message);
}

// Get all install events from all GA4 properties
router.get('/all', async (req, res) => {
  try {
    if (!installTrackingService) {
      return res.status(500).json({ 
        error: 'Install tracking service not configured. Please check your environment variables.',
        details: 'GOOGLE_APPLICATION_CREDENTIALS is required.',
        help: 'Make sure you have set the correct service account credentials in your environment variables.'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    logger.info('Fetching all install events:', { startDate, endDate });

    const data = await installTrackingService.fetchAllInstallEvents(startDate, endDate);
    
    res.json(data);
  } catch (error) {
    logger.error('Error fetching all install events:', error);
    
    // Provide specific error messages for common issues
    let errorMessage = 'Failed to fetch install events';
    let details = error.message;
    let help = null;
    
    if (error.message.includes('PERMISSION_DENIED')) {
      errorMessage = 'Insufficient permissions for Google Analytics';
      help = 'Please ensure your service account has access to all GA4 properties. Go to Google Analytics Admin → Property access management and add your service account email as a Viewer.';
    } else if (error.message.includes('authentication')) {
      errorMessage = 'Google Analytics authentication failed';
      help = 'Please check your GOOGLE_APPLICATION_CREDENTIALS environment variable and ensure the service account has access to Google Analytics.';
    } else if (error.message.includes('No GA4 properties configured')) {
      errorMessage = 'No GA4 properties configured';
      help = 'Please add GA4 properties first using the GA4 Property Manager.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details,
      help
    });
  }
});

// Get install events for a specific GA4 property
router.get('/property/:propertyId', async (req, res) => {
  try {
    if (!installTrackingService) {
      return res.status(500).json({ 
        error: 'Install tracking service not configured',
        details: 'GOOGLE_APPLICATION_CREDENTIALS is required.'
      });
    }

    const { propertyId } = req.params;
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    logger.info('Fetching install events for property:', { propertyId, startDate, endDate });

    const data = await installTrackingService.fetchInstallEventsForProperty(
      propertyId, 
      startDate, 
      endDate,
      `Property ${propertyId}`
    );
    
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching install events for property ${req.params.propertyId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch install events for property',
      details: error.message 
    });
  }
});

// Get install events for a specific Ortto campaign
router.get('/ortto-campaign/:campaignId', async (req, res) => {
  try {
    if (!installTrackingService) {
      return res.status(500).json({ 
        error: 'Install tracking service not configured',
        details: 'GOOGLE_APPLICATION_CREDENTIALS is required.'
      });
    }

    const { campaignId } = req.params;
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    logger.info('Fetching install events for Ortto campaign:', { campaignId, startDate, endDate });

    const data = await installTrackingService.getInstallsForOrttoCampaign(
      campaignId, 
      startDate, 
      endDate
    );
    
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching install events for Ortto campaign ${req.params.campaignId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch install events for Ortto campaign',
      details: error.message 
    });
  }
});

// Get install tracking status and summary
router.get('/status', async (req, res) => {
  try {
    const status = {
      configured: !!installTrackingService,
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Configured' : 'Not configured',
      lastCheck: new Date().toISOString()
    };

    // If service is configured, get a quick summary
    if (installTrackingService) {
      try {
        const summary = await installTrackingService.fetchAllInstallEvents('7daysAgo', 'today');
        status.recentActivity = {
          totalInstalls: summary.summary.totalInstalls,
          totalUniqueInstalls: summary.summary.totalUniqueInstalls,
          propertiesAnalyzed: summary.summary.propertiesAnalyzed,
          dateRange: summary.dateRange
        };
      } catch (error) {
        status.recentActivity = { error: error.message };
      }
    }

    res.json(status);
  } catch (error) {
    logger.error('Error getting install tracking status:', error);
    res.status(500).json({ 
      error: 'Failed to get install tracking status',
      details: error.message 
    });
  }
});

module.exports = router; 