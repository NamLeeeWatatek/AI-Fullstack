# Widget Appearance Customization

## ⚠️ IMPORTANT: Appearance Now Belongs to Widget Version

**As of version 1.0.0, appearance settings are now part of Widget Version, not Bot entity.**

This means:
- ✅ Appearance settings rollback with version
- ✅ Each version can have different appearance
- ✅ Full history tracking of appearance changes
- ✅ A/B testing different appearances

See [WIDGET_APPEARANCE_VERSION_REFACTOR.md](./WIDGET_APPEARANCE_VERSION_REFACTOR.md) for migration details.

## Overview

Widget appearance settings cho phép người dùng tùy chỉnh giao diện của chat widget (màu sắc, vị trí, kích thước, tin nhắn). Các settings này được lưu trong **Widget Version config**, không phải Bot entity.

## Features

### 1. **Primary Color**
- Màu chính cho widget button và tin nhắn của user
- Hỗ trợ color picker và nhập mã hex
- Mặc định: `#667eea`

### 2. **Widget Position**
- Vị trí hiển thị của widget button trên trang
- Options:
  - `bottom-right` (mặc định)
  - `bottom-left`
  - `top-right`
  - `top-left`

### 3. **Button Size**
- Kích thước của floating chat button
- Options:
  - `small` (48px)
  - `medium` (56px - mặc định)
  - `large` (64px)

### 4. **Welcome Message**
- Tin nhắn đầu tiên hiển thị khi widget mở
- Mặc định: "Xin chào! Tôi có thể giúp gì cho bạn?"

### 5. **Placeholder Text**
- Text hiển thị trong ô nhập tin nhắn
- Mặc định: "Nhập tin nhắn..."

## How It Works

### Frontend (Dashboard)

1. **Widget Appearance Settings Component**
   - Location: `apps/web/components/widget/widget-appearance-settings.tsx`
   - Features:
     - Live preview của widget button
     - Color picker
     - Dropdown selects cho position và size
     - Text inputs cho messages
     - Save button

2. **Widget Page**
   - Location: `apps/web/app/(dashboard)/bots/[id]/widget/page.tsx`
   - Tabs:
     - **Appearance** - Tùy chỉnh giao diện
     - **Embed Code** - Lấy code nhúng
     - **Versions** - Quản lý versions
     - **Deployment History** - Lịch sử deploy

### Backend (API)

1. **Widget Version Config** (NEW - Primary Source)
   - Location: `apps/backend/src/bots/infrastructure/persistence/relational/entities/widget-version.entity.ts`
   - Config structure:
     ```typescript
     config: {
       theme: {
         primaryColor: string;
         position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
         buttonSize: 'small' | 'medium' | 'large';
         showAvatar: boolean;
         showTimestamp: boolean;
       };
       messages: {
         welcome: string;
         placeholder: string;
         offline: string;
         errorMessage: string;
       };
       behavior: { ... };
       features: { ... };
       branding: { ... };
       security: {
         allowedOrigins: string[];
       };
     }
     ```

2. **Bot Entity** (DEPRECATED for appearance)
   - Location: `apps/backend/src/bots/domain/bot.ts`
   - ⚠️ Appearance fields are deprecated, use Widget Version config instead
   - Fields still exist for backward compatibility but are not used

3. **Appearance API Endpoints** (NEW)
   - `GET /api/v1/bots/:botId/widget/appearance` - Get current appearance
   - `PATCH /api/v1/bots/:botId/widget/appearance` - Update appearance
   - These endpoints work with active widget version config

4. **Public Bot Config API**
   - Endpoint: `GET /api/v1/public/bots/:botId/config`
   - Response includes theme from active version:
     ```json
     {
       "botId": "...",
       "version": "1.0.1",
       "versionId": "...",
       "name": "...",
       "theme": {
         "primaryColor": "#667eea",
         "position": "bottom-right",
         "buttonSize": "medium",
         "showAvatar": true,
         "showTimestamp": true
       },
       "welcomeMessage": "...",
       "placeholderText": "..."
     }
     ```

### Widget Implementation

1. **Script Tag Widget**
   - Location: `apps/backend/public/widget-core.js`
   - Reads config from API và apply theme settings

2. **iFrame Widget**
   - Location: `apps/web/app/public/bots/[id]/page.tsx`
   - Cùng giao diện với Script Tag
   - Reads config và render với theme settings

## Usage Flow (NEW)

### 1. Customize Appearance

```typescript
// User goes to: /bots/{botId}/widget
// Clicks on "Appearance" tab
// Changes settings:
- Primary Color: #FF5733
- Position: bottom-left
- Button Size: large
- Welcome Message: "Hello! How can I help?"
- Placeholder: "Type your message..."

// Clicks "Save Appearance Settings"
```

### 2. Backend Creates New Version (Automatic)

```typescript
// NEW: Updates active widget version config
PATCH /api/v1/bots/{botId}/widget/appearance
{
  "primaryColor": "#FF5733",
  "position": "bottom-left",
  "buttonSize": "large",
  "welcomeMessage": "Hello! How can I help?",
  "placeholderText": "Type your message..."
}

// Backend automatically:
// 1. Gets current active version (e.g., 1.0.0)
// 2. Creates new version 1.0.1 with updated config
// 3. Publishes version 1.0.1
// 4. Deactivates version 1.0.0
// 5. Records deployment history
```

### 3. Widget Loads Config

```typescript
// When widget loads on customer's website:
GET /api/v1/public/bots/{botId}/config

// Response includes updated theme
{
  "theme": {
    "primaryColor": "#FF5733",
    "position": "bottom-left",
    "buttonSize": "large"
  },
  "welcomeMessage": "Hello! How can I help?",
  "placeholderText": "Type your message..."
}
```

### 4. Widget Applies Theme

```javascript
// widget-core.js or page.tsx
const primaryColor = botConfig.theme.primaryColor;
const position = botConfig.theme.position;
const buttonSize = botConfig.theme.buttonSize;

// Apply to button style
button.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ...)`;
button.style[position.includes('right') ? 'right' : 'left'] = '20px';
button.style.width = buttonSize === 'large' ? '64px' : '56px';
```

## Benefits (UPDATED)

1. **Consistent Branding**
   - Widget matches customer's brand colors
   - Customizable position to fit website layout

2. **No Code Changes**
   - Settings update immediately
   - No need to re-embed widget code

3. **Version-Based** (NEW)
   - Each version has its own appearance
   - Rollback version = rollback appearance
   - Full history tracking

4. **Live Preview**
   - See changes before saving
   - Visual feedback in dashboard

5. **A/B Testing Ready** (NEW)
   - Test different appearances
   - Compare conversion rates
   - Easy rollback if needed

## Future Enhancements

- [ ] Custom icons/avatars
- [ ] Font customization
- [ ] Border radius settings
- [ ] Animation preferences
- [ ] Dark mode support
- [ ] Per-version theme overrides
- [ ] Multiple color schemes
- [ ] Custom CSS injection

## API Reference (UPDATED)

### Get Current Appearance (NEW)

```http
GET /api/v1/bots/:botId/widget/appearance
Authorization: Bearer <token>

Response:
{
  "primaryColor": "#667eea",
  "position": "bottom-right",
  "buttonSize": "medium",
  "showAvatar": true,
  "showTimestamp": true,
  "welcomeMessage": "Xin chào!",
  "placeholderText": "Nhập tin nhắn..."
}
```

### Update Appearance (NEW)

```http
PATCH /api/v1/bots/:botId/widget/appearance
Authorization: Bearer <token>
Content-Type: application/json

{
  "primaryColor": "#667eea",
  "position": "bottom-right",
  "buttonSize": "medium",
  "welcomeMessage": "Xin chào!",
  "placeholderText": "Nhập tin nhắn...",
  "showAvatar": true,
  "showTimestamp": true
}

Response:
{
  "id": "version-uuid",
  "version": "1.0.1",
  "status": "published",
  "isActive": true,
  "changelog": "Updated appearance settings",
  ...
}
```

### ⚠️ DEPRECATED: Update Bot Directly

```http
# This still works but is deprecated
PATCH /api/v1/bots/:botId
Content-Type: application/json

{
  "primaryColor": "#667eea",
  "widgetPosition": "bottom-right",
  "widgetButtonSize": "medium",
  "welcomeMessage": "Xin chào!",
  "placeholderText": "Nhập tin nhắn..."
}
```

### Get Bot Config (Public)

```http
GET /api/v1/public/bots/:botId/config
Origin: https://example.com

Response:
{
  "botId": "uuid",
  "version": "1.0.0",
  "name": "Support Bot",
  "theme": {
    "primaryColor": "#667eea",
    "position": "bottom-right",
    "buttonSize": "medium",
    "showAvatar": true,
    "showTimestamp": true
  },
  "welcomeMessage": "Xin chào!",
  "placeholderText": "Nhập tin nhắn..."
}
```

## Testing

1. **Dashboard Test**
   ```bash
   # Navigate to widget settings
   http://localhost:3000/bots/{botId}/widget
   
   # Change appearance settings
   # Click Save
   # Verify success toast
   ```

2. **Widget Test**
   ```bash
   # Open test page
   http://localhost:3000/public/bots/{botId}
   
   # Verify:
   # - Button color matches
   # - Position is correct
   # - Size is correct
   # - Welcome message shows
   # - Placeholder text shows
   ```

3. **API Test**
   ```bash
   # Get config
   curl http://localhost:8000/api/v1/public/bots/{botId}/config
   
   # Update settings
   curl -X PATCH http://localhost:8000/api/v1/bots/{botId} \
     -H "Content-Type: application/json" \
     -d '{"primaryColor": "#FF5733"}'
   ```
