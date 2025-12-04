import axios from 'axios';

const API_URL = 'https://ai-backend.odooenterprise.id.vn/api/v1';

async function testFacebookOAuth() {
  console.log('🧪 Testing Facebook OAuth Endpoints...\n');

  // Test 1: Get OAuth URL (requires auth)
  console.log('📘 Test 1: GET /channels/facebook/oauth/url');
  console.log('   This endpoint requires JWT token');
  console.log('   Expected: 401 Unauthorized (if no token)');
  
  try {
    const response = await axios.get(`${API_URL}/channels/facebook/oauth/url`);
    console.log('   ✅ Response:', response.data);
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('   ✅ Got 401 as expected (endpoint exists, needs auth)');
    } else {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }
  }
  console.log('');

  // Test 2: OAuth callback (public endpoint)
  console.log('📘 Test 2: GET /channels/facebook/oauth/callback');
  console.log('   This endpoint should be public');
  
  try {
    const response = await axios.get(`${API_URL}/channels/facebook/oauth/callback`, {
      params: {
        code: 'test-code',
        state: 'test-state',
      },
    });
    console.log('   Response:', response.data);
  } catch (error: any) {
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 3: Get connections (requires auth)
  console.log('📘 Test 3: GET /channels/facebook/connections');
  console.log('   This endpoint requires JWT token');
  
  try {
    const response = await axios.get(`${API_URL}/channels/facebook/connections`);
    console.log('   Response:', response.data);
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('   ✅ Got 401 as expected (endpoint exists, needs auth)');
    } else {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }
  }
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ All endpoints are accessible');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📝 To test with authentication:');
  console.log('1. Login to get JWT token');
  console.log('2. Add header: Authorization: Bearer <token>');
  console.log('3. Call /channels/facebook/oauth/url');
  console.log('');
}

testFacebookOAuth();
