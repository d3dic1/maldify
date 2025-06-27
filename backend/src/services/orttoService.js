require('dotenv').config();
const axios = require('axios');
const { logger } = require('../utils/logger');

class OrttoService {
  constructor() {
    // Revert to the US/global region endpoint
    this.baseURL = 'https://api.ap3api.com';
    this.apiKey = process.env.ORTTO_API_KEY;
    this.instanceId = process.env.ORTTO_INSTANCE_ID;
    
    // Rate limiting configuration
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests (reduced from 3 seconds)
    this.maxRequestsPerMinute = 20; // Increased to 20 requests per minute (from 10)
    this.requestCount = 0;
    this.lastResetTime = Date.now();

    this.cache = new Map(); // In-memory cache
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes in ms

    logger.info('Initializing OrttoService with:', {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey,
      hasInstanceId: !!this.instanceId
    });

    if (!this.apiKey) {
      throw new Error('ORTTO_API_KEY is required');
    }

    if (!this.instanceId) {
      throw new Error('ORTTO_INSTANCE_ID is required');
    }

    // Log the API key (first few characters) for debugging
    logger.info(`API Key configured: ${this.apiKey.substring(0, 10)}...`);
  }

  // Helper method to delay execution
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to wait for rate limit
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      logger.info(`Rate limiting: waiting ${waitTime}ms before next request`);
      await this.delay(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  // Helper method to make API request with retry logic
  async makeApiRequest(endpoint, requestBody, maxRetries = 3) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method: 'POST',
      url: url,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      data: requestBody
    };

    // Use executeRequest directly instead of makeRequest
    return await this.executeRequest(endpoint, requestBody);
  }

  getCacheKey(type, id, timeframe) {
    return `${type}:${id}:${timeframe || 'all'}`;
  }

  getFromCache(key) {
    const entry = this.cache.get(key);
    if (entry && (Date.now() - entry.timestamp < this.cacheTTL)) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async executeGetRequest(endpoint, params) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      url: url,
      headers: {
        'X-API-Key': this.apiKey,
      },
      params: params,
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`GET request to ${url} failed`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async fetchCampaignsAndJourneys() {
    logger.info('Starting to fetch and cache campaigns...');
    try {
      // Fetch both campaigns and journeys
      const campaignsResponse = await this.listCampaigns();

      logger.info('Successfully received responses from listCampaigns.');

      const campaigns = campaignsResponse.assets || [];

      logger.info(`Found ${campaigns.length} campaigns.`);

      // Cache campaigns by ID
      campaigns.forEach(c => {
        const cacheKey = this.getCacheKey('name', c.id);
        this.setCache(cacheKey, c.name);
        logger.info(`Cached campaign: ID=${c.id}, Name=${c.name}`);
      });

      logger.info(`Finished caching campaigns.`);

    } catch (error) {
      logger.error('Error fetching and caching campaigns:', error);
    }
  }

  async fetchAndCacheJourneyNames() {
    logger.info('Starting to fetch and cache journey names...');
    try {
      const currentYear = new Date().getFullYear();
      const campaignsResponse = await this.listCampaigns({ year: currentYear });
      const campaigns = campaignsResponse.assets || [];

      logger.info(`Found ${campaigns.length} total campaigns/journeys.`);

      // Cache all campaign names (including journeys) for better name resolution
      for (const campaign of campaigns) {
        const cacheKey = this.getCacheKey('name', campaign.id);
        this.setCache(cacheKey, campaign.name);
        
        // Also cache as journey info if it looks like a journey
        if (campaign.type === 'journey' || campaign.name?.toLowerCase().includes('journey')) {
          const journeyInfoKey = this.getCacheKey('journey_info', campaign.id);
          const journeyInfo = {
            id: campaign.id,
            name: campaign.name,
            type: 'journey',
            created_at: campaign.created_at,
            updated_at: campaign.updated_at
          };
          this.setCache(journeyInfoKey, journeyInfo);
          logger.info(`Cached journey: ID=${campaign.id}, Name=${campaign.name}`);
        }
      }

      logger.info(`Finished caching journey names.`);
    } catch (error) {
      logger.error('Error fetching and caching journey names:', error);
    }
  }

  async fetchReport(campaignId, timeframe = 'all-time') {
    const cacheKey = this.getCacheKey('campaign', campaignId, timeframe);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    try {
      const endpoint = '/v1/campaign/reports/get';
      const requestBody = {
        campaign_id: campaignId
      };
      // Only add timeframe if it's not 'all-time', as omitting it might default to all-time stats
      if (timeframe !== 'all-time') {
        requestBody.timeframe = timeframe;
      }
      const reportData = await this.makeApiRequest(endpoint, requestBody);

      // Check if we have the expected data structure
      if (!reportData || !reportData.reports || !reportData.reports.performance) {
        logger.error('Invalid response format:', reportData);
        throw new Error('Invalid response format from API');
      }

      const performance = reportData.reports.performance;

      // Try to get the name from the report, otherwise from cache
      let campaignName = reportData.campaign_name;
      
      if (!campaignName) {
        const cacheKey = this.getCacheKey('name', campaignId);
        campaignName = this.getFromCache(cacheKey) || `Campaign ${campaignId}`;
      }

      // Map the response to our expected format
      const mappedReport = {
        name: campaignName,
        opens: performance.opens || 0,
        clicks: performance.clicks || 0,
        deliveries: performance.deliveries || 0,
        bounces: performance.bounced || 0,
        unsubscribes: performance.unsubscribed || 0,
        spam_reports: performance.spam || 0,
        unique_opens: performance.unique_opens || 0,
        unique_clicks: performance.unique_clicks || 0,
        total_recipients: performance.sent || 0,
        invalid: performance.invalid || 0,
        forwarded: performance.forwarded || 0,
        reacted: performance.reacted || 0,
        replied: performance.replied || 0,
        viewed_online: performance.viewed_online || 0
      };

      logger.info('Mapped report with name:', {
        campaignId,
        name: mappedReport.name,
        hasName: !!mappedReport.name
      });
      this.setCache(cacheKey, mappedReport);
      return mappedReport;
    } catch (error) {
      logger.error('Error fetching report for campaign:', {
        campaignId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }

  async fetchJourneyReport(campaignId, timeframe = 'all-time') {
    const cacheKey = this.getCacheKey('journey', campaignId, timeframe);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.info(`Returning cached journey report for ${campaignId} with timeframe ${timeframe}`);
      return cached;
    }
    try {
      const endpoint = '/v1/campaign/reports/get';
      const requestBody = {
        campaign_id: campaignId
      };
      
      // Only add timeframe if it's not 'all-time', as omitting it might default to all-time stats
      if (timeframe !== 'all-time') {
        requestBody.timeframe = timeframe;
      }

      logger.info(`Fetching journey report for ${campaignId} with body:`, requestBody);
      const reportData = await this.makeApiRequest(endpoint, requestBody);

      if (!reportData || !reportData.reports) {
        logger.error('Invalid response format (journey):', reportData);
        throw new Error('Invalid response format from API (journey)');
      }

      const performance = reportData.reports.performance || {};
      logger.info('Journey performance object:', performance);
      const emailSummary = reportData.reports.email_summary || {};

      // Try to get journey name from multiple sources
      let journeyName = null;
      
      // First, try to get from the report data
      if (reportData.campaign_name) {
        journeyName = reportData.campaign_name;
        logger.info(`Using journey name from report for ${campaignId}: ${journeyName}`);
      }
      
      // If not found in report, try to get journey info
      if (!journeyName) {
        try {
          const journeyInfo = await this.getJourneyInfo(campaignId);
          journeyName = journeyInfo.name;
          logger.info(`Using journey info name for ${campaignId}: ${journeyName}`);
        } catch (error) {
          logger.warn(`Could not fetch journey info for ${campaignId}:`, error.message);
        }
      }
      
      // Final fallback
      if (!journeyName) {
        journeyName = `Journey ${campaignId}`;
        logger.info(`Using fallback name for ${campaignId}: ${journeyName}`);
      }

      // Map journey metrics with all email metrics included
      const mappedReport = {
        name: journeyName,
        // Journey-specific metrics (from performance)
        entered: performance.entered || 0,
        in_journey: performance.in_journey || 0,
        exited: performance.exited || 0,
        revenue: performance.revenue || 0,
        // Email metrics are also in the performance object for journeys
        opens: performance.opens || 0,
        clicks: performance.clicks || 0,
        deliveries: performance.deliveries || 0,
        bounces: performance.bounced || 0,
        unsubscribes: performance.unsubscribed || 0,
        spam_reports: performance.spam || 0,
        unique_opens: performance.unique_opens || 0,
        unique_clicks: performance.unique_clicks || 0,
        // For journeys, total_recipients should be the number of people who entered the journey.
        total_recipients: performance.entered || 0,
        invalid: performance.invalid || 0,
        forwarded: performance.forwarded || 0,
        reacted: performance.reacted || 0,
        replied: performance.replied || 0,
        viewed_online: performance.viewed_online || 0
      };

      logger.info('Mapped journey report:', mappedReport);
      this.setCache(cacheKey, mappedReport);
      return mappedReport;
    } catch (error) {
      logger.error('Error fetching journey report:', {
        campaignId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }

  getEmptyReport() {
    return {
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

  aggregateReports(reports) {
    const emptyReport = this.getEmptyReport();
    return reports.reduce((acc, report) => {
      if (!report) return acc;
      Object.keys(emptyReport).forEach(key => {
        acc[key] = (acc[key] || 0) + (report[key] || 0);
      });
      return acc;
    }, { ...emptyReport });
  }

  async makeRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ endpoint, params, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      // Check rate limits
      const now = Date.now();
      
      // Reset counter every minute
      if (now - this.lastResetTime > 60000) {
        this.requestCount = 0;
        this.lastResetTime = now;
      }
      
      // Check if we've hit the per-minute limit
      if (this.requestCount >= this.maxRequestsPerMinute) {
        const waitTime = 60000 - (now - this.lastResetTime);
        logger.info(`Rate limit reached (${this.maxRequestsPerMinute} requests/minute). Waiting ${waitTime}ms...`);
        await this.delay(waitTime);
        this.requestCount = 0;
        this.lastResetTime = Date.now();
      }
      
      // Ensure minimum interval between requests
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        // Only log for longer waits to reduce log noise
        if (waitTime > 500) {
          logger.info(`Rate limiting: waiting ${waitTime}ms before next request...`);
        }
        await this.delay(waitTime);
      }

      const { endpoint, params, resolve, reject } = this.requestQueue.shift();
      this.lastRequestTime = Date.now();
      this.requestCount++;

      try {
        logger.info(`Making API request to ${endpoint} (request ${this.requestCount}/${this.maxRequestsPerMinute} this minute)`);
        const response = await this.executeRequest(endpoint, params);
        resolve(response);
      } catch (error) {
        // Handle 429 errors with exponential backoff
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          const waitTime = parseInt(retryAfter) * 1000;
          logger.info(`Rate limited (429). Waiting ${waitTime}ms before retry...`);
          
          // Put the request back in the queue after waiting
          setTimeout(() => {
            this.requestQueue.unshift({ endpoint, params, resolve, reject });
            this.processQueue();
          }, waitTime);
          
          // Reset counters after rate limit
          this.requestCount = 0;
          this.lastResetTime = Date.now();
        } else {
          reject(error);
        }
      }
    }

    this.isProcessing = false;
  }

  async getCampaignReport(campaignId) {
    try {
      logger.info(`Fetching campaign report for: ${campaignId}`);
      
      const params = {
        instance_id: this.instanceId,
        campaign_id: campaignId
      };
      
      const response = await this.makeRequest('/v1/campaigns/report', params);
      
      if (response.data && response.data.campaign) {
        return response.data.campaign;
      } else {
        logger.warn(`No campaign data found for ID: ${campaignId}`);
        return this.createEmptyReport(campaignId);
      }
    } catch (error) {
      logger.error(`Error fetching campaign report for ${campaignId}:`, error);
      throw error;
    }
  }

  async executeRequest(endpoint, requestBody) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method: 'POST',
      url: url,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      data: requestBody,
      timeout: 30000 // 30 second timeout
    };

    logger.info(`Executing API request to ${endpoint}`);
    
    const response = await axios(config);
    
    logger.info('API request successful:', {
      status: response.status,
      statusText: response.statusText
    });

    return response.data;
  }

  async listCampaigns(params = {}) {
    logger.info('Listing campaigns with params:', params);
    try {
      const endpoint = '/v1/campaign/calendar';
      const currentYear = new Date().getFullYear();
      
      // Calculate start and end dates for the year
      const startDate = new Date(currentYear, 0, 1); // January 1st of current year
      const endDate = new Date(currentYear, 11, 31); // December 31st of current year
      
      const requestBody = {
        start: {
          year: startDate.getFullYear(),
          month: startDate.getMonth() + 1, // JavaScript months are 0-indexed
          day: startDate.getDate()
        },
        end: {
          year: endDate.getFullYear(),
          month: endDate.getMonth() + 1, // JavaScript months are 0-indexed
          day: endDate.getDate()
        },
        year: String(params.year || currentYear),     // Keep year for backward compatibility
        timezone: 'UTC'  // Add timezone as required by the API
      };
      
      const response = await this.makeRequest(endpoint, requestBody);
      
      logger.info(`Successfully listed campaigns for year ${requestBody.year}. Found ${response?.campaigns?.length || 0} campaigns.`);
      
      // The response for calendar is different, it returns a `campaigns` array.
      // To keep it consistent with the previous (incorrect) list endpoint,
      // I'll format it to return an 'assets' array.
      return { assets: response.campaigns || [] };
      
    } catch (error) {
      logger.error('Error in listCampaigns:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * New method using the updated Ortto API endpoint for exporting campaign data
   * Based on the new API documentation: https://help.ortto.com/a-887-using-the-api-to-export-campaign-data
   */
  async exportCampaigns(filters = {}) {
    logger.info('Exporting campaigns with filters:', filters);
    try {
      const endpoint = '/v1/campaign/get-all';
      
      // Build request body with available filters
      const requestBody = {};
      
      // Campaign type filtering
      if (filters.type) {
        requestBody.type = filters.type; // single type: 'email', 'journey', 'sms', etc.
      } else if (filters.types && Array.isArray(filters.types)) {
        requestBody.types = filters.types; // multiple types: ['email', 'journey', 'sms']
      }
      
      // Status filtering
      if (filters.state) {
        requestBody.state = filters.state; // 'draft', 'scheduled', 'sending', 'sent', 'cancelled', 'on', 'off'
      }
      
      // Folder filtering
      if (filters.folder_id) {
        requestBody.folder_id = filters.folder_id;
      }
      
      // Specific campaign IDs
      if (filters.campaign_ids && Array.isArray(filters.campaign_ids)) {
        requestBody.campaign_ids = filters.campaign_ids;
      }
      
      // Search query
      if (filters.q) {
        requestBody.q = filters.q;
      }
      
      // Pagination
      if (filters.limit) {
        requestBody.limit = Math.min(filters.limit, 50); // API max is 50
      }
      if (filters.offset) {
        requestBody.offset = filters.offset;
      }
      
      // Sorting
      if (filters.sort) {
        requestBody.sort = filters.sort; // 'name', 'state', 'created_at', 'opens', 'clicks', etc.
      }
      if (filters.sort_order) {
        requestBody.sort_order = filters.sort_order; // 'asc' or 'desc'
      }
      
      const response = await this.makeApiRequest(endpoint, requestBody);
      
      logger.info(`Successfully exported campaigns. Found ${response?.campaigns?.length || 0} campaigns.`);
      
      return {
        campaigns: response.campaigns || [],
        next_offset: response.next_offset,
        has_more: response.has_more,
        folder_id: response.folder_id
      };
      
    } catch (error) {
      logger.error('Error in exportCampaigns:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Enhanced method to get campaigns with advanced filtering
   * Combines the new export functionality with existing caching
   */
  async getFilteredCampaigns(filters = {}) {
    const cacheKey = this.getCacheKey('filtered_campaigns', JSON.stringify(filters));
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.info('Returning cached filtered campaigns');
      return cached;
    }
    
    try {
      const result = await this.exportCampaigns(filters);
      
      // Cache the result for 5 minutes (shorter TTL for filtered results)
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Error getting filtered campaigns:', error);
      throw error;
    }
  }

  async listContacts(limit = 100, offset = 0) {
    logger.info(`Listing contacts with limit: ${limit} and offset: ${offset}`);
    try {
      const endpoint = '/v1/person/get';
      const requestBody = {
        limit,
        offset,
        sort_by_field_id: "str::last",
        sort_order: "asc",
        fields: ["str::id", "str::first", "str::last", "str::email"],
      };
      const response = await this.makeApiRequest(endpoint, requestBody);
      logger.info(`Successfully listed ${response?.contacts?.length || 0} contacts.`);
      return response.contacts || [];
    } catch (error) {
      logger.error('Error in listContacts:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  async getContactActivities(contactId) {
    logger.info(`Fetching activities for contact: ${contactId}`);
    try {
      // This endpoint seems more appropriate, even if documentation was slightly ambiguous
      const endpoint = `/v1/person/get/activities`; 
      const requestBody = {
        person_id: contactId,
        limit: 50 // Get recent activities
      };
      const response = await this.makeApiRequest(endpoint, requestBody);
      logger.info(`Found ${response?.activities?.length || 0} activities for contact ${contactId}.`);
      return response.activities || [];
    } catch (error) {
      logger.error(`Error fetching activities for contact ${contactId}:`, {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      // Return empty array on error to not break the main loop
      return [];
    }
  }

  async getJourneyInfo(journeyId) {
    logger.info(`Fetching journey info for: ${journeyId}`);
    
    // First, try to get from cache
    const cacheKey = this.getCacheKey('journey_info', journeyId);
    const cachedInfo = this.getFromCache(cacheKey);
    if (cachedInfo) {
      logger.info(`Using cached journey info for ${journeyId}: ${cachedInfo.name}`);
      return cachedInfo;
    }
    
    try {
      // Try to get journey information from the campaign endpoint
      const endpoint = '/v1/campaign/get';
      const requestBody = {
        campaign_id: journeyId
      };
      
      const response = await this.makeApiRequest(endpoint, requestBody);
      
      if (response && response.campaign) {
        const journeyInfo = {
          id: journeyId,
          name: response.campaign.name || `Journey ${journeyId}`,
          type: response.campaign.type || 'journey',
          created_at: response.campaign.created_at,
          updated_at: response.campaign.updated_at
        };
        
        // Cache the journey info
        this.setCache(cacheKey, journeyInfo);
        
        logger.info(`Found journey info: ${journeyInfo.name}`);
        return journeyInfo;
      }
    } catch (error) {
      logger.info(`Error fetching journey info from campaign endpoint for ${journeyId}:`, error.message);
    }
    
    // If the first method failed, try to get from the campaign calendar
    try {
      const currentYear = new Date().getFullYear();
      const calendarResponse = await this.listCampaigns({ year: currentYear });
      const campaigns = calendarResponse.assets || [];
      
      // Find the journey in the calendar
      const journey = campaigns.find(campaign => campaign.id === journeyId);
      if (journey) {
        const journeyInfo = {
          id: journeyId,
          name: journey.name || `Journey ${journeyId}`,
          type: 'journey',
          created_at: journey.created_at,
          updated_at: journey.updated_at
        };
        
        // Cache the journey info
        this.setCache(cacheKey, journeyInfo);
        
        logger.info(`Found journey info from calendar: ${journeyInfo.name}`);
        return journeyInfo;
      }
    } catch (error) {
      logger.info(`Error fetching journey info from calendar for ${journeyId}:`, error.message);
    }
    
    // Final fallback
    logger.info(`No journey info found for ${journeyId}, using default name`);
    const fallbackInfo = {
      id: journeyId,
      name: `Journey ${journeyId}`,
      type: 'journey'
    };
    
    // Cache the fallback info to avoid repeated API calls
    this.setCache(cacheKey, fallbackInfo);
    return fallbackInfo;
  }

  async discoverAndCategorizeAllAssets() {
    logger.info('Starting automatic discovery and categorization of all assets (quick mode)...');
    try {
      const currentYear = new Date().getFullYear();
      const campaignsResponse = await this.listCampaigns({ year: currentYear });
      const allAssets = campaignsResponse.assets || [];

      logger.info(`Found ${allAssets.length} total assets to categorize`);

      const categorizedAssets = {
        campaigns: [],
        journeys: [],
        all: []
      };

      // Use only the calendar data for categorization (no /v1/campaign/get calls)
      for (const asset of allAssets) {
        const type = asset.type === 'journey' || asset.name?.toLowerCase().includes('journey')
          ? 'journey'
          : 'campaign';
        const categorizedAsset = {
          id: asset.id,
          name: asset.name || `Unnamed ${type}`,
          type,
          created_at: asset.created_at,
          updated_at: asset.updated_at,
          status: asset.status || 'active'
        };
        categorizedAssets.all.push(categorizedAsset);
        if (type === 'journey') {
          categorizedAssets.journeys.push(categorizedAsset);
        } else {
          categorizedAssets.campaigns.push(categorizedAsset);
        }
      }

      logger.info(`Categorization complete: ${categorizedAssets.campaigns.length} campaigns, ${categorizedAssets.journeys.length} journeys`);
      this.setCache('categorized_assets', categorizedAssets);
      return categorizedAssets;
    } catch (error) {
      logger.error('Error in discoverAndCategorizeAllAssets:', error);
      throw error;
    }
  }

  async getAssetType(assetId) {
    logger.info(`Determining type for asset: ${assetId}`);
    
    // First check cache
    const cacheKey = this.getCacheKey('asset_type', assetId);
    const cachedType = this.getFromCache(cacheKey);
    if (cachedType) {
      return cachedType;
    }

    try {
      // Try to get detailed info from the campaign endpoint
      const endpoint = '/v1/campaign/get';
      const requestBody = {
        campaign_id: assetId
      };
      
      const response = await this.makeApiRequest(endpoint, requestBody);
      
      if (response && response.campaign) {
        const assetType = {
          id: assetId,
          type: response.campaign.type || 'campaign',
          name: response.campaign.name,
          isJourney: response.campaign.type === 'journey' || response.campaign.name?.toLowerCase().includes('journey')
        };
        
        // Cache the asset type
        this.setCache(cacheKey, assetType);
        
        return assetType;
      }
    } catch (error) {
      logger.info(`Could not get detailed info for ${assetId}:`, error.message);
    }

    // Fallback: try to determine from calendar data
    try {
      const currentYear = new Date().getFullYear();
      const calendarResponse = await this.listCampaigns({ year: currentYear });
      const campaigns = calendarResponse.assets || [];
      
      const asset = campaigns.find(campaign => campaign.id === assetId);
      if (asset) {
        const assetType = {
          id: assetId,
          type: asset.type || 'campaign',
          name: asset.name,
          isJourney: asset.type === 'journey' || asset.name?.toLowerCase().includes('journey')
        };
        
        // Cache the asset type
        this.setCache(cacheKey, assetType);
        
        return assetType;
      }
    } catch (error) {
      logger.info(`Could not find asset ${assetId} in calendar:`, error.message);
    }

    // Default fallback
    const defaultType = {
      id: assetId,
      type: 'campaign',
      name: `Asset ${assetId}`,
      isJourney: false
    };
    
    this.setCache(cacheKey, defaultType);
    return defaultType;
  }

  async getCachedCategorizedAssets() {
    return this.getFromCache('categorized_assets') || null;
  }

  async refreshCategorizedAssets() {
    logger.info('Refreshing categorized assets...');
    return await this.discoverAndCategorizeAllAssets();
  }
}

// Export a singleton instance
module.exports = new OrttoService(); 