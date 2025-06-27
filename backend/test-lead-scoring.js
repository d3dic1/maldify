require('dotenv').config();
const orttoService = require('./src/services/orttoService');
const leadScoringService = require('./src/services/leadScoringService');
const { logger } = require('./src/utils/logger');

async function testLeadScoring() {
  try {
    logger.info('Testing Ortto API connection...');
    
    // Test 1: Check if we can list contacts
    logger.info('Test 1: Listing contacts...');
    const contacts = await orttoService.listContacts(5); // Just get 5 contacts
    logger.info(`Found ${contacts.length} contacts`);
    
    if (contacts.length > 0) {
      const firstContact = contacts[0];
      logger.info('First contact:', {
        id: firstContact.id,
        email: firstContact.fields?.['str::email'],
        name: `${firstContact.fields?.['str::first'] || ''} ${firstContact.fields?.['str::last'] || ''}`.trim()
      });
      
      // Test 2: Check if we can get activities for the first contact
      logger.info('Test 2: Getting activities for first contact...');
      const activities = await orttoService.getContactActivities(firstContact.id);
      logger.info(`Found ${activities.length} activities for contact ${firstContact.id}`);
      
      // Test 3: Test the full lead scoring service
      logger.info('Test 3: Testing full lead scoring service...');
      const scores = await leadScoringService.calculateLeadScores();
      logger.info(`Generated scores for ${scores.length} contacts`);
      
      if (scores.length > 0) {
        logger.info('Sample score:', scores[0]);
      }
    }
    
  } catch (error) {
    logger.error('Test failed:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testLeadScoring(); 