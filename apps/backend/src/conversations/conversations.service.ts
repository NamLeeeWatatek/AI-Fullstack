import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  ConversationEntity,
  MessageEntity,
  MessageFeedbackEntity,
} from './infrastructure/persistence/relational/entities/conversation.entity';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateConversationStatusDto,
  MessageFeedbackDto,
  CreateMessageFeedbackDto,
} from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(MessageFeedbackEntity)
    private feedbackRepository: Repository<MessageFeedbackEntity>,
  ) {}

  async create(createDto: CreateConversationDto) {
    const conversation = this.conversationRepository.create({
      ...createDto,
      channelType: createDto.channelType ?? 'web',
      status: 'active',
      metadata: createDto.metadata || {},
    });
    return this.conversationRepository.save(conversation);
  }

  async findAll(options: {
    botId?: string;
    channelType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    workspaceId?: string;
    onlyChannelConversations?: boolean;
  }) {
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .leftJoin('channel_connection', 'channel', 'channel.id = conversation.channelId')
      .addSelect(['channel.name', 'channel.type', 'channel.metadata'])
      .where('conversation.deletedAt IS NULL');

    // Filter by conversation source
    if (options.onlyChannelConversations === true) {
      // Only channel conversations (Facebook, WhatsApp, etc.)
      query.andWhere('conversation.channelId IS NOT NULL');
    } else if (options.onlyChannelConversations === false) {
      // Only widget conversations (AI chat from website)
      query.andWhere('conversation.channelId IS NULL');
    }
    // If undefined, show all conversations

    // Filter by workspace through bot
    if (options.workspaceId) {
      query.andWhere('bot.workspaceId = :workspaceId', { 
        workspaceId: options.workspaceId 
      });
    }

    if (options.botId) {
      query.andWhere('conversation.botId = :botId', { botId: options.botId });
    }

    if (options.channelType) {
      query.andWhere('conversation.channelType = :channelType', {
        channelType: options.channelType,
      });
    }

    if (options.status) {
      query.andWhere('conversation.status = :status', {
        status: options.status,
      });
    }

    if (options.startDate) {
      query.andWhere('conversation.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      query.andWhere('conversation.createdAt <= :endDate', {
        endDate: options.endDate,
      });
    }

    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);

    query
      .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    // Format items with channel info and last message
    const formattedItems = await Promise.all(
      items.map(async (item) => {
        // Get channel info if channelId exists
        let channelName = item.channelType || 'Unknown';
        let channelMetadata = {};
        
        if (item.channelId) {
          try {
            const channel = await this.conversationRepository.manager
              .getRepository('channel_connection')
              .findOne({ 
                where: { id: item.channelId },
                select: ['name', 'type', 'metadata']
              });
            
            if (channel) {
              channelName = (channel as any).name || channelName;
              channelMetadata = (channel as any).metadata || {};
            }
          } catch (error) {
            // Ignore channel fetch errors
          }
        }

        // Get last message
        let lastMessage = 'No messages yet';
        try {
          const lastMsg = await this.messageRepository.findOne({
            where: { conversationId: item.id },
            order: { sentAt: 'DESC' },
          });
          if (lastMsg) {
            lastMessage = lastMsg.content;
          }
        } catch (error) {
          // Ignore message fetch errors
        }

        return {
          ...item,
          channelName,
          channelMetadata,
          lastMessage,
        };
      })
    );

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['bot'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateStatus(id: string, dto: UpdateConversationStatusDto) {
    const conversation = await this.findOne(id);
    conversation.status = dto.status;
    return this.conversationRepository.save(conversation);
  }

  async close(id: string) {
    return this.updateStatus(id, { status: 'closed' });
  }

  async archive(id: string) {
    return this.updateStatus(id, { status: 'archived' });
  }

  async delete(id: string) {
    await this.conversationRepository.softDelete(id);
  }

  // Messages
  async addMessage(conversationId: string, createDto: CreateMessageDto) {
    const conversation = await this.findOne(conversationId);

    const message = this.messageRepository.create({
      conversationId,
      role: createDto.role,
      content: createDto.content,
      attachments: createDto.attachments,
      metadata: createDto.metadata || {},
      sources: createDto.sources,
      toolCalls: createDto.toolCalls,
      // Legacy support
      sender: createDto.sender ?? createDto.role,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation's lastMessageAt
    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    return savedMessage;
  }

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ) {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId });

    if (options?.before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: options.before },
      });
      if (beforeMessage) {
        query.andWhere('message.sentAt < :beforeDate', {
          beforeDate: beforeMessage.sentAt,
        });
      }
    }

    const limit = Math.min(options?.limit ?? 50, 100);

    return query.orderBy('message.sentAt', 'ASC').take(limit).getMany();
  }

  async getMessage(conversationId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, conversationId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async updateMessageFeedback(
    conversationId: string,
    messageId: string,
    dto: MessageFeedbackDto,
  ) {
    const message = await this.getMessage(conversationId, messageId);

    if (dto.feedback !== undefined) message.feedback = dto.feedback;
    if (dto.feedbackComment !== undefined)
      message.feedbackComment = dto.feedbackComment;

    return this.messageRepository.save(message);
  }

  // Message Feedback (detailed)
  async createMessageFeedback(
    messageId: string,
    dto: CreateMessageFeedbackDto,
  ) {
    // Check if feedback already exists
    const existing = await this.feedbackRepository.findOne({
      where: { messageId },
    });

    if (existing) {
      existing.rating = dto.rating;
      existing.comment = dto.comment;
      return this.feedbackRepository.save(existing);
    }

    const feedback = this.feedbackRepository.create({
      messageId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return this.feedbackRepository.save(feedback);
  }

  async getMessageFeedback(messageId: string) {
    return this.feedbackRepository.findOne({
      where: { messageId },
    });
  }

  // Stats
  async getConversationStats(botId: string, period: 'day' | 'week' | 'month') {
    const startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else startDate.setMonth(startDate.getMonth() - 1);

    const [totalConversations, activeConversations, totalMessages] =
      await Promise.all([
        this.conversationRepository.count({
          where: {
            botId,
            createdAt: MoreThanOrEqual(startDate),
          },
        }),
        this.conversationRepository.count({
          where: {
            botId,
            status: 'active',
          },
        }),
        this.messageRepository
          .createQueryBuilder('message')
          .innerJoin('message.conversation', 'conversation')
          .where('conversation.botId = :botId', { botId })
          .andWhere('message.sentAt >= :startDate', { startDate })
          .getCount(),
      ]);

    return {
      totalConversations,
      activeConversations,
      totalMessages,
      period,
      startDate,
    };
  }

  // Find or create conversation by external ID (for channel integrations)
  async findOrCreateByExternalId(
    botId: string,
    externalId: string,
    channelType: string,
    contactInfo?: { name?: string; avatar?: string },
  ) {
    let conversation = await this.conversationRepository.findOne({
      where: { botId, externalId, channelType },
    });

    if (!conversation) {
      conversation = await this.create({
        botId,
        externalId,
        channelType,
        contactName: contactInfo?.name,
        contactAvatar: contactInfo?.avatar,
      });
    }

    return conversation;
  }
}
