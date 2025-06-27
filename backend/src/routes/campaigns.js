const express = require('express');
const router = express.Router();
const orttoService = require('../services/orttoService');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/campaigns/list
 * @desc    Get a list of all campaigns and journeys from Ortto
 * @access  Public
 */
router.get('/list', async (req, res) => {
  try {
    logger.info('Fetching list of campaigns and journeys...');
    const campaigns = await orttoService.listCampaigns(req.query);
    res.json(campaigns);
  } catch (error) {
    logger.error('Error fetching campaign list:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to fetch campaign list.' });
  }
});

// Get individual campaign reports (returns separate data for each campaign)
router.get('/reports', async (req, res) => {
  try {
    logger.info('Received campaign-reports request:', {
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    const { campaignIds, timeframe } = req.query;
    if (!campaignIds) {
      logger.warn('No campaign IDs provided in request');
      return res.status(400).json({ error: 'Campaign IDs are required' });
    }

    // Split comma-separated string into array
    const ids = campaignIds.split(',').map(id => id.trim());
    logger.info('Processing campaign IDs:', ids);

    const reports = await Promise.all(
      ids.map(async (id) => {
        try {
          const report = await orttoService.fetchReport(id, timeframe);
          const result = { campaignId: id, ...report };
          return result;
        } catch (error) {
          logger.error(`Error fetching report for campaign ${id}:`, error);
          return { campaignId: id, error: error.message };
        }
      })
    );

    const validReports = reports.filter(report => !report.error);
    if (validReports.length === 0) {
      return res.status(404).json({ error: 'No valid reports found' });
    }

    // Return individual reports with campaign IDs
    res.json({
      campaigns: validReports,
      total: validReports.length
    });
  } catch (error) {
    logger.error('Error in campaign-reports route:', error);
    res.status(500).json({ error: 'Failed to fetch campaign reports' });
  }
});

// Get campaign report (replaces metrics, top performers, account performance)
router.get('/report', async (req, res) => {
  try {
    logger.info('Received campaign-report request:', {
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    const { campaignIds } = req.query;
    if (!campaignIds) {
      logger.warn('No campaign IDs provided in request');
      return res.status(400).json({ error: 'Campaign IDs are required' });
    }

    // Split comma-separated string into array
    const ids = campaignIds.split(',').map(id => id.trim());
    logger.info('Processing campaign IDs:', ids);

    const reports = await Promise.all(
      ids.map(async (id) => {
        try {
          const report = await orttoService.fetchReport(id);
          return report;
        } catch (error) {
          logger.error(`Error fetching report for campaign ${id}:`, error);
          return null;
        }
      })
    );

    const validReports = reports.filter(report => report !== null);
    if (validReports.length === 0) {
      return res.status(404).json({ error: 'No valid reports found' });
    }

    // Aggregate the reports
    const aggregatedReport = validReports.reduce((acc, report) => {
      Object.keys(report).forEach(key => {
        if (typeof report[key] === 'number') {
          acc[key] = (acc[key] || 0) + report[key];
        }
      });
      return acc;
    }, {});

    res.json(aggregatedReport);
  } catch (error) {
    logger.error('Error in campaign-report route:', error);
    res.status(500).json({ error: 'Failed to fetch campaign report' });
  }
});

/**
 * @route   POST /api/campaigns/export
 * @desc    Export campaigns using the new Ortto API with advanced filtering
 * @access  Public
 */
router.post('/export', async (req, res) => {
  try {
    logger.info('Received campaign export request:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    const filters = req.body || {};
    
    // Validate filters
    if (filters.limit && (filters.limit < 1 || filters.limit > 50)) {
      return res.status(400).json({ error: 'Limit must be between 1 and 50' });
    }

    const result = await orttoService.exportCampaigns(filters);
    
    res.json({
      success: true,
      data: result,
      message: `Successfully exported ${result.campaigns.length} campaigns`
    });
  } catch (error) {
    logger.error('Error in campaign export route:', error);
    res.status(500).json({ 
      error: 'Failed to export campaigns',
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/campaigns/filtered
 * @desc    Get campaigns with advanced filtering using query parameters
 * @access  Public
 */
router.get('/filtered', async (req, res) => {
  try {
    logger.info('Received filtered campaigns request:', {
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    // Convert query parameters to filters
    const filters = {};
    
    // Campaign type filtering
    if (req.query.type) {
      filters.type = req.query.type;
    } else if (req.query.types) {
      filters.types = req.query.types.split(',').map(t => t.trim());
    }
    
    // Status filtering
    if (req.query.state) {
      filters.state = req.query.state;
    }
    
    // Folder filtering
    if (req.query.folder_id) {
      filters.folder_id = req.query.folder_id;
    }
    
    // Search query
    if (req.query.q) {
      filters.q = req.query.q;
    }
    
    // Pagination
    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit);
    }
    if (req.query.offset) {
      filters.offset = parseInt(req.query.offset);
    }
    
    // Sorting
    if (req.query.sort) {
      filters.sort = req.query.sort;
    }
    if (req.query.sort_order) {
      filters.sort_order = req.query.sort_order;
    }

    const result = await orttoService.getFilteredCampaigns(filters);
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.campaigns.length} campaigns matching criteria`
    });
  } catch (error) {
    logger.error('Error in filtered campaigns route:', error);
    res.status(500).json({ 
      error: 'Failed to fetch filtered campaigns',
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/campaigns/top-performers
 * @desc    Get top performing campaigns based on various metrics
 * @access  Public
 */
router.get('/top-performers', async (req, res) => {
  try {
    logger.info('Received top performers request:', {
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    const { 
      metric = 'opens', 
      limit = 10, 
      type = 'email',
      timeframe = 'all-time'
    } = req.query;

    // Get campaigns sorted by the specified metric
    const filters = {
      type: type,
      limit: Math.min(parseInt(limit), 50),
      sort: metric,
      sort_order: 'desc'
    };

    const result = await orttoService.getFilteredCampaigns(filters);
    
    // Get detailed reports for top performers
    const topPerformers = await Promise.all(
      result.campaigns.slice(0, parseInt(limit)).map(async (campaign) => {
        try {
          const report = await orttoService.fetchReport(campaign.id, timeframe);
          return {
            ...campaign,
            performance: report
          };
        } catch (error) {
          logger.error(`Error fetching report for campaign ${campaign.id}:`, error);
          return {
            ...campaign,
            performance: null,
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        campaigns: topPerformers,
        metric: metric,
        timeframe: timeframe,
        total: topPerformers.length
      },
      message: `Top ${topPerformers.length} performers by ${metric}`
    });
  } catch (error) {
    logger.error('Error in top performers route:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top performers',
      details: error.message 
    });
  }
});

module.exports = router; 