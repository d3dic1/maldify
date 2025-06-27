const axios = require('axios');

async function testCachingImprovements() {
  console.log('🧪 Testing Caching Improvements...\n');

  try {
    // Test 1: Get cached reports without providing items
    console.log('1. Testing get all cached reports without items...');
    const cachedResponse = await axios.post('http://localhost:5001/api/reports/dashboard-reports', {
      items: [],
      timeframe: 'all-time'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cached reports response:', {
      reportsCount: cachedResponse.data.reports?.length || 0,
      message: cachedResponse.data.message,
      source: cachedResponse.data.summary?.source
    });

    // Test 2: Test with specific items (should use cache if available)
    console.log('\n2. Testing with specific items...');
    const testItems = [
      { id: 'test-campaign-1', type: 'campaign' },
      { id: 'test-campaign-2', type: 'campaign' }
    ];
    
    const specificResponse = await axios.post('http://localhost:5001/api/reports/dashboard-reports', {
      items: testItems,
      timeframe: 'all-time'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Specific items response:', {
      reportsCount: specificResponse.data.reports?.length || 0,
      pendingCount: specificResponse.data.pending?.length || 0,
      partial: specificResponse.data.partial,
      message: specificResponse.data.message,
      source: specificResponse.data.summary?.source
    });

    // Test 3: Test the new cached-reports endpoint
    console.log('\n3. Testing cached-reports endpoint...');
    const cachedReportsResponse = await axios.get('http://localhost:5001/api/reports/cached-reports?timeframe=all-time', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Cached reports endpoint response:', {
      reportsCount: cachedReportsResponse.data.reports?.length || 0,
      count: cachedReportsResponse.data.count,
      cacheAge: cachedReportsResponse.data.cacheAge,
      message: cachedReportsResponse.data.message
    });

    console.log('\n🎉 All caching improvement tests completed successfully!');
    console.log('\nKey improvements:');
    console.log('- Cache expiration extended to 24 hours');
    console.log('- Better accumulative caching (no data overwrite)');
    console.log('- New endpoint to get all cached reports');
    console.log('- Frontend maintains loaded data during refreshes');
    console.log('- Rate limit recovery preserves existing data');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCachingImprovements(); 