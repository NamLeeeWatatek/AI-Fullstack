import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const API_VERSION = 'v24.0';

async function testFacebookConnection() {
  console.log('🧪 Testing Facebook Connection...\n');

  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ FACEBOOK_PAGE_ACCESS_TOKEN not found in .env');
    return;
  }

  console.log('✅ Token found:', PAGE_ACCESS_TOKEN.substring(0, 20) + '...\n');

  try {
    // 1. Test: Get Token Info
    console.log('📘 Test 1: Getting Token Info...');
    const debugTokenUrl = `https://graph.facebook.com/${API_VERSION}/debug_token`;
    try {
      const debugResponse = await axios.get(debugTokenUrl, {
        params: {
          input_token: PAGE_ACCESS_TOKEN,
          access_token: PAGE_ACCESS_TOKEN,
        },
      });
      console.log('✅ Token Info:');
      console.log('   - Type:', debugResponse.data.data.type);
      console.log('   - App ID:', debugResponse.data.data.app_id);
      console.log('   - User ID:', debugResponse.data.data.user_id);
      console.log('   - Expires:', debugResponse.data.data.expires_at || 'Never');
      console.log('');
    } catch (error: any) {
      console.log('⚠️  Could not debug token');
    }

    // 2. Test: Get User/Page Info
    console.log('📘 Test 2: Getting Account Info...');
    const meUrl = `https://graph.facebook.com/${API_VERSION}/me`;
    const meResponse = await axios.get(meUrl, {
      params: {
        access_token: PAGE_ACCESS_TOKEN,
        fields: 'id,name',
      },
    });

    console.log('✅ Account Info:');
    console.log('   - ID:', meResponse.data.id);
    console.log('   - Name:', meResponse.data.name);
    console.log('');

    // 3. Test: Get Pages (if User Token)
    console.log('📘 Test 3: Getting Pages...');
    try {
      const pagesUrl = `https://graph.facebook.com/${API_VERSION}/me/accounts`;
      const pagesResponse = await axios.get(pagesUrl, {
        params: {
          access_token: PAGE_ACCESS_TOKEN,
          fields: 'id,name,access_token,category',
        },
      });

      if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
        console.log('✅ Your Pages:');
        pagesResponse.data.data.forEach((page: any, index: number) => {
          console.log(`   ${index + 1}. ${page.name} (ID: ${page.id})`);
          console.log(`      Category: ${page.category}`);
          console.log(`      Page Token: ${page.access_token.substring(0, 20)}...`);
        });
        console.log('');
        console.log('⚠️  You are using a USER token, not a PAGE token!');
        console.log('   Please use one of the Page Access Tokens above');
        console.log('');
      } else {
        console.log('   No pages found');
      }
    } catch (error: any) {
      console.log('   ℹ️  This is a Page Token (good!)');
      console.log('');
    }

    // 4. Test: Get Subscribed Apps (for Page Token)
    console.log('📘 Test 4: Checking Subscribed Apps...');
    try {
      const subscribedAppsUrl = `https://graph.facebook.com/${API_VERSION}/me/subscribed_apps`;
      const subscribedAppsResponse = await axios.get(subscribedAppsUrl, {
        params: {
          access_token: PAGE_ACCESS_TOKEN,
        },
      });

      console.log('✅ Subscribed Apps:', subscribedAppsResponse.data.data);
      console.log('');
    } catch (error: any) {
      console.log('   ⚠️  Could not get subscribed apps');
      console.log('   This endpoint only works with Page Access Token');
      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Facebook Connection Test PASSED');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Setup webhook URL in Facebook App:');
    console.log('   URL: https://your-domain.com/api/v1/webhooks/facebook');
    console.log('   Verify Token:', process.env.FACEBOOK_VERIFY_TOKEN);
    console.log('');
    console.log('2. Subscribe to webhook fields:');
    console.log('   - messages');
    console.log('   - messaging_postbacks');
    console.log('   - messaging_optins');
    console.log('');
    console.log('3. Test by sending a message to your page');
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.log('');
    console.log('Common Issues:');
    console.log('- Invalid token: Check if token is expired');
    console.log('- Wrong permissions: Token needs pages_messaging permission');
    console.log('- Token type: Make sure you are using Page Access Token, not User Token');
  }
}

// Run test
testFacebookConnection();
