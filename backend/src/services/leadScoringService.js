const orttoService = require('./orttoService');
const aiService = require('./aiService');
const { logger } = require('../utils/logger');

class LeadScoringService {
  /**
   * Calculates lead scores based on a combination of rules and AI prediction.
   */
  async calculateLeadScores() {
    logger.info('Starting lead score calculation...');

    // Limit to first 20 contacts to avoid hitting AI API rate limits
    const contacts = await orttoService.listContacts(20);

    if (!contacts || contacts.length === 0) {
      logger.warn('No contacts found in Ortto. Aborting lead score calculation.');
      return [];
    }

    logger.info(`Processing ${contacts.length} contacts for lead scoring...`);

    const scoredContacts = [];
    
    // Process contacts sequentially to avoid overwhelming the AI API
    for (let i = 0; i < contacts.length; i++) {
      try {
        const contactData = contacts[i];
        const contact = {
          id: contactData.id,
          email: contactData.fields['str::email'],
          name: `${contactData.fields['str::first'] || ''} ${contactData.fields['str::last'] || ''}`.trim(),
        };

        const activities = await orttoService.getContactActivities(contact.id);
        
        // 1. Rule-based scoring
        let ruleBasedScore = 0;
        let lastActivityDate = null;

        activities.forEach(activity => {
          // Use field_id which contains the activity type information
          const activityType = activity.field_id || activity.activity_id || activity.id || activity.type;
          if (!activityType) {
            logger.warn('Activity type is undefined. Full activity object:', JSON.stringify(activity));
            return; // Skip if undefined
          }
          logger.info('Activity type:', activityType);
          if (activityType.includes('opened')) {
            ruleBasedScore += 1;
          } else if (activityType.includes('clicked')) {
            ruleBasedScore += 5;
          }

          const activityDate = new Date(activity.created_at);
          if (!lastActivityDate || activityDate > lastActivityDate) {
            lastActivityDate = activityDate;
          }
        });

        // Convert activities into a simpler format for the AI
        const activitySummary = activities.map(a => ({ 
          type: a.activity_id, 
          date: a.created_at 
        }));

        // 2. AI-powered predictive scoring (with fallback)
        let aiPrediction;
        try {
          aiPrediction = await aiService.predictLeadScore(contact, activitySummary);
        } catch (error) {
          logger.warn(`AI prediction failed for contact ${contact.id}, using fallback:`, error.message);
          // Fallback prediction based on rule-based score
          aiPrediction = this.generateFallbackPrediction(ruleBasedScore, activities.length);
        }
        
        // Combine scores (you can adjust the weighting)
        const finalScore = (ruleBasedScore * 0.5) + (aiPrediction.predicted_score * 0.5);

        scoredContacts.push({
          ...contact,
          ruleBasedScore,
          finalScore: Math.round(finalScore),
          status: aiPrediction.status,
          recommendation: aiPrediction.recommendation,
          lastActivity: lastActivityDate ? lastActivityDate.toISOString() : new Date().toISOString(),
        });

        // Add a small delay between AI calls to avoid rate limiting
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }

      } catch (error) {
        logger.error(`Error processing contact ${contacts[i]?.id}:`, error);
        // Continue with next contact instead of failing completely
      }
    }

    logger.info(`Lead score calculation finished. Processed ${scoredContacts.length} contacts.`);
    return scoredContacts.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Generate a fallback prediction when AI service is unavailable
   */
  generateFallbackPrediction(ruleBasedScore, activityCount) {
    let predictedScore = ruleBasedScore;
    let status = 'Cold';
    let reasoning = 'Limited data available for analysis.';
    let recommendation = 'Gather more engagement data to improve scoring.';

    // Simple logic based on rule-based score and activity count
    if (ruleBasedScore >= 10) {
      status = 'Hot';
      reasoning = 'High engagement score indicates strong interest.';
      recommendation = 'Prioritize for immediate follow-up.';
    } else if (ruleBasedScore >= 5) {
      status = 'Warm';
      reasoning = 'Moderate engagement suggests potential interest.';
      recommendation = 'Continue nurturing with targeted content.';
    } else if (activityCount > 0) {
      status = 'Cold';
      reasoning = 'Low engagement despite some activity.';
      recommendation = 'Re-engage with different content or approach.';
    }

    return {
      predicted_score: predictedScore,
      status,
      reasoning,
      recommendation
    };
  }
}

module.exports = new LeadScoringService(); 