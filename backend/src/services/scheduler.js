const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { sendEmailReport } = require('./emailService');
const orttoService = require('./orttoService');

const setupScheduledTasks = () => {
  logger.info('Setting up scheduled tasks...');

  // Auto-refresh categorized assets every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running scheduled auto-refresh of categorized assets...');
    try {
      await orttoService.refreshCategorizedAssets();
      logger.info('Successfully refreshed categorized assets');
    } catch (error) {
      logger.error('Error in scheduled auto-refresh:', error);
    }
  });

  // Pre-fetch campaigns and journeys every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running scheduled pre-fetch of campaigns and journeys...');
    try {
      await orttoService.fetchCampaignsAndJourneys();
      await orttoService.fetchAndCacheJourneyNames();
      logger.info('Successfully pre-fetched campaigns and journeys');
    } catch (error) {
      logger.error('Error in scheduled pre-fetch:', error);
    }
  });

  // Schedule data refresh every Friday at 00:00 UTC
  cron.schedule('0 0 * * 5', async () => {
    try {
      logger.info('Starting scheduled data refresh...');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const metrics = await orttoService.getMetrics(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Store the refreshed data (implement your storage logic here)
      logger.info('Data refresh completed successfully');
    } catch (error) {
      logger.error('Error in scheduled data refresh:', error);
    }
  });

  // Schedule email report every Friday at 09:00 UTC
  cron.schedule('0 9 * * 5', async () => {
    try {
      logger.info('Starting scheduled email report...');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const metrics = await orttoService.getMetrics(
        startDate.toISOString(),
        endDate.toISOString()
      );

      await sendEmailReport(metrics);
      logger.info('Email report sent successfully');
    } catch (error) {
      logger.error('Error in scheduled email report:', error);
    }
  });

  logger.info('Scheduled tasks set up successfully');
};

module.exports = { setupScheduledTasks }; 