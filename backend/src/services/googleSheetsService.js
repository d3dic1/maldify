const { google } = require('googleapis');
const { logger } = require('../utils/logger');

class GoogleSheetsService {
  constructor() {
    this.credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!this.credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required');
    }

    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is required');
    }

    this.auth = new google.auth.GoogleAuth({
      keyFile: this.credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });

    // Rate limiting and caching
    this.lastApiCall = 0;
    this.minInterval = 1000; // 1 second between API calls
    this.spreadsheetCache = null;
    this.cacheExpiry = 0;
    this.cacheDuration = 30000; // 30 seconds cache

    logger.info('Initializing GoogleSheetsService with:', {
      hasCredentials: !!this.credentials,
      spreadsheetId: this.spreadsheetId
    });
  }

  // Rate limiting helper with retry for 429 errors
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.minInterval) {
      const delay = this.minInterval - timeSinceLastCall;
      logger.info(`Rate limiting: waiting ${delay}ms before next API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastApiCall = Date.now();
  }

  // Retry wrapper for API calls
  async retryApiCall(apiCall, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.code === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }

  // Cached spreadsheet getter
  async getSpreadsheet() {
    const now = Date.now();
    
    // Return cached version if still valid
    if (this.spreadsheetCache && now < this.cacheExpiry) {
      return this.spreadsheetCache;
    }

    // Rate limit before API call
    await this.rateLimit();
    
    // Fetch fresh data with retry
    const spreadsheet = await this.retryApiCall(async () => {
      return await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
    });

    // Cache the result
    this.spreadsheetCache = spreadsheet;
    this.cacheExpiry = now + this.cacheDuration;
    
    return spreadsheet;
  }

  async createOrUpdateSheet(sheetName, data, headers) {
    try {
      logger.info('Creating/updating sheet:', { sheetName, dataLength: data.length });

      // Get spreadsheet data (cached)
      const spreadsheet = await this.getSpreadsheet();

      const sheetExists = spreadsheet.data.sheets.some(
        sheet => sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        // Rate limit before API call
        await this.rateLimit();
        
        // Create new sheet with retry
        await this.retryApiCall(async () => {
          return await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: sheetName
                    }
                  }
                }
              ]
            }
          });
        });

        // Invalidate cache since we added a sheet
        this.spreadsheetCache = null;
        this.cacheExpiry = 0;

        logger.info('Created new sheet:', sheetName);
      }

      // Convert data to proper format for Google Sheets API
      let sheetData;
      if (data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
        // Data is array of objects, convert to array of arrays
        sheetData = [
          headers,
          ...data.map(row => headers.map(header => row[header] || ''))
        ];
      } else {
        // Data is already array of arrays, just add headers
        sheetData = [headers, ...data];
      }

      // Rate limit before API call
      await this.rateLimit();

      // Update sheet with data with retry
      await this.retryApiCall(async () => {
        return await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          resource: {
            values: sheetData
          }
        });
      });

      // Auto-resize columns (with rate limiting)
      await this.autoResizeColumns(sheetName, headers.length);

      logger.info('Successfully updated sheet:', sheetName);
      return { success: true, sheetName, rowsUpdated: data.length };

    } catch (error) {
      logger.error('Error creating/updating sheet:', {
        sheetName,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async autoResizeColumns(sheetName, columnCount) {
    try {
      const requests = [];
      
      for (let i = 0; i < columnCount; i++) {
        requests.push({
          autoResizeDimensions: {
            dimensions: {
              sheetId: await this.getSheetId(sheetName),
              dimension: 'COLUMNS',
              startIndex: i,
              endIndex: i + 1
            }
          }
        });
      }

      // Rate limit before API call
      await this.rateLimit();

      await this.retryApiCall(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: { requests }
        });
      });

    } catch (error) {
      logger.warn('Could not auto-resize columns:', error.message);
    }
  }

  async getSheetId(sheetName) {
    const spreadsheet = await this.getSpreadsheet();

    const sheet = spreadsheet.data.sheets.find(
      s => s.properties.title === sheetName
    );

    return sheet ? sheet.properties.sheetId : null;
  }

  async createSummarySheet(summaryData) {
    try {
      const sheetName = '📊 Summary Dashboard';
      
      const headers = [
        'Metric',
        'Value',
        'Description',
        'Last Updated'
      ];

      const data = [
        ['Total Records', summaryData.totalRecords, 'Total number of records processed', new Date().toISOString()],
        ['Date Range', summaryData.dateRange, 'Date range of the data', new Date().toISOString()],
        ['Sheets Created', summaryData.sheetsCreated, 'Number of sheets created/updated', new Date().toISOString()],
        ['Processing Time', summaryData.processingTime, 'Time taken to process data', new Date().toISOString()],
        ['AI Insights', summaryData.aiInsights, 'Key insights from AI analysis', new Date().toISOString()]
      ];

      return await this.createOrUpdateSheet(sheetName, data, headers);

    } catch (error) {
      logger.error('Error creating summary sheet:', error);
      throw error;
    }
  }

  async formatSheet(sheetName, formatOptions = {}) {
    try {
      const requests = [];

      // Header formatting
      requests.push({
        repeatCell: {
          range: {
            sheetId: await this.getSheetId(sheetName),
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      });

      // Add borders
      requests.push({
        updateBorders: {
          range: {
            sheetId: await this.getSheetId(sheetName),
            startRowIndex: 0,
            endRowIndex: 1000,
            startColumnIndex: 0,
            endColumnIndex: 20
          },
          top: { style: 'SOLID' },
          bottom: { style: 'SOLID' },
          left: { style: 'SOLID' },
          right: { style: 'SOLID' }
        }
      });

      // Rate limit before API call
      await this.rateLimit();

      await this.retryApiCall(async () => {
        return await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: { requests }
        });
      });

      logger.info('Formatted sheet:', sheetName);

    } catch (error) {
      logger.warn('Could not format sheet:', error.message);
    }
  }

  async getSpreadsheetUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
  }
}

module.exports = GoogleSheetsService; 