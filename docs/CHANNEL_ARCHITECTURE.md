# Kiến Trúc Channel - Thiết Kế Chuẩn

## 🎯 Tổng Quan

Hệ thống channel được thiết kế theo **Strategy Pattern** với 3 layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  (Bots, Conversations, Business Logic)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CHANNEL LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Channel    │  │   Channel    │  │   Webhooks   │      │
│  │   Strategy   │  │   Service    │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PROVIDER LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Facebook │  │ Instagram│  │ Telegram │  │  Zalo    │   │
│  │ Provider │  │ Provider │  │ Provider │  │ Provider │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Channel          │  │ Channel          │                │
│  │ Connection       │  │ Credential       │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### 1. Channel Credential (Cấu hình App)

Lưu thông tin App/API credentials cho từng platform.

```typescript
interface ChannelCredential {
  id: string;                    // UUID
  provider: string;              // 'facebook', 'telegram', 'zalo', etc.
  workspaceId: string;           // Thuộc workspace nào
  name: string;                  // "Production Facebook App"
  clientId: string;              // App ID
  clientSecret: string;          // App Secret (encrypted)
  scopes: string;                // OAuth scopes
  isActive: boolean;             // Có đang dùng không
  metadata: {
    apiVersion?: string;         // v24.0
    webhookUrl?: string;         // Callback URL
    verifyToken?: string;        // Webhook verify token
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Ví dụ:**
```json
{
  "id": "cred-123",
  "provider": "facebook",
  "workspaceId": "workspace-456",
  "name": "Production Facebook App",
  "clientId": "852815350438940",
  "clientSecret": "encrypted_secret",
  "scopes": "pages_messaging,pages_manage_metadata",
  "isActive": true,
  "metadata": {
    "apiVersion": "v24.0",
    "webhookUrl": "https://api.yourdomain.com/webhooks/facebook",
    "verifyToken": "wataomi_verify_token_2025"
  }
}
```

### 2. Channel Connection (Kết nối cụ thể)

Lưu từng kết nối cụ thể (ví dụ: Facebook Page "Demo đa kênh").

```typescript
interface ChannelConnection {
  id: string;                    // UUID
  name: string;                  // "Demo đa kênh - Facebook"
  type: string;                  // 'facebook', 'telegram', 'zalo'
  credentialId: string;          // Link to ChannelCredential
  workspaceId: string;           // Thuộc workspace nào
  accessToken: string;           // Page/Bot Access Token (encrypted)
  refreshToken?: string;         // Refresh token (nếu có)
  expiresAt?: Date;              // Token expiry
  metadata: {
    pageId?: string;             // Facebook Page ID
    pageName?: string;           // Facebook Page Name
    botToken?: string;           // Telegram Bot Token
    phoneNumber?: string;        // Zalo OA Phone
    // Channel-specific data
  };
  status: string;                // 'active', 'expired', 'error'
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Ví dụ:**
```json
{
  "id": "conn-789",
  "name": "Demo đa kênh - Facebook",
  "type": "facebook",
  "credentialId": "cred-123",
  "workspaceId": "workspace-456",
  "accessToken": "EAAMHoYwFnBwBQ...",
  "expiresAt": "2025-06-01T00:00:00Z",
  "metadata": {
    "pageId": "939014215956208",
    "pageName": "Demo đa kênh",
    "category": "Dịch vụ mua sắm"
  },
  "status": "active",
  "connectedAt": "2025-12-03T10:00:00Z"
}
```

---

## 🏗️ Code Architecture

### 1. Channel Provider Interface

Tất cả providers phải implement interface này:

```typescript
// apps/backend/src/channels/interfaces/channel-provider.interface.ts

export interface ChannelProvider {
  readonly channelType: string;
  
  // Gửi tin nhắn
  sendMessage(message: ChannelMessage): Promise<ChannelMessageResponse>;
  
  // Verify webhook signature
  verifyWebhook(payload: any, signature: string): boolean;
  
  // Parse incoming message
  parseIncomingMessage(payload: any): IncomingMessage;
  
  // Set credentials dynamically
  setCredentials?(credentials: any): void;
}

export interface ChannelMessage {
  to: string;                    // Recipient ID
  content: string;               // Message text
  mediaUrl?: string;             // Media attachment
  buttons?: Button[];            // Quick replies/buttons
  metadata?: Record<string, any>;
}

export interface ChannelMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IncomingMessage {
  from: string;                  // Sender ID
  content: string;               // Message text
  timestamp: Date;
  channelType: string;
  conversationId?: string;       // External conversation ID
  metadata?: Record<string, any>;
}
```

### 2. Facebook Provider (Ví dụ)

```typescript
// apps/backend/src/channels/providers/facebook.provider.ts

@Injectable()
export class FacebookProvider implements ChannelProvider {
  readonly channelType = 'facebook';
  private pageAccessToken: string;
  private appSecret: string;
  private readonly apiVersion = 'v24.0';

  constructor(private configService: ConfigService) {
    // Load from env as default
    this.pageAccessToken = this.configService.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    this.appSecret = this.configService.get('FACEBOOK_APP_SECRET');
  }

  // Set credentials dynamically (from database)
  setCredentials(credentials: { pageAccessToken: string; appSecret: string }) {
    this.pageAccessToken = credentials.pageAccessToken;
    this.appSecret = credentials.appSecret;
  }

  async sendMessage(message: ChannelMessage): Promise<ChannelMessageResponse> {
    const url = `https://graph.facebook.com/${this.apiVersion}/me/messages`;
    
    const payload: any = {
      recipient: { id: message.to },
      message: { text: message.content },
    };

    // Add quick replies if provided
    if (message.buttons && message.buttons.length > 0) {
      payload.message.quick_replies = message.buttons.map(btn => ({
        content_type: 'text',
        title: btn.text,
        payload: btn.value,
      }));
    }

    try {
      const response = await axios.post(url, payload, {
        params: { access_token: this.pageAccessToken },
      });

      return {
        success: true,
        messageId: response.data.message_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  verifyWebhook(payload: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }

  parseIncomingMessage(payload: any): IncomingMessage {
    const entry = payload.entry?.[0];
    const messaging = entry?.messaging?.[0];

    return {
      from: messaging?.sender?.id || '',
      content: messaging?.message?.text || '',
      timestamp: new Date(messaging?.timestamp || Date.now()),
      channelType: this.channelType,
      conversationId: messaging?.sender?.id,
      metadata: {
        pageId: entry?.id,
        messageId: messaging?.message?.mid,
      },
    };
  }
}
```

### 3. Channel Strategy (Quản lý nhiều providers)

```typescript
// apps/backend/src/channels/channel.strategy.ts

@Injectable()
export class ChannelStrategy {
  private providers = new Map<string, ChannelProvider>();

  constructor(
    private channelsService: ChannelsService,
  ) {}

  // Register provider
  register(channelType: string, provider: ChannelProvider): void {
    this.providers.set(channelType, provider);
  }

  // Get provider
  getProvider(channelType: string): ChannelProvider {
    const provider = this.providers.get(channelType);
    if (!provider) {
      throw new Error(`Channel provider not found: ${channelType}`);
    }
    return provider;
  }

  // Send message (with auto credential injection)
  async sendMessage(
    channelType: string,
    message: ChannelMessage,
    workspaceId?: string,
  ): Promise<ChannelMessageResponse> {
    // 1. Get connection from database
    const connection = await this.channelsService.findByType(
      channelType,
      workspaceId,
    );

    if (!connection) {
      return {
        success: false,
        error: `No active connection found for ${channelType}`,
      };
    }

    // 2. Get provider
    const provider = this.getProvider(channelType);

    // 3. Inject credentials
    if ('setCredentials' in provider) {
      (provider as any).setCredentials({
        pageAccessToken: connection.accessToken,
        appSecret: connection.credential?.clientSecret,
      });
    }

    // 4. Send message
    return provider.sendMessage(message);
  }

  // Verify webhook
  verifyWebhook(channelType: string, payload: any, signature: string): boolean {
    const provider = this.getProvider(channelType);
    return provider.verifyWebhook(payload, signature);
  }

  // Parse incoming message
  parseIncomingMessage(channelType: string, payload: any): IncomingMessage {
    const provider = this.getProvider(channelType);
    return provider.parseIncomingMessage(payload);
  }
}
```

### 4. Channels Service (CRUD operations)

```typescript
// apps/backend/src/channels/channels.service.ts

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
    @InjectRepository(ChannelCredentialEntity)
    private credentialRepository: Repository<ChannelCredentialEntity>,
  ) {}

  // Tạo credential (App config)
  async createCredential(dto: CreateCredentialDto): Promise<ChannelCredentialEntity> {
    const credential = this.credentialRepository.create({
      ...dto,
      clientSecret: this.encrypt(dto.clientSecret), // Encrypt in production
    });
    return this.credentialRepository.save(credential);
  }

  // Tạo connection (Kết nối cụ thể)
  async createConnection(dto: CreateConnectionDto): Promise<ChannelConnectionEntity> {
    const connection = this.connectionRepository.create({
      ...dto,
      accessToken: this.encrypt(dto.accessToken), // Encrypt in production
      status: 'active',
      connectedAt: new Date(),
    });
    return this.connectionRepository.save(connection);
  }

  // Lấy connection theo type và workspace
  async findByType(
    type: string,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity | null> {
    const where: any = { type, status: 'active' };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    
    return this.connectionRepository.findOne({
      where,
      relations: ['credential'],
    });
  }

  // List all connections
  async findAll(workspaceId?: string): Promise<ChannelConnectionEntity[]> {
    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    
    return this.connectionRepository.find({
      where,
      relations: ['credential'],
      order: { connectedAt: 'DESC' },
    });
  }

  // Update connection status
  async updateStatus(id: string, status: string): Promise<void> {
    await this.connectionRepository.update(id, { status });
  }

  // Delete connection
  async delete(id: string, workspaceId?: string): Promise<void> {
    const where: any = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    await this.connectionRepository.delete(where);
  }

  private encrypt(text: string): string {
    // TODO: Implement encryption
    return text;
  }

  private decrypt(text: string): string {
    // TODO: Implement decryption
    return text;
  }
}
```

### 5. Webhooks Controller

```typescript
// apps/backend/src/channels/webhooks.controller.ts

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly channelStrategy: ChannelStrategy,
    private readonly conversationsService: ConversationsService,
    private readonly botExecutionService: BotExecutionService,
  ) {}

  // Generic webhook endpoint
  @Post(':channel')
  async handleWebhook(
    @Param('channel') channel: string,
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    try {
      // 1. Verify signature
      const isValid = this.channelStrategy.verifyWebhook(
        channel,
        payload,
        signature || '',
      );

      if (!isValid) {
        this.logger.error(`Invalid webhook signature for ${channel}`);
        return { success: false, error: 'Invalid signature' };
      }

      // 2. Parse message
      const incomingMessage = this.channelStrategy.parseIncomingMessage(
        channel,
        payload,
      );

      // 3. Process message
      await this.processIncomingMessage(incomingMessage);

      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook error for ${channel}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Facebook webhook verification
  @Get('facebook')
  verifyFacebookWebhook(@Query() query: any) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      this.logger.log('✅ Facebook webhook verified');
      return challenge;
    }

    this.logger.error('❌ Facebook webhook verification failed');
    return { success: false };
  }

  private async processIncomingMessage(message: IncomingMessage) {
    // 1. Find or create conversation
    let conversation = await this.conversationsService.findByExternalId(
      message.from,
      message.channelType,
    );

    if (!conversation) {
      conversation = await this.conversationsService.create({
        externalId: message.from,
        status: 'active',
        metadata: {
          channel: message.channelType,
          lastMessage: message.content,
          lastMessageAt: message.timestamp.toISOString(),
          ...message.metadata,
        },
      });
    }

    // 2. Save user message
    await this.conversationsService.addMessage(conversation.id, {
      role: 'user',
      content: message.content,
      timestamp: message.timestamp,
    });

    // 3. Execute bot
    const botResponse = await this.botExecutionService.processMessage({
      channel: message.channelType,
      senderId: message.from,
      message: message.content,
      conversationId: conversation.id,
      metadata: message.metadata,
    });

    // 4. Send response
    if (botResponse.success) {
      await this.channelStrategy.sendMessage(
        message.channelType,
        {
          to: message.from,
          content: botResponse.message,
          buttons: botResponse.suggestions?.map(s => ({
            text: s,
            value: s,
          })),
        },
      );

      // 5. Save bot message
      await this.conversationsService.addMessage(conversation.id, {
        role: 'assistant',
        content: botResponse.message,
        timestamp: new Date(),
      });
    }
  }
}
```

---

## 📝 API Endpoints

### Channel Credentials

```bash
# Tạo credential (App config)
POST /api/v1/channels/credentials
{
  "provider": "facebook",
  "name": "Production Facebook App",
  "clientId": "852815350438940",
  "clientSecret": "your-app-secret",
  "scopes": "pages_messaging",
  "metadata": {
    "apiVersion": "v24.0",
    "verifyToken": "wataomi_verify_token_2025"
  }
}

# List credentials
GET /api/v1/channels/credentials?provider=facebook

# Update credential
PATCH /api/v1/channels/credentials/:id

# Delete credential
DELETE /api/v1/channels/credentials/:id
```

### Channel Connections

```bash
# Tạo connection (Kết nối Page/Bot)
POST /api/v1/channels/connections
{
  "name": "Demo đa kênh - Facebook",
  "type": "facebook",
  "credentialId": "cred-123",
  "accessToken": "EAAMHoYwFnBwBQ...",
  "metadata": {
    "pageId": "939014215956208",
    "pageName": "Demo đa kênh"
  }
}

# List connections
GET /api/v1/channels/connections?type=facebook

# Get connection detail
GET /api/v1/channels/connections/:id

# Update connection
PATCH /api/v1/channels/connections/:id

# Delete connection
DELETE /api/v1/channels/connections/:id

# Test connection
POST /api/v1/channels/connections/:id/test
```

### Webhooks

```bash
# Generic webhook
POST /api/v1/webhooks/:channel

# Facebook webhook verification
GET /api/v1/webhooks/facebook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
```

---

## 🔐 Security Best Practices

### 1. Encrypt Sensitive Data

```typescript
import * as crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encrypted: string): string {
    const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 2. Validate Webhook Signatures

Luôn verify signature trước khi xử lý webhook.

### 3. Rate Limiting

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('webhooks')
export class WebhooksController {
  // ...
}
```

### 4. Environment Variables

```bash
# .env
ENCRYPTION_KEY=your-32-byte-hex-key
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_VERIFY_TOKEN=your-verify-token
```

---

## ✅ Checklist Triển Khai

- [ ] Tạo database tables (credentials, connections)
- [ ] Implement ChannelProvider interface cho từng platform
- [ ] Implement ChannelStrategy
- [ ] Implement ChannelsService (CRUD)
- [ ] Implement WebhooksController
- [ ] Implement encryption cho sensitive data
- [ ] Setup webhook URLs trong các platforms
- [ ] Test gửi/nhận tin nhắn
- [ ] Monitor logs và errors
- [ ] Setup alerting cho connection failures

---

## 🎯 Kết Luận

Kiến trúc này cho phép:

✅ **Dễ mở rộng**: Thêm channel mới chỉ cần implement ChannelProvider
✅ **Tách biệt concerns**: Provider, Service, Controller riêng biệt
✅ **Flexible credentials**: Hỗ trợ nhiều App configs và connections
✅ **Secure**: Encrypt sensitive data, verify webhooks
✅ **Maintainable**: Code rõ ràng, dễ debug
✅ **Testable**: Dễ dàng unit test từng component

Bạn có thể áp dụng pattern này cho tất cả các channels: Facebook, Instagram, Telegram, Zalo, WhatsApp, etc.
