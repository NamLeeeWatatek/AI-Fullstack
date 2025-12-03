import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ConversationEntity,
  MessageEntity,
  MessageFeedbackEntity,
} from './infrastructure/persistence/relational/entities/conversation.entity';
import { AiConversationEntity } from './infrastructure/persistence/relational/entities/ai-conversation.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { AiConversationsService } from './ai-conversations.service';
import { AiConversationsController } from './ai-conversations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      MessageFeedbackEntity,
      AiConversationEntity,
    ]),
  ],
  controllers: [ConversationsController, AiConversationsController],
  providers: [ConversationsService, AiConversationsService],
  exports: [ConversationsService, AiConversationsService],
})
export class ConversationsModule {}
