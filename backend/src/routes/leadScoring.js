const express = require('express');
const router = express.Router();
const leadScoringService = require('../services/leadScoringService');
const orttoService = require('../services/orttoService');
const { logger } = require('../utils/logger');

router.get('/scores', async (req, res) => {
  try {
    logger.info('Received request for lead scores.');
    const scores = await leadScoringService.calculateLeadScores();
    res.json(scores);
  } catch (error) {
    logger.error('Error in lead scoring endpoint:', error);
    res.status(500).json({ error: 'Failed to calculate lead scores' });
  }
});

// New endpoint for basic scoring without AI (for testing when AI is rate limited)
router.get('/basic-scores', async (req, res) => {
  try {
    logger.info('Received request for basic lead scores (no AI).');
    
    const contacts = await orttoService.listContacts(10); // Just 10 contacts for testing
    
    if (!contacts || contacts.length === 0) {
      return res.json([]);
    }

    const basicScores = [];
    
    for (const contactData of contacts) {
      try {
        const contact = {
          id: contactData.id,
          email: contactData.fields['str::email'],
          name: `${contactData.fields['str::first'] || ''} ${contactData.fields['str::last'] || ''}`.trim(),
        };

        const activities = await orttoService.getContactActivities(contact.id);
        
        // Simple rule-based scoring only
        let score = 0;
        let lastActivityDate = null;

        activities.forEach(activity => {
          // Debug: Log the first activity to see its structure
          if (activities.indexOf(activity) === 0) {
            logger.info('Sample activity structure:', JSON.stringify(activity, null, 2));
          }
          
          // Use field_id which contains the activity type information
          const activityType = activity.field_id || activity.activity_id || activity.id || activity.type;
          if (!activityType) {
            logger.warn('Activity type is undefined. Full activity object:', JSON.stringify(activity));
            return; // Skip if undefined
          }
          logger.info('Activity type:', activityType);
          if (activityType.includes('opened')) {
            score += 1;
          } else if (activityType.includes('clicked')) {
            score += 5;
          }

          const activityDate = new Date(activity.created_at);
          if (!lastActivityDate || activityDate > lastActivityDate) {
            lastActivityDate = activityDate;
          }
        });

        // Determine status based on score
        let status = 'Cold';
        if (score >= 10) status = 'Hot';
        else if (score >= 5) status = 'Warm';

        basicScores.push({
          ...contact,
          finalScore: score,
          status,
          recommendation: `Score: ${score}, Activities: ${activities.length}`,
          lastActivity: lastActivityDate ? lastActivityDate.toISOString() : new Date().toISOString(),
        });

      } catch (error) {
        logger.error(`Error processing contact ${contactData.id}:`, error);
      }
    }

    res.json(basicScores.sort((a, b) => b.finalScore - a.finalScore));
    
  } catch (error) {
    logger.error('Error in basic lead scoring endpoint:', error);
    res.status(500).json({ error: 'Failed to calculate basic lead scores' });
  }
});

module.exports = router; 