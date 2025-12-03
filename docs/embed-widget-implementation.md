# WataOmi - Embed Widget Implementation Guide

## 🎯 Mục tiêu

Cho phép khách hàng nhúng chatbot vào website của họ chỉ bằng **1 dòng code**:

```html
<script src="https://cdn.wataomi.com/widget.js" data-bot-id="YOUR_BOT_ID"></script>
```

---

## 📋 Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Website                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  <script src="cdn.wataomi.com/widget.js"              │ │
│  │          data-bot-id="abc123">                         │ │
│  │  </script>                                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         WataOmi Chat Widget (Floating Button)          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  💬 Chat với chúng tôi                           │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ API Calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    WataOmi Backend                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Public API Endpoints (No Auth Required)               │ │
│  │  • GET  /api/v1/public/bots/:botId/config             │ │
│  │  • POST /api/v1/public/bots/:botId/conversations      │ │
│  │  • POST /api/v1/public/conversations/:id/messages     │ │
│  │  • GET  /api/v1/public/conversations/:id/messages     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ PHASE 1: Backend - Public API Endpoints

### 1.1 Tạo Public Bot Controller

**File**: `apps/backend/src/bots/controllers/public-bot.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PublicBotService } from '../services/public-bot.service';
import { CreatePublicConversationDto, AddPublicMessageDto } from '../dto/public-bot.dto';

@ApiTags('Public Bot API')
@Controller('api/v1/public/bots')
export class PublicBotController {
  constructor(private readonly publicBotService: PublicBotService) {}

  /**
   * Get bot configuration for widget
   * No authentication required
   */
  @Get(':botId/config')
  @ApiOperation({ summary: 'Get bot widget configuration' })
  @ApiParam({ name: 'botId', type: 'string' })
  async getBotConfig(
    @Param('botId') botId: string,
    @Headers('origin') origin?: string,
  ) {
    return this.publicBotService.getBotConfig(botId, origin);
  }

  /**
   * Create a new public conversation
   */
  @Post(':botId/conversations')
  @ApiOperation({ summary: 'Create new conversation' })
  async createConversation(
    @Param('botId') botId: string,
    @Body() dto: CreatePublicConversationDto,
    @Headers('origin') origin?: string,
  ) {
    return this.publicBotService.createConversation(botId, dto, origin);
  }

  /**
   * Send message to bot
   */
  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send message to bot' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: AddPublicMessageDto,
  ) {
    return this.publicBotService.sendMessage(conversationId, dto);
  }

  /**
   * Get conversation messages
   */
  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.publicBotService.getMessages(conversationId);
  }
}
```

### 1.2 Tạo Public Bot Service

**File**: `apps/backend/src/bots/services/public-bot.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { MessageEntity } from '../../conversations/infrastructure/persistence/relational/entities/message.entity';
import { KnowledgeBaseService } from '../../knowledge-base/services/kb-management.service';
import { AiProvidersService } from '../../ai-providers/ai-providers.service';

@Injectable()
export class PublicBotService {
  constructor(
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly aiProvidersService: AiProvidersService,
  ) {}

  /**
   * Get bot configuration for widget
   */
  async getBotConfig(botId: string, origin?: string) {
    const bot = await this.botRepository.findOne({
      where: { id: botId, status: 'active' },
      relations: ['workspace'],
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or inactive');
    }

    // Check if origin is allowed (CORS)
    if (bot.allowedOrigins && origin) {
      const allowed = bot.allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === '*') return true;
        return origin.includes(allowedOrigin);
      });

      if (!allowed) {
        throw new ForbiddenException('Origin not allowed');
      }
    }

    return {
      botId: bot.id,
      name: bot.name,
      description: bot.description,
      avatarUrl: bot.avatarUrl,
      defaultLanguage: bot.defaultLanguage,
      timezone: bot.timezone,
      welcomeMessage: bot.welcomeMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?',
      placeholderText: bot.placeholderText || 'Nhập tin nhắn...',
      theme: {
        primaryColor: bot.primaryColor || '#3B82F6',
        position: bot.widgetPosition || 'bottom-right',
        buttonSize: bot.widgetButtonSize || 'medium',
        showAvatar: bot.showAvatar ?? true,
        showTimestamp: bot.showTimestamp ?? true,
      },
    };
  }

  /**
   * Create new public conversation
   */
  async createConversation(
    botId: string,
    dto: CreatePublicConversationDto,
    origin?: string,
  ) {
    const bot = await this.botRepository.findOne({
      where: { id: botId, status: 'active' },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or inactive');
    }

    // Validate origin
    if (bot.allowedOrigins && origin) {
      const allowed = bot.allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === '*') return true;
        return origin.includes(allowedOrigin);
      });

      if (!allowed) {
        throw new ForbiddenException('Origin not allowed');
      }
    }

    const conversation = this.conversationRepository.create({
      botId,
      userId: dto.userId || null,
      metadata: {
        ...dto.metadata,
        origin,
        userAgent: dto.userAgent,
        ipAddress: dto.ipAddress,
      },
      status: 'active',
    });

    await this.conversationRepository.save(conversation);

    return {
      conversationId: conversation.id,
      botId: bot.id,
      createdAt: conversation.createdAt,
    };
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(conversationId: string, dto: AddPublicMessageDto) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['bot'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const bot = conversation.bot;

    // Save user message
    const userMessage = this.messageRepository.create({
      conversationId,
      role: 'user',
      content: dto.message,
      metadata: dto.metadata,
    });
    await this.messageRepository.save(userMessage);

    // Get conversation history
    const history = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 10,
    });

    // Query knowledge base if available
    let context = '';
    if (bot.knowledgeBaseIds && bot.knowledgeBaseIds.length > 0) {
      const kbResults = await this.knowledgeBaseService.query({
        query: dto.message,
        knowledgeBaseId: bot.knowledgeBaseIds[0],
        limit: 3,
        similarityThreshold: 0.7,
      });

      context = kbResults.results
        .map((r) => r.content)
        .join('\n\n');
    }

    // Generate AI response
    const systemPrompt = bot.systemPrompt || 'You are a helpful assistant.';
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context ? [{ role: 'system', content: `Context:\n${context}` }] : []),
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    const aiResponse = await this.aiProvidersService.chat(
      messages,
      bot.aiProvider || 'openai',
      {
        model: bot.aiModelName || 'gpt-4',
        temperature: bot.aiParameters?.temperature || 0.7,
        max_tokens: bot.aiParameters?.max_tokens || 1000,
      },
    );

    // Save bot message
    const botMessage = this.messageRepository.create({
      conversationId,
      role: 'assistant',
      content: aiResponse.content,
      metadata: {
        model: bot.aiModelName,
        tokensUsed: aiResponse.tokensUsed,
        sources: context ? kbResults.results.map((r) => r.documentId) : [],
      },
    });
    await this.messageRepository.save(botMessage);

    return {
      messageId: botMessage.id,
      content: botMessage.content,
      role: 'assistant',
      timestamp: botMessage.createdAt,
      metadata: botMessage.metadata,
    };
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string) {
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    return {
      conversationId,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
        metadata: m.metadata,
      })),
    };
  }
}
```

### 1.3 Tạo DTOs

**File**: `apps/backend/src/bots/dto/public-bot.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreatePublicConversationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AddPublicMessageDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

### 1.4 Cập nhật Bot Entity

**File**: `apps/backend/src/bots/infrastructure/persistence/relational/entities/bot.entity.ts`

Thêm các fields mới:

```typescript
@Column({ name: 'allowed_origins', type: 'jsonb', nullable: true })
allowedOrigins?: string[] | null; // ['https://example.com', 'https://app.example.com']

@Column({ name: 'welcome_message', type: String, nullable: true })
welcomeMessage?: string | null;

@Column({ name: 'placeholder_text', type: String, nullable: true })
placeholderText?: string | null;

@Column({ name: 'primary_color', type: String, nullable: true })
primaryColor?: string | null;

@Column({ name: 'widget_position', type: String, default: 'bottom-right' })
widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

@Column({ name: 'widget_button_size', type: String, default: 'medium' })
widgetButtonSize: 'small' | 'medium' | 'large';

@Column({ name: 'show_avatar', type: Boolean, default: true })
showAvatar: boolean;

@Column({ name: 'show_timestamp', type: Boolean, default: true })
showTimestamp: boolean;
```

---

## 🎨 PHASE 2: Frontend - Embeddable Widget

### 2.1 Tạo Standalone Widget

**File**: `apps/web/public/widget/wataomi-widget.js`

```javascript
(function() {
  'use strict';

  // Configuration
  const WATAOMI_API_URL = 'https://api.wataomi.com';
  const WIDGET_VERSION = '1.0.0';

  class WataomiWidget {
    constructor(botId, config = {}) {
      this.botId = botId;
      this.config = config;
      this.conversationId = null;
      this.isOpen = false;
      this.messages = [];
      
      this.init();
    }

    async init() {
      try {
        // Fetch bot configuration
        const botConfig = await this.fetchBotConfig();
        this.config = { ...botConfig.theme, ...this.config };
        
        // Create widget UI
        this.createWidget();
        
        // Load conversation from localStorage
        this.loadConversation();
        
        // Attach event listeners
        this.attachEventListeners();
      } catch (error) {
        console.error('[WataOmi] Failed to initialize widget:', error);
      }
    }

    async fetchBotConfig() {
      const response = await fetch(`${WATAOMI_API_URL}/api/v1/public/bots/${this.botId}/config`, {
        headers: {
          'Origin': window.location.origin,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bot config');
      }
      
      return response.json();
    }

    createWidget() {
      // Create container
      const container = document.createElement('div');
      container.id = 'wataomi-widget-container';
      container.innerHTML = `
        <style>
          #wataomi-widget-container {
            position: fixed;
            ${this.config.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
            ${this.config.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
            ${this.config.position === 'top-right' ? 'top: 20px; right: 20px;' : ''}
            ${this.config.position === 'top-left' ? 'top: 20px; left: 20px;' : ''}
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          #wataomi-chat-button {
            width: ${this.config.buttonSize === 'small' ? '50px' : this.config.buttonSize === 'large' ? '70px' : '60px'};
            height: ${this.config.buttonSize === 'small' ? '50px' : this.config.buttonSize === 'large' ? '70px' : '60px'};
            border-radius: 50%;
            background: ${this.config.primaryColor || '#3B82F6'};
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }
          
          #wataomi-chat-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
          }
          
          #wataomi-chat-window {
            position: absolute;
            ${this.config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
            ${this.config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
          }
          
          #wataomi-chat-window.open {
            display: flex;
          }
          
          .wataomi-header {
            background: ${this.config.primaryColor || '#3B82F6'};
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .wataomi-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .wataomi-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .wataomi-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 24px;
            padding: 0;
            width: 32px;
            height: 32px;
          }
          
          .wataomi-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f9fafb;
          }
          
          .wataomi-message {
            margin-bottom: 12px;
            display: flex;
            gap: 8px;
          }
          
          .wataomi-message.user {
            justify-content: flex-end;
          }
          
          .wataomi-message-content {
            max-width: 70%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .wataomi-message.user .wataomi-message-content {
            background: ${this.config.primaryColor || '#3B82F6'};
            color: white;
          }
          
          .wataomi-message.assistant .wataomi-message-content {
            background: white;
            color: #1f2937;
          }
          
          .wataomi-input-container {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: white;
          }
          
          .wataomi-input-wrapper {
            display: flex;
            gap: 8px;
          }
          
          .wataomi-input {
            flex: 1;
            padding: 10px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
          }
          
          .wataomi-input:focus {
            border-color: ${this.config.primaryColor || '#3B82F6'};
          }
          
          .wataomi-send-button {
            background: ${this.config.primaryColor || '#3B82F6'};
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          }
          
          .wataomi-send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .wataomi-typing {
            display: flex;
            gap: 4px;
            padding: 10px 14px;
          }
          
          .wataomi-typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #9ca3af;
            animation: wataomi-typing 1.4s infinite;
          }
          
          .wataomi-typing-dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          .wataomi-typing-dot:nth-child(3) {
            animation-delay: 0.4s;
          }
          
          @keyframes wataomi-typing {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-10px);
            }
          }
        </style>
        
        <button id="wataomi-chat-button" aria-label="Open chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        
        <div id="wataomi-chat-window">
          <div class="wataomi-header">
            <div class="wataomi-header-info">
              ${this.config.showAvatar ? `
                <div class="wataomi-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              ` : ''}
              <div>
                <div style="font-weight: 600;">${this.config.name || 'AI Assistant'}</div>
                <div style="font-size: 12px; opacity: 0.9;">Luôn sẵn sàng hỗ trợ</div>
              </div>
            </div>
            <button class="wataomi-close" aria-label="Close chat">&times;</button>
          </div>
          
          <div class="wataomi-messages" id="wataomi-messages">
            <div class="wataomi-message assistant">
              <div class="wataomi-message-content">
                ${this.config.welcomeMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?'}
              </div>
            </div>
          </div>
          
          <div class="wataomi-input-container">
            <div class="wataomi-input-wrapper">
              <input 
                type="text" 
                class="wataomi-input" 
                id="wataomi-input"
                placeholder="${this.config.placeholderText || 'Nhập tin nhắn...'}"
              />
              <button class="wataomi-send-button" id="wataomi-send">Gửi</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(container);
    }

    attachEventListeners() {
      const button = document.getElementById('wataomi-chat-button');
      const closeBtn = document.querySelector('.wataomi-close');
      const sendBtn = document.getElementById('wataomi-send');
      const input = document.getElementById('wataomi-input');
      
      button.addEventListener('click', () => this.toggleChat());
      closeBtn.addEventListener('click', () => this.toggleChat());
      sendBtn.addEventListener('click', () => this.sendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    toggleChat() {
      this.isOpen = !this.isOpen;
      const window = document.getElementById('wataomi-chat-window');
      window.classList.toggle('open', this.isOpen);
    }

    async sendMessage() {
      const input = document.getElementById('wataomi-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      // Add user message to UI
      this.addMessage('user', message);
      input.value = '';
      
      // Show typing indicator
      this.showTyping();
      
      try {
        // Create conversation if needed
        if (!this.conversationId) {
          await this.createConversation();
        }
        
        // Send message to API
        const response = await fetch(
          `${WATAOMI_API_URL}/api/v1/public/bots/conversations/${this.conversationId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
          }
        );
        
        const data = await response.json();
        
        // Hide typing indicator
        this.hideTyping();
        
        // Add bot response to UI
        this.addMessage('assistant', data.content);
        
        // Save conversation
        this.saveConversation();
      } catch (error) {
        console.error('[WataOmi] Failed to send message:', error);
        this.hideTyping();
        this.addMessage('assistant', 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    }

    async createConversation() {
      const response = await fetch(
        `${WATAOMI_API_URL}/api/v1/public/bots/${this.botId}/conversations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
          },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            metadata: {
              url: window.location.href,
              referrer: document.referrer,
            },
          }),
        }
      );
      
      const data = await response.json();
      this.conversationId = data.conversationId;
    }

    addMessage(role, content) {
      const messagesContainer = document.getElementById('wataomi-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `wataomi-message ${role}`;
      messageDiv.innerHTML = `
        <div class="wataomi-message-content">${this.escapeHtml(content)}</div>
      `;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      this.messages.push({ role, content, timestamp: new Date() });
    }

    showTyping() {
      const messagesContainer = document.getElementById('wataomi-messages');
      const typingDiv = document.createElement('div');
      typingDiv.id = 'wataomi-typing-indicator';
      typingDiv.className = 'wataomi-message assistant';
      typingDiv.innerHTML = `
        <div class="wataomi-message-content wataomi-typing">
          <div class="wataomi-typing-dot"></div>
          <div class="wataomi-typing-dot"></div>
          <div class="wataomi-typing-dot"></div>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
      const typingIndicator = document.getElementById('wataomi-typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }

    saveConversation() {
      localStorage.setItem(`wataomi_conversation_${this.botId}`, JSON.stringify({
        conversationId: this.conversationId,
        messages: this.messages,
      }));
    }

    loadConversation() {
      const saved = localStorage.getItem(`wataomi_conversation_${this.botId}`);
      if (saved) {
        const data = JSON.parse(saved);
        this.conversationId = data.conversationId;
        this.messages = data.messages || [];
        
        // Restore messages to UI
        data.messages?.forEach(msg => {
          if (msg.role !== 'system') {
            this.addMessage(msg.role, msg.content);
          }
        });
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Auto-initialize from script tag
  function initFromScript() {
    const script = document.currentScript || document.querySelector('script[data-bot-id]');
    if (script) {
      const botId = script.getAttribute('data-bot-id');
      if (botId) {
        new WataomiWidget(botId);
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromScript);
  } else {
    initFromScript();
  }

  // Expose to window for manual initialization
  window.WataomiWidget = WataomiWidget;
})();
```

---

## 📦 PHASE 3: Widget Management UI

### 3.1 Tạo Widget Settings Page

**File**: `apps/web/app/(dashboard)/bots/[id]/widget/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { getBot, updateBot } from '@/lib/api/bots'
import type { Bot } from '@/lib/types/bots'

export default function BotWidgetPage() {
  const params = useParams()
  const botId = params.id as string
  
  const [bot, setBot] = useState<Bot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Widget settings
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>(['*'])
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [placeholderText, setPlaceholderText] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3B82F6')
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right')
  const [widgetButtonSize, setWidgetButtonSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [showAvatar, setShowAvatar] = useState(true)
  const [showTimestamp, setShowTimestamp] = useState(true)
  
  useEffect(() => {
    loadBot()
  }, [botId])
  
  const loadBot = async () => {
    try {
      const data = await getBot(botId)
      setBot(data)
      
      // Load widget settings
      setAllowedOrigins(data.allowedOrigins || ['*'])
      setWelcomeMessage(data.welcomeMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?')
      setPlaceholderText(data.placeholderText || 'Nhập tin nhắn...')
      setPrimaryColor(data.primaryColor || '#3B82F6')
      setWidgetPosition(data.widgetPosition || 'bottom-right')
      setWidgetButtonSize(data.widgetButtonSize || 'medium')
      setShowAvatar(data.showAvatar ?? true)
      setShowTimestamp(data.showTimestamp ?? true)
    } catch (error) {
      toast.error('Failed to load bot')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await updateBot(botId, {
        allowedOrigins,
        welcomeMessage,
        placeholderText,
        primaryColor,
        widgetPosition,
        widgetButtonSize,
        showAvatar,
        showTimestamp,
      })
      toast.success('Widget settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }
  
  const embedCode = `<script src="https://cdn.wataomi.com/widget.js" data-bot-id="${botId}"></script>`
  
  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success('Embed code copied!')
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Widget Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize and embed your chatbot on your website
        </p>
      </div>
      
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="install">Installation</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how your widget looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select value={widgetPosition} onValueChange={(v: any) => setWidgetPosition(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="buttonSize">Button Size</Label>
                  <Select value={widgetButtonSize} onValueChange={(v: any) => setWidgetButtonSize(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showAvatar">Show Avatar</Label>
                <Switch
                  id="showAvatar"
                  checked={showAvatar}
                  onCheckedChange={setShowAvatar}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showTimestamp">Show Timestamp</Label>
                <Switch
                  id="showTimestamp"
                  checked={showTimestamp}
                  onCheckedChange={setShowTimestamp}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Customize widget messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Xin chào! Tôi có thể giúp gì cho bạn?"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="placeholderText">Input Placeholder</Label>
                <Input
                  id="placeholderText"
                  value={placeholderText}
                  onChange={(e) => setPlaceholderText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Control where your widget can be embedded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Allowed Origins</Label>
                <p className="text-sm text-muted-foreground">
                  Enter domains where your widget can be embedded (one per line). Use * to allow all domains.
                </p>
                <Textarea
                  value={allowedOrigins.join('\n')}
                  onChange={(e) => setAllowedOrigins(e.target.value.split('\n').filter(Boolean))}
                  placeholder="https://example.com&#10;https://app.example.com&#10;*"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="install">
          <Card>
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
              <CardDescription>Add this code to your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Step 1: Copy the embed code</h3>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{embedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={copyEmbedCode}
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Step 2: Paste before closing &lt;/body&gt; tag</h3>
                <p className="text-sm text-muted-foreground">
                  Add the code snippet just before the closing &lt;/body&gt; tag on every page where you want the widget to appear.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Example:</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Your website content -->
  
  <!-- WataOmi Widget -->
  ${embedCode}
</body>
</html>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Widget Preview</CardTitle>
              <CardDescription>See how your widget will look on your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-8 bg-muted/20 min-h-[600px] relative">
                <p className="text-center text-muted-foreground">
                  Widget preview will appear here
                </p>
                {/* TODO: Implement live preview */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 🚀 Deployment

### CDN Setup

1. **Build widget.js**:
```bash
cd apps/web/public/widget
npx esbuild wataomi-widget.js --bundle --minify --outfile=widget.min.js
```

2. **Upload to CDN** (AWS CloudFront, Cloudflare, etc.):
```
https://cdn.wataomi.com/widget.js
https://cdn.wataomi.com/widget.min.js
```

3. **Enable CORS** on backend:
```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: true, // Allow all origins for public API
  credentials: true,
});
```

---

## ✅ Testing

### Test Embed Code:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test WataOmi Widget</title>
</head>
<body>
  <h1>My Website</h1>
  <p>This is a test page for WataOmi widget.</p>
  
  <!-- WataOmi Widget -->
  <script src="http://localhost:3000/widget/wataomi-widget.js" data-bot-id="YOUR_BOT_ID"></script>
</body>
</html>
```

---

## 📝 Summary

Với implementation này, khách hàng chỉ cần:

1. ✅ **Copy 1 dòng code** từ dashboard
2. ✅ **Paste vào website** (trước thẻ `</body>`)
3. ✅ **Done!** Widget tự động xuất hiện và hoạt động

**Tính năng chính**:
- ✅ Public API (không cần auth)
- ✅ Embeddable widget (1-line install)
- ✅ Customizable (màu sắc, vị trí, messages)
- ✅ CORS protection (allowed origins)
- ✅ Conversation persistence (localStorage)
- ✅ Responsive design
- ✅ Real-time chat
- ✅ Knowledge base integration

Bạn muốn tôi implement code thực tế không? 🚀
