const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const ga4PropertyService = require('./ga4PropertyService');
const { logger } = require('../utils/logger');

class InstallTrackingService {
  constructor() {
    this.credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!this.credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required');
    }

    this.analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: this.credentials
    });

    this.ga4PropertyService = ga4PropertyService;
    
    logger.info('Initializing InstallTrackingService');
  }

  /**
   * Fetch install events from all active GA4 properties
   */
  async fetchAllInstallEvents(startDate = '30daysAgo', endDate = 'today') {
    try {
      const properties = this.ga4PropertyService.getProperties();
      const activeProperties = properties.properties.filter(p => p.isActive);
      
      logger.info(`Fetching install events from ${activeProperties.length} active GA4 properties`);

      const allInstallData = [];
      
      for (const property of activeProperties) {
        try {
          logger.info(`Fetching install events from property: ${property.label} (${property.propertyId})`);
          
          const installData = await this.fetchInstallEventsForProperty(
            property.propertyId, 
            startDate, 
            endDate,
            property.label
          );
          
          allInstallData.push(installData);
          
        } catch (error) {
          logger.error(`Error fetching install events from property ${property.propertyId}:`, error);
          allInstallData.push({
            propertyId: property.propertyId,
            propertyLabel: property.label,
            success: false,
            error: error.message,
            installs: []
          });
        }
      }

      return {
        success: true,
        totalProperties: activeProperties.length,
        successfulProperties: allInstallData.filter(d => d.success).length,
        data: allInstallData,
        summary: this.generateInstallSummary(allInstallData),
        dateRange: { startDate, endDate }
      };

    } catch (error) {
      logger.error('Error fetching all install events:', error);
      throw new Error(`Failed to fetch install events: ${error.message}`);
    }
  }

  /**
   * Fetch install events for a specific GA4 property
   */
  async fetchInstallEventsForProperty(propertyId, startDate, endDate, propertyLabel) {
    try {
      logger.info(`Fetching install events for property ${propertyId} from ${startDate} to ${endDate}`);

      // Fetch app install events
      const [installResponse] = await this.analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'date' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'sessionCampaign' },
          { name: 'sessionCampaignId' },
          { name: 'eventName' }
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'totalUsers' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: 'app_install'
            }
          }
        }
      });

      // Fetch first_open events (alternative install event)
      const [firstOpenResponse] = await this.analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'date' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'sessionCampaign' },
          { name: 'sessionCampaignId' },
          { name: 'eventName' }
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'totalUsers' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: 'first_open'
            }
          }
        }
      });

      // Combine and process the data
      const installs = this.processInstallData(installResponse, firstOpenResponse, propertyId, propertyLabel);

      return {
        propertyId,
        propertyLabel,
        success: true,
        installs,
        totalInstalls: installs.reduce((sum, install) => sum + install.installCount, 0),
        uniqueInstalls: installs.reduce((sum, install) => sum + install.uniqueInstalls, 0)
      };

    } catch (error) {
      logger.error(`Error fetching install events for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Process and combine install data from different event types
   */
  processInstallData(installResponse, firstOpenResponse, propertyId, propertyLabel) {
    const installs = new Map();

    // Process app_install events
    if (installResponse.rows) {
      for (const row of installResponse.rows) {
        const key = this.createInstallKey(row);
        const existing = installs.get(key) || this.createInstallRecord(row, propertyId, propertyLabel);
        
        existing.installCount += parseInt(row.metricValues[0].value);
        existing.uniqueInstalls += parseInt(row.metricValues[1].value);
        existing.eventTypes.add('app_install');
        
        installs.set(key, existing);
      }
    }

    // Process first_open events
    if (firstOpenResponse.rows) {
      for (const row of firstOpenResponse.rows) {
        const key = this.createInstallKey(row);
        const existing = installs.get(key) || this.createInstallRecord(row, propertyId, propertyLabel);
        
        existing.installCount += parseInt(row.metricValues[0].value);
        existing.uniqueInstalls += parseInt(row.metricValues[1].value);
        existing.eventTypes.add('first_open');
        
        installs.set(key, existing);
      }
    }

    return Array.from(installs.values());
  }

  /**
   * Create a unique key for install records
   */
  createInstallKey(row) {
    const date = row.dimensionValues[0].value;
    const source = row.dimensionValues[1].value;
    const medium = row.dimensionValues[2].value;
    const campaign = row.dimensionValues[3].value;
    const campaignId = row.dimensionValues[4].value;
    
    return `${date}_${source}_${medium}_${campaign}_${campaignId}`;
  }

  /**
   * Create a new install record
   */
  createInstallRecord(row, propertyId, propertyLabel) {
    return {
      date: row.dimensionValues[0].value,
      source: row.dimensionValues[1].value,
      medium: row.dimensionValues[2].value,
      campaign: row.dimensionValues[3].value,
      campaignId: row.dimensionValues[4].value,
      propertyId,
      propertyLabel,
      installCount: 0,
      uniqueInstalls: 0,
      eventTypes: new Set(),
      orttoCampaignId: this.mapToOrttoCampaign(row.dimensionValues[3].value, row.dimensionValues[4].value)
    };
  }

  /**
   * Map GA4 campaign data to Ortto campaign IDs
   */
  mapToOrttoCampaign(campaign, campaignId) {
    // This is a basic mapping - you can enhance this with your actual UTM to Ortto mapping
    if (campaign && campaign !== '(not set)') {
      // Try to extract Ortto campaign ID from campaign name
      const orttoIdMatch = campaign.match(/([a-f0-9]{24})/);
      if (orttoIdMatch) {
        return orttoIdMatch[1];
      }
    }
    
    if (campaignId && campaignId !== '(not set)') {
      // Try to extract Ortto campaign ID from campaign ID
      const orttoIdMatch = campaignId.match(/([a-f0-9]{24})/);
      if (orttoIdMatch) {
        return orttoIdMatch[1];
      }
    }
    
    return null;
  }

  /**
   * Generate summary of install data
   */
  generateInstallSummary(allInstallData) {
    const successfulData = allInstallData.filter(d => d.success);
    
    const totalInstalls = successfulData.reduce((sum, data) => sum + data.totalInstalls, 0);
    const totalUniqueInstalls = successfulData.reduce((sum, data) => sum + data.uniqueInstalls, 0);
    
    // Group by source/medium
    const sourceBreakdown = new Map();
    const campaignBreakdown = new Map();
    
    successfulData.forEach(data => {
      data.installs.forEach(install => {
        // Source breakdown
        const sourceKey = `${install.source}/${install.medium}`;
        const sourceData = sourceBreakdown.get(sourceKey) || { source: install.source, medium: install.medium, installs: 0, uniqueInstalls: 0 };
        sourceData.installs += install.installCount;
        sourceData.uniqueInstalls += install.uniqueInstalls;
        sourceBreakdown.set(sourceKey, sourceData);
        
        // Campaign breakdown
        if (install.campaign && install.campaign !== '(not set)') {
          const campaignData = campaignBreakdown.get(install.campaign) || { campaign: install.campaign, installs: 0, uniqueInstalls: 0, orttoCampaignId: install.orttoCampaignId };
          campaignData.installs += install.installCount;
          campaignData.uniqueInstalls += install.uniqueInstalls;
          campaignBreakdown.set(install.campaign, campaignData);
        }
      });
    });

    return {
      totalInstalls,
      totalUniqueInstalls,
      sourceBreakdown: Array.from(sourceBreakdown.values()),
      campaignBreakdown: Array.from(campaignBreakdown.values()),
      propertiesAnalyzed: successfulData.length,
      dateRange: successfulData.length > 0 ? successfulData[0].dateRange : null
    };
  }

  /**
   * Get install events for a specific Ortto campaign
   */
  async getInstallsForOrttoCampaign(orttoCampaignId, startDate = '30daysAgo', endDate = 'today') {
    try {
      const allData = await this.fetchAllInstallEvents(startDate, endDate);
      
      const campaignInstalls = [];
      
      allData.data.forEach(propertyData => {
        if (propertyData.success) {
          propertyData.installs.forEach(install => {
            if (install.orttoCampaignId === orttoCampaignId) {
              campaignInstalls.push(install);
            }
          });
        }
      });

      return {
        success: true,
        orttoCampaignId,
        installs: campaignInstalls,
        totalInstalls: campaignInstalls.reduce((sum, install) => sum + install.installCount, 0),
        totalUniqueInstalls: campaignInstalls.reduce((sum, install) => sum + install.uniqueInstalls, 0),
        dateRange: { startDate, endDate }
      };

    } catch (error) {
      logger.error(`Error getting installs for Ortto campaign ${orttoCampaignId}:`, error);
      throw error;
    }
  }
}

module.exports = InstallTrackingService; 