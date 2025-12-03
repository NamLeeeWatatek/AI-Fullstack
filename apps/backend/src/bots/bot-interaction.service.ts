import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from './infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';

/**
 * Bot Interaction Service
 * Handles bot interactions with conversations and messages
 */
@Injectable()
export class BotInteractionService {
  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
  ) {}

  /**
   * Get bot with all related data for interaction
   */
  async getBotForInteraction(botId: string) {
    const bot = await this.botRepository.findOne({
      where: { id: botId, status: 'active' },
      relations: ['workspace', 'flowVersions', 'knowledgeBases'],
    });

    if (!bot) {
      throw new NotFoundException('Active bot not found');
    }

    // Get published flow version
    const publishedFlow = bot.flowVersions?.find(
      (v) => v.status === 'published',
    );

    // Get active knowledge bases
    const activeKBs = bot.knowledgeBases?.filter((kb) => kb.isActive) || [];

    return {
      bot,
      publishedFlow,
      knowledgeBases: activeKBs,
    };
  }

  /**
   * Process incoming message for bot
   */
  async processMessage(
    botId: string,
    conversationId: string,
    message: string,
    metadata?: Record<string, any>,
  ) {
    const { bot, publishedFlow, knowledgeBases } =
      await this.getBotForInteraction(botId);

    // Get conversation
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, botId },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Build context for bot response
    const context = {
      bot: {
        id: bot.id,
        name: bot.name,
        systemPrompt: bot.systemPrompt,
        aiProviderId: bot.aiProviderId,
        aiModelName: bot.aiModelName,
        aiParameters: bot.aiParameters,
      },
      conversation: {
        id: conversation.id,
        externalId: conversation.externalId,
        metadata: conversation.metadata,
        messageHistory: conversation.messages?.slice(-10) || [], // Last 10 messages
      },
      flow: publishedFlow
        ? {
            id: publishedFlow.id,
            version: publishedFlow.version,
            flow: publishedFlow.flow,
          }
        : null,
      knowledgeBases: knowledgeBases.map((kb) => ({
        id: kb.knowledgeBaseId,
        priority: kb.priority,
        ragSettings: kb.ragSettings,
      })),
      message: {
        content: message,
        metadata,
      },
    };

    return context;
  }

  /**
   * Get bot statistics
   */
  async getBotStats(botId: string) {
    const bot = await this.botRepository.findOne({
      where: { id: botId },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    // Count conversations
    const conversationCount = await this.conversationRepository.count({
      where: { botId },
    });

    // Count active conversations (with messages in last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const activeConversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId = :botId', { botId })
      .andWhere('conversation.updatedAt > :oneDayAgo', { oneDayAgo })
      .getCount();

    return {
      botId: bot.id,
      botName: bot.name,
      status: bot.status,
      totalConversations: conversationCount,
      activeConversations,
      createdAt: bot.createdAt,
    };
  }

  /**
   * Validate bot can interact
   */
  async validateBotInteraction(botId: string): Promise<boolean> {
    const bot = await this.botRepository.findOne({
      where: { id: botId },
    });

    if (!bot) {
      return false;
    }

    // Bot must be active
    if (bot.status !== 'active') {
      return false;
    }

    return true;
  }
}
