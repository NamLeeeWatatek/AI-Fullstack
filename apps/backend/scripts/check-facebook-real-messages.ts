import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('=== Checking Real Facebook Messages ===\n');

  // Get Facebook channel connections
  const fbChannels = await dataSource.query(`
    SELECT 
      cc.id,
      cc.name,
      cc.type,
      cc."accessToken",
      cc.metadata,
      cc.status
    FROM channel_connection cc
    WHERE (cc.type = 'facebook' OR cc.type = 'messenger') 
      AND cc.status = 'active'
      AND cc."accessToken" IS NOT NULL
  `);

  if (fbChannels.length === 0) {
    console.log('❌ No active Facebook channels found with access token\n');
    await app.close();
    return;
  }

  console.log(`✅ Found ${fbChannels.length} active Facebook channel(s)\n`);

  for (const channel of fbChannels) {
    console.log(`\n📱 Channel: ${channel.name}`);
    console.log(`   ID: ${channel.id}`);
    console.log(`   Status: ${channel.status}`);
    
    const metadata = typeof channel.metadata === 'string' 
      ? JSON.parse(channel.metadata) 
      : channel.metadata;
    
    const pageId = metadata?.pageId;
    const pageName = metadata?.pageName;
    
    console.log(`   Page ID: ${pageId || 'N/A'}`);
    console.log(`   Page Name: ${pageName || 'N/A'}`);
    console.log(`   Has Access Token: ${channel.accessToken ? 'Yes' : 'No'}`);

    if (!pageId || !channel.accessToken) {
      console.log('   ⚠️  Missing Page ID or Access Token\n');
      continue;
    }

    try {
      // Get conversations from Facebook API
      console.log('\n   🔍 Fetching conversations from Facebook...');
      const conversationsUrl = `https://graph.facebook.com/v18.0/${pageId}/conversations`;
      const conversationsResponse = await axios.get(conversationsUrl, {
        params: {
          access_token: channel.accessToken,
          fields: 'id,updated_time,message_count,participants',
          limit: 10
        }
      });

      const conversations = conversationsResponse.data.data || [];
      console.log(`   ✅ Found ${conversations.length} conversation(s) on Facebook\n`);

      if (conversations.length === 0) {
        console.log('   ℹ️  No conversations found. Try sending a message to the page first.\n');
        continue;
      }

      // Get details for each conversation
      for (let i = 0; i < Math.min(conversations.length, 5); i++) {
        const conv = conversations[i];
        console.log(`   ${i + 1}. Conversation ID: ${conv.id}`);
        console.log(`      Updated: ${conv.updated_time}`);
        console.log(`      Message Count: ${conv.message_count || 0}`);
        
        if (conv.participants?.data) {
          const participants = conv.participants.data
            .filter((p: any) => p.id !== pageId)
            .map((p: any) => p.name || p.id);
          console.log(`      Participants: ${participants.join(', ') || 'Unknown'}`);
        }

        // Get messages for this conversation
        try {
          const messagesUrl = `https://graph.facebook.com/v18.0/${conv.id}`;
          const messagesResponse = await axios.get(messagesUrl, {
            params: {
              access_token: channel.accessToken,
              fields: 'messages{id,created_time,from,message,to}',
              limit: 5
            }
          });

          const messages = messagesResponse.data.messages?.data || [];
          if (messages.length > 0) {
            console.log(`      Recent messages:`);
            messages.slice(0, 3).forEach((msg: any, idx: number) => {
              const fromName = msg.from?.name || msg.from?.id || 'Unknown';
              const preview = msg.message?.substring(0, 50) || '[No text]';
              console.log(`        ${idx + 1}. [${fromName}] ${preview}${msg.message?.length > 50 ? '...' : ''}`);
            });
          }
        } catch (msgError: any) {
          console.log(`      ⚠️  Could not fetch messages: ${msgError.message}`);
        }
        console.log('');
      }

    } catch (error: any) {
      console.log(`   ❌ Error fetching from Facebook API:`);
      if (error.response?.data) {
        console.log(`      ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`      ${error.message}`);
      }
      console.log('');
    }
  }

  // Compare with DB
  console.log('\n=== Comparing with Database ===\n');
  
  for (const channel of fbChannels) {
    const dbConversations = await dataSource.query(`
      SELECT 
        c.id,
        c.contact_name,
        c.external_id,
        c.status,
        c.created_at,
        COUNT(m.id) as message_count
      FROM conversation c
      LEFT JOIN message m ON m.conversation_id = c.id
      WHERE c.channel_id = $1 AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.last_message_at DESC NULLS LAST
      LIMIT 10
    `, [channel.id]);

    console.log(`📊 Channel: ${channel.name}`);
    console.log(`   Conversations in DB: ${dbConversations.length}`);
    
    if (dbConversations.length > 0) {
      dbConversations.forEach((conv: any, idx: number) => {
        console.log(`   ${idx + 1}. ${conv.contact_name || 'Unknown'} (${conv.message_count} messages)`);
        console.log(`      External ID: ${conv.external_id || 'N/A'}`);
        console.log(`      Status: ${conv.status}`);
      });
    }
    console.log('');
  }

  console.log('\n=== Summary ===');
  console.log('✅ Script completed');
  console.log('\nℹ️  To test:');
  console.log('1. Go to your Facebook Page');
  console.log('2. Send a message to the page from a personal account');
  console.log('3. Run this script again to see the message');

  await app.close();
}

bootstrap().catch(console.error);
