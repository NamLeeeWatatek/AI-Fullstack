# Ví Dụ Thực Tế - Tích Hợp Omnichannel

## 1. Kết Nối Facebook Messenger - Full Flow

### Backend Setup

```typescript
// apps/backend/src/channels/providers/facebook.provider.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class FacebookProvider {
  private pageAccessToken: string;
  private appSecret: string;

  constructor() {
    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
  }

  // Gửi tin nhắn
  async sendMessage(recipientId: string, message: string) {
    const url = 'https://graph.facebook.com/v18.0/me/messages';
    
    try {
      const response = await axios.post(
        url,
        {
          recipient: { id: recipientId },
          message: { text: message }
        },
        {
          params: { access_token: this.pageAccessToken }
        }
      );
      
      return {
        success: true,
        messageId: response.data.message_id
      };
    } catch (error) {
      console.error('Facebook send error:', error.response?.data);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify webhook signature
  verifyWebhook(payload: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }

  // Gửi typing indicator
  async sendTypingOn(recipientId: string) {
    const url = 'https://graph.facebook.com/v18.0/me/messages';
    
    await axios.post(
      url,
      {
        recipient: { id: recipientId },
        sender_action: 'typing_on'
      },
      {
        params: { access_token: this.pageAccessToken }
      }
    );
  }

  // Gửi tin nhắn với quick replies
  async sendQuickReplies(recipientId: string, text: string, replies: string[]) {
    const url = 'https://graph.facebook.com/v18.0/me/messages';
    
    const response = await axios.post(
      url,
      {
        recipient: { id: recipientId },
        message: {
          text: text,
          quick_replies: replies.map(reply => ({
            content_type: 'text',
            title: reply,
            payload: reply
          }))
        }
      },
      {
        params: { access_token: this.pageAccessToken }
      }
    );
    
    return response.data;
  }
}
```

### Webhook Handler

```typescript
// apps/backend/src/channels/webhooks.controller.ts

import { Controller, Post, Get, Body, Headers, Query, Logger } from '@nestjs/common';
import { FacebookProvider } from './providers/facebook.provider';
import { ConversationsService } from '../conversations/conversations.service';
import { BotExecutionService } from '../bots/bot-execution.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private facebookProvider: FacebookProvider,
    private conversationsService: ConversationsService,
    private botExecutionService: BotExecutionService,
  ) {}

  // Verify webhook (GET request từ Facebook)
  @Get('facebook')
  verifyFacebookWebhook(@Query() query: any) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'wataomi_verify_token';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      this.logger.log('✅ Facebook webhook verified');
      return challenge;
    }

    this.logger.error('❌ Facebook webhook verification failed');
    return { success: false };
  }

  // Nhận tin nhắn (POST request từ Facebook)
  @Post('facebook')
  async handleFacebookWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    try {
      // 1. Verify signature
      const isValid = this.facebookProvider.verifyWebhook(payload, signature);
      if (!isValid) {
        this.logger.error('❌ Invalid Facebook signature');
        return { success: false, error: 'Invalid signature' };
      }

      // 2. Process entries
      if (payload.object === 'page') {
        for (const entry of payload.entry || []) {
          for (const messaging of entry.messaging || []) {
            await this.processFacebookMessage(messaging, entry.id);
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Facebook webhook error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Xử lý tin nhắn Facebook
  private async processFacebookMessage(messaging: any, pageId: string) {
    const senderId = messaging.sender.id;
    const message = messaging.message;

    if (!message || !message.text) {
      return; // Bỏ qua nếu không phải text message
    }

    this.logger.log(`📩 Received Facebook message from ${senderId}: ${message.text}`);

    try {
      // 1. Hiển thị typing indicator
      await this.facebookProvider.sendTypingOn(senderId);

      // 2. Tìm hoặc tạo conversation
      let conversation = await this.conversationsService.findByExternalId(
        senderId,
        'facebook'
      );

      if (!conversation) {
        conversation = await this.conversationsService.create({
          externalId: senderId,
          status: 'active',
          metadata: {
            channel: 'facebook',
            pageId: pageId,
            lastMessage: message.text,
            lastMessageAt: new Date().toISOString(),
          },
        });
      }

      // 3. Lưu tin nhắn user
      await this.conversationsService.addMessage(conversation.id, {
        role: 'user',
        content: message.text,
        timestamp: new Date(),
      });

      // 4. Xử lý với bot
      const botResponse = await this.botExecutionService.processMessage({
        channel: 'facebook',
        senderId: senderId,
        message: message.text,
        conversationId: conversation.id,
        metadata: {
          pageId: pageId,
          messageId: message.mid,
        },
      });

      // 5. Gửi phản hồi
      if (botResponse.success) {
        await this.facebookProvider.sendMessage(senderId, botResponse.message);

        // 6. Lưu tin nhắn bot
        await this.conversationsService.addMessage(conversation.id, {
          role: 'assistant',
          content: botResponse.message,
          timestamp: new Date(),
        });

        this.logger.log(`✅ Sent response to ${senderId}`);
      }
    } catch (error) {
      this.logger.error(`Error processing Facebook message: ${error.message}`);
      
      // Gửi error message cho user
      await this.facebookProvider.sendMessage(
        senderId,
        'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
      );
    }
  }
}
```

### Environment Variables

```bash
# .env
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FACEBOOK_APP_SECRET=your-app-secret-here
FACEBOOK_VERIFY_TOKEN=wataomi_verify_token
```

---

## 2. Kết Nối Telegram - Full Flow

### Telegram Provider

```typescript
// apps/backend/src/channels/providers/telegram.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramProvider {
  private readonly logger = new Logger(TelegramProvider.name);
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  // Gửi tin nhắn
  async sendMessage(chatId: string | number, text: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      });

      return {
        success: true,
        messageId: response.data.result.message_id,
      };
    } catch (error) {
      this.logger.error(`Telegram send error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Gửi typing indicator
  async sendTypingAction(chatId: string | number) {
    try {
      await axios.post(`${this.baseUrl}/sendChatAction`, {
        chat_id: chatId,
        action: 'typing',
      });
    } catch (error) {
      this.logger.error(`Telegram typing error: ${error.message}`);
    }
  }

  // Gửi tin nhắn với inline keyboard
  async sendMessageWithButtons(
    chatId: string | number,
    text: string,
    buttons: Array<{ text: string; callback_data: string }>,
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [buttons],
        },
      });

      return {
        success: true,
        messageId: response.data.result.message_id,
      };
    } catch (error) {
      this.logger.error(`Telegram buttons error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Set webhook
  async setWebhook(url: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/setWebhook`, {
        url: url,
        allowed_updates: ['message', 'callback_query'],
      });

      this.logger.log(`Telegram webhook set: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Telegram webhook error: ${error.message}`);
      throw error;
    }
  }

  // Get webhook info
  async getWebhookInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/getWebhookInfo`);
      return response.data.result;
    } catch (error) {
      this.logger.error(`Telegram webhook info error: ${error.message}`);
      throw error;
    }
  }
}
```

### Telegram Webhook Handler

```typescript
// apps/backend/src/channels/webhooks.controller.ts (thêm vào)

@Post('telegram')
async handleTelegramWebhook(@Body() payload: any) {
  try {
    this.logger.log('📩 Received Telegram webhook');

    // Xử lý tin nhắn text
    if (payload.message) {
      await this.processTelegramMessage(payload.message);
    }

    // Xử lý callback query (từ inline buttons)
    if (payload.callback_query) {
      await this.processTelegramCallback(payload.callback_query);
    }

    return { success: true };
  } catch (error) {
    this.logger.error(`Telegram webhook error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

private async processTelegramMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from.id;
  const userName = message.from.first_name || message.from.username;

  if (!text) return;

  this.logger.log(`📩 Telegram message from ${userName} (${chatId}): ${text}`);

  try {
    // 1. Hiển thị typing
    await this.telegramProvider.sendTypingAction(chatId);

    // 2. Tìm hoặc tạo conversation
    let conversation = await this.conversationsService.findByExternalId(
      chatId.toString(),
      'telegram'
    );

    if (!conversation) {
      conversation = await this.conversationsService.create({
        externalId: chatId.toString(),
        status: 'active',
        metadata: {
          channel: 'telegram',
          chatId: chatId,
          userId: userId,
          customerName: userName,
          lastMessage: text,
          lastMessageAt: new Date().toISOString(),
        },
      });
    }

    // 3. Lưu tin nhắn user
    await this.conversationsService.addMessage(conversation.id, {
      role: 'user',
      content: text,
      timestamp: new Date(),
    });

    // 4. Xử lý với bot
    const botResponse = await this.botExecutionService.processMessage({
      channel: 'telegram',
      senderId: chatId.toString(),
      message: text,
      conversationId: conversation.id,
      metadata: {
        userId: userId,
        userName: userName,
        messageId: message.message_id,
      },
    });

    // 5. Gửi phản hồi
    if (botResponse.success) {
      // Nếu có suggestions, gửi với buttons
      if (botResponse.suggestions && botResponse.suggestions.length > 0) {
        await this.telegramProvider.sendMessageWithButtons(
          chatId,
          botResponse.message,
          botResponse.suggestions.map(s => ({
            text: s,
            callback_data: s,
          }))
        );
      } else {
        await this.telegramProvider.sendMessage(chatId, botResponse.message);
      }

      // 6. Lưu tin nhắn bot
      await this.conversationsService.addMessage(conversation.id, {
        role: 'assistant',
        content: botResponse.message,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Sent Telegram response to ${chatId}`);
    }
  } catch (error) {
    this.logger.error(`Error processing Telegram message: ${error.message}`);
    await this.telegramProvider.sendMessage(
      chatId,
      'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
    );
  }
}

private async processTelegramCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  this.logger.log(`🔘 Telegram callback from ${chatId}: ${data}`);

  // Xử lý callback như một tin nhắn mới
  await this.processTelegramMessage({
    chat: { id: chatId },
    from: callbackQuery.from,
    text: data,
    message_id: messageId,
  });

  // Answer callback query để tắt loading
  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      callback_query_id: callbackQuery.id,
    }
  );
}
```

### Setup Telegram Webhook

```typescript
// apps/backend/src/channels/channels.controller.ts (thêm endpoint)

@Post('telegram/setup-webhook')
async setupTelegramWebhook(@Body() body: { url: string }) {
  const result = await this.telegramProvider.setWebhook(body.url);
  return result;
}

@Get('telegram/webhook-info')
async getTelegramWebhookInfo() {
  const info = await this.telegramProvider.getWebhookInfo();
  return info;
}
```

### Environment Variables

```bash
# .env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

## 3. Bot Execution Service - Xử Lý Thống Nhất

```typescript
// apps/backend/src/bots/bot-execution.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { BotsService } from './bots.service';
import { KnowledgeBaseService } from '../knowledge-base/services/knowledge-base.service';
import { AiProvidersService } from '../ai-providers/ai-providers.service';

interface ProcessMessageInput {
  channel: string;
  senderId: string;
  message: string;
  conversationId: string;
  metadata?: any;
}

interface ProcessMessageOutput {
  success: boolean;
  message?: string;
  suggestions?: string[];
  error?: string;
}

@Injectable()
export class BotExecutionService {
  private readonly logger = new Logger(BotExecutionService.name);

  constructor(
    private botsService: BotsService,
    private knowledgeBaseService: KnowledgeBaseService,
    private aiProvidersService: AiProvidersService,
  ) {}

  async processMessage(input: ProcessMessageInput): Promise<ProcessMessageOutput> {
    try {
      this.logger.log(`🤖 Processing message from ${input.channel}: ${input.message}`);

      // 1. Tìm bot cho channel này
      const bot = await this.findBotForChannel(input.channel);
      if (!bot) {
        return {
          success: false,
          error: 'No bot configured for this channel',
        };
      }

      // 2. Lấy lịch sử hội thoại
      const history = await this.getConversationHistory(input.conversationId);

      // 3. Query Knowledge Base (RAG)
      let context = '';
      if (bot.enableAutoLearn) {
        const kbResults = await this.knowledgeBaseService.query({
          query: input.message,
          botId: bot.id,
          limit: 5,
          similarityThreshold: 0.7,
        });

        if (kbResults.success && kbResults.results.length > 0) {
          context = kbResults.results
            .map((r, i) => `[${i + 1}] ${r.content}`)
            .join('\n\n');
          
          this.logger.log(`📚 Found ${kbResults.results.length} relevant documents`);
        }
      }

      // 4. Tạo prompt
      const systemPrompt = bot.systemPrompt || 'Bạn là trợ lý AI hữu ích.';
      const contextPrompt = context
        ? `\n\nThông tin tham khảo từ tài liệu:\n${context}\n\nHãy dựa vào thông tin trên để trả lời câu hỏi.`
        : '';

      // 5. Gọi AI model
      const aiResponse = await this.aiProvidersService.chat({
        model: bot.aiModel || 'gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt + contextPrompt,
          },
          ...history,
          {
            role: 'user',
            content: input.message,
          },
        ],
        temperature: 0.7,
        maxTokens: 1000,
      });

      if (!aiResponse.success) {
        return {
          success: false,
          error: 'AI service error',
        };
      }

      // 6. Tạo suggestions (optional)
      const suggestions = await this.generateSuggestions(input.message, bot);

      this.logger.log(`✅ Generated response: ${aiResponse.content.substring(0, 50)}...`);

      return {
        success: true,
        message: aiResponse.content,
        suggestions: suggestions,
      };
    } catch (error) {
      this.logger.error(`❌ Error processing message: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async findBotForChannel(channel: string) {
    // TODO: Implement logic to find bot based on channel
    // For now, return first active bot
    const bots = await this.botsService.findAll({ status: 'active' });
    return bots[0] || null;
  }

  private async getConversationHistory(conversationId: string) {
    // TODO: Get last N messages from conversation
    // For now, return empty array
    return [];
  }

  private async generateSuggestions(message: string, bot: any): Promise<string[]> {
    // TODO: Generate smart suggestions based on context
    // For now, return common suggestions
    return [
      'Tôi cần thêm thông tin',
      'Cảm ơn bạn',
      'Liên hệ hỗ trợ',
    ];
  }
}
```

---

## 4. Frontend - Hiển Thị Conversations

```typescript
// apps/web/app/conversations/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Conversation {
  id: string;
  externalId: string;
  status: string;
  metadata: {
    channel: string;
    customerName?: string;
    lastMessage: string;
    lastMessageAt: string;
  };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  useEffect(() => {
    fetchConversations();
  }, [selectedChannel]);

  const fetchConversations = async () => {
    const params = selectedChannel !== 'all' ? `?channel=${selectedChannel}` : '';
    const response = await fetch(`/api/v1/conversations${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const data = await response.json();
    setConversations(data);
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      telegram: '✈️',
      web: '🌐',
    };
    return icons[channel] || '💬';
  };

  const getChannelColor = (channel: string) => {
    const colors = {
      facebook: 'bg-blue-500',
      instagram: 'bg-pink-500',
      telegram: 'bg-sky-500',
      web: 'bg-purple-500',
    };
    return colors[channel] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conversations</h1>
        
        <div className="flex gap-2">
          <Button
            variant={selectedChannel === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedChannel('all')}
          >
            All
          </Button>
          <Button
            variant={selectedChannel === 'facebook' ? 'default' : 'outline'}
            onClick={() => setSelectedChannel('facebook')}
          >
            📘 Facebook
          </Button>
          <Button
            variant={selectedChannel === 'instagram' ? 'default' : 'outline'}
            onClick={() => setSelectedChannel('instagram')}
          >
            📷 Instagram
          </Button>
          <Button
            variant={selectedChannel === 'telegram' ? 'default' : 'outline'}
            onClick={() => setSelectedChannel('telegram')}
          >
            ✈️ Telegram
          </Button>
          <Button
            variant={selectedChannel === 'web' ? 'default' : 'outline'}
            onClick={() => setSelectedChannel('web')}
          >
            🌐 Web
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {conversations.map((conv) => (
          <Card key={conv.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${getChannelColor(conv.metadata.channel)} flex items-center justify-center text-white text-xl`}>
                    {getChannelIcon(conv.metadata.channel)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {conv.metadata.customerName || conv.externalId}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {conv.metadata.channel.toUpperCase()} • {conv.externalId}
                    </p>
                  </div>
                </div>
                <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                  {conv.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">{conv.metadata.lastMessage}</p>
              <p className="text-xs text-gray-400">
                {new Date(conv.metadata.lastMessageAt).toLocaleString('vi-VN')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {conversations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">📭 No conversations yet</p>
          <p>Conversations will appear here when users message your bot</p>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Testing Script

```typescript
// scripts/test-omnichannel.ts

import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';
const TOKEN = 'your-jwt-token';

async function testFacebookWebhook() {
  console.log('🧪 Testing Facebook webhook...');

  const payload = {
    object: 'page',
    entry: [
      {
        id: 'page-123',
        messaging: [
          {
            sender: { id: 'user-123' },
            recipient: { id: 'page-123' },
            timestamp: Date.now(),
            message: {
              mid: 'msg-123',
              text: 'Hello, I need help!',
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await axios.post(`${API_URL}/webhooks/facebook`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': 'sha256=test', // In production, calculate real signature
      },
    });

    console.log('✅ Facebook webhook response:', response.data);
  } catch (error) {
    console.error('❌ Facebook webhook error:', error.response?.data || error.message);
  }
}

async function testTelegramWebhook() {
  console.log('🧪 Testing Telegram webhook...');

  const payload = {
    update_id: 123456,
    message: {
      message_id: 1,
      from: {
        id: 987654321,
        first_name: 'John',
        username: 'john_doe',
      },
      chat: {
        id: 987654321,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: 'Hello bot!',
    },
  };

  try {
    const response = await axios.post(`${API_URL}/webhooks/telegram`, payload);
    console.log('✅ Telegram webhook response:', response.data);
  } catch (error) {
    console.error('❌ Telegram webhook error:', error.response?.data || error.message);
  }
}

async function testGetConversations() {
  console.log('🧪 Testing get conversations...');

  try {
    const response = await axios.get(`${API_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log('✅ Conversations:', response.data);
  } catch (error) {
    console.error('❌ Get conversations error:', error.response?.data || error.message);
  }
}

async function runTests() {
  await testFacebookWebhook();
  await testTelegramWebhook();
  await testGetConversations();
}

runTests();
```

---

## Kết Luận

Với các ví dụ trên, bạn có thể:

1. ✅ Kết nối Facebook Messenger và nhận tin nhắn
2. ✅ Kết nối Telegram và nhận tin nhắn
3. ✅ Xử lý tin nhắn thống nhất qua Bot Execution Service
4. ✅ Tích hợp RAG để trả lời dựa trên Knowledge Base
5. ✅ Hiển thị conversations trong dashboard
6. ✅ Test các webhook endpoints

**Next Steps:**
- Deploy backend lên server public (để nhận webhook)
- Cấu hình webhook URLs trong Facebook/Telegram
- Test với real users
- Monitor logs và conversations
