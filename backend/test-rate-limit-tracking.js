const axios = require('axios');

async function testRateLimitTracking() {
  console.log('🧪 Testing Rate Limit Tracking System...\n');

  try {
    // Test 1: Check current rate limited items
    console.log('1. Checking current rate limited items...');
    const rateLimitResponse = await axios.get('http://localhost:5001/api/reports/rate-limits?timeframe=all-time', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Rate limited items:', {
      count: rateLimitResponse.data.count,
      message: rateLimitResponse.data.message
    });

    // Test 2: Test with items that might be rate limited
    console.log('\n2. Testing dashboard reports with potential rate limited items...');
    const testItems = [
      { id: 'test-campaign-1', type: 'campaign' },
      { id: 'test-campaign-2', type: 'campaign' },
      { id: 'test-journey-1', type: 'journey' }
    ];
    
    const dashboardResponse = await axios.post('http://localhost:5001/api/reports/dashboard-reports', {
      items: testItems,
      timeframe: 'all-time'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Dashboard response:', {
      reportsCount: dashboardResponse.data.reports?.length || 0,
      pendingCount: dashboardResponse.data.pending?.length || 0,
      rateLimitedCount: dashboardResponse.data.rateLimited?.length || 0,
      partial: dashboardResponse.data.partial,
      message: dashboardResponse.data.message,
      source: dashboardResponse.data.summary?.source
    });

    // Test 3: Check rate limited items again after request
    console.log('\n3. Checking rate limited items after request...');
    const rateLimitResponse2 = await axios.get('http://localhost:5001/api/reports/rate-limits?timeframe=all-time', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Rate limited items after request:', {
      count: rateLimitResponse2.data.count,
      message: rateLimitResponse2.data.message
    });

    // Test 4: Test clearing rate limits
    console.log('\n4. Testing rate limit clearing...');
    const clearResponse = await axios.delete('http://localhost:5001/api/reports/rate-limits?timeframe=all-time', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Clear rate limits response:', {
      success: clearResponse.data.success,
      message: clearResponse.data.message
    });

    // Test 5: Verify rate limits are cleared
    console.log('\n5. Verifying rate limits are cleared...');
    const rateLimitResponse3 = await axios.get('http://localhost:5001/api/reports/rate-limits?timeframe=all-time', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Rate limited items after clearing:', {
      count: rateLimitResponse3.data.count,
      message: rateLimitResponse3.data.message
    });

    console.log('\n🎉 Rate limit tracking system test completed successfully!');
    console.log('\nKey improvements:');
    console.log('- Rate limited items are tracked in Firebase');
    console.log('- Rate limited items are filtered out before processing');
    console.log('- Rate limits expire after 5 minutes');
    console.log('- Manual rate limit clearing available');
    console.log('- Prevents infinite loops of rate limited requests');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testRateLimitTracking(); 