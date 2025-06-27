require('dotenv').config();

// Set the credentials path
process.env.GOOGLE_APPLICATION_CREDENTIALS = require('path').join(__dirname, 'credentials/google-analytics-service-account.json');

console.log('Testing InstallTrackingService initialization...');
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

try {
  const InstallTrackingService = require('./src/services/installTrackingService');
  console.log('✅ InstallTrackingService module loaded successfully');
  
  const service = new InstallTrackingService();
  console.log('✅ InstallTrackingService instance created successfully');
  
  // Test fetching data
  service.fetchAllInstallEvents('7daysAgo', 'today')
    .then(data => {
      console.log('✅ Install tracking data fetched successfully');
      console.log('Summary:', data.summary);
    })
    .catch(error => {
      console.error('❌ Error fetching install data:', error.message);
    });
    
} catch (error) {
  console.error('❌ Error initializing InstallTrackingService:', error.message);
  console.error('Stack:', error.stack);
} 