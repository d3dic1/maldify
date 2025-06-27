require('dotenv').config();
const orttoService = require('./services/orttoService');
const { logger } = require('./utils/logger');

async function testOrttoService() {
  try {
    // Test only the problematic campaign ID
    const campaignId = '6644cbfd350c83f7b94a3bfe';
    
    logger.info('Testing OrttoService with campaign ID:', campaignId);
    
    // Test fetchReport
    const report = await orttoService.fetchReport(null, null, campaignId);
    
    logger.info('Report fetched successfully:', JSON.stringify(report, null, 2));
    
  } catch (error) {
    logger.error(`Test failed: ${error && error.stack ? error.stack : error}`);
  }
}

testOrttoService(); 