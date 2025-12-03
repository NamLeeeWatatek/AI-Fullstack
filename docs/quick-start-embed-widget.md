# 🚀 WataOmi - Quick Start: Embed Widget Implementation

## Tóm tắt

Để khách hàng có thể nhúng bot vào website, bạn cần implement 3 phần chính:

1. **Backend**: Public API endpoints (không cần authentication)
2. **Widget**: Standalone JavaScript file
3. **Dashboard**: UI để khách hàng lấy embed code

---

## ⚡ Implementation Checklist

### Phase 1: Backend API (2-3 ngày)

- [ ] **1.1 Tạo Public Bot Controller**
  - File: `apps/backend/src/bots/controllers/public-bot.controller.ts`
  - Endpoints:
    - `GET /api/v1/public/bots/:botId/config`
    - `POST /api/v1/public/bots/:botId/conversations`
    - `POST /api/v1/public/bots/conversations/:id/messages`
    - `GET /api/v1/public/bots/conversations/:id/messages`

- [ ] **1.2 Tạo Public Bot Service**
  - File: `apps/backend/src/bots/services/public-bot.service.ts`
  - Logic: Xử lý chat, RAG, CORS validation

- [ ] **1.3 Tạo DTOs**
  - File: `apps/backend/src/bots/dto/public-bot.dto.ts`
  - DTOs: `CreatePublicConversationDto`, `AddPublicMessageDto`

- [ ] **1.4 Cập nhật Bot Entity**
  - Thêm fields: `allowedOrigins`, `welcomeMessage`, `placeholderText`, `primaryColor`, `widgetPosition`, etc.
  - Migration: `npm run migration:generate -- src/database/migrations/AddWidgetSettings`

- [ ] **1.5 Enable CORS**
  - File: `apps/backend/src/main.ts`
  - Allow all origins cho public API

### Phase 2: Widget JavaScript (2-3 ngày)

- [ ] **2.1 Tạo Widget Script**
  - File: `apps/web/public/widget/wataomi-widget.js`
  - Features:
    - Auto-init từ script tag
    - Fetch bot config
    - Create conversation
    - Send/receive messages
    - LocalStorage persistence
    - Responsive UI

- [ ] **2.2 Build & Minify**
  - Tool: esbuild
  - Output: `widget.min.js`

- [ ] **2.3 Upload to CDN**
  - CDN: AWS CloudFront / Cloudflare
  - URL: `https://cdn.wataomi.com/widget.js`

### Phase 3: Dashboard UI (2 ngày)

- [ ] **3.1 Widget Settings Page**
  - File: `apps/web/app/(dashboard)/bots/[id]/widget/page.tsx`
  - Features:
    - Appearance settings (color, position, size)
    - Messages customization
    - Security (allowed origins)
    - Embed code generator
    - Preview

- [ ] **3.2 Navigation**
  - Thêm "Widget" tab vào bot detail page

### Phase 4: Testing (1 ngày)

- [ ] **4.1 Test Public API**
  - Postman/Insomnia collection
  - Test all endpoints

- [ ] **4.2 Test Widget**
  - Tạo test HTML file
  - Test trên nhiều browsers
  - Test responsive

- [ ] **4.3 Test CORS**
  - Test từ different origins
  - Test allowed/blocked origins

---

## 📝 Step-by-Step Implementation

### Step 1: Database Migration

```bash
cd apps/backend

# Generate migration
npm run migration:generate -- src/database/migrations/AddWidgetSettings

# Run migration
npm run migration:run
```

**Migration content**:
```typescript
export class AddWidgetSettings1733155200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bot" 
      ADD COLUMN "allowed_origins" jsonb DEFAULT '["*"]',
      ADD COLUMN "welcome_message" varchar,
      ADD COLUMN "placeholder_text" varchar,
      ADD COLUMN "primary_color" varchar DEFAULT '#3B82F6',
      ADD COLUMN "widget_position" varchar DEFAULT 'bottom-right',
      ADD COLUMN "widget_button_size" varchar DEFAULT 'medium',
      ADD COLUMN "show_avatar" boolean DEFAULT true,
      ADD COLUMN "show_timestamp" boolean DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bot" 
      DROP COLUMN "allowed_origins",
      DROP COLUMN "welcome_message",
      DROP COLUMN "placeholder_text",
      DROP COLUMN "primary_color",
      DROP COLUMN "widget_position",
      DROP COLUMN "widget_button_size",
      DROP COLUMN "show_avatar",
      DROP COLUMN "show_timestamp"
    `);
  }
}
```

### Step 2: Create Public API

**File structure**:
```
apps/backend/src/bots/
├── controllers/
│   ├── bots.controller.ts (existing)
│   └── public-bot.controller.ts (NEW)
├── services/
│   ├── bots.service.ts (existing)
│   └── public-bot.service.ts (NEW)
└── dto/
    ├── create-bot.dto.ts (existing)
    └── public-bot.dto.ts (NEW)
```

**Register in module**:
```typescript
// apps/backend/src/bots/bots.module.ts
import { PublicBotController } from './controllers/public-bot.controller';
import { PublicBotService } from './services/public-bot.service';

@Module({
  controllers: [BotsController, PublicBotController],
  providers: [BotsService, PublicBotService],
  // ...
})
export class BotsModule {}
```

### Step 3: Create Widget

**Directory structure**:
```
apps/web/public/widget/
├── wataomi-widget.js (source)
├── widget.min.js (built)
└── README.md
```

**Build script** (add to `apps/web/package.json`):
```json
{
  "scripts": {
    "build:widget": "esbuild public/widget/wataomi-widget.js --bundle --minify --outfile=public/widget/widget.min.js"
  }
}
```

### Step 4: Create Dashboard UI

**Add route**:
```typescript
// apps/web/app/(dashboard)/bots/[id]/layout.tsx
import Link from 'next/link'

export default function BotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>
        <Link href={`/bots/${botId}`}>Overview</Link>
        <Link href={`/bots/${botId}/flows`}>Flows</Link>
        <Link href={`/bots/${botId}/knowledge-base`}>Knowledge Base</Link>
        <Link href={`/bots/${botId}/widget`}>Widget</Link> {/* NEW */}
      </nav>
      {children}
    </div>
  )
}
```

### Step 5: Test

**Test HTML** (`test-widget.html`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WataOmi Widget Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    h1 { color: #333; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <h1>WataOmi Widget Test Page</h1>
  <p>This is a test page to verify the WataOmi chatbot widget is working correctly.</p>
  <p>The widget should appear in the bottom-right corner of the page.</p>
  
  <h2>Instructions:</h2>
  <ol>
    <li>Look for the chat button in the bottom-right corner</li>
    <li>Click the button to open the chat window</li>
    <li>Type a message and press Enter or click Send</li>
    <li>Verify that the bot responds correctly</li>
  </ol>
  
  <!-- WataOmi Widget -->
  <script src="http://localhost:3000/widget/wataomi-widget.js" data-bot-id="YOUR_BOT_ID_HERE"></script>
</body>
</html>
```

**Test steps**:
1. Replace `YOUR_BOT_ID_HERE` with actual bot ID
2. Start backend: `cd apps/backend && npm run start:dev`
3. Start frontend: `cd apps/web && npm run dev`
4. Open `test-widget.html` in browser
5. Test chat functionality

---

## 🎯 Priority Features

### Must-Have (MVP)
1. ✅ Public API endpoints
2. ✅ Basic widget (chat interface)
3. ✅ Embed code generator
4. ✅ CORS protection

### Should-Have (v1.1)
1. ✅ Widget customization (colors, position)
2. ✅ Conversation persistence (localStorage)
3. ✅ Typing indicator
4. ✅ Welcome message

### Nice-to-Have (v1.2)
1. ⚠️ Widget analytics (views, interactions)
2. ⚠️ A/B testing
3. ⚠️ Custom CSS injection
4. ⚠️ Multi-language widget

---

## 🔧 Development Tips

### 1. CORS Issues
If you encounter CORS errors:
```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: (origin, callback) => {
    // Allow all origins for public API
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
});
```

### 2. Widget Not Loading
Check:
- Script src URL is correct
- Bot ID is valid
- Backend is running
- CORS is enabled
- Browser console for errors

### 3. Bot Not Responding
Check:
- Bot status is 'active'
- AI provider is configured
- Knowledge base is synced
- API endpoints are working

### 4. Testing Locally
Use ngrok to test on external domains:
```bash
# Terminal 1: Start backend
cd apps/backend && npm run start:dev

# Terminal 2: Start ngrok
ngrok http 3000

# Use ngrok URL in widget script
<script src="https://abc123.ngrok.io/widget/wataomi-widget.js" ...>
```

---

## 📊 Success Metrics

After implementation, track:
- ✅ Widget load time (<2s)
- ✅ First response time (<3s)
- ✅ Conversation completion rate (>60%)
- ✅ Customer satisfaction (>4/5)
- ✅ Error rate (<1%)

---

## 🚀 Next Steps

After basic widget is working:

1. **Analytics Dashboard**
   - Track widget views
   - Track conversations started
   - Track messages sent
   - Track conversion rate

2. **Advanced Features**
   - Proactive messages (trigger after X seconds)
   - Exit intent detection
   - Lead capture forms
   - File upload support
   - Voice input

3. **Integrations**
   - Google Analytics
   - Facebook Pixel
   - Segment
   - Mixpanel

4. **White-label**
   - Remove WataOmi branding
   - Custom domain (widget.customer.com)
   - Custom CSS

---

## 📞 Support

Nếu gặp vấn đề:
1. Check documentation: `/docs/embed-widget-implementation.md`
2. Check examples: `/apps/web/public/widget/examples/`
3. Check API docs: `http://localhost:3000/api/docs`

---

**Estimated Timeline**: 7-10 days
**Difficulty**: Medium
**Priority**: High (critical for customer acquisition)

Good luck! 🚀
