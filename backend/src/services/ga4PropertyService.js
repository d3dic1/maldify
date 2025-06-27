const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class GA4PropertyService {
  constructor() {
    this.configPath = path.join(__dirname, '../../data/ga4-properties.json');
    this.ensureDataDirectory();
    this.loadProperties();
  }

  ensureDataDirectory() {
    const dataDir = path.dirname(this.configPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadProperties() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.properties = JSON.parse(data);
      } else {
        this.properties = {
          properties: [],
          defaultPropertyId: null
        };
        this.saveProperties();
      }
    } catch (error) {
      logger.error('Error loading GA4 properties:', error);
      this.properties = {
        properties: [],
        defaultPropertyId: null
      };
    }
  }

  saveProperties() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.properties, null, 2));
      logger.info('GA4 properties saved successfully');
    } catch (error) {
      logger.error('Error saving GA4 properties:', error);
      throw error;
    }
  }

  validatePropertyId(propertyId) {
    const cleanId = propertyId.toString().trim();
    
    if (cleanId.startsWith('G-')) {
      throw new Error('Invalid Property ID format. Google Analytics Data API v1 requires a numeric Property ID, not a Measurement ID (G-XXXXXXXXX).');
    }
    
    if (!/^\d+$/.test(cleanId)) {
      throw new Error('Property ID must be numeric.');
    }
    
    return cleanId;
  }

  addProperty(propertyId, label = null) {
    try {
      const validatedId = this.validatePropertyId(propertyId);
      
      // Check if property already exists
      const existingProperty = this.properties.properties.find(p => p.propertyId === validatedId);
      if (existingProperty) {
        throw new Error('Property ID already exists.');
      }

      const newProperty = {
        id: Date.now().toString(), // Simple unique ID
        propertyId: validatedId,
        label: label || `Property ${validatedId}`,
        addedAt: new Date().toISOString(),
        isActive: true
      };

      this.properties.properties.push(newProperty);
      
      // Set as default if it's the first property
      if (this.properties.properties.length === 1) {
        this.properties.defaultPropertyId = validatedId;
      }

      this.saveProperties();
      
      logger.info('GA4 property added successfully:', {
        propertyId: validatedId,
        label: newProperty.label
      });

      return newProperty;
    } catch (error) {
      logger.error('Error adding GA4 property:', error);
      throw error;
    }
  }

  getProperties() {
    return {
      properties: this.properties.properties,
      defaultPropertyId: this.properties.defaultPropertyId
    };
  }

  getProperty(propertyId) {
    return this.properties.properties.find(p => p.propertyId === propertyId);
  }

  updateProperty(propertyId, updates) {
    try {
      const property = this.getProperty(propertyId);
      if (!property) {
        throw new Error('Property not found.');
      }

      // Update allowed fields
      if (updates.label !== undefined) {
        property.label = updates.label;
      }
      if (updates.isActive !== undefined) {
        property.isActive = updates.isActive;
      }

      property.updatedAt = new Date().toISOString();
      this.saveProperties();

      logger.info('GA4 property updated successfully:', {
        propertyId,
        updates
      });

      return property;
    } catch (error) {
      logger.error('Error updating GA4 property:', error);
      throw error;
    }
  }

  deleteProperty(propertyId) {
    try {
      const propertyIndex = this.properties.properties.findIndex(p => p.propertyId === propertyId);
      if (propertyIndex === -1) {
        throw new Error('Property not found.');
      }

      const deletedProperty = this.properties.properties.splice(propertyIndex, 1)[0];
      
      // Update default property if needed
      if (this.properties.defaultPropertyId === propertyId) {
        this.properties.defaultPropertyId = this.properties.properties.length > 0 
          ? this.properties.properties[0].propertyId 
          : null;
      }

      this.saveProperties();

      logger.info('GA4 property deleted successfully:', {
        propertyId,
        label: deletedProperty.label
      });

      return deletedProperty;
    } catch (error) {
      logger.error('Error deleting GA4 property:', error);
      throw error;
    }
  }

  setDefaultProperty(propertyId) {
    try {
      const property = this.getProperty(propertyId);
      if (!property) {
        throw new Error('Property not found.');
      }

      this.properties.defaultPropertyId = propertyId;
      this.saveProperties();

      logger.info('Default GA4 property set:', { propertyId });

      return property;
    } catch (error) {
      logger.error('Error setting default GA4 property:', error);
      throw error;
    }
  }

  getDefaultProperty() {
    if (!this.properties.defaultPropertyId) {
      return null;
    }
    return this.getProperty(this.properties.defaultPropertyId);
  }

  getActiveProperties() {
    return this.properties.properties.filter(p => p.isActive);
  }
}

module.exports = new GA4PropertyService(); 