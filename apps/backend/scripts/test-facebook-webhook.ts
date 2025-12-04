import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../src/integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { ConversationEntity } from '../src/conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { MessageEntity } from '../src/conversations/infrastructure/persistence/relational/entities/conversation.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const channelRepo = app.get<Repository<ChannelConnectionEntity>>('ChannelConnectionEntityRepository');
  const conversationRepo = app.get<Repository<ConversationEntity>>('ConversationEntityRepository');
  const messageRepo = app.get<Repository<MessageEntity>>('MessageEntityRepository');

  console.log('\n=== Testing Facebook Webhook & Conversations ===\n');

  try {
    // 1. Find Facebook channel
    console.log('1. Finding Facebook channel...');
    const channels = await channelRepo.find({
      where: { type: 'facebook', status: 'active' },
    });

    if (channels.length === 0) {
      console.log('❌ No Facebook channels found!');
      console.log('Please connect a Facebook page first at /channels');
      await app.close();
      return;
    }

    const channel = channels[0];
    console.log(`✅ Found channel: ${channel.name}`);
    console.log(`   ID: ${channel.id}`);
    console.log(`   Page ID: ${channel.metadata?.pageId}`);
    console.log(`   Bot ID: ${channel.metadata?.botId || 'NOT SET ❌'}`);
    console.log(`   Workspace ID: ${channel.workspaceId}`);

    if (!channel.metadata?.botId) {
      console.log('\n❌ Channel does not have botId!');
      console.log('Please reconnect the Facebook page to add botId.');
      await app.close();
      return;
    }

    // 2. Check existing conversations
    console.log('\n2. Checking existing conversations...');
    const existingConversations = await conversationRepo.find({
      where: { channelId: channel.id },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    console.log(`Found ${existingConversations.length} existing conversations:`);
    existingConversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.contactName || 'Unknown'} (${conv.externalId})`);
      console.log(`      Status: ${conv.status}, Last message: ${conv.lastMessageAt}`);
    });

    // 3. Create test conversation
    console.log('\n3. Creating test conversation...');
    const testExternalId = `test_user_${Date.now()}`;
    
    const testConversation = conversationRepo.create({
      botId: channel.metadata.botId,
      channelId: channel.id,
      channelType: 'facebook',
      externalId: testExternalId,
      contactName: 'Test User',
      contactAvatar: 'https://via.placeholder.com/150',
      status: 'active',
      lastMessageAt: new Date(),
      metadata: {
        pageId: channel.metadata.pageId,
        test: true,
      },
    });

    const savedConversation = await conversationRepo.save(testConversation);
    console.log(`✅ Created test conversation: ${savedConversation.id}`);

    // 4. Add test messages
    console.log('\n4. Adding test messages...');
    
    const userMessage = messageRepo.create({
      conversationId: savedConversation.id,
      role: 'user',
      content: 'Xin chào! Tôi muốn hỏi về sản phẩm.',
      sender: 'user',
      metadata: { test: true },
    });

    const assistantMessage = messageRepo.create({
      conversationId: savedConversation.id,
      role: 'assistant',
      content: 'Chào bạn! Tôi có thể giúp gì cho bạn?',
      sender: 'assistant',
      metadata: { test: true },
    });

    await messageRepo.save([userMessage, assistantMessage]);
    console.log('✅ Added 2 test messages');

    // 5. Verify conversation
    console.log('\n5. Verifying conversation...');
    const verifyConv = await conversationRepo.findOne({
      where: { id: savedConversation.id },
      relations: ['bot'],
    });

    if (verifyConv) {
      console.log('✅ Conversation verified:');
      console.log(`   ID: ${verifyConv.id}`);
      console.log(`   Contact: ${verifyConv.contactName}`);
      console.log(`   Bot: ${verifyConv.bot?.name || 'N/A'}`);
      console.log(`   Channel ID: ${verifyConv.channelId}`);
      console.log(`   Status: ${verifyConv.status}`);
    }

    // 6. Check messages
    const messages = await messageRepo.find({
      where: { conversationId: savedConversation.id },
      order: { sentAt: 'ASC' },
    });

    console.log(`\n6. Messages (${messages.length}):`);
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}] ${msg.content}`);
    });

    // 7. Summary
    console.log('\n=== Summary ===');
    console.log(`✅ Channel: ${channel.name} (${channel.id})`);
    console.log(`✅ Bot ID: ${channel.metadata.botId}`);
    console.log(`✅ Test Conversation: ${savedConversation.id}`);
    console.log(`✅ Messages: ${messages.length}`);
    console.log('\n📱 Now you can:');
    console.log(`   1. Open /conversations in the web app`);
    console.log(`   2. You should see "Test User" in the list`);
    console.log(`   3. Click to view the conversation`);
    console.log('\n💬 To test real Facebook messages:');
    console.log(`   1. Send a message to your Facebook page`);
    console.log(`   2. Check webhook logs in backend`);
    console.log(`   3. Conversation should appear in /conversations`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  await app.close();
}

bootstrap();
