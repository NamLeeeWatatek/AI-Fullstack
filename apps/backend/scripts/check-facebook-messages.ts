import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('=== Checking Facebook Messages ===\n');

  // Get all Facebook channel connections
  const fbChannels = await dataSource.query(`
    SELECT 
      cc.id,
      cc.name,
      cc.type,
      cc."workspaceId",
      w.name as workspace_name,
      cc.metadata,
      cc.status,
      cc."createdAt"
    FROM channel_connection cc
    LEFT JOIN workspace w ON w.id = cc."workspaceId"
    WHERE cc.type = 'facebook' OR cc.type = 'messenger'
    ORDER BY cc."createdAt" DESC
  `);

  console.log(`Found ${fbChannels.length} Facebook channels:\n`);
  fbChannels.forEach((channel, idx) => {
    console.log(`${idx + 1}. Channel: ${channel.name}`);
    console.log(`   ID: ${channel.id}`);
    console.log(`   Type: ${channel.type}`);
    console.log(`   Status: ${channel.status}`);
    console.log(`   Workspace: ${channel.workspace_name} (${channel.workspaceId})`);
    console.log(`   Created: ${channel.createdAt}`);
    if (channel.metadata) {
      const meta = typeof channel.metadata === 'string' 
        ? JSON.parse(channel.metadata) 
        : channel.metadata;
      console.log(`   Page ID: ${meta.pageId || 'N/A'}`);
      console.log(`   Page Name: ${meta.pageName || 'N/A'}`);
    }
    console.log('');
  });

  // Get conversations from Facebook channels
  for (const channel of fbChannels) {
    console.log(`\n=== Conversations for ${channel.name} ===`);
    
    const conversations = await dataSource.query(`
      SELECT 
        c.id,
        c.contact_name,
        c.external_id,
        c.status,
        c.created_at,
        c.last_message_at,
        COUNT(m.id) as message_count
      FROM conversation c
      LEFT JOIN message m ON m.conversation_id = c.id
      WHERE c.channel_id = $1 AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.last_message_at DESC NULLS LAST
      LIMIT 10
    `, [channel.id]);

    if (conversations.length === 0) {
      console.log('❌ No conversations found\n');
      continue;
    }

    console.log(`✅ Found ${conversations.length} conversations:\n`);
    
    for (const conv of conversations) {
      console.log(`Conversation: ${conv.contact_name || 'Unknown'}`);
      console.log(`  ID: ${conv.id}`);
      console.log(`  External ID: ${conv.external_id || 'N/A'}`);
      console.log(`  Status: ${conv.status}`);
      console.log(`  Messages: ${conv.message_count}`);
      console.log(`  Created: ${conv.created_at}`);
      console.log(`  Last Message: ${conv.last_message_at || 'N/A'}`);

      // Get recent messages
      const messages = await dataSource.query(`
        SELECT 
          id,
          content,
          sender,
          "createdAt"
        FROM message
        WHERE conversation_id = $1
        ORDER BY "createdAt" DESC
        LIMIT 5
      `, [conv.id]);

      if (messages.length > 0) {
        console.log(`  Recent messages:`);
        messages.reverse().forEach((msg, idx) => {
          const preview = msg.content?.substring(0, 50) || '';
          console.log(`    ${idx + 1}. [${msg.sender}] ${preview}${msg.content?.length > 50 ? '...' : ''}`);
        });
      }
      console.log('');
    }
  }

  // Check webhook events
  console.log('\n=== Recent Facebook Webhook Events ===\n');
  const webhookEvents = await dataSource.query(`
    SELECT 
      id,
      event_type,
      payload,
      status,
      created_at
    FROM webhook_event
    WHERE event_type LIKE '%facebook%' OR event_type LIKE '%messenger%'
    ORDER BY created_at DESC
    LIMIT 10
  `);

  if (webhookEvents.length === 0) {
    console.log('❌ No webhook events found\n');
  } else {
    console.log(`✅ Found ${webhookEvents.length} webhook events:\n`);
    webhookEvents.forEach((event, idx) => {
      console.log(`${idx + 1}. Event: ${event.event_type}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Created: ${event.created_at}`);
      if (event.payload) {
        const payload = typeof event.payload === 'string' 
          ? JSON.parse(event.payload) 
          : event.payload;
        console.log(`   Payload:`, JSON.stringify(payload, null, 2).substring(0, 200));
      }
      console.log('');
    });
  }

  // Summary
  console.log('\n=== Summary ===');
  const totalConversations = await dataSource.query(`
    SELECT COUNT(*) as count
    FROM conversation c
    INNER JOIN channel_connection cc ON cc.id = c.channel_id
    WHERE (cc.type = 'facebook' OR cc.type = 'messenger') 
      AND c.deleted_at IS NULL
  `);
  
  const totalMessages = await dataSource.query(`
    SELECT COUNT(*) as count
    FROM message m
    INNER JOIN conversation c ON c.id = m.conversation_id
    INNER JOIN channel_connection cc ON cc.id = c.channel_id
    WHERE (cc.type = 'facebook' OR cc.type = 'messenger')
  `);

  console.log(`Total Facebook Channels: ${fbChannels.length}`);
  console.log(`Total Conversations: ${totalConversations[0].count}`);
  console.log(`Total Messages: ${totalMessages[0].count}`);

  await app.close();
}

bootstrap();
