import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const USER_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const API_VERSION = 'v24.0';

async function getPageTokens() {
  console.log('🔑 Getting Page Access Tokens...\n');

  if (!USER_ACCESS_TOKEN) {
    console.error('❌ FACEBOOK_PAGE_ACCESS_TOKEN not found in .env');
    return;
  }

  try {
    // Get all pages
    const pagesUrl = `https://graph.facebook.com/${API_VERSION}/me/accounts`;
    const pagesResponse = await axios.get(pagesUrl, {
      params: {
        access_token: USER_ACCESS_TOKEN,
        fields: 'id,name,access_token,category,tasks',
      },
    });

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      console.log('❌ No pages found');
      return;
    }

    console.log('✅ Found', pagesResponse.data.data.length, 'page(s):\n');

    pagesResponse.data.data.forEach((page: any, index: number) => {
      console.log(`${index + 1}. ${page.name}`);
      console.log(`   ID: ${page.id}`);
      console.log(`   Category: ${page.category}`);
      console.log(`   Tasks: ${page.tasks?.join(', ') || 'N/A'}`);
      console.log(`   Page Token: ${page.access_token}`);
      console.log('');
    });

    // Auto-update .env with first page token
    const firstPage = pagesResponse.data.data[0];
    console.log('═══════════════════════════════════════════════════');
    console.log('📝 Updating .env with Page Token...');
    console.log('═══════════════════════════════════════════════════\n');

    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Replace token
    envContent = envContent.replace(
      /FACEBOOK_PAGE_ACCESS_TOKEN=.*/,
      `FACEBOOK_PAGE_ACCESS_TOKEN=${firstPage.access_token}`
    );

    fs.writeFileSync(envPath, envContent);

    console.log('✅ Updated .env with:');
    console.log(`   Page: ${firstPage.name}`);
    console.log(`   ID: ${firstPage.id}`);
    console.log(`   Token: ${firstPage.access_token.substring(0, 30)}...`);
    console.log('');
    console.log('🎉 Done! Now you can:');
    console.log('   1. Run: npm run test:facebook');
    console.log('   2. Start backend: npm run start:dev');
    console.log('   3. Setup webhook in Facebook App');
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

getPageTokens();
