# 🏗️ Widget Backend-Driven Architecture

## 🎯 Nguyên tắc thiết kế

### ❌ KHÔNG làm:
- Hardcode config trong widget JavaScript
- Lưu config trong localStorage
- Cho phép frontend tự customize

### ✅ PHẢI làm:
- **Backend là nguồn chân lý duy nhất**
- Widget chỉ là "dumb client" - nhận config từ API
- Mọi customization phải qua Dashboard → Backend → API → Widget

---

## 🔄 Luồng hoạt động HOÀN CHỈNH

### 1️⃣ **Admin tạo/config Bot (Dashboard)**

```
Admin login Dashboard
  ↓
Tạo Bot mới
  ↓
Config Bot (name, description, AI model, knowledge base...)
  ↓
Vào tab "Widget Settings"
  ↓
Customize widget:
  - Theme (color, position, size)
  - Behavior (auto-open, delay)
  - Messages (welcome, placeholder)
  - Security (allowed origins, rate limit)
  ↓
Click "Save" → POST /api/v1/bots/:botId/widget/config
  ↓
Backend lưu vào database (bot.widget_config JSONB)
  ↓
Backend generate embed code với botId
  ↓
Admin copy embed code
```

### 2️⃣ **Khách hàng nhúng Widget vào website**

```html
<!-- Khách chỉ cần botId, KHÔNG có config nào khác -->
<script 
    src="https://cdn.wataomi.com/widget-loader.js"
    data-bot-id="abc-123-xyz"
></script>
```

### 3️⃣ **Widget load và fetch config từ Backend**

```
User visit website
  ↓
widget-loader.js load (3KB)
  ↓
Parse data-bot-id từ script tag
  ↓
User click chat button
  ↓
widget-core.js load (15KB)
  ↓
Gọi API: GET /api/v1/public/bots/:botId/config
  ↓
Backend check:
  - Bot exists?
  - Bot status = active?
  - Widget enabled?
  - Origin allowed? (CORS check)
  ↓
Backend return FULL config:
  {
    botId, name, description, avatarUrl,
    theme: { primaryColor, position, buttonSize... },
    behavior: { autoOpen, autoOpenDelay... },
    messages: { welcome, placeholder, offline, error },
    features: { fileUpload, voiceInput, markdown... }
  }
  ↓
Widget render với config từ backend
  ↓
User chat → Widget gọi API send message
```

---

## 📊 Database Schema

### Table: `bot`

```sql
CREATE TABLE bot (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, archived
  
  -- AI Configuration
  ai_model_name VARCHAR(100),
  system_prompt TEXT,
  temperature DECIMAL(3,2),
  
  -- Knowledge Base
  knowledge_base_ids UUID[],
  
  -- Widget Configuration (JSONB - flexible)
  widget_enabled BOOLEAN DEFAULT false,
  widget_config JSONB DEFAULT '{}'::jsonb,
  
  -- Security
  allowed_origins TEXT[] DEFAULT ARRAY['*'],
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast widget config lookup
CREATE INDEX idx_bot_widget_enabled ON bot(id) WHERE widget_enabled = true;
```

### Widget Config Structure (JSONB)

```json
{
  "theme": {
    "primaryColor": "#667eea",
    "secondaryColor": "#764ba2",
    "position": "bottom-right",
    "buttonSize": "medium",
    "showAvatar": true,
    "showTimestamp": true,
    "customCSS": null
  },
  "behavior": {
    "autoOpen": false,
    "autoOpenDelay": 0,
    "showOnPages": [],
    "hideOnPages": [],
    "greetingDelay": 2,
    "soundEnabled": false
  },
  "messages": {
    "welcome": "Xin chào! Tôi có thể giúp gì cho bạn?",
    "placeholder": "Nhập tin nhắn...",
    "offline": "Chúng tôi hiện đang offline",
    "errorMessage": "Đã có lỗi xảy ra. Vui lòng thử lại.",
    "thankYou": "Cảm ơn bạn đã liên hệ!"
  },
  "features": {
    "fileUpload": false,
    "voiceInput": false,
    "markdown": true,
    "quickReplies": true,
    "typing": true,
    "readReceipts": false
  },
  "branding": {
    "showPoweredBy": true,
    "customLogo": null,
    "customFooter": null
  },
  "advanced": {
    "rateLimit": {
      "maxMessages": 100,
      "windowMs": 60000
    },
    "sessionTimeout": 3600000,
    "maxMessageLength": 2000
  }
}
```

---

## 🔌 Backend API Endpoints

### 1. Public Widget Config API (Cho widget gọi)

```typescript
// apps/backend/src/bots/controllers/public-bot.controller.ts

@Get(':botId/config')
@Public()
@ApiOperation({ summary: 'Get bot widget configuration' })
async getBotConfig(
  @Param('botId') botId: string,
  @Headers('origin') origin?: string,
): Promise<WidgetConfigResponseDto> {
  return this.publicBotService.getWidgetConfig(botId, origin);
}
```

**Response:**
```json
{
  "botId": "abc-123-xyz",
  "name": "Support Bot",
  "description": "24/7 AI Support",
  "avatarUrl": "https://cdn.wataomi.com/avatars/bot-123.png",
  "defaultLanguage": "vi",
  "timezone": "Asia/Ho_Chi_Minh",
  
  "theme": {
    "primaryColor": "#667eea",
    "position": "bottom-right",
    "buttonSize": "medium",
    "showAvatar": true,
    "showTimestamp": true
  },
  
  "behavior": {
    "autoOpen": false,
    "autoOpenDelay": 0,
    "greetingDelay": 2
  },
  
  "messages": {
    "welcome": "Xin chào! Tôi có thể giúp gì cho bạn?",
    "placeholder": "Nhập tin nhắn...",
    "offline": "Chúng tôi hiện đang offline",
    "errorMessage": "Đã có lỗi xảy ra. Vui lòng thử lại."
  },
  
  "features": {
    "fileUpload": false,
    "voiceInput": false,
    "markdown": true,
    "quickReplies": true
  },
  
  "branding": {
    "showPoweredBy": true
  }
}
```

### 2. Admin Widget Config API (Cho dashboard gọi)

```typescript
// apps/backend/src/bots/controllers/bot.controller.ts

@Get(':id/widget/config')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get widget configuration for admin' })
async getWidgetConfig(
  @Param('id') botId: string,
  @Request() req,
): Promise<WidgetConfigDto> {
  return this.botService.getWidgetConfig(botId, req.user.id);
}

@Patch(':id/widget/config')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Update widget configuration' })
async updateWidgetConfig(
  @Param('id') botId: string,
  @Body() dto: UpdateWidgetConfigDto,
  @Request() req,
): Promise<WidgetConfigDto> {
  return this.botService.updateWidgetConfig(botId, dto, req.user.id);
}

@Post(':id/widget/enable')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Enable widget' })
async enableWidget(
  @Param('id') botId: string,
  @Request() req,
): Promise<{ success: boolean }> {
  await this.botService.enableWidget(botId, req.user.id);
  return { success: true };
}

@Post(':id/widget/disable')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Disable widget' })
async disableWidget(
  @Param('id') botId: string,
  @Request() req,
): Promise<{ success: boolean }> {
  await this.botService.disableWidget(botId, req.user.id);
  return { success: true };
}

@Get(':id/widget/embed-code')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get embed code' })
async getEmbedCode(
  @Param('id') botId: string,
  @Request() req,
): Promise<{ embedCode: string }> {
  const embedCode = this.botService.generateEmbedCode(botId);
  return { embedCode };
}
```

---

## 🔧 Backend Service Implementation

```typescript
// apps/backend/src/bots/services/public-bot.service.ts

@Injectable()
export class PublicBotService {
  constructor(
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Get widget configuration (PUBLIC - no auth)
   * Cached for 5 minutes
   */
  async getWidgetConfig(
    botId: string,
    origin?: string,
  ): Promise<WidgetConfigResponseDto> {
    // Try cache first
    const cacheKey = `widget:config:${botId}`;
    const cached = await this.cacheManager.get<WidgetConfigResponseDto>(cacheKey);
    if (cached) {
      // Still need to validate origin
      this.validateOrigin(cached.allowedOrigins, origin);
      return cached;
    }

    // Fetch from database
    const bot = await this.botRepository.findOne({
      where: { 
        id: botId, 
        status: 'active',
        widgetEnabled: true 
      },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or widget is disabled');
    }

    // Validate origin (CORS)
    this.validateOrigin(bot.allowedOrigins, origin);

    // Build response
    const config: WidgetConfigResponseDto = {
      botId: bot.id,
      name: bot.name,
      description: bot.description,
      avatarUrl: bot.avatarUrl,
      defaultLanguage: bot.defaultLanguage || 'vi',
      timezone: bot.timezone || 'Asia/Ho_Chi_Minh',
      
      // Merge default config with custom config
      theme: {
        primaryColor: '#667eea',
        position: 'bottom-right',
        buttonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
        ...bot.widgetConfig?.theme,
      },
      
      behavior: {
        autoOpen: false,
        autoOpenDelay: 0,
        greetingDelay: 2,
        ...bot.widgetConfig?.behavior,
      },
      
      messages: {
        welcome: bot.welcomeMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?',
        placeholder: bot.placeholderText || 'Nhập tin nhắn...',
        offline: 'Chúng tôi hiện đang offline',
        errorMessage: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        ...bot.widgetConfig?.messages,
      },
      
      features: {
        fileUpload: false,
        voiceInput: false,
        markdown: true,
        quickReplies: true,
        ...bot.widgetConfig?.features,
      },
      
      branding: {
        showPoweredBy: true,
        ...bot.widgetConfig?.branding,
      },
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, config, 300);

    return config;
  }

  /**
   * Validate origin against allowed origins
   */
  private validateOrigin(allowedOrigins: string[], origin?: string): void {
    if (!origin) return; // Allow if no origin header

    // Allow all if * is in the list
    if (allowedOrigins.includes('*')) return;

    // Check exact match or wildcard match
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin === origin) return true;
      
      // Wildcard pattern: *.example.com
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.slice(2);
        return origin.endsWith(domain);
      }
      
      return false;
    });

    if (!isAllowed) {
      throw new ForbiddenException(
        `Origin ${origin} is not allowed. Please add it to allowed origins in bot settings.`
      );
    }
  }
}
```

```typescript
// apps/backend/src/bots/services/bot.service.ts

@Injectable()
export class BotService {
  constructor(
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Get widget config for admin (with full details)
   */
  async getWidgetConfig(botId: string, userId: string): Promise<WidgetConfigDto> {
    const bot = await this.findBotByIdAndUser(botId, userId);
    
    return {
      enabled: bot.widgetEnabled,
      config: bot.widgetConfig || this.getDefaultWidgetConfig(),
      allowedOrigins: bot.allowedOrigins || ['*'],
    };
  }

  /**
   * Update widget config
   */
  async updateWidgetConfig(
    botId: string,
    dto: UpdateWidgetConfigDto,
    userId: string,
  ): Promise<WidgetConfigDto> {
    const bot = await this.findBotByIdAndUser(botId, userId);

    // Validate config
    this.validateWidgetConfig(dto.config);

    // Update
    bot.widgetConfig = dto.config;
    if (dto.allowedOrigins) {
      bot.allowedOrigins = dto.allowedOrigins;
    }
    bot.updatedAt = new Date();

    await this.botRepository.save(bot);

    // Invalidate cache
    await this.cacheManager.del(`widget:config:${botId}`);

    return {
      enabled: bot.widgetEnabled,
      config: bot.widgetConfig,
      allowedOrigins: bot.allowedOrigins,
    };
  }

  /**
   * Enable widget
   */
  async enableWidget(botId: string, userId: string): Promise<void> {
    const bot = await this.findBotByIdAndUser(botId, userId);
    
    bot.widgetEnabled = true;
    bot.updatedAt = new Date();
    
    await this.botRepository.save(bot);
    await this.cacheManager.del(`widget:config:${botId}`);
  }

  /**
   * Disable widget
   */
  async disableWidget(botId: string, userId: string): Promise<void> {
    const bot = await this.findBotByIdAndUser(botId, userId);
    
    bot.widgetEnabled = false;
    bot.updatedAt = new Date();
    
    await this.botRepository.save(bot);
    await this.cacheManager.del(`widget:config:${botId}`);
  }

  /**
   * Generate embed code
   */
  generateEmbedCode(botId: string): string {
    return `<script 
    src="https://cdn.wataomi.com/widget-loader.js"
    data-bot-id="${botId}"
></script>`;
  }

  /**
   * Get default widget config
   */
  private getDefaultWidgetConfig(): any {
    return {
      theme: {
        primaryColor: '#667eea',
        position: 'bottom-right',
        buttonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
      },
      behavior: {
        autoOpen: false,
        autoOpenDelay: 0,
        greetingDelay: 2,
      },
      messages: {
        welcome: 'Xin chào! Tôi có thể giúp gì cho bạn?',
        placeholder: 'Nhập tin nhắn...',
        offline: 'Chúng tôi hiện đang offline',
        errorMessage: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      },
      features: {
        fileUpload: false,
        voiceInput: false,
        markdown: true,
        quickReplies: true,
      },
      branding: {
        showPoweredBy: true,
      },
    };
  }

  /**
   * Validate widget config
   */
  private validateWidgetConfig(config: any): void {
    // Validate color format
    if (config.theme?.primaryColor && !this.isValidColor(config.theme.primaryColor)) {
      throw new BadRequestException('Invalid primary color format');
    }

    // Validate position
    const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    if (config.theme?.position && !validPositions.includes(config.theme.position)) {
      throw new BadRequestException('Invalid position');
    }

    // Validate button size
    const validSizes = ['small', 'medium', 'large'];
    if (config.theme?.buttonSize && !validSizes.includes(config.theme.buttonSize)) {
      throw new BadRequestException('Invalid button size');
    }

    // Add more validations...
  }

  private isValidColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }
}
```

---

## 📝 DTOs

```typescript
// apps/backend/src/bots/dto/widget-config.dto.ts

export class WidgetConfigResponseDto {
  @ApiProperty()
  botId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  avatarUrl?: string;

  @ApiProperty()
  defaultLanguage: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  theme: {
    primaryColor: string;
    position: string;
    buttonSize: string;
    showAvatar: boolean;
    showTimestamp: boolean;
  };

  @ApiProperty()
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;
    greetingDelay: number;
  };

  @ApiProperty()
  messages: {
    welcome: string;
    placeholder: string;
    offline: string;
    errorMessage: string;
  };

  @ApiProperty()
  features: {
    fileUpload: boolean;
    voiceInput: boolean;
    markdown: boolean;
    quickReplies: boolean;
  };

  @ApiProperty()
  branding: {
    showPoweredBy: boolean;
  };
}

export class UpdateWidgetConfigDto {
  @ApiProperty()
  @IsObject()
  config: any;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  allowedOrigins?: string[];
}

export class WidgetConfigDto {
  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  config: any;

  @ApiProperty()
  allowedOrigins: string[];
}
```

---

## 🔄 Luồng Update Config

```
Admin thay đổi config trong Dashboard
  ↓
Frontend gọi: PATCH /api/v1/bots/:botId/widget/config
  ↓
Backend validate config
  ↓
Backend save vào database (bot.widget_config)
  ↓
Backend invalidate cache
  ↓
Backend return success
  ↓
Frontend show success message
  ↓
Widget trên customer website tự động nhận config mới
(sau khi cache expire hoặc reload page)
```

---

## 🎯 Ưu điểm của kiến trúc này

### ✅ Backend-Driven
- Config được quản lý tập trung ở backend
- Không hardcode gì ở frontend
- Dễ maintain và update

### ✅ Security
- Origin validation ở backend
- Rate limiting ở backend
- Không expose sensitive data

### ✅ Performance
- Cache config 5 phút (giảm DB load)
- Widget chỉ fetch config 1 lần khi load
- CDN cache cho static files

### ✅ Flexibility
- Admin có thể thay đổi config bất cứ lúc nào
- Không cần customer update embed code
- Support A/B testing (future)

### ✅ Scalability
- Cache layer giảm DB load
- CDN cho static files
- Horizontal scaling dễ dàng

---

## 📊 Sequence Diagram

```
Customer Website          Widget              Backend API           Database
      |                     |                      |                    |
      |--[Load Page]------->|                      |                    |
      |                     |                      |                    |
      |                     |--[GET /config]------>|                    |
      |                     |                      |--[Check Cache]---->|
      |                     |                      |                    |
      |                     |                      |<--[Cache Miss]-----|
      |                     |                      |                    |
      |                     |                      |--[Query Bot]------>|
      |                     |                      |<--[Bot Data]-------|
      |                     |                      |                    |
      |                     |                      |--[Validate Origin]>|
      |                     |                      |                    |
      |                     |                      |--[Build Config]--->|
      |                     |                      |                    |
      |                     |                      |--[Cache Config]--->|
      |                     |<--[Return Config]----|                    |
      |                     |                      |                    |
      |<--[Render Widget]---|                      |                    |
      |                     |                      |                    |
```

---

## ✅ Implementation Checklist

### Backend
- [ ] Add `widget_enabled` column to `bot` table
- [ ] Add `widget_config` JSONB column to `bot` table
- [ ] Add `allowed_origins` column to `bot` table
- [ ] Create migration
- [ ] Implement `PublicBotService.getWidgetConfig()`
- [ ] Implement `BotService.updateWidgetConfig()`
- [ ] Implement origin validation
- [ ] Implement caching (Redis)
- [ ] Add API endpoints
- [ ] Write tests

### Frontend (Widget)
- [x] Remove hardcoded config
- [ ] Fetch config from API on load
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Cache config in memory (not localStorage)

### Frontend (Dashboard)
- [ ] Create Widget Settings page
- [ ] Create config form
- [ ] Create live preview
- [ ] Create embed code generator
- [ ] Integrate with backend API

---

**Đây là kiến trúc backend-driven đúng chuẩn! 🚀**
