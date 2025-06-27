require('dotenv').config();
const orttoService = require('./services/orttoService');
const { logger } = require('./utils/logger');

async function testOrttoService() {
  try {
    // Get test campaign ID from environment variable or use a placeholder
    const campaignId = process.env.TEST_CAMPAIGN_ID || 'test-campaign-id';
    
    logger.info('Testing OrttoService with campaign ID:', campaignId);
    
    // Test fetchReport
    const report = await orttoService.fetchReport(campaignId);
    
    logger.info('Report fetched successfully:', JSON.stringify(report, null, 2));
    
    // Test aggregateReports with multiple reports
    const reports = [report, report]; // Using same report twice for testing
    const aggregatedReport = orttoService.aggregateReports(reports);
    
    logger.info('Aggregated report:', JSON.stringify(aggregatedReport, null, 2));
    
  } catch (error) {
    logger.error(`Test failed: ${error && error.stack ? error.stack : error}`);
  }
}

testOrttoService();