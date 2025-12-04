import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import axios from 'axios';

/**
 * Script to sync Facebook messages to database
 * This will fetch conversations from Facebook and save them to DB
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('=== Syncing Facebook Messages to Database ===\n');

  // Get Facebook channels
  const fbChannels = await dataSource.query(`
    SELECT 
      cc.id,
      cc.name,
      cc."accessToken",
      cc.metadata
    FROM channel_connection cc
    WHERE (cc.type = 'facebook' OR cc.type = 'messenger') 
      AND cc.status = 'active'
      AND cc."accessToken" IS NOT NULL
  `);

  if (fbChannels.length === 0) {
    console.log('❌ No active Facebook channels found\n');
    await app.close();
    return;
  }

  console.log(`✅ Found ${fbChannels.length} Facebook channel(s)\n`);

  for (const channel of fbChannels) {
    const metadata = typeof channel.metadata === 'string' 
      ? JSON.parse(channel.metadata) 
      : channel.metadata;
    
    const pageId = metadata?.pageId;
    const botId = metadata?.botId;

    if (!pageId || !channel.accessToken || !botId) {
      console.log(`⚠️  Skipping ${channel.name}: Missing pageId, accessToken, or botId\n`);
      continue;
    }

    console.log(`\n📱 Processing: ${channel.name}`);
    console.log(`   Page ID: ${pageId}`);
    console.log(`   Bot ID: ${botId}`);

    try {
      // Fetch conversations from Facebook
      const conversationsUrl = `https://graph.facebook.com/v18.0/${pageId}/conversations`;
      const conversationsResponse = await axios.get(conversationsUrl, {
        params: {
          access_token: channel.accessToken,
          fields: 'id,updated_time,message_count,participants',
          limit: 10
        }
      });

      const conversations = conversationsResponse.data.data || [];
      console.log(`   Found ${conversations.length} conversation(s) on Facebook`);

      for (const fbConv of conversations) {
        // Get conversation details with messages
        const convUrl = `https://graph.facebook.com/v18.0/${fbConv.id}`;
        const convResponse = await axios.get(convUrl, {
          params: {
            access_token: channel.accessToken,
            fields: 'messages{id,created_time,from,message,to}',
            limit: 50
          }
        });

        const messages = convResponse.data.messages?.data || [];
        if (messages.length === 0) continue;

        // Get sender info (first message from user)
        const userMessage = messages.find((m: any) => m.from?.id !== pageId);
        if (!userMessage) continue;

        const senderId = userMessage.from.id;
        let contactName = userMessage.from.name || 'Facebook User';
        let contactAvatar: string | undefined;

        // Get user profile
        try {
          const userUrl = `https://graph.facebook.com/v18.0/${senderId}`;
          const userResponse = await axios.get(userUrl, {
            params: {
              access_token: channel.accessToken,
              fields: 'name,profile_pic'
            }
          });
          contactName = userResponse.data.name || contactName;
          contactAvatar = userResponse.data.profile_pic;
        } catch (error) {
          // Ignore user info errors
        }

        // Check if conversation exists in DB
        const existingConv = await dataSource.query(`
          SELECT id FROM conversation 
          WHERE external_id = $1 AND channel_id = $2
        `, [senderId, channel.id]);

        let conversationId: string;

        if (existingConv.length > 0) {
          // Update existing conversation
          conversationId = existingConv[0].id;
          await dataSource.query(`
            UPDATE conversation 
            SET 
              contact_name = $1,
              contact_avatar = $2,
              last_message_at = $3,
              status = 'active'
            WHERE id = $4
          `, [contactName, contactAvatar, new Date(), conversationId]);
          console.log(`   ✓ Updated conversation: ${contactName}`);
        } else {
          // Create new conversation
          const result = await dataSource.query(`
            INSERT INTO conversation (
              bot_id, channel_id, channel_type, external_id,
              contact_name, contact_avatar, status, last_message_at,
              metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING id
          `, [
            botId,
            channel.id,
            'facebook',
            senderId,
            contactName,
            contactAvatar,
            'active',
            new Date(),
            JSON.stringify({ pageId })
          ]);
          conversationId = result[0].id;
          console.log(`   ✓ Created conversation: ${contactName}`);
        }

        // Save messages (reverse order - oldest first)
        const sortedMessages = messages.reverse();
        let savedCount = 0;

        for (const msg of sortedMessages) {
          if (!msg.message) continue;

          // Check if message already exists
          const existingMsg = await dataSource.query(`
            SELECT id FROM message 
            WHERE conversation_id = $1 
              AND metadata->>'externalId' = $2
          `, [conversationId, msg.id]);

          if (existingMsg.length > 0) continue;

          // Determine role
          const role = msg.from.id === pageId ? 'assistant' : 'user';

          // Save message
          await dataSource.query(`
            INSERT INTO message (
              conversation_id, role, content, metadata, sent_at
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            conversationId,
            role,
            msg.message,
            JSON.stringify({
              externalId: msg.id,
              senderId: msg.from.id,
              senderName: msg.from.name,
              channelType: 'facebook'
            }),
            new Date(msg.created_time)
          ]);
          savedCount++;
        }

        console.log(`     → Saved ${savedCount} new message(s)`);
      }

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`      ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }

  console.log('\n=== Sync Complete ===');
  await app.close();
}

bootstrap().catch(console.error);
