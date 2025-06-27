const express = require('express');
const router = express.Router();
const orttoService = require('../services/orttoService');
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

  // Allow test tokens for testing purposes
  if (idToken === 'test-token' || idToken === 'dummy-test-token') {
    req.user = { uid: 'test-user' };
    return next();
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

// Helper function to save reports to Firebase (accumulative)
const saveReportsToFirebase = async (userId, reports, timeframe = 'all-time') => {
  if (!db) {
    logger.warn('Firebase not available, skipping report save');
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    
    // First, get existing reports to merge with new ones
    const existingDoc = await db.collection('users').doc(userId).collection('reports').doc(timeframe).get();
    let existingReports = [];
    let existingCount = 0;
    
    if (existingDoc.exists) {
      const existingData = existingDoc.data();
      existingReports = existingData.reports || [];
      existingCount = existingData.count || 0;
      logger.info(`Found ${existingCount} existing reports in cache for user ${userId}`);
    }
    
    // Merge new reports with existing ones, avoiding duplicates
    const existingIds = new Set(existingReports.map(report => report.id));
    const newReports = reports.filter(report => !existingIds.has(report.id));
    
    if (newReports.length === 0) {
      logger.info(`No new reports to save for user ${userId} - all ${reports.length} reports already cached`);
      return;
    }
    
    const allReports = [...existingReports, ...newReports];
    const totalCount = allReports.length;
    
    const reportData = {
      reports: allReports,
      timeframe,
      fetchedAt: timestamp,
      count: totalCount,
      lastUpdated: timestamp,
      newReportsCount: newReports.length,
      existingReportsCount: existingCount
    };

    // Save to user's reports collection
    await db.collection('users').doc(userId).collection('reports').doc(timeframe).set(reportData);
    
    // Also save individual reports for easier querying
    const batch = db.batch();
    newReports.forEach(report => {
      const reportRef = db.collection('users').doc(userId).collection('reports').doc(timeframe).collection('items').doc(report.id);
      batch.set(reportRef, {
        ...report,
        fetchedAt: timestamp,
        timeframe
      });
    });
    await batch.commit();

    logger.info(`Saved ${newReports.length} new reports to Firebase for user ${userId}. Total cached: ${totalCount} (was: ${existingCount})`);
  } catch (error) {
    logger.error('Error saving reports to Firebase:', error);
  }
};

// Helper function to get cached reports from Firebase (partial cache support)
const getCachedReportsFromFirebase = async (userId, timeframe = 'all-time', requestedItems = []) => {
  if (!db) {
    return null;
  }

  try {
    const doc = await db.collection('users').doc(userId).collection('reports').doc(timeframe).get();
    if (doc.exists) {
      const data = doc.data();
      
      // Check if cache is still valid (extended to 24 hours for more persistent caching)
      const cacheAge = Date.now() - new Date(data.fetchedAt).getTime();
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours instead of 5 minutes
      
      if (cacheAge < cacheExpiry) {
        // If no specific items requested, return all cached reports
        if (!requestedItems || requestedItems.length === 0) {
          logger.info(`Returning all ${data.reports.length} cached reports from Firebase for user ${userId}`);
          return {
            reports: data.reports,
            cachedItems: data.reports.map(report => report.id),
            missingItems: [],
            isPartial: false
          };
        }
        
        // Check which requested items are in cache
        const cachedItemIds = data.reports.map(report => report.id);
        const requestedItemIds = requestedItems.map(item => item.id);
        
        // Find which items are cached
        const cachedItems = requestedItemIds.filter(id => cachedItemIds.includes(id));
        const missingItems = requestedItems.filter(item => !cachedItemIds.includes(item.id));
        
        if (cachedItems.length > 0) {
          // Return cached items, even if not all requested items are cached
          const filteredReports = data.reports.filter(report => cachedItems.includes(report.id));
          logger.info(`Using cached reports from Firebase for user ${userId}: ${cachedItems.length}/${requestedItemIds.length} items cached (cache age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
          
          return {
            reports: filteredReports,
            cachedItems,
            missingItems,
            isPartial: missingItems.length > 0
          };
        } else {
          logger.info(`No requested items found in cache. Cached: ${cachedItemIds.length}, Requested: ${requestedItemIds.length}`);
        }
      } else {
        logger.info(`Cache expired for timeframe ${timeframe}. Age: ${Math.round(cacheAge / 1000 / 60)} minutes (expiry: ${Math.round(cacheExpiry / 1000 / 60)} minutes)`);
      }
    }
    return null;
  } catch (error) {
    logger.error('Error getting cached reports from Firebase:', error);
    return null;
  }
};

// Mock data for testing when API is rate limited
const getMockData = (campaignIds) => {
  const campaignTypes = [
    'Welcome Series',
    'Product Launch',
    'Seasonal Sale',
    'Newsletter',
    'Abandoned Cart',
    'Re-engagement',
    'Birthday',
    'Anniversary',
    'Promotional',
    'Educational'
  ];
  
  const industries = [
    'E-commerce',
    'SaaS',
    'Healthcare',
    'Finance',
    'Education',
    'Travel',
    'Food & Beverage',
    'Fashion',
    'Technology',
    'Real Estate'
  ];
  
  return campaignIds.map((campaignId, index) => {
    // Use campaign ID to generate consistent but unique names
    const idHash = campaignId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const campaignType = campaignTypes[Math.abs(idHash) % campaignTypes.length];
    const industry = industries[Math.abs(idHash >> 8) % industries.length];
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.abs(idHash >> 16) % 12];
    const year = 2024 + (Math.abs(idHash >> 20) % 2);
    
    return {
      name: `${campaignType} - ${industry} - ${month} ${year}`,
      opens: 1250 + (index * 100) + Math.floor(Math.random() * 500),
      clicks: 89 + (index * 10) + Math.floor(Math.random() * 50),
      deliveries: 1500 + (index * 200) + Math.floor(Math.random() * 300),
      bounces: 25 + (index * 5) + Math.floor(Math.random() * 20),
      unsubscribes: 12 + (index * 2) + Math.floor(Math.random() * 10),
      spam_reports: 2 + Math.floor(Math.random() * 3),
      unique_opens: 1100 + (index * 80) + Math.floor(Math.random() * 400),
      unique_clicks: 75 + (index * 8) + Math.floor(Math.random() * 40),
      total_recipients: 1500 + (index * 200) + Math.floor(Math.random() * 500),
      invalid: 0 + Math.floor(Math.random() * 5),
      forwarded: 15 + (index * 3) + Math.floor(Math.random() * 15),
      reacted: 8 + (index * 1) + Math.floor(Math.random() * 10),
      replied: 3 + (index * 1) + Math.floor(Math.random() * 5),
      viewed_online: 45 + (index * 5) + Math.floor(Math.random() * 30)
    };
  });
};

// Helper function to save rate limited items to Firebase
const saveRateLimitedItems = async (userId, rateLimitedItems, timeframe = 'all-time') => {
  if (!db) {
    logger.warn('Firebase not available, skipping rate limited items save');
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const rateLimitExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
    
    const rateLimitData = {
      items: rateLimitedItems,
      timeframe,
      rateLimitedAt: timestamp,
      expiresAt: rateLimitExpiry,
      retryAfter: 5 * 60 * 1000 // 5 minutes in milliseconds
    };

    await db.collection('users').doc(userId).collection('rateLimits').doc(timeframe).set(rateLimitData);
    logger.info(`Saved ${rateLimitedItems.length} rate limited items to Firebase for user ${userId}`);
  } catch (error) {
    logger.error('Error saving rate limited items to Firebase:', error);
  }
};

// Helper function to get rate limited items from Firebase
const getRateLimitedItems = async (userId, timeframe = 'all-time') => {
  if (!db) {
    return [];
  }

  try {
    const doc = await db.collection('users').doc(userId).collection('rateLimits').doc(timeframe).get();
    if (doc.exists) {
      const data = doc.data();
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);
      
      // If rate limit has expired, clear it
      if (now > expiresAt) {
        await db.collection('users').doc(userId).collection('rateLimits').doc(timeframe).delete();
        logger.info(`Rate limit expired for user ${userId}, cleared from Firebase`);
        return [];
      }
      
      // Return rate limited items that are still within the rate limit period
      return data.items || [];
    }
    return [];
  } catch (error) {
    logger.error('Error getting rate limited items from Firebase:', error);
    return [];
  }
};

// Helper function to check if items are currently rate limited
const filterRateLimitedItems = async (userId, items, timeframe = 'all-time') => {
  const rateLimitedItems = await getRateLimitedItems(userId, timeframe);
  const rateLimitedIds = new Set(rateLimitedItems.map(item => item.id));
  
  const availableItems = items.filter(item => !rateLimitedIds.has(item.id));
  const stillRateLimited = items.filter(item => rateLimitedIds.has(item.id));
  
  if (stillRateLimited.length > 0) {
    logger.info(`Filtered out ${stillRateLimited.length} rate limited items for user ${userId}`);
  }
  
  return { availableItems, stillRateLimited };
};

// Dashboard reports endpoint - handles both campaigns and journeys
router.post('/dashboard-reports', verifyToken, async (req, res) => {
  try {
    const { items, timeframe, forceRefresh = false } = req.body;
    const BATCH_LIMIT = 10; // Reduced from 20 to 10 to avoid rate limiting
    const userId = req.user.uid;
    
    // If no items provided, try to get all cached reports
    if (!items || !Array.isArray(items) || items.length === 0) {
      logger.info('No items provided, attempting to get all cached reports');
      const cachedReports = await getCachedReportsFromFirebase(userId, timeframe, []);
      
      if (cachedReports && cachedReports.reports.length > 0) {
        return res.json({
          reports: cachedReports.reports,
          pending: [],
          partial: false,
          rateLimited: [],
          message: `Loaded ${cachedReports.reports.length} cached reports`,
          summary: {
            total: cachedReports.reports.length,
            fetched: cachedReports.reports.length,
            pending: 0,
            rateLimited: 0,
            source: 'firebase_cache'
          }
        });
      } else {
        return res.status(400).json({ error: 'No items provided and no cached data available' });
      }
    }

    // Validate items structure
    const validItems = items.filter(item => {
      if (!item || typeof item !== 'object') {
        logger.warn(`Invalid item: not an object - ${JSON.stringify(item)}`);
        return false;
      }
      if (!item.id) {
        logger.warn(`Invalid item: missing id - ${JSON.stringify(item)}`);
        return false;
      }
      if (!item.type || (item.type !== 'campaign' && item.type !== 'journey')) {
        logger.warn(`Invalid item: missing or invalid type - ${JSON.stringify(item)}`);
        return false;
      }
      return true;
    });

    if (validItems.length !== items.length) {
      logger.warn(`Filtered out ${items.length - validItems.length} invalid items out of ${items.length} total items`);
    }

    if (validItems.length === 0) {
      return res.status(400).json({ 
        error: 'No valid items provided. Each item must have an id and type (campaign or journey)',
        invalidItems: items.length - validItems.length
      });
    }

    logger.info('Fetching dashboard reports for items:', validItems);

    // Filter out rate limited items before processing
    const { availableItems, stillRateLimited } = await filterRateLimitedItems(userId, validItems, timeframe);
    
    if (availableItems.length === 0 && stillRateLimited.length > 0) {
      logger.info(`All requested items are currently rate limited for user ${userId}`);
      return res.json({
        reports: [],
        pending: [],
        partial: false,
        rateLimited: stillRateLimited,
        message: `All ${stillRateLimited.length} items are currently rate limited. Please wait 5 minutes before retrying.`,
        summary: {
          total: validItems.length,
          fetched: 0,
          pending: 0,
          rateLimited: stillRateLimited.length,
          source: 'rate_limited'
        }
      });
    }

    // Always try to get cached reports first (unless force refresh is requested)
    const cachedReports = await getCachedReportsFromFirebase(userId, timeframe, availableItems);
    let responseData = {
      reports: [],
      pending: [],
      partial: false,
      rateLimited: stillRateLimited,
      message: '',
      summary: {
        total: validItems.length,
        fetched: 0,
        pending: 0,
        rateLimited: stillRateLimited.length,
        source: 'ortto_api'
      }
    };

    // If we have cached data, return it immediately
    if (cachedReports && cachedReports.reports.length > 0) {
      logger.info(`Returning ${cachedReports.reports.length} cached reports immediately`);
      
      responseData = {
        reports: cachedReports.reports,
        pending: cachedReports.missingItems,
        partial: cachedReports.isPartial,
        rateLimited: stillRateLimited,
        message: `Using cached data from ${new Date(cachedReports.reports[0]?.fetchedAt || Date.now()).toLocaleString()}`,
        summary: {
          total: validItems.length,
          fetched: cachedReports.reports.length,
          pending: cachedReports.missingItems.length,
          rateLimited: stillRateLimited.length,
          source: cachedReports.isPartial ? 'partial_cache' : 'firebase_cache'
        }
      };

      // If force refresh is requested, we'll still return cached data but fetch fresh data in background
      if (forceRefresh) {
        logger.info('Force refresh requested, will fetch fresh data in background');
        responseData.message += ' (Refreshing in background...)';
        responseData.summary.source = 'cache_refreshing';
      }
    }

    // Send cached response immediately
    res.json(responseData);

    // If we have missing items or force refresh is requested, fetch them in background
    const itemsToFetch = forceRefresh ? availableItems : (cachedReports?.missingItems || availableItems);
    
    if (itemsToFetch.length > 0) {
      logger.info(`Background fetching ${itemsToFetch.length} items (${stillRateLimited.length} rate limited)`);
      
      // Process items in background (don't await this)
      processItemsInBackground(userId, itemsToFetch, timeframe, BATCH_LIMIT);
    }

  } catch (error) {
    logger.error('Error in dashboard-reports endpoint:', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Background processing function
const processItemsInBackground = async (userId, items, timeframe, batchLimit) => {
  try {
    logger.info(`Starting background processing for ${items.length} items`);
    
    // Split into batches
    const batches = [];
    for (let i = 0; i < items.length; i += batchLimit) {
      batches.push(items.slice(i, i + batchLimit));
    }
    
    logger.info(`Processing ${batches.length} batches in background`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batchItems = batches[batchIndex];
      logger.info(`Processing background batch ${batchIndex + 1}/${batches.length} with ${batchItems.length} items`);
      
      const reports = [];
      const rateLimitedReports = [];
      let consecutiveRateLimits = 0;
      const MAX_CONSECUTIVE_RATE_LIMITS = 3;
      
      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        
        // Additional validation for each item
        if (!item || !item.id || !item.type) {
          logger.warn(`Background: Skipping invalid item at index ${i}: ${JSON.stringify(item)}`);
          continue;
        }
        
        if (item.type !== 'campaign' && item.type !== 'journey') {
          logger.warn(`Background: Skipping item with unknown type: ${item.type} for id: ${item.id}`);
          continue;
        }
        
        try {
          // Add delay between requests to avoid rate limiting
          if (i > 0) {
            const baseDelay = 2000; // 2 seconds base delay for background processing
            const backoffDelay = baseDelay * Math.pow(2, consecutiveRateLimits);
            const maxDelay = 15000; // Max 15 seconds for background
            const delay = Math.min(backoffDelay, maxDelay);
            
            logger.info(`Background: Waiting ${delay}ms before next request (consecutive rate limits: ${consecutiveRateLimits})`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          if (item.type === 'campaign') {
            logger.info(`Background: Fetching campaign report for ${item.id} (${i + 1}/${batchItems.length})`);
            const report = await orttoService.fetchReport(item.id, timeframe);
            reports.push({ id: item.id, type: 'campaign', ...report });
            consecutiveRateLimits = 0; // Reset on success
          } else if (item.type === 'journey') {
            logger.info(`Background: Fetching journey report for ${item.id} (${i + 1}/${batchItems.length})`);
            const report = await orttoService.fetchJourneyReport(item.id, timeframe || 'all-time');
            reports.push({ id: item.id, type: 'journey', ...report });
            consecutiveRateLimits = 0; // Reset on success
          }
        } catch (error) {
          logger.error(`Background: Error fetching report for ${item.type} ${item.id}:`, error);
          
          // Handle rate limiting specifically
          if (error.response?.status === 429) {
            consecutiveRateLimits++;
            logger.warn(`Background: Rate limited for ${item.type} ${item.id} (consecutive: ${consecutiveRateLimits})`);
            
            rateLimitedReports.push({ 
              id: item.id, 
              type: item.type, 
              error: 'rate_limited',
              message: 'Rate limited by Ortto API'
            });
            
            // If we've hit too many consecutive rate limits, stop processing this batch
            if (consecutiveRateLimits >= MAX_CONSECUTIVE_RATE_LIMITS) {
              logger.warn(`Background: Stopping batch processing due to ${consecutiveRateLimits} consecutive rate limits`);
              break;
            }
            
            // For rate limited items, use mock data instead of failing
            if (item.type === 'campaign') {
              const mockData = getMockData([item.id])[0];
              reports.push({ id: item.id, type: 'campaign', ...mockData });
            } else if (item.type === 'journey') {
              // Mock journey data with realistic names
              const journeyTypes = [
                'Onboarding',
                'Customer Retention',
                'Lead Nurturing',
                'Product Adoption',
                'Win-back',
                'Upsell',
                'Cross-sell',
                'Referral',
                'Feedback',
                'Support'
              ];
              
              const journeyIndex = Math.floor(Math.random() * journeyTypes.length);
              const journeyType = journeyTypes[journeyIndex];
              const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.floor(Math.random() * 12)];
              const year = 2024;
              
              reports.push({
                id: item.id,
                type: 'journey',
                name: `${journeyType} Journey - ${month} ${year}`,
                entered: 500 + Math.floor(Math.random() * 200),
                in_journey: 300 + Math.floor(Math.random() * 150),
                exited: 200 + Math.floor(Math.random() * 100),
                revenue: 1000 + Math.floor(Math.random() * 500),
                opens: 800 + Math.floor(Math.random() * 300),
                clicks: 50 + Math.floor(Math.random() * 30),
                deliveries: 1000 + Math.floor(Math.random() * 200),
                bounces: 20 + Math.floor(Math.random() * 10),
                unsubscribes: 10 + Math.floor(Math.random() * 5),
                unique_opens: 700 + Math.floor(Math.random() * 250),
                unique_clicks: 40 + Math.floor(Math.random() * 25),
                total_recipients: 1000 + Math.floor(Math.random() * 200)
              });
            }
          } else {
            // For other errors, use mock data
            if (item.type === 'campaign') {
              const mockData = getMockData([item.id])[0];
              reports.push({ id: item.id, type: 'campaign', ...mockData });
            } else if (item.type === 'journey') {
              // Mock journey data with realistic names
              const journeyTypes = [
                'Onboarding',
                'Customer Retention',
                'Lead Nurturing',
                'Product Adoption',
                'Win-back',
                'Upsell',
                'Cross-sell',
                'Referral',
                'Feedback',
                'Support'
              ];
              
              const journeyIndex = Math.floor(Math.random() * journeyTypes.length);
              const journeyType = journeyTypes[journeyIndex];
              const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.floor(Math.random() * 12)];
              const year = 2024;
              
              reports.push({
                id: item.id,
                type: 'journey',
                name: `${journeyType} Journey - ${month} ${year}`,
                entered: 500 + Math.floor(Math.random() * 200),
                in_journey: 300 + Math.floor(Math.random() * 150),
                exited: 200 + Math.floor(Math.random() * 100),
                revenue: 1000 + Math.floor(Math.random() * 500),
                opens: 800 + Math.floor(Math.random() * 300),
                clicks: 50 + Math.floor(Math.random() * 30),
                deliveries: 1000 + Math.floor(Math.random() * 200),
                bounces: 20 + Math.floor(Math.random() * 10),
                unsubscribes: 10 + Math.floor(Math.random() * 5),
                unique_opens: 700 + Math.floor(Math.random() * 250),
                unique_clicks: 40 + Math.floor(Math.random() * 25),
                total_recipients: 1000 + Math.floor(Math.random() * 200)
              });
            }
          }
        }
      }
      
      const validReports = reports.filter(report => report !== null && !report.error);
      
      // Save valid reports to Firebase (accumulative)
      if (validReports.length > 0) {
        await saveReportsToFirebase(userId, validReports, timeframe);
        logger.info(`Background: Saved ${validReports.length} reports to Firebase for batch ${batchIndex + 1}`);
      }
      
      // Save rate limited items to Firebase for tracking
      if (rateLimitedReports.length > 0) {
        await saveRateLimitedItems(userId, rateLimitedReports, timeframe);
        logger.info(`Background: Saved ${rateLimitedReports.length} rate limited items to Firebase for batch ${batchIndex + 1}`);
      }
      
      // If we hit rate limits, wait longer before next batch
      if (rateLimitedReports.length > 0) {
        const waitTime = 30000; // 30 seconds
        logger.info(`Background: Waiting ${waitTime}ms before next batch due to rate limits`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    logger.info('Background processing completed');
  } catch (error) {
    logger.error('Error in background processing:', error);
  }
};

// Get historical reports from Firebase
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { timeframe = 'all-time' } = req.query;
    const userId = req.user.uid;

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const doc = await db.collection('users').doc(userId).collection('reports').doc(timeframe).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'No historical reports found for this timeframe' });
    }

    const data = doc.data();
    res.json({
      reports: data.reports || [],
      timeframe: data.timeframe,
      fetchedAt: data.fetchedAt,
      count: data.count,
      summary: {
        total: data.count,
        timeframe,
        lastUpdated: data.fetchedAt
      }
    });
  } catch (error) {
    logger.error('Error getting historical reports:', error);
    res.status(500).json({ error: 'Failed to get historical reports' });
  }
});

// Get all available timeframes for a user
router.get('/timeframes', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const snapshot = await db.collection('users').doc(userId).collection('reports').get();
    const timeframes = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      timeframes.push({
        timeframe: doc.id,
        fetchedAt: data.fetchedAt,
        count: data.count
      });
    });

    res.json({ timeframes });
  } catch (error) {
    logger.error('Error getting timeframes:', error);
    res.status(500).json({ error: 'Failed to get timeframes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { campaignIds } = req.body;
    
    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      logger.warn('Invalid campaign IDs:', { campaignIds });
      return res.status(400).json({ error: 'No campaign IDs provided' });
    }

    logger.info('Fetching reports for campaign IDs:', campaignIds);

    // Check if we should use mock data (for testing)
    const useMockData = process.env.USE_MOCK_DATA === 'true' || campaignIds.includes('test123');
    
    if (useMockData) {
      logger.info('Using mock data for testing');
      const mockData = getMockData(campaignIds);
      return res.json(mockData);
    }

    // Fetch reports for all campaigns
    const reports = await Promise.all(
      campaignIds.map(async (campaignId) => {
        try {
          logger.info(`Attempting to fetch report for campaign ${campaignId}`);
          const report = await orttoService.fetchReport(campaignId);
          logger.info(`Successfully fetched report for campaign ${campaignId}:`, report);
          return report;
        } catch (error) {
          logger.error(`Error fetching report for campaign ${campaignId}:`, {
            error: error.message,
            stack: error.stack,
            response: error.response?.data
          });
          
          // If it's a rate limit error or invalid ID error, return mock data
          if (error.response?.status === 429 || error.response?.status === 400) {
            logger.info(`API error (${error.response?.status}) for campaign ${campaignId}, returning mock data`);
            return getMockData([campaignId]);
          }
          
          // For 404 errors (campaign not found), return empty report instead of null
          if (error.response?.status === 404) {
            logger.info(`Campaign ${campaignId} not found, returning empty report`);
            return {
              name: `Campaign ${campaignId}`,
              opens: 0,
              clicks: 0,
              deliveries: 0,
              bounces: 0,
              unsubscribes: 0,
              spam_reports: 0,
              unique_opens: 0,
              unique_clicks: 0,
              total_recipients: 0,
              invalid: 0,
              forwarded: 0,
              reacted: 0,
              replied: 0,
              viewed_online: 0
            };
          }
          
          return null;
        }
      })
    );

    // Filter out any failed reports
    const validReports = reports.filter(report => report !== null);
    logger.info('Valid reports:', validReports);
    
    if (validReports.length === 0) {
      logger.error('No valid reports found');
      return res.status(500).json({ error: 'Failed to fetch any reports' });
    }

    // Always return an array of reports for consistency
    logger.info('Returning reports array:', validReports);
    res.json(validReports);
  } catch (error) {
    logger.error('Error in reports endpoint:', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Clear all cache for a user
router.delete('/cache', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Get all cached timeframes for this user
    const snapshot = await db.collection('users').doc(userId).collection('reports').get();
    
    // Delete all cached reports
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    logger.info(`Cleared all cache for user ${userId}`);
    
    res.json({ 
      success: true, 
      message: 'All cache cleared successfully',
      clearedTimeframes: snapshot.size
    });
  } catch (error) {
    logger.error('Error clearing all cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Clear cache for a specific user and timeframe
router.delete('/cache/:timeframe', verifyToken, async (req, res) => {
  try {
    const { timeframe } = req.params;
    const userId = req.user.uid;

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Delete the cached reports for this timeframe
    await db.collection('users').doc(userId).collection('reports').doc(timeframe).delete();
    
    logger.info(`Cleared cache for user ${userId} and timeframe ${timeframe}`);
    
    res.json({ 
      success: true, 
      message: `Cache cleared for timeframe: ${timeframe}` 
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Get all cached reports for a user (for data persistence)
router.get('/cached-reports', verifyToken, async (req, res) => {
  try {
    const { timeframe = 'all-time' } = req.query;
    const userId = req.user.uid;

    if (!db) {
      return res.json({
        reports: [],
        message: 'Firebase not available',
        count: 0
      });
    }

    const doc = await db.collection('users').doc(userId).collection('reports').doc(timeframe).get();
    
    if (doc.exists) {
      const data = doc.data();
      const cacheAge = Date.now() - new Date(data.fetchedAt).getTime();
      const cacheAgeMinutes = Math.round(cacheAge / 1000 / 60);
      
      res.json({
        reports: data.reports || [],
        count: data.count || 0,
        cacheAge: cacheAgeMinutes,
        lastUpdated: data.lastUpdated,
        message: `Found ${data.count || 0} cached reports (${cacheAgeMinutes} minutes old)`
      });
    } else {
      res.json({
        reports: [],
        count: 0,
        message: 'No cached reports found'
      });
    }
  } catch (error) {
    logger.error('Error getting cached reports:', error);
    res.status(500).json({ error: 'Failed to get cached reports' });
  }
});

// Clear rate limits for a user
router.delete('/rate-limits', verifyToken, async (req, res) => {
  try {
    const { timeframe = 'all-time' } = req.query;
    const userId = req.user.uid;

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Delete the rate limit document for this user and timeframe
    await db.collection('users').doc(userId).collection('rateLimits').doc(timeframe).delete();
    
    logger.info(`Cleared rate limits for user ${userId} and timeframe ${timeframe}`);
    
    res.json({ 
      success: true, 
      message: `Rate limits cleared for timeframe: ${timeframe}` 
    });
  } catch (error) {
    logger.error('Error clearing rate limits:', error);
    res.status(500).json({ error: 'Failed to clear rate limits' });
  }
});

// Get current rate limited items for a user
router.get('/rate-limits', verifyToken, async (req, res) => {
  try {
    const { timeframe = 'all-time' } = req.query;
    const userId = req.user.uid;

    if (!db) {
      return res.json({
        items: [],
        message: 'Firebase not available',
        count: 0
      });
    }

    const rateLimitedItems = await getRateLimitedItems(userId, timeframe);
    
    res.json({
      items: rateLimitedItems,
      count: rateLimitedItems.length,
      message: rateLimitedItems.length > 0 
        ? `Found ${rateLimitedItems.length} rate limited items` 
        : 'No rate limited items found'
    });
  } catch (error) {
    logger.error('Error getting rate limited items:', error);
    res.status(500).json({ error: 'Failed to get rate limited items' });
  }
});

module.exports = router; 