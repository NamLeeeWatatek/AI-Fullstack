import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ConversationsService } from '../src/conversations/conversations.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const conversationsService = app.get(ConversationsService);

  console.log('\n=== Testing Conversations API ===\n');

  try {
    // Test 1: Get all conversations
    console.log('1. Getting all conversations...');
    const allConversations = await conversationsService.findAll({
      limit: 10,
    });
    console.log(`Found ${allConversations.total} conversations`);
    console.log('Items:', JSON.stringify(allConversations.items, null, 2));

    // Test 2: Get only channel conversations
    console.log('\n2. Getting only channel conversations...');
    const channelConversations = await conversationsService.findAll({
      limit: 10,
      onlyChannelConversations: true,
    });
    console.log(`Found ${channelConversations.total} channel conversations`);
    console.log('Items:', JSON.stringify(channelConversations.items, null, 2));

    // Test 3: Check conversations table
    console.log('\n3. Checking conversations table directly...');
    const conversations = await conversationsService['conversationRepository'].find({
      take: 5,
      order: { createdAt: 'DESC' },
    });
    console.log(`Found ${conversations.length} conversations in DB`);
    conversations.forEach((conv) => {
      console.log(`- ID: ${conv.id}`);
      console.log(`  Bot ID: ${conv.botId}`);
      console.log(`  Channel ID: ${conv.channelId}`);
      console.log(`  Channel Type: ${conv.channelType}`);
      console.log(`  Contact: ${conv.contactName}`);
      console.log(`  External ID: ${conv.externalId}`);
      console.log(`  Status: ${conv.status}`);
      console.log(`  Last Message: ${conv.lastMessageAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }

  await app.close();
}

bootstrap();
