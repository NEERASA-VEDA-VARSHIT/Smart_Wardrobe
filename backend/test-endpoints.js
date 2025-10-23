// Test script to verify backend endpoints are working
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8000';

async function testEndpoints() {
  console.log('🧪 Testing backend endpoints...\n');

  // Test health endpoint
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData);
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }

  // Test laundry stats endpoint (should fail without auth)
  try {
    const laundryResponse = await fetch(`${BASE_URL}/api/laundry/stats/test-user-id`);
    const laundryData = await laundryResponse.json();
    console.log('📊 Laundry stats response:', laundryData);
  } catch (error) {
    console.log('📊 Laundry stats error (expected without auth):', error.message);
  }

  console.log('\n🎯 Backend endpoint testing complete!');
}

testEndpoints();
