const express = require('express');
const GoogleAnalyticsService = require('../services/googleAnalyticsService');
const GA4PropertyService = require('../services/ga4PropertyService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Initialize Google Analytics service
let analyticsService;
try {
  analyticsService = new GoogleAnalyticsService();
} catch (error) {
  logger.error('Failed to initialize GoogleAnalyticsService:', error.message);
}

// Get Google Analytics data for Ortto source
router.get('/ortto-data', async (req, res) => {
  try {
    if (!analyticsService) {
      return res.status(500).json({ 
        error: 'Google Analytics service not configured. Please check your environment variables.',
        details: 'GOOGLE_APPLICATION_CREDENTIALS is required.',
        help: 'Make sure you have set the correct service account credentials in your environment variables.'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today', propertyId } = req.query;
    
    // Use provided propertyId or default property
    let targetPropertyId = propertyId;
    if (!targetPropertyId) {
      const defaultProperty = GA4PropertyService.getDefaultProperty();
      if (!defaultProperty) {
        return res.status(400).json({
          error: 'No GA4 Property configured',
          details: 'Please add a GA4 Property ID first.',
          help: 'Use the "Add GA4 Property" button to configure your first property.'
        });
      }
      targetPropertyId = defaultProperty.propertyId;
    }

    logger.info('Fetching Google Analytics data:', { startDate, endDate, propertyId: targetPropertyId });

    const data = await analyticsService.fetchOrttoData(startDate, endDate, targetPropertyId);
    
    res.json(data);
  } catch (error) {
    logger.error('Error fetching Google Analytics data:', error);
    
    // Provide specific error messages for common issues
    let errorMessage = 'Failed to fetch Google Analytics data';
    let details = error.message;
    let help = null;
    
    if (error.message.includes('Invalid Property ID format')) {
      errorMessage = 'Invalid Google Analytics Property ID';
      help = 'Please ensure the Property ID is numeric (not a Measurement ID starting with G-).';
    } else if (error.message.includes('PERMISSION_DENIED')) {
      errorMessage = 'Insufficient permissions for Google Analytics';
      help = 'Please ensure your service account has access to this GA4 property. Go to Google Analytics Admin → Property access management and add your service account email as a Viewer.';
    } else if (error.message.includes('authentication')) {
      errorMessage = 'Google Analytics authentication failed';
      help = 'Please check your GOOGLE_APPLICATION_CREDENTIALS environment variable and ensure the service account has access to Google Analytics.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details,
      help
    });
  }
});

// Get custom date range data
router.get('/custom-range', async (req, res) => {
  try {
    if (!analyticsService) {
      return res.status(500).json({ 
        error: 'Google Analytics service not configured. Please check your environment variables.',
        details: 'GOOGLE_APPLICATION_CREDENTIALS is required.',
        help: 'Make sure you have set the correct service account credentials in your environment variables.'
      });
    }

    const { startDate, endDate, propertyId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate are required' 
      });
    }

    // Use provided propertyId or default property
    let targetPropertyId = propertyId;
    if (!targetPropertyId) {
      const defaultProperty = GA4PropertyService.getDefaultProperty();
      if (!defaultProperty) {
        return res.status(400).json({
          error: 'No GA4 Property configured',
          details: 'Please add a GA4 Property ID first.',
          help: 'Use the "Add GA4 Property" button to configure your first property.'
        });
      }
      targetPropertyId = defaultProperty.propertyId;
    }

    logger.info('Fetching custom date range data:', { startDate, endDate, propertyId: targetPropertyId });

    const data = await analyticsService.fetchCustomDateRange(startDate, endDate, targetPropertyId);
    
    res.json(data);
  } catch (error) {
    logger.error('Error fetching custom date range data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch custom date range data',
      details: error.message 
    });
  }
});

// Discover source/medium combinations
router.get('/discover-sources', async (req, res) => {
  try {
    if (!analyticsService) {
      return res.status(500).json({ 
        error: 'Google Analytics service not configured. Please check your environment variables.',
        details: 'GOOGLE_APPLICATION_CREDENTIALS is required.',
        help: 'Make sure you have set the correct service account credentials in your environment variables.'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today', propertyId } = req.query;
    
    // Use provided propertyId or default property
    let targetPropertyId = propertyId;
    if (!targetPropertyId) {
      const defaultProperty = GA4PropertyService.getDefaultProperty();
      if (!defaultProperty) {
        return res.status(400).json({
          error: 'No GA4 Property configured',
          details: 'Please add a GA4 Property ID first.',
          help: 'Use the "Add GA4 Property" button to configure your first property.'
        });
      }
      targetPropertyId = defaultProperty.propertyId;
    }

    logger.info('Discovering source/medium combinations:', { startDate, endDate, propertyId: targetPropertyId });

    const combinations = await analyticsService.discoverSourceMediumCombinations(targetPropertyId, startDate, endDate);
    
    res.json({
      success: true,
      data: combinations,
      dateRange: { startDate, endDate },
      propertyId: targetPropertyId,
      note: 'Top 50 source/medium combinations by event count'
    });
  } catch (error) {
    logger.error('Error discovering source/medium combinations:', error);
    res.status(500).json({ 
      error: 'Failed to discover source/medium combinations',
      details: error.message 
    });
  }
});

// GA4 Property Management Routes

// Get all GA4 properties
router.get('/properties', async (req, res) => {
  try {
    const properties = GA4PropertyService.getProperties();
    res.json(properties);
  } catch (error) {
    logger.error('Error getting GA4 properties:', error);
    res.status(500).json({ 
      error: 'Failed to get GA4 properties',
      details: error.message 
    });
  }
});

// Add new GA4 property
router.post('/properties', async (req, res) => {
  try {
    const { propertyId, label } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({ 
        error: 'Property ID is required' 
      });
    }

    const newProperty = GA4PropertyService.addProperty(propertyId, label);
    res.status(201).json(newProperty);
  } catch (error) {
    logger.error('Error adding GA4 property:', error);
    res.status(400).json({ 
      error: 'Failed to add GA4 property',
      details: error.message 
    });
  }
});

// Update GA4 property
router.put('/properties/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const updates = req.body;

    const updatedProperty = GA4PropertyService.updateProperty(propertyId, updates);
    res.json(updatedProperty);
  } catch (error) {
    logger.error('Error updating GA4 property:', error);
    res.status(400).json({ 
      error: 'Failed to update GA4 property',
      details: error.message 
    });
  }
});

// Delete GA4 property
router.delete('/properties/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const deletedProperty = GA4PropertyService.deleteProperty(propertyId);
    res.json({ 
      message: 'Property deleted successfully',
      deletedProperty 
    });
  } catch (error) {
    logger.error('Error deleting GA4 property:', error);
    res.status(400).json({ 
      error: 'Failed to delete GA4 property',
      details: error.message 
    });
  }
});

// Set default GA4 property
router.post('/properties/:propertyId/default', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const defaultProperty = GA4PropertyService.setDefaultProperty(propertyId);
    res.json({ 
      message: 'Default property set successfully',
      defaultProperty 
    });
  } catch (error) {
    logger.error('Error setting default GA4 property:', error);
    res.status(400).json({ 
      error: 'Failed to set default GA4 property',
      details: error.message 
    });
  }
});

// Get analytics configuration status
router.get('/status', async (req, res) => {
  try {
    const properties = GA4PropertyService.getProperties();
    const defaultProperty = GA4PropertyService.getDefaultProperty();
    
    const status = {
      configured: !!analyticsService,
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Configured' : 'Not configured',
      properties: {
        count: properties.properties.length,
        defaultProperty: defaultProperty ? {
          propertyId: defaultProperty.propertyId,
          label: defaultProperty.label
        } : null,
        activeCount: properties.properties.filter(p => p.isActive).length
      }
    };

    res.json(status);
  } catch (error) {
    logger.error('Error getting analytics status:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics status',
      details: error.message 
    });
  }
});

module.exports = router; 