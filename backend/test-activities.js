require('dotenv').config();
const orttoService = require('./src/services/orttoService');
const { logger } = require('./src/utils/logger');

async function testActivities() {
  try {
    logger.info('Testing Ortto activities...');
    
    // Get first contact
    const contacts = await orttoService.listContacts(1);
    logger.info(`Found ${contacts.length} contacts`);
    
    if (contacts.length > 0) {
      const contact = contacts[0];
      logger.info('Contact:', {
        id: contact.id,
        email: contact.fields?.['str::email'],
        name: `${contact.fields?.['str::first'] || ''} ${contact.fields?.['str::last'] || ''}`.trim()
      });
      
      // Get activities for this contact
      const activities = await orttoService.getContactActivities(contact.id);
      logger.info(`Found ${activities.length} activities`);
      
      if (activities.length > 0) {
        logger.info('First activity structure:', JSON.stringify(activities[0], null, 2));
        logger.info('Activity properties:', Object.keys(activities[0]));
      }
    }
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

testActivities(); 