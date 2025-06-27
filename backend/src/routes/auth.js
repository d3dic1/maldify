const express = require('express');
const router = express.Router();
const { db, auth } = require('../services/firebaseService');
const { logger } = require('../utils/logger');

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  if (!auth) {
    // If Firebase is not available, skip authentication
    req.user = { uid: 'default-user' };
    return next();
  }

  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Error verifying token:', error);
    return res.status(403).json({ error: 'Unauthorized' });
  }
};

// Register a new user
router.post('/register', async (req, res) => {
  if (!auth || !db) {
    return res.status(503).json({ error: 'Authentication service not available' });
  }

  try {
    const { email, password } = req.body;
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Create a document for the user in Firestore to store their IDs
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      campaignIds: [],
      journeyIds: [],
    });

    res.status(201).json({ uid: userRecord.uid });
  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's saved IDs
router.get('/ids', verifyToken, async (req, res) => {
  if (!db) {
    // If Firebase is not available, return empty arrays
    return res.json({
      campaignIds: [],
      journeyIds: [],
    });
  }

  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(doc.data());
  } catch (error) {
    logger.error('Error getting user IDs:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Save user's IDs
router.post('/ids', verifyToken, async (req, res) => {
  if (!db) {
    // If Firebase is not available, just return success
    return res.status(200).json({ message: 'IDs saved successfully (local storage only)' });
  }

  try {
    const { campaignIds = [], journeyIds = [] } = req.body;
    await db.collection('users').doc(req.user.uid).set({
      campaignIds,
      journeyIds,
    }, { merge: true });
    res.status(200).json({ message: 'IDs saved successfully' });
  } catch (error) {
    logger.error('Error saving user IDs:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Auto-discover and save all IDs
router.post('/auto-discover', verifyToken, async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const orttoService = require('../services/orttoService');
    
    // Discover and categorize all assets
    const categorizedAssets = await orttoService.discoverAndCategorizeAllAssets();
    
    // Extract IDs
    const campaignIds = categorizedAssets.campaigns.map(campaign => campaign.id);
    const journeyIds = categorizedAssets.journeys.map(journey => journey.id);
    
    // Save to user's account
    await db.collection('users').doc(req.user.uid).set({
      campaignIds,
      journeyIds,
      lastAutoDiscover: new Date().toISOString(),
      totalCampaigns: campaignIds.length,
      totalJourneys: journeyIds.length
    }, { merge: true });

    logger.info(`Auto-discovered ${campaignIds.length} campaigns and ${journeyIds.length} journeys for user ${req.user.uid}`);
    
    res.json({
      success: true,
      message: `Auto-discovered ${campaignIds.length} campaigns and ${journeyIds.length} journeys`,
      data: {
        campaignIds,
        journeyIds,
        totalCampaigns: campaignIds.length,
        totalJourneys: journeyIds.length,
        categorizedAssets
      }
    });
  } catch (error) {
    logger.error('Error in auto-discover:', error);
    res.status(500).json({ error: 'Failed to auto-discover assets' });
  }
});

// Get auto-discovered assets
router.get('/auto-discover', verifyToken, async (req, res) => {
  try {
    const orttoService = require('../services/orttoService');
    
    // Get cached categorized assets
    const categorizedAssets = await orttoService.getCachedCategorizedAssets();
    
    if (!categorizedAssets) {
      // If not cached, discover them
      const discovered = await orttoService.discoverAndCategorizeAllAssets();
      res.json({
        success: true,
        data: discovered
      });
    } else {
      res.json({
        success: true,
        data: categorizedAssets
      });
    }
  } catch (error) {
    logger.error('Error getting auto-discovered assets:', error);
    res.status(500).json({ error: 'Failed to get auto-discovered assets' });
  }
});

// Refresh auto-discovered assets
router.post('/refresh-discover', verifyToken, async (req, res) => {
  try {
    const orttoService = require('../services/orttoService');
    
    // Force refresh of categorized assets
    const categorizedAssets = await orttoService.refreshCategorizedAssets();
    
    res.json({
      success: true,
      message: 'Assets refreshed successfully',
      data: categorizedAssets
    });
  } catch (error) {
    logger.error('Error refreshing auto-discovered assets:', error);
    res.status(500).json({ error: 'Failed to refresh assets' });
  }
});

module.exports = router; 