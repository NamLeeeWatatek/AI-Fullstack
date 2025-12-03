# ✅ Embed Widget Implementation - Progress Report

## 🎯 Mục tiêu
Cho phép khách hàng nhúng chatbot vào website của họ bằng 1 dòng code:
```html
<script src="https://cdn.wataomi.com/widget.js" data-bot-id="YOUR_BOT_ID"></script>
```

---

## ✅ ĐÃ HOÀN THÀNH (Backend)

### 1. Database Migration ✅
**File**: `apps/backend/src/database/migrations/1733155200000-AddWidgetSettings.ts`

**Thêm các fields mới vào bảng `bot`**:
- `allowed_origins` (jsonb): Danh sách origins được phép (CORS)
- `welcome_message` (varchar): Tin nhắn chào mừng
- `placeholder_text` (varchar): Placeholder cho input
- `primary_color` (varchar): Màu chủ đạo (#hex)
- `widget_position` (varchar): Vị trí widget (bottom-right, bottom-left, top-right, top-left)
- `widget_button_size` (varchar): Kích thước nút (small, medium, large)
- `show_avatar` (boolean): Hiển thị avatar
- `show_timestamp` (boolean): Hiển thị timestamp
- `widget_enabled` (boolean): Bật/tắt widget

**Chạy migration**:
```bash
cd apps/backend
npm run migration:run
```

### 2. Bot Entity Updated ✅
**File**: `apps/backend/src/bots/infrastructure/persistence/relational/entities/bot.entity.ts`

Đã thêm widget configuration fields vào BotEntity.

### 3. Bot Domain Model Updated ✅
**File**: `apps/backend/src/bots/domain/bot.ts`

Đã thêm widget properties với Swagger documentation đầy đủ.

### 4. Public Bot DTOs ✅
**File**: `apps/backend/src/bots/dto/public-bot.dto.ts`

**DTOs đã tạo**:
- `CreatePublicConversationDto`: Tạo conversation từ widget
- `AddPublicMessageDto`: Gửi message
- `BotConfigResponseDto`: Response bot config
- `CreateConversationResponseDto`: Response conversation created
- `MessageResponseDto`: Response message
- `ConversationMessagesResponseDto`: Response danh sách messages

### 5. Public Bot Service ✅
**File**: `apps/backend/src/bots/services/public-bot.service.ts`

**Methods đã implement**:
- `getBotConfig(botId, origin)`: Lấy config bot cho widget
- `createConversation(botId, dto, origin)`: Tạo conversation mới
- `sendMessage(conversationId, dto)`: Gửi message (placeholder - cần implement AI)
- `getMessages(conversationId)`: Lấy messages (placeholder - cần implement)
- `isOriginAllowed(allowedOrigins, origin)`: Validate CORS

**Features**:
- ✅ CORS validation
- ✅ Origin checking (exact match + wildcard)
- ✅ Bot status validation
- ✅ Widget enabled check
- ✅ Proper error handling

### 6. Public Bot Controller ✅
**File**: `apps/backend/src/bots/controllers/public-bot.controller.ts`

**Endpoints đã tạo**:
- `GET /api/v1/public/bots/:botId/config` - Lấy config bot
- `POST /api/v1/public/bots/:botId/conversations` - Tạo conversation
- `POST /api/v1/public/bots/conversations/:conversationId/messages` - Gửi message
- `GET /api/v1/public/bots/conversations/:conversationId/messages` - Lấy messages

**Features**:
- ✅ No authentication required
- ✅ Swagger documentation đầy đủ
- ✅ Proper HTTP status codes
- ✅ Error responses

### 7. Module Registration ✅
**File**: `apps/backend/src/bots/bots.module.ts`

Đã register:
- `PublicBotController` trong controllers
- `PublicBotService` trong providers và exports

---

## ⏳ CẦN LÀM TIẾP (Backend)

### 1. Implement AI Message Handling 🔴 QUAN TRỌNG
**File**: `apps/backend/src/bots/services/public-bot.service.ts`

**Hiện tại**: Method `sendMessage()` chỉ return placeholder response

**Cần làm**:
```typescript
async sendMessage(
  conversationId: string,
  dto: AddPublicMessageDto,
): Promise<MessageResponseDto> {
  // 1. Lấy conversation + bot
  const conversation = await this.conversationRepository.findOne({
    where: { id: conversationId },
    relations: ['bot'],
  });

  // 2. Lưu user message vào DB
  const userMessage = await this.messageRepository.save({
    conversationId,
    role: 'user',
    content: dto.message,
    metadata: dto.metadata,
  });

  // 3. Lấy conversation history
  const history = await this.messageRepository.find({
    where: { conversationId },
    order: { sentAt: 'ASC' },
    take: 10,
  });

  // 4. Query knowledge base (nếu có)
  let context = '';
  if (bot.knowledgeBaseIds?.length > 0) {
    const kbResults = await this.knowledgeBaseService.query({
      query: dto.message,
      knowledgeBaseId: bot.knowledgeBaseIds[0],
      limit: 3,
    });
    context = kbResults.results.map(r => r.content).join('\n\n');
  }

  // 5. Generate AI response
  const messages = [
    { role: 'system', content: bot.systemPrompt || 'You are a helpful assistant.' },
    ...(context ? [{ role: 'system', content: `Context:\n${context}` }] : []),
    ...history.map(m => ({ role: m.role, content: m.content })),
  ];

  const aiResponse = await this.aiProvidersService.chat(
    messages,
    bot.aiProvider || 'openai',
    {
      model: bot.aiModelName || 'gpt-4',
      temperature: bot.aiParameters?.temperature || 0.7,
    },
  );

  // 6. Lưu bot message vào DB
  const botMessage = await this.messageRepository.save({
    conversationId,
    role: 'assistant',
    content: aiResponse.content,
    metadata: {
      model: bot.aiModelName,
      tokensUsed: aiResponse.tokensUsed,
    },
  });

  return {
    messageId: botMessage.id,
    content: botMessage.content,
    role: 'assistant',
    timestamp: botMessage.sentAt,
    metadata: botMessage.metadata,
  };
}
```

**Dependencies cần inject**:
```typescript
constructor(
  @InjectRepository(BotEntity)
  private readonly botRepository: Repository<BotEntity>,
  @InjectRepository(ConversationEntity)
  private readonly conversationRepository: Repository<ConversationEntity>,
  @InjectRepository(MessageEntity)  // CẦN THÊM
  private readonly messageRepository: Repository<MessageEntity>,
  private readonly knowledgeBaseService: KnowledgeBaseService,  // CẦN THÊM
  private readonly aiProvidersService: AiProvidersService,  // CẦN THÊM
) {}
```

### 2. Implement Get Messages 🟡
**File**: `apps/backend/src/bots/services/public-bot.service.ts`

```typescript
async getMessages(
  conversationId: string,
): Promise<ConversationMessagesResponseDto> {
  const messages = await this.messageRepository.find({
    where: { conversationId },
    order: { sentAt: 'ASC' },
  });

  return {
    conversationId,
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.sentAt,
      metadata: m.metadata,
    })),
  };
}
```

### 3. Enable CORS 🔴 QUAN TRỌNG
**File**: `apps/backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for public API
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins for public API
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
  });

  // ... rest of bootstrap
}
```

### 4. Update Bot DTOs 🟡
**Files**: 
- `apps/backend/src/bots/dto/create-bot.dto.ts`
- `apps/backend/src/bots/dto/update-bot.dto.ts`

Thêm widget configuration fields vào DTOs để có thể update từ dashboard.

---

## ⏳ CẦN LÀM TIẾP (Frontend)

### 1. Widget JavaScript File 🔴 QUAN TRỌNG
**File**: `apps/web/public/widget/wataomi-widget.js`

Tạo standalone widget script (xem file `docs/embed-widget-implementation.md` để lấy code đầy đủ).

**Features cần có**:
- Auto-init từ script tag
- Fetch bot config từ API
- Create conversation
- Send/receive messages
- LocalStorage persistence
- Responsive UI
- Typing indicator

### 2. Widget Settings Page 🔴 QUAN TRỌNG
**File**: `apps/web/app/(dashboard)/bots/[id]/widget/page.tsx`

Tạo UI để khách hàng:
- Customize widget (màu sắc, vị trí, kích thước)
- Set welcome message, placeholder
- Configure allowed origins (CORS)
- Copy embed code
- Preview widget

### 3. Update Bot Types 🟡
**File**: `apps/web/lib/types/bots.ts`

Thêm widget configuration fields vào Bot type.

### 4. Update Bot API 🟡
**File**: `apps/web/lib/api/bots.ts`

Update `updateBot()` để support widget fields.

---

## 📝 TESTING CHECKLIST

### Backend API Testing
- [ ] Test `GET /api/v1/public/bots/:botId/config`
  - [ ] Bot exists và active
  - [ ] Bot không tồn tại
  - [ ] Widget disabled
  - [ ] Origin allowed
  - [ ] Origin not allowed

- [ ] Test `POST /api/v1/public/bots/:botId/conversations`
  - [ ] Create conversation thành công
  - [ ] Bot không tồn tại
  - [ ] Origin not allowed

- [ ] Test `POST /api/v1/public/bots/conversations/:id/messages`
  - [ ] Send message thành công
  - [ ] Conversation không tồn tại
  - [ ] Bot disabled

- [ ] Test `GET /api/v1/public/bots/conversations/:id/messages`
  - [ ] Get messages thành công
  - [ ] Conversation không tồn tại

### Widget Testing
- [ ] Widget loads correctly
- [ ] Widget displays at correct position
- [ ] Widget opens/closes smoothly
- [ ] Messages send successfully
- [ ] Bot responds correctly
- [ ] Conversation persists in localStorage
- [ ] Typing indicator works
- [ ] Responsive on mobile

### CORS Testing
- [ ] Widget works from allowed origin
- [ ] Widget blocked from disallowed origin
- [ ] Wildcard (*) allows all origins
- [ ] Subdomain wildcard works (*.example.com)

---

## 🚀 DEPLOYMENT STEPS

### 1. Run Migration
```bash
cd apps/backend
npm run migration:run
```

### 2. Update Existing Bots
```sql
-- Set default widget settings for existing bots
UPDATE bot 
SET 
  allowed_origins = '["*"]',
  welcome_message = 'Xin chào! Tôi có thể giúp gì cho bạn?',
  placeholder_text = 'Nhập tin nhắn...',
  primary_color = '#3B82F6',
  widget_position = 'bottom-right',
  widget_button_size = 'medium',
  show_avatar = true,
  show_timestamp = true,
  widget_enabled = true
WHERE widget_enabled IS NULL;
```

### 3. Build Widget
```bash
cd apps/web
npm run build:widget
```

### 4. Upload to CDN
Upload `widget.min.js` to CDN (AWS CloudFront, Cloudflare, etc.)

### 5. Update Environment Variables
```env
# .env
WIDGET_CDN_URL=https://cdn.wataomi.com
```

---

## 📊 PROGRESS SUMMARY

### Backend
- ✅ Database migration (100%)
- ✅ Entity updates (100%)
- ✅ DTOs (100%)
- ✅ Public API endpoints (100%)
- ⏳ AI message handling (0%)
- ⏳ Get messages implementation (0%)
- ⏳ CORS configuration (0%)

**Backend Progress**: 60% ✅

### Frontend
- ⏳ Widget JavaScript (0%)
- ⏳ Widget settings page (0%)
- ⏳ Type updates (0%)
- ⏳ API updates (0%)

**Frontend Progress**: 0% ⏳

### Overall Progress: 30% ✅

---

## 🎯 NEXT STEPS (Priority Order)

1. **🔴 HIGH**: Implement AI message handling trong `PublicBotService`
2. **🔴 HIGH**: Enable CORS trong `main.ts`
3. **🔴 HIGH**: Tạo widget JavaScript file
4. **🟡 MEDIUM**: Tạo widget settings page
5. **🟡 MEDIUM**: Implement get messages
6. **🟢 LOW**: Update bot DTOs
7. **🟢 LOW**: Testing & debugging

---

## 💡 TIPS

### Development
- Test public API với Postman/Insomnia trước
- Use ngrok để test widget từ external domain
- Check browser console cho CORS errors

### Production
- Set proper `allowed_origins` cho từng bot
- Monitor API usage
- Set rate limiting cho public endpoints
- Enable CDN caching cho widget.js

---

**Last Updated**: 2025-12-02  
**Status**: Backend 60% complete, Frontend 0% complete  
**Estimated Time to Complete**: 2-3 ngày
