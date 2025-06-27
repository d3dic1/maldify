const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PacingService = require('../services/pacingService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads - use memory storage for Netlify
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize Pacing service
let pacingService;
try {
  pacingService = new PacingService();
} catch (error) {
  logger.error('Failed to initialize PacingService:', error.message);
}

// Upload CSV and process with AI
router.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No CSV file uploaded' 
      });
    }

    if (!pacingService) {
      return res.status(500).json({ 
        error: 'Pacing service not configured. Please check your environment variables.' 
      });
    }

    logger.info('Processing CSV file:', {
      filename: req.file.originalname,
      size: req.file.size
    });

    // Convert buffer to string and process
    const csvContent = req.file.buffer.toString('utf-8');
    const result = await pacingService.processCSVContentAndOrganizeSheets(csvContent, req.file.originalname);
    
    res.json({
      success: true,
      message: 'CSV processed successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error processing CSV file:', error);
    
    res.status(500).json({ 
      error: 'Failed to process CSV file',
      details: error.message 
    });
  }
});

// Get pacing service status
router.get('/status', async (req, res) => {
  try {
    const status = {
      configured: !!pacingService,
      googleSheets: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Configured' : 'Not configured',
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Configured' : 'Not configured',
      aiService: process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'
    };

    res.json(status);
  } catch (error) {
    logger.error('Error getting pacing status:', error);
    res.status(500).json({ 
      error: 'Failed to get pacing status',
      details: error.message 
    });
  }
});

// Get spreadsheet URL
router.get('/spreadsheet-url', async (req, res) => {
  try {
    if (!pacingService) {
      return res.status(500).json({ 
        error: 'Pacing service not configured' 
      });
    }

    const url = await pacingService.sheetsService.getSpreadsheetUrl();
    res.json({ url });
  } catch (error) {
    logger.error('Error getting spreadsheet URL:', error);
    res.status(500).json({ 
      error: 'Failed to get spreadsheet URL',
      details: error.message 
    });
  }
});

// Test CSV parsing (without creating sheets)
router.post('/test-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No CSV file uploaded' 
      });
    }

    logger.info('Testing CSV file:', {
      filename: req.file.originalname,
      size: req.file.size
    });

    // Convert buffer to string and parse CSV
    const csvContent = req.file.buffer.toString('utf-8');
    const csvData = await pacingService.parseCSVContent(csvContent);

    res.json({
      success: true,
      message: 'CSV parsed successfully',
      recordCount: csvData.length,
      columns: Object.keys(csvData[0] || {}),
      sampleData: csvData.slice(0, 3) // First 3 rows as sample
    });

  } catch (error) {
    logger.error('Error testing CSV file:', error);
    
    res.status(500).json({ 
      error: 'Failed to parse CSV file',
      details: error.message 
    });
  }
});

module.exports = router; 