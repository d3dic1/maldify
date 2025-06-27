const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

console.log('🔍 Google Analytics Configuration Checker\n');

// Check environment variables
const ga4PropertyId = process.env.GA4_PROPERTY_ID;
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

console.log('📋 Environment Variables:');
console.log(`GA4_PROPERTY_ID: ${ga4PropertyId || 'NOT SET'}`);
console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${credentials || 'NOT SET'}`);

console.log('\n🔍 Analysis:');

// Check Property ID
if (!ga4PropertyId) {
  console.log('❌ GA4_PROPERTY_ID is not set');
  console.log('   Please set it to your numeric Property ID (e.g., 123456789)');
} else if (ga4PropertyId.startsWith('G-')) {
  console.log('❌ GA4_PROPERTY_ID is set to a Measurement ID (G-XXXXXXXXX)');
  console.log('   Google Analytics Data API v1 requires a numeric Property ID');
  console.log('   Current value:', ga4PropertyId);
  console.log('\n   🔧 How to fix:');
  console.log('   1. Go to Google Analytics Admin');
  console.log('   2. Select your property');
  console.log('   3. Look for "Property ID" (numeric, e.g., 123456789)');
  console.log('   4. Update your .env file: GA4_PROPERTY_ID=123456789');
} else if (/^\d+$/.test(ga4PropertyId.trim())) {
  console.log('✅ GA4_PROPERTY_ID is correctly formatted (numeric)');
  console.log('   Value:', ga4PropertyId);
} else {
  console.log('❌ GA4_PROPERTY_ID has invalid format');
  console.log('   Current value:', ga4PropertyId);
  console.log('   Property ID must be numeric (e.g., 123456789)');
}

// Check credentials
if (!credentials) {
  console.log('\n❌ GOOGLE_APPLICATION_CREDENTIALS is not set');
  console.log('   Please set it to the path of your service account JSON file');
} else if (!fs.existsSync(credentials)) {
  console.log('\n❌ GOOGLE_APPLICATION_CREDENTIALS file does not exist');
  console.log('   Path:', credentials);
  console.log('   Please check the file path and ensure the JSON file exists');
} else {
  console.log('\n✅ GOOGLE_APPLICATION_CREDENTIALS file exists');
  console.log('   Path:', credentials);
  
  try {
    const credData = JSON.parse(fs.readFileSync(credentials, 'utf8'));
    console.log('   Service Account Email:', credData.client_email || 'Not found');
    console.log('   Project ID:', credData.project_id || 'Not found');
  } catch (error) {
    console.log('   ❌ Error reading credentials file:', error.message);
  }
}

console.log('\n📚 Next Steps:');
console.log('1. Fix any issues identified above');
console.log('2. Restart your backend server');
console.log('3. Test the Google Analytics integration');

console.log('\n🔗 Helpful Links:');
console.log('- Google Analytics Admin: https://analytics.google.com/');
console.log('- Google Cloud Console: https://console.cloud.google.com/');
console.log('- Setup Guide: NEW_FEATURES_SETUP.md'); 