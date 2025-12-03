# 🎨 Widget Appearance & Version Integration

## ❌ Vấn đề hiện tại

### Appearance settings đang ở 2 nơi:

1. **Bot Entity** (Global - Cũ):
```typescript
bot.primaryColor
bot.widgetPosition
bot.widgetButtonSize
bot.welcomeMessage
bot.placeholderText
bot.showAvatar
bot.showTimestamp
```

2. **Widget Version Config** (Per Version - Mới):
```typescript
widgetVersion.config.theme.primaryColor
widgetVersion.config.theme.position
widgetVersion.config.theme.buttonSize
widgetVersion.config.messages.welcome
widgetVersion.config.messages.placeholder
widgetVersion.config.theme.showAvatar
widgetVersion.config.theme.showTimestamp
```

### Vấn đề:
- ❌ Duplicate data
- ❌ Không biết dùng source nào
- ❌ Update ở 1 nơi không sync với nơi kia
- ❌ Không rollback được appearance
- ❌ Không A/B test được appearance

---

## ✅ Giải pháp: Appearance thuộc về Version

### Nguyên tắc:
> **Mọi thứ liên quan đến widget phải thuộc về Widget Version, không phải Bot**

### Lý do:
1. **Rollback**: Khi rollback version, appearance cũng phải rollback theo
2. **A/B Testing**: Test version A với màu xanh vs version B với màu đỏ
3. **History**: Biết được version 1.0.0 dùng màu gì, version 1.0.1 dùng màu gì
4. **Consistency**: 1 version = 1 snapshot hoàn chỉnh (config + appearance)

---

## 🔄 Migration Plan

### Phase 1: Migrate Bot fields → Widget Version config

#### Step 1: Update Widget Version Config Structure

```typescript
// widget-version.entity.ts
config: {
  theme: {
    primaryColor: string;           // ← Từ bot.primaryColor
    position: string;                // ← Từ bot.widgetPosition
    buttonSize: string;              // ← Từ bot.widgetButtonSize
    showAvatar: boolean;             // ← Từ bot.showAvatar
    showTimestamp: boolean;          // ← Từ bot.showTimestamp
  };
  messages: {
    welcome: string;                 // ← Từ bot.welcomeMessage
    placeholder: string;             // ← Từ bot.placeholderText
    offline: string;
    errorMessage: string;
  };
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;
    greetingDelay: number;
  };
  features: {
    fileUpload: boolean;
    voiceInput: boolean;
    markdown: boolean;
    quickReplies: boolean;
  };
  branding: {
    showPoweredBy: boolean;
  };
  security: {
    allowedOrigins: string[];        // ← Từ bot.allowedOrigins
    rateLimit?: {
      maxRequests: number;
      windowMs: number;
    };
  };
}
```

#### Step 2: Create Migration Script

```typescript
// apps/backend/src/database/migrations/1733300000000-MigrateAppearanceToVersion.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateAppearanceToVersion1733300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing widget_versions với data từ bot
    await queryRunner.query(`
      UPDATE widget_version wv
      SET config = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    wv.config,
                    '{theme,primaryColor}',
                    to_jsonb(COALESCE(b.primary_color, '#667eea'))
                  ),
                  '{theme,position}',
                  to_jsonb(COALESCE(b.widget_position, 'bottom-right'))
                ),
                '{theme,buttonSize}',
                to_jsonb(COALESCE(b.widget_button_size, 'medium'))
              ),
              '{theme,showAvatar}',
              to_jsonb(COALESCE(b.show_avatar, true))
            ),
            '{theme,showTimestamp}',
            to_jsonb(COALESCE(b.show_timestamp, true))
          ),
          '{messages,welcome}',
          to_jsonb(COALESCE(b.welcome_message, 'Xin chào! Tôi có thể giúp gì cho bạn?'))
        ),
        '{messages,placeholder}',
        to_jsonb(COALESCE(b.placeholder_text, 'Nhập tin nhắn...'))
      )
      FROM bot b
      WHERE wv.bot_id = b.id;
    `);

    // Update security.allowedOrigins
    await queryRunner.query(`
      UPDATE widget_version wv
      SET config = jsonb_set(
        wv.config,
        '{security,allowedOrigins}',
        COALESCE(b.allowed_origins, '["*"]'::jsonb)
      )
      FROM bot b
      WHERE wv.bot_id = b.id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Copy data từ widget_version về bot
    await queryRunner.query(`
      UPDATE bot b
      SET 
        primary_color = wv.config->'theme'->>'primaryColor',
        widget_position = wv.config->'theme'->>'position',
        widget_button_size = wv.config->'theme'->>'buttonSize',
        show_avatar = (wv.config->'theme'->>'showAvatar')::boolean,
        show_timestamp = (wv.config->'theme'->>'showTimestamp')::boolean,
        welcome_message = wv.config->'messages'->>'welcome',
        placeholder_text = wv.config->'messages'->>'placeholder'
      FROM widget_version wv
      WHERE b.id = wv.bot_id AND wv.is_active = true;
    `);
  }
}
```

#### Step 3: Update Public Bot Service

**Trước (Cũ):**
```typescript
// public-bot.service.ts
theme: {
  primaryColor: bot.primaryColor || activeVersion.config.theme?.primaryColor || '#667eea',
  position: bot.widgetPosition || activeVersion.config.theme?.position || 'bottom-right',
  buttonSize: bot.widgetButtonSize || activeVersion.config.theme?.buttonSize || 'medium',
  showAvatar: bot.showAvatar ?? activeVersion.config.theme?.showAvatar ?? true,
  showTimestamp: bot.showTimestamp ?? activeVersion.config.theme?.showTimestamp ?? true,
}
```

**Sau (Mới):**
```typescript
// public-bot.service.ts
theme: {
  primaryColor: activeVersion.config.theme?.primaryColor || '#667eea',
  position: activeVersion.config.theme?.position || 'bottom-right',
  buttonSize: activeVersion.config.theme?.buttonSize || 'medium',
  showAvatar: activeVersion.config.theme?.showAvatar ?? true,
  showTimestamp: activeVersion.config.theme?.showTimestamp ?? true,
}
```

**Chỉ đọc từ `activeVersion.config`, không đọc từ `bot` nữa!**

#### Step 4: Update Bot Service (Create/Update Bot)

**Khi tạo bot mới:**
```typescript
// bot.service.ts - create()
async create(createBotDto: CreateBotDto) {
  // 1. Create bot (không lưu appearance fields)
  const bot = await this.botRepository.create({
    name: createBotDto.name,
    description: createBotDto.description,
    workspaceId: createBotDto.workspaceId,
    // Không lưu primaryColor, widgetPosition, etc.
  });

  // 2. Create default widget version với appearance settings
  await this.widgetVersionService.create(bot.id, {
    version: '1.0.0',
    config: {
      theme: {
        primaryColor: createBotDto.primaryColor || '#667eea',
        position: createBotDto.widgetPosition || 'bottom-right',
        buttonSize: createBotDto.widgetButtonSize || 'medium',
        showAvatar: createBotDto.showAvatar ?? true,
        showTimestamp: createBotDto.showTimestamp ?? true,
      },
      messages: {
        welcome: createBotDto.welcomeMessage || 'Xin chào!',
        placeholder: createBotDto.placeholderText || 'Nhập tin nhắn...',
        offline: 'Chúng tôi hiện không trực tuyến',
        errorMessage: 'Đã có lỗi xảy ra',
      },
      behavior: {
        autoOpen: false,
        autoOpenDelay: 3000,
        greetingDelay: 1000,
      },
      features: {
        fileUpload: true,
        voiceInput: false,
        markdown: true,
        quickReplies: true,
      },
      branding: {
        showPoweredBy: true,
      },
      security: {
        allowedOrigins: createBotDto.allowedOrigins || ['*'],
      },
    },
    changelog: 'Initial version',
  });

  // 3. Publish version 1.0.0
  await this.widgetVersionService.publish(bot.id, version.id);

  return bot;
}
```

**Khi update appearance:**
```typescript
// bot.service.ts - updateAppearance()
async updateAppearance(botId: string, updateDto: UpdateBotAppearanceDto) {
  // Không update bot entity nữa!
  // Thay vào đó, update active widget version

  const activeVersion = await this.widgetVersionService.getActiveVersion(botId);
  
  if (!activeVersion) {
    throw new NotFoundException('No active widget version found');
  }

  // Update config của active version
  await this.widgetVersionService.update(botId, activeVersion.id, {
    config: {
      ...activeVersion.config,
      theme: {
        ...activeVersion.config.theme,
        primaryColor: updateDto.primaryColor,
        position: updateDto.position,
        buttonSize: updateDto.buttonSize,
        showAvatar: updateDto.showAvatar,
        showTimestamp: updateDto.showTimestamp,
      },
      messages: {
        ...activeVersion.config.messages,
        welcome: updateDto.welcomeMessage,
        placeholder: updateDto.placeholderText,
      },
    },
  });

  return { success: true };
}
```

#### Step 5: Deprecate Bot Appearance Fields

**Option A: Soft deprecation (Recommended)**
```typescript
// bot.entity.ts
@Column({ name: 'primary_color', type: String, nullable: true })
@Deprecated('Use widgetVersion.config.theme.primaryColor instead')
primaryColor?: string | null;

@Column({ name: 'widget_position', type: String, nullable: true })
@Deprecated('Use widgetVersion.config.theme.position instead')
widgetPosition?: string | null;

// ... other fields
```

**Option B: Hard removal (Future)**
```sql
-- Migration to drop columns (sau khi đã migrate xong)
ALTER TABLE bot DROP COLUMN primary_color;
ALTER TABLE bot DROP COLUMN widget_position;
ALTER TABLE bot DROP COLUMN widget_button_size;
ALTER TABLE bot DROP COLUMN show_avatar;
ALTER TABLE bot DROP COLUMN show_timestamp;
ALTER TABLE bot DROP COLUMN welcome_message;
ALTER TABLE bot DROP COLUMN placeholder_text;
```

---

## 🎨 Dashboard UI Changes

### Widget Appearance Settings Page

**Trước:**
```
PATCH /api/v1/bots/:botId
{
  primaryColor: "#FF5733",
  widgetPosition: "bottom-left"
}
```

**Sau:**
```
PATCH /api/v1/bots/:botId/widget/versions/:versionId
{
  config: {
    theme: {
      primaryColor: "#FF5733",
      position: "bottom-left"
    }
  }
}
```

### UI Flow:

```
User vào: /bots/:botId/widget/appearance
  ↓
Load active widget version
  ↓
Display appearance settings từ activeVersion.config
  ↓
User thay đổi settings
  ↓
Click "Save"
  ↓
PATCH /api/v1/bots/:botId/widget/versions/:activeVersionId
  ↓
Update config của active version
  ↓
Success! Widget tự động dùng settings mới
```

### Important Note:

**Khi user update appearance, có 2 options:**

#### Option 1: Update active version trực tiếp (Simple)
```typescript
// Update config của version đang active
await widgetVersionService.update(botId, activeVersionId, {
  config: { theme: { primaryColor: '#FF5733' } }
});
```
**Pros:** Đơn giản, nhanh
**Cons:** Mất history, không rollback được appearance changes

#### Option 2: Create new version (Recommended)
```typescript
// Tạo version mới với appearance mới
const newVersion = await widgetVersionService.create(botId, {
  version: '1.0.1',
  config: {
    ...activeVersion.config,
    theme: {
      ...activeVersion.config.theme,
      primaryColor: '#FF5733'
    }
  },
  changelog: 'Updated primary color to #FF5733'
});

// Publish version mới
await widgetVersionService.publish(botId, newVersion.id);
```
**Pros:** Full history, có thể rollback
**Cons:** Phức tạp hơn, nhiều versions hơn

**Recommendation:** Dùng Option 2 cho production!

---

## 🔄 Rollback Behavior

### Scenario: Rollback version cũ

```
Version 1.0.0:
  - Primary Color: #667eea (blue)
  - Position: bottom-right
  - Welcome: "Hello!"

Version 1.0.1 (Active):
  - Primary Color: #FF5733 (red)
  - Position: bottom-left
  - Welcome: "Hi there!"

User clicks "Rollback to 1.0.0"
  ↓
Deactivate 1.0.1, Activate 1.0.0
  ↓
Widget tự động dùng:
  - Primary Color: #667eea (blue) ← Rollback!
  - Position: bottom-right ← Rollback!
  - Welcome: "Hello!" ← Rollback!
```

**Appearance cũng rollback theo version! 🎉**

---

## 📊 API Changes Summary

### Deprecated APIs (Không dùng nữa):

```typescript
// ❌ Không update bot appearance trực tiếp
PATCH /api/v1/bots/:botId
{
  primaryColor: "#FF5733",
  widgetPosition: "bottom-left"
}
```

### New APIs (Dùng thay thế):

```typescript
// ✅ Update active version config
PATCH /api/v1/bots/:botId/widget/versions/:versionId
{
  config: {
    theme: {
      primaryColor: "#FF5733",
      position: "bottom-left"
    }
  }
}

// ✅ Hoặc tạo version mới (Recommended)
POST /api/v1/bots/:botId/widget/versions
{
  version: "1.0.1",
  config: {
    theme: { primaryColor: "#FF5733" }
  },
  changelog: "Updated primary color"
}

POST /api/v1/bots/:botId/widget/versions/:versionId/publish
```

---

## ✅ Benefits

### 1. Consistency
- Appearance là part của version
- 1 version = 1 complete snapshot

### 2. Rollback
- Rollback version → rollback appearance
- Không cần rollback riêng appearance

### 3. History
- Biết version 1.0.0 dùng màu gì
- Track appearance changes qua versions

### 4. A/B Testing
- Version A: Blue theme
- Version B: Red theme
- Compare conversion rates

### 5. Canary Deployment
- Deploy new appearance cho 10% users
- Monitor feedback
- Rollback nếu users không thích

---

## 🚀 Implementation Checklist

### Backend:
- [ ] Create migration script to copy bot appearance → widget_version.config
- [ ] Update PublicBotService to read from version.config only
- [ ] Update BotService.create() to create default version with appearance
- [ ] Update BotService.updateAppearance() to update active version
- [ ] Add @Deprecated decorator to bot appearance fields
- [ ] Update DTOs and validation
- [ ] Update tests

### Frontend:
- [ ] Update widget-appearance-settings.tsx to use version API
- [ ] Update widget page to load active version
- [ ] Add version selector (optional)
- [ ] Update save handler to update version config
- [ ] Add "Create new version" option when updating appearance
- [ ] Update tests

### Documentation:
- [ ] Update WIDGET_APPEARANCE_CUSTOMIZATION.md
- [ ] Update WIDGET_VERSIONING_ARCHITECTURE.md
- [ ] Update API documentation
- [ ] Update migration guide

### Testing:
- [ ] Test migration script
- [ ] Test appearance update flow
- [ ] Test rollback behavior
- [ ] Test A/B testing (future)
- [ ] Test widget rendering with version config

---

## 📝 Migration Timeline

### Week 1: Backend Migration
- Day 1-2: Create migration script
- Day 3-4: Update services and controllers
- Day 5: Testing and bug fixes

### Week 2: Frontend Migration
- Day 1-2: Update dashboard UI
- Day 3-4: Update widget rendering
- Day 5: Testing and bug fixes

### Week 3: Deprecation
- Day 1-2: Add deprecation warnings
- Day 3-4: Update documentation
- Day 5: Final testing

### Week 4: Cleanup (Optional)
- Day 1-2: Remove deprecated fields
- Day 3-4: Final migration
- Day 5: Production deployment

---

**Đây là cách đúng để integrate Appearance với Versioning! 🎨🔄**
