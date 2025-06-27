const axios = require('axios');

// Test the batching system
async function testBatching() {
  try {
    console.log('=== Testing batching system with 25 items ===');
    
    // Create test data with more than 20 items
    const testItems = [];
    for (let i = 1; i <= 25; i++) {
      testItems.push({ id: `test-campaign-${i}`, type: 'campaign' });
    }
    
    console.log(`Created ${testItems.length} test items`);
    
    // Make request to dashboard-reports endpoint with authentication
    const response = await axios.post('http://localhost:5001/api/reports/dashboard-reports', {
      items: testItems,
      timeframe: 'all-time'
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // This will be handled by the verifyToken middleware
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response received:');
    console.log('- Reports fetched:', response.data.reports.length);
    console.log('- Pending items:', response.data.pending.length);
    console.log('- Is partial:', response.data.partial);
    console.log('- Rate limited:', response.data.rateLimited.length);
    console.log('- Message:', response.data.message);
    console.log('- Summary:', JSON.stringify(response.data.summary, null, 2));
    console.log('- Full response structure:', Object.keys(response.data));
    
    // Verify batching worked
    if (response.data.reports.length <= 20 && response.data.pending.length > 0) {
      console.log('✅ Batching system working correctly!');
    } else {
      console.log('❌ Batching system not working as expected');
    }
    
    console.log('\n=== Testing with 15 items (no batching needed) ===');
    
    // Test with fewer items
    const smallTestItems = [];
    for (let i = 1; i <= 15; i++) {
      smallTestItems.push({ id: `small-test-${i}`, type: 'campaign' });
    }
    
    const smallResponse = await axios.post('http://localhost:5001/api/reports/dashboard-reports', {
      items: smallTestItems,
      timeframe: 'all-time'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Small test response:');
    console.log('- Reports fetched:', smallResponse.data.reports.length);
    console.log('- Pending items:', smallResponse.data.pending.length);
    console.log('- Is partial:', smallResponse.data.partial);
    console.log('- Summary:', JSON.stringify(smallResponse.data.summary, null, 2));
    
    if (smallResponse.data.reports.length === 15 && smallResponse.data.pending.length === 0) {
      console.log('✅ Small batch test working correctly!');
    } else {
      console.log('❌ Small batch test not working as expected');
    }
    
    console.log('\n=== Testing Firebase caching ===');
    console.log('Making the same request again to test Firebase caching...');
    
    // Test Firebase caching by making the same request again
    const cacheResponse = await axios.post('http://localhost:5001/api/reports/dashboard-reports', {
      items: smallTestItems,
      timeframe: 'all-time'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Cache test response:');
    console.log('- Reports fetched:', cacheResponse.data.reports.length);
    console.log('- Summary:', JSON.stringify(cacheResponse.data.summary, null, 2));
    console.log('- Message:', cacheResponse.data.message);
    
    if (cacheResponse.data.summary?.source === 'firebase_cache') {
      console.log('✅ Firebase caching working correctly!');
    } else {
      console.log('⚠️ Firebase caching not used (this is normal if Firebase is not configured)');
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response?.status === 403) {
      console.log('Note: 403 error is expected if Firebase authentication is not configured');
    }
  }
}

// Run the test
testBatching(); 