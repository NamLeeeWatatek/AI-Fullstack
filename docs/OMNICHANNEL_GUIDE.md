# Hướng Dẫn Tích Hợp Omnichannel - Kết Nối và Nhận Tin Nhắn

## Tổng Quan

Hệ thống WataOmi hỗ trợ **omnichannel messaging** - cho phép bot nhận và gửi tin nhắn qua nhiều kênh khác nhau:

- ✅ **Facebook Messenger**
- ✅ **Instagram Direct**
- ✅ **Telegram**
- ✅ **Web Widget** (Chatbox nhúng)
- ✅ **Omi** (Custom channel)
- 🔄 **Google Business Messages** (Đang phát triển)

---

## Kiến Trúc Omnichannel

### 1. Luồng Hoạt Động

```
┌─────────────┐
│  Facebook   │──┐
│  Messenger  │  │
└─────────────┘  │
                 │
┌─────────────┐  │    ┌──────────────┐    ┌──────────────┐    ┌─────────┐
│ Instagram   │──┼───▶│   Webhooks   │───▶│ Conversation │───▶│   Bot   │
│   Direct    │  │    │  Controller  │    │   Service    │    │ Engine  │
└─────────────┘  │    └──────────────┘    └──────────────┘    └─────────┘
                 │            │                    │                 │
┌─────────────┐  │            │                    │                 │
│  Telegram   │──┘            ▼                    ▼                 ▼
└─────────────┘        ┌──────────────┐    ┌──────────────┐  ┌──────────┐
                       │   Channel    │    │  Messages    │  │   RAG    │
┌─────────────┐        │   Strategy   │    │   Storage    │  │  Search  │
│ Web Widget  │───────▶│   Pattern    │    └──────────────┘  └──────────┘
└─────────────┘        └──────────────┘
```

### 2. Các Thành Phần Chính

#### a. **Webhooks Controller** (`webhooks.controller.ts`)
- Nhận tin nhắn từ các kênh
- Xác thực webhook signature
- Parse tin nhắn theo format của từng kênh
- Lưu vào Conversation

#### b. **Channel Strategy** (`channel.strategy.ts`)
- Pattern Strategy để quản lý nhiều providers
- Tự động chọn provider phù hợp
- Inject credentials từ database

#### c. **Channel Providers** (`providers/`)
- Mỗi kênh có 1 provider riêng
- Implement interface chung: `ChannelProvider`
- Xử lý gửi/nhận tin nhắn theo API của từng platform

#### d. **Channels Service** (`channels.service.ts`)
- Quản lý kết nối kênh
- Lưu trữ credentials
- CRUD operations cho channel connections

---

## Cách Kết Nối Các Kênh

### 1. Facebook Messenger

#### Bước 1: Tạo Facebook App

1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo app mới, chọn type: **Business**
3. Thêm sản phẩm: **Messenger**

#### Bước 2: Cấu Hình Webhook

1. Trong Messenger Settings, chọn **Webhooks**
2. Callback URL: `https://your-domain.com/api/v1/webhooks/facebook`
3. Verify Token: `wataomi_verify_token` (hoặc tùy chỉnh trong `.env`)
4. Subscribe to fields:
   - `messages`
   - `messaging_postbacks`
   - `messaging_optins`

#### Bước 3: Lấy Page Access Token

1. Trong Messenger Settings, chọn **Access Tokens**
2. Chọn Facebook Page bạn muốn kết nối
3. Copy **Page Access Token**

#### Bước 4: Lưu Credentials vào Hệ Thống

**API Request:**
```bash
POST /api/v1/channels
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Facebook Page - Customer Support",
  "type": "facebook",
  "accessToken": "EAAxxxxxxxxxxxxx",
  "metadata": {
    "pageId": "123456789",
    "pageName": "My Business Page"
  }
}
```

**Response:**
```json
{
  "id": "channel-123",
  "name": "Facebook Page - Customer Support",
  "type": "facebook",
  "status": "active",
  "connected_at": "2025-12-03T10:00:00Z"
}
```

#### Bước 5: Cấu Hình Backend (.env)

```bash
# Facebook App Credentials
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_VERIFY_TOKEN=wataomi_verify_token
```

#### Bước 6: Test Webhook

```bash
# Facebook sẽ gửi GET request để verify
GET /api/v1/webhooks/facebook?hub.mode=subscribe&hub.verify_token=wataomi_verify_token&hub.challenge=123456

# Response: 123456 (challenge value)
```

---

### 2. Instagram Direct

#### Bước 1: Kết Nối Instagram với Facebook Page

1. Trong Facebook Page Settings
2. Chọn **Instagram** → **Connect Account**
3. Đăng nhập Instagram Business Account

#### Bước 2: Cấu Hình Webhook (Giống Facebook)

1. Callback URL: `https://your-domain.com/api/v1/webhooks/instagram`
2. Subscribe to fields:
   - `messages`
   - `messaging_postbacks`

#### Bước 3: Lưu Credentials

```bash
POST /api/v1/channels
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Instagram - Customer Support",
  "type": "instagram",
  "accessToken": "EAAxxxxxxxxxxxxx",
  "metadata": {
    "igId": "instagram-user-id",
    "username": "@mybusiness"
  }
}
```

---

### 3. Telegram

#### Bước 1: Tạo Telegram Bot

1. Mở Telegram, tìm **@BotFather**
2. Gửi lệnh: `/newbot`
3. Đặt tên bot: `My Support Bot`
4. Đặt username: `@mysupport_bot`
5. Nhận **Bot Token**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

#### Bước 2: Cấu Hình Webhook

```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/v1/webhooks/telegram",
    "allowed_updates": ["message", "callback_query"]
  }'
```

#### Bước 3: Lưu Credentials

```bash
POST /api/v1/channels
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Telegram Support Bot",
  "type": "telegram",
  "metadata": {
    "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    "botUsername": "@mysupport_bot"
  }
}
```

#### Bước 4: Test Bot

1. Mở Telegram, tìm bot của bạn: `@mysupport_bot`
2. Gửi tin nhắn: `/start`
3. Bot sẽ nhận và xử lý tin nhắn

---

### 4. Web Widget (Chatbox Nhúng)

#### Bước 1: Tạo Bot

```bash
POST /api/v1/bots
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Website Support Bot",
  "description": "Bot hỗ trợ khách hàng trên website",
  "systemPrompt": "Bạn là trợ lý hỗ trợ khách hàng chuyên nghiệp",
  "aiModel": "gemini-2.0-flash"
}
```

#### Bước 2: Nhúng Script vào Website

```html
<!-- Thêm vào cuối thẻ <body> -->
<script src="https://your-domain.com/widget-loader.js"></script>
<script>
  WataBubble.init({
    botId: 'bot-123',
    apiUrl: 'https://api.your-domain.com',
    color: '#8B5CF6',
    position: 'right'
  });
</script>
```

#### Bước 3: Widget Tự Động Kết Nối

- Widget sẽ tự động tạo conversation
- Tin nhắn được gửi qua REST API (không qua webhook)
- Real-time updates qua WebSocket (optional)

---

## Cách Nhận và Xử Lý Tin Nhắn

### 1. Luồng Nhận Tin Nhắn

```typescript
// webhooks.controller.ts

@Post('facebook')
async handleFacebookWebhook(@Body() payload: any) {
  // 1. Verify signature
  const isValid = this.channelStrategy.verifyWebhook('facebook', payload, signature);
  
  // 2. Parse message
  const messaging = payload.entry[0].messaging[0];
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  // 3. Save to conversation
  const conversation = await this.conversationRepository.save({
    externalId: senderId,
    status: 'active',
    metadata: {
      channel: 'facebook',
      lastMessage: messageText
    }
  });
  
  // 4. Trigger bot execution
  await this.botExecutionService.processMessage({
    channel: 'facebook',
    senderId: senderId,
    message: messageText,
    conversationId: conversation.id
  });
  
  return { success: true };
}
```

### 2. Bot Execution Service

```typescript
// bot-execution.service.ts

async processMessage(input: {
  channel: string;
  senderId: string;
  message: string;
  conversationId: string;
}) {
  // 1. Find bot for this channel
  const bot = await this.findBotForChannel(input.channel);
  
  // 2. Get conversation history
  const history = await this.getConversationHistory(input.conversationId);
  
  // 3. Query Knowledge Base (RAG)
  const context = await this.knowledgeBaseService.query({
    query: input.message,
    botId: bot.id,
    limit: 5
  });
  
  // 4. Generate AI response
  const response = await this.aiService.chat({
    model: bot.aiModel,
    messages: [
      { role: 'system', content: bot.systemPrompt },
      ...history,
      { role: 'user', content: input.message }
    ],
    context: context.results
  });
  
  // 5. Send response back to channel
  await this.channelStrategy.sendMessage(input.channel, {
    to: input.senderId,
    content: response.content
  });
  
  // 6. Save bot response to conversation
  await this.saveMessage(input.conversationId, {
    role: 'assistant',
    content: response.content
  });
}
```

---

## Cách Gửi Tin Nhắn

### 1. Gửi Tin Nhắn Qua API

```bash
POST /api/v1/channels/send
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "channelType": "facebook",
  "recipientId": "facebook-user-id",
  "message": "Xin chào! Tôi có thể giúp gì cho bạn?"
}
```

### 2. Gửi Tin Nhắn Từ Code

```typescript
// Inject ChannelStrategy
constructor(private channelStrategy: ChannelStrategy) {}

// Send message
async sendReply(channel: string, recipientId: string, message: string) {
  const result = await this.channelStrategy.sendMessage(channel, {
    to: recipientId,
    content: message
  });
  
  if (!result.success) {
    console.error('Failed to send message:', result.error);
  }
}
```

### 3. Gửi Tin Nhắn Với Buttons (Telegram)

```typescript
await this.telegramService.sendMessageWithButtons(
  chatId,
  'Bạn muốn làm gì?',
  [
    { text: '📞 Liên hệ hỗ trợ', callback_data: 'contact_support' },
    { text: '📚 Xem tài liệu', callback_data: 'view_docs' }
  ]
);
```

---

## Quản Lý Conversations

### 1. Cấu Trúc Conversation

```typescript
interface Conversation {
  id: string;
  externalId: string;        // User ID từ channel (Facebook ID, Telegram Chat ID, etc.)
  status: 'active' | 'closed';
  metadata: {
    channel: string;         // 'facebook', 'telegram', 'instagram', 'web'
    customerName?: string;
    lastMessage: string;
    lastMessageAt: string;
    // Channel-specific data
    pageId?: string;         // Facebook
    chatId?: number;         // Telegram
    igId?: string;           // Instagram
  };
  messages: Message[];
}
```

### 2. Lấy Danh Sách Conversations

```bash
GET /api/v1/conversations?channel=facebook&status=active
Authorization: Bearer <your-jwt-token>
```

### 3. Lấy Chi Tiết Conversation

```bash
GET /api/v1/conversations/:id
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "id": "conv-123",
  "externalId": "facebook-user-123",
  "status": "active",
  "metadata": {
    "channel": "facebook",
    "customerName": "Nguyễn Văn A",
    "lastMessage": "Tôi cần hỗ trợ về sản phẩm",
    "lastMessageAt": "2025-12-03T10:30:00Z"
  },
  "messages": [
    {
      "role": "user",
      "content": "Xin chào",
      "timestamp": "2025-12-03T10:25:00Z"
    },
    {
      "role": "assistant",
      "content": "Xin chào! Tôi có thể giúp gì cho bạn?",
      "timestamp": "2025-12-03T10:25:05Z"
    }
  ]
}
```

---

## Testing & Debugging

### 1. Test Webhook Locally với ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start backend
npm run start:dev

# Expose local server
ngrok http 3000

# Use ngrok URL for webhook
# Example: https://abc123.ngrok.io/api/v1/webhooks/facebook
```

### 2. Test Facebook Webhook

```bash
# Send test message
curl -X POST "https://your-domain.com/api/v1/webhooks/facebook" \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=..." \
  -d '{
    "object": "page",
    "entry": [{
      "id": "page-id",
      "messaging": [{
        "sender": {"id": "user-123"},
        "recipient": {"id": "page-id"},
        "message": {
          "mid": "msg-123",
          "text": "Hello"
        }
      }]
    }]
  }'
```

### 3. Check Logs

```bash
# Backend logs
tail -f logs/app.log

# Filter by channel
tail -f logs/app.log | grep "Facebook"
tail -f logs/app.log | grep "Telegram"
```

---

## Best Practices

### 1. Security

✅ **Luôn verify webhook signature**
```typescript
const isValid = this.channelStrategy.verifyWebhook(channel, payload, signature);
if (!isValid) {
  return { success: false, error: 'Invalid signature' };
}
```

✅ **Lưu credentials an toàn**
- Không hardcode trong code
- Sử dụng environment variables
- Encrypt trong database

✅ **Rate limiting**
- Giới hạn số request từ mỗi user
- Tránh spam

### 2. Performance

✅ **Async processing**
```typescript
// Không chờ bot response trong webhook
await this.botExecutionService.processMessage(input);
return { success: true }; // Return ngay
```

✅ **Queue system** (Optional)
- Sử dụng Bull/BullMQ cho message queue
- Xử lý tin nhắn bất đồng bộ

### 3. Error Handling

✅ **Graceful degradation**
```typescript
try {
  await this.sendMessage(channel, message);
} catch (error) {
  // Log error
  this.logger.error(`Failed to send message: ${error.message}`);
  
  // Fallback: Save to retry queue
  await this.retryQueue.add({ channel, message });
}
```

---

## Troubleshooting

### Lỗi: "Invalid webhook signature"

**Nguyên nhân:** App Secret không đúng hoặc payload bị modify

**Giải pháp:**
1. Kiểm tra `FACEBOOK_APP_SECRET` trong `.env`
2. Đảm bảo không modify `req.body` trước khi verify
3. Sử dụng `express.json()` với `verify` option

### Lỗi: "Webhook verification failed"

**Nguyên nhân:** Verify token không khớp

**Giải pháp:**
1. Kiểm tra `FACEBOOK_VERIFY_TOKEN` trong `.env`
2. Đảm bảo token trong Facebook App Settings khớp với backend

### Lỗi: "No active connection found"

**Nguyên nhân:** Chưa tạo channel connection

**Giải pháp:**
```bash
POST /api/v1/channels
{
  "name": "My Channel",
  "type": "facebook",
  "accessToken": "..."
}
```

---

## Kết Luận

Hệ thống omnichannel của WataOmi cho phép:

✅ Nhận tin nhắn từ nhiều kênh (Facebook, Instagram, Telegram, Web)
✅ Xử lý thống nhất qua Conversation Service
✅ Bot tự động trả lời dựa trên Knowledge Base
✅ Gửi tin nhắn ngược lại user qua đúng kênh
✅ Quản lý credentials an toàn
✅ Dễ dàng mở rộng thêm kênh mới

**Next Steps:**
1. Kết nối kênh đầu tiên (Facebook hoặc Telegram)
2. Test nhận/gửi tin nhắn
3. Tích hợp bot với Knowledge Base
4. Monitor conversations trong dashboard
