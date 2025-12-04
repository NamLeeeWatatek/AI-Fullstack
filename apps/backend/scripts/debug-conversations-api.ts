import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ConversationsService } from '../src/conversations/conversations.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const conversationsService = app.get(ConversationsService);

  console.log('\n=== Debugging Conversations API ===\n');

  try {
    // Test 1: Get ALL conversations (no filters)
    console.log('1. Getting ALL conversations (no filters)...');
    const allConvs = await conversationsService.findAll({
      limit: 10,
      onlyChannelConversations: false,
    });
    console.log(`Total: ${allConvs.total}`);
    console.log('Items:', allConvs.items.map(c => ({
      id: c.id,
      contactName: c.contactName,
      channelId: c.channelId,
      botId: c.botId,
      bot: c.bot ? { id: c.bot.id, name: c.bot.name, workspaceId: c.bot.workspaceId } : null,
    })));

    // Test 2: Get only channel conversations
    console.log('\n2. Getting only channel conversations...');
    const channelConvs = await conversationsService.findAll({
      limit: 10,
      onlyChannelConversations: true,
    });
    console.log(`Total: ${channelConvs.total}`);
    console.log('Items:', channelConvs.items.map(c => ({
      id: c.id,
      contactName: c.contactName,
      channelId: c.channelId,
      botId: c.botId,
      bot: c.bot ? { id: c.bot.id, name: c.bot.name, workspaceId: c.bot.workspaceId } : null,
    })));

    // Test 3: Get with specific workspace
    if (channelConvs.items.length > 0 && channelConvs.items[0].bot) {
      const workspaceId = channelConvs.items[0].bot.workspaceId;
      console.log(`\n3. Getting conversations for workspace: ${workspaceId}...`);
      const workspaceConvs = await conversationsService.findAll({
        limit: 10,
        onlyChannelConversations: true,
        workspaceId,
      });
      console.log(`Total: ${workspaceConvs.total}`);
      console.log('Items:', workspaceConvs.items.map(c => ({
        id: c.id,
        contactName: c.contactName,
        channelId: c.channelId,
        botId: c.botId,
        bot: c.bot ? { id: c.bot.id, name: c.bot.name, workspaceId: c.bot.workspaceId } : null,
      })));
    }

    // Test 4: Check the test conversation specifically
    console.log('\n4. Looking for test conversation...');
    const testConvs = await conversationsService.findAll({
      limit: 100,
      onlyChannelConversations: false,
    });
    
    const testConv = testConvs.items.find(c => c.contactName === 'Test User');
    if (testConv) {
      console.log('✅ Found test conversation:');
      console.log('   ID:', testConv.id);
      console.log('   Contact:', testConv.contactName);
      console.log('   Channel ID:', testConv.channelId);
      console.log('   Bot ID:', testConv.botId);
      console.log('   Bot:', testConv.bot ? {
        id: testConv.bot.id,
        name: testConv.bot.name,
        workspaceId: testConv.bot.workspaceId,
      } : 'NOT LOADED');
      console.log('   Status:', testConv.status);
      console.log('   Last Message At:', testConv.lastMessageAt);
    } else {
      console.log('❌ Test conversation not found!');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  await app.close();
}

bootstrap();
