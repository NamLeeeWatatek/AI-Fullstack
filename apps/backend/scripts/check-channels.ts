import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ChannelsService } from '../src/channels/channels.service';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../src/integrations/infrastructure/persistence/relational/entities/channel-connection.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const channelsService = app.get(ChannelsService);
  const connectionRepo = app.get<Repository<ChannelConnectionEntity>>('ChannelConnectionEntityRepository');

  console.log('\n=== Checking Channel Connections ===\n');

  try {
    // Get all channels
    const channels = await connectionRepo.find();
    console.log(`Found ${channels.length} channel connections\n`);

    channels.forEach((channel, index) => {
      console.log(`${index + 1}. Channel: ${channel.name}`);
      console.log(`   ID: ${channel.id}`);
      console.log(`   Type: ${channel.type}`);
      console.log(`   Status: ${channel.status}`);
      console.log(`   Workspace ID: ${channel.workspaceId}`);
      console.log(`   Metadata:`, JSON.stringify(channel.metadata, null, 2));
      console.log(`   Has botId: ${!!channel.metadata?.botId}`);
      console.log(`   Page ID: ${channel.metadata?.pageId || 'N/A'}`);
      console.log('');
    });

    // Test findByExternalId
    if (channels.length > 0 && channels[0].metadata?.pageId) {
      const pageId = channels[0].metadata.pageId;
      console.log(`\nTesting findByExternalId with pageId: ${pageId}`);
      const found = await channelsService.findByExternalId(pageId);
      console.log('Found:', found ? `Yes (${found.name})` : 'No');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  await app.close();
}

bootstrap();
