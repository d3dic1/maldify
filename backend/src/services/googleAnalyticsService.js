const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { logger } = require('../utils/logger');

class GoogleAnalyticsService {
  constructor() {
    this.credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!this.credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required');
    }

    this.analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: this.credentials
    });

    logger.info('Initializing GoogleAnalyticsService with:', {
      hasCredentials: !!this.credentials
    });
  }

  validateAndFormatPropertyId(propertyId) {
    // Remove any whitespace
    const cleanId = propertyId.toString().trim();
    
    // Check if it's a Measurement ID (starts with G-)
    if (cleanId.startsWith('G-')) {
      logger.warn(`Measurement ID detected (${cleanId}). Google Analytics Data API v1 requires a numeric Property ID.`);
      logger.warn('To find your Property ID:');
      logger.warn('1. Go to Google Analytics Admin');
      logger.warn('2. Select your property');
      logger.warn('3. Look for "Property ID" (numeric, e.g., 123456789)');
      logger.warn('4. Update your GA4_PROPERTY_ID environment variable');
      
      throw new Error(`Invalid Property ID format: ${cleanId}. Google Analytics Data API v1 requires a numeric Property ID, not a Measurement ID (G-XXXXXXXXX). Please update your GA4_PROPERTY_ID environment variable with the numeric Property ID from Google Analytics Admin.`);
    }
    
    // Check if it's numeric
    if (!/^\d+$/.test(cleanId)) {
      throw new Error(`Invalid Property ID format: ${cleanId}. Property ID must be numeric.`);
    }
    
    return cleanId;
  }

  async fetchOrttoData(startDate = '30daysAgo', endDate = 'today', propertyId = null) {
    try {
      // Use provided propertyId or fallback to environment variable for backward compatibility
      let targetPropertyId = propertyId;
      if (!targetPropertyId) {
        targetPropertyId = process.env.GA4_PROPERTY_ID;
        if (!targetPropertyId) {
          throw new Error('No Property ID provided and GA4_PROPERTY_ID environment variable is not set');
        }
      }

      // Validate the property ID
      targetPropertyId = this.validateAndFormatPropertyId(targetPropertyId);

      logger.info('Fetching Google Analytics data for Ortto source:', {
        startDate,
        endDate,
        propertyId: targetPropertyId
      });

      // Try to get Ortto-specific data first
      try {
        const orttoData = await this.fetchOrttoSpecificData(targetPropertyId, startDate, endDate);
        return orttoData;
      } catch (orttoError) {
        logger.warn('Could not fetch Ortto-specific data, falling back to general analytics:', orttoError.message);
        return await this.fetchGeneralAnalyticsData(targetPropertyId, startDate, endDate);
      }

    } catch (error) {
      logger.error('Error fetching Google Analytics data:', {
        error: error.message,
        stack: error.stack,
        propertyId: propertyId || process.env.GA4_PROPERTY_ID
      });
      
      throw new Error(`Failed to fetch Google Analytics data: ${error.message}`);
    }
  }

  async fetchOrttoSpecificData(propertyId, startDate, endDate) {
    // Try different approaches to get Ortto-specific data
    try {
      logger.info('Testing firstUserSourceMedium dimension compatibility...');

      const [testResponse] = await this.analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'date' },
          { name: 'firstUserSourceMedium' }
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'sessions' },
          { name: 'engagedSessions' },
          { name: 'totalUsers' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'firstUserSourceMedium',
            stringFilter: {
              matchType: 'EXACT',
              value: 'ortto / email',
            },
          },
        },
      });

      logger.info('firstUserSourceMedium dimension test successful:', {
        rowCount: testResponse.rows?.length || 0,
        hasData: testResponse.rows && testResponse.rows.length > 0
      });

      if (testResponse.rows && testResponse.rows.length > 0) {
        // We have Ortto data! Now try to get additional metrics including shopify_app_install
        return this.processOrttoData(testResponse, propertyId, startDate, endDate);
      } else {
        logger.warn('No Ortto data found with firstUserSourceMedium dimension');
        throw new Error('No Ortto data found');
      }

    } catch (error) {
      logger.warn('firstUserSourceMedium dimension approach failed:', error.message);
      throw new Error(`Ortto-specific approach failed: ${error.message}`);
    }
  }

  async fetchShopifyAppInstallEvents(propertyId, startDate, endDate) {
    try {
      logger.info('Fetching shopify_app_install events from Ortto campaigns...');

      const [installResponse] = await this.analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'date' },
          { name: 'firstUserSourceMedium' },
          { name: 'eventName' }
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'totalUsers' }
        ],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'firstUserSourceMedium',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'ortto / email',
                  },
                },
              },
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'shopify_app_install',
                  },
                },
              },
            ],
          },
        },
      });

      logger.info('shopify_app_install events fetched:', {
        rowCount: installResponse.rows?.length || 0,
        hasData: installResponse.rows && installResponse.rows.length > 0
      });

      return installResponse;
    } catch (error) {
      logger.warn('Failed to fetch shopify_app_install events:', error.message);
      return null;
    }
  }

  async discoverSourceMediumCombinations(propertyId, startDate, endDate) {
    try {
      logger.info('Discovering source/medium combinations in GA4 data...');

      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'firstUserSourceMedium' }
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'sessions' },
          { name: 'totalUsers' }
        ],
        orderBys: [
          {
            metric: { metricName: 'eventCount' },
            desc: true
          }
        ],
        limit: 50
      });

      if (response.rows && response.rows.length > 0) {
        const combinations = response.rows.map(row => {
          const dimensions = row.dimensionValues;
          const metrics = row.metricValues;
          
          return {
            sourceMedium: dimensions[0].value,
            eventCount: parseInt(metrics[0].value) || 0,
            sessions: parseInt(metrics[1].value) || 0,
            users: parseInt(metrics[2].value) || 0
          };
        });

        logger.info('Found source/medium combinations:', {
          totalCombinations: combinations.length,
          topCombinations: combinations.slice(0, 10)
        });

        return combinations;
      } else {
        logger.warn('No source/medium combinations found');
        return [];
      }
    } catch (error) {
      logger.error('Failed to discover source/medium combinations:', error.message);
      return [];
    }
  }

  async processOrttoData(orttoResponse, propertyId, startDate, endDate) {
    // Process the Ortto data we found
    const dailyData = orttoResponse.rows.map(row => {
      const dimensions = row.dimensionValues;
      const metrics = row.metricValues;

      return {
        date: dimensions[0].value, // date
        sourceMedium: dimensions[1].value, // firstUserSourceMedium
        sessions: parseInt(metrics[1].value) || 0,
        engagedSessions: parseInt(metrics[2].value) || 0,
        users: parseInt(metrics[3].value) || 0,
        events: parseInt(metrics[0].value) || 0
      };
    });

    // Fetch shopify_app_install events
    const installEvents = await this.fetchShopifyAppInstallEvents(propertyId, startDate, endDate);
    
    // Process install events if available
    let installData = [];
    let totalInstalls = 0;
    let totalUniqueInstalls = 0;
    
    if (installEvents && installEvents.rows && installEvents.rows.length > 0) {
      installData = installEvents.rows.map(row => {
        const dimensions = row.dimensionValues;
        const metrics = row.metricValues;
        
        const installCount = parseInt(metrics[0].value) || 0;
        const uniqueInstalls = parseInt(metrics[1].value) || 0;
        
        totalInstalls += installCount;
        totalUniqueInstalls += uniqueInstalls;
        
        return {
          date: dimensions[0].value,
          sourceMedium: dimensions[1].value,
          eventName: dimensions[2].value,
          installCount: installCount,
          uniqueInstalls: uniqueInstalls
        };
      });
    }

    const totals = dailyData.reduce((acc, day) => {
      acc.sessions += day.sessions;
      acc.engagedSessions += day.engagedSessions;
      acc.users += day.users;
      acc.events += day.events;
      return acc;
    }, {
      sessions: 0,
      engagedSessions: 0,
      users: 0,
      events: 0,
      installs: totalInstalls,
      uniqueInstalls: totalUniqueInstalls
    });

    const data = { 
      dailyData, 
      totals,
      installEvents: installData,
      keyEvents: {
        shopifyAppInstalls: {
          total: totalInstalls,
          unique: totalUniqueInstalls,
          dailyData: installData
        }
      }
    };

    return {
      success: true,
      data: data,
      summary: this.generateSummary(data),
      dateRange: { startDate, endDate },
      propertyId: propertyId,
      note: 'Ortto event data (filtered by firstUserSourceMedium = ortto / email) including shopify_app_install events'
    };
  }

  async fetchGeneralAnalyticsData(propertyId, startDate, endDate) {
    // Fallback to general analytics data
    const [basicResponse] = await this.analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'conversions' },
        { name: 'totalUsers' },
      ],
    });

    const [eventResponse] = await this.analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'eventCount' },
      ],
    });

    const combinedData = this.combineAnalyticsData(basicResponse, eventResponse);
    
    return {
      success: true,
      data: combinedData,
      summary: this.generateSummary(combinedData),
      dateRange: { startDate, endDate },
      propertyId: propertyId,
      note: 'General analytics data (not filtered by source)'
    };
  }

  combineAnalyticsData(basicResponse, eventResponse) {
    // Create a map of event data by date
    const eventDataMap = new Map();
    if (eventResponse.rows) {
      eventResponse.rows.forEach(row => {
        const date = row.dimensionValues[0].value;
        const pageViews = parseInt(row.metricValues[0].value) || 0;
        const events = parseInt(row.metricValues[1].value) || 0;
        eventDataMap.set(date, { pageViews, events });
      });
    }

    // Process basic data and merge with event data
    if (!basicResponse.rows || basicResponse.rows.length === 0) {
      return {
        dailyData: [],
        totals: {
          sessions: 0,
          pageViews: 0,
          conversions: 0,
          users: 0,
          events: 0
        }
      };
    }

    const dailyData = basicResponse.rows.map(row => {
      const dimensions = row.dimensionValues;
      const metrics = row.metricValues;
      const date = dimensions[0].value;
      const eventData = eventDataMap.get(date) || { pageViews: 0, events: 0 };

      return {
        date: date,
        source: 'all', // General analytics data
        medium: 'all', // General analytics data
        sessions: parseInt(metrics[0].value) || 0,
        pageViews: eventData.pageViews,
        conversions: parseInt(metrics[1].value) || 0,
        users: parseInt(metrics[2].value) || 0,
        events: eventData.events
      };
    });

    // Calculate totals
    const totals = dailyData.reduce((acc, day) => {
      acc.sessions += day.sessions;
      acc.pageViews += day.pageViews;
      acc.conversions += day.conversions;
      acc.users += day.users;
      acc.events += day.events;
      return acc;
    }, {
      sessions: 0,
      pageViews: 0,
      conversions: 0,
      users: 0,
      events: 0
    });

    return {
      dailyData,
      totals
    };
  }

  generateSummary(data) {
    const { totals, dailyData } = data;
    
    if (dailyData.length === 0) {
      return {
        totalSessions: 0,
        totalPageViews: 0,
        totalConversions: 0,
        totalUsers: 0,
        totalEvents: 0,
        avgSessionsPerDay: 0,
        avgPageViewsPerDay: 0,
        avgConversionsPerDay: 0,
        conversionRate: 0,
        pageViewsPerSession: 0
      };
    }

    const daysCount = dailyData.length;
    
    return {
      totalSessions: totals.sessions,
      totalPageViews: totals.pageViews,
      totalConversions: totals.conversions,
      totalUsers: totals.users,
      totalEvents: totals.events,
      avgSessionsPerDay: Math.round(totals.sessions / daysCount * 100) / 100,
      avgPageViewsPerDay: Math.round(totals.pageViews / daysCount * 100) / 100,
      avgConversionsPerDay: Math.round(totals.conversions / daysCount * 100) / 100,
      conversionRate: totals.sessions > 0 ? Math.round((totals.conversions / totals.sessions) * 100 * 100) / 100 : 0,
      pageViewsPerSession: totals.sessions > 0 ? Math.round((totals.pageViews / totals.sessions) * 100) / 100 : 0
    };
  }

  async fetchCustomDateRange(startDate, endDate, propertyId = null) {
    return this.fetchOrttoData(startDate, endDate, propertyId);
  }
}

module.exports = GoogleAnalyticsService; 