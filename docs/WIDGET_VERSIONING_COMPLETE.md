# ✅ Widget Versioning Implementation - COMPLETE

## 📋 Tổng quan

Đã implement toàn bộ hệ thống widget versioning cho phép:
- ✅ Mỗi version có config riêng (theme, messages, behavior)
- ✅ Automatic version loading (users luôn nhận active version)
- ✅ Cache busting (mỗi version có URL riêng)
- ✅ Instant rollback (không cần code changes)
- ✅ Zero downtime deployment

---

## 🎯 Vấn đề đã fix

### ❌ Trước khi implement:
```
User embeds:
<script src="/widget.js" data-bot-id="xxx"></script>

Problems:
- Không có version management
- Browser cache widget.js → không update được
- Rollback phải thay đổi code
- Config và script không sync
```

### ✅ Sau khi implement:
```
User embeds:
<script 
    src="/api/v1/public/widget/{botId}/loader.js"
    data-bot-id="{botId}"
></script>

Benefits:
- Loader fetch active version từ API
- Core script load theo version: /v/1.0.1/core.js
- Browser cache per version (immutable)
- Publish/rollback instant (chỉ thay đổi active version)
```

---

## 📁 Files đã tạo/sửa

### Backend

#### 1. **New Controller: `public-widget.controller.ts`**
```typescript
Location: apps/backend/src/bots/controllers/public-widget.controller.ts

Endpoints:
- GET /api/v1/public/widget/:botId/loader.js
  → Serve loader script (inject version)
  → Cache: 5 minutes

- GET /api/v1/public/widget/:botId/v/:version/core.js
  → Serve versioned core script
  → Cache: 1 year (immutable)

- GET /api/v1/public/widget/:botId/v/:version/styles.css
  → Serve versioned styles
  → Cache: 1 year (immutable)
```

#### 2. **Updated: `bots.module.ts`**
```typescript
Location: apps/backend/src/bots/bots.module.ts

Changes:
+ import { PublicWidgetController } from './controllers/public-widget.controller';
+ controllers: [..., PublicWidgetController]
```

#### 3. **Updated: `widget-version.service.ts`**
```typescript
Location: apps/backend/src/bots/services/widget-version.service.ts

Changes:
- listVersions(botId: string, userId: string)
+ listVersions(botId: string, userId?: string)  // Optional for public access
```

### Frontend

#### 4. **Updated: `widget-loader.js`**
```javascript
Location: apps/web/public/widget-loader.js

Changes:
+ Fetch bot config to get active version
+ Load core script with version: /v/{version}/core.js
+ Store version in config
+ Console log version info
```

#### 5. **New: `widget-core.js`**
```javascript
Location: apps/web/public/widget-core.js

Features:
- Full widget UI implementation
- Message handling
- Conversation management
- Mobile responsive
- Version display in header
- Theme customization from config
```

#### 6. **Updated: `widget-embed-code.tsx`**
```typescript
Location: apps/web/components/widget/widget-embed-code.tsx

Changes:
- Old: src="/widget.js"
+ New: src="/api/v1/public/widget/{botId}/loader.js"
+ Added version info display
+ Added test buttons
+ Updated documentation
```

#### 7. **New: `widget-test.html`**
```html
Location: apps/web/public/widget-test.html

Purpose:
- Test page for widget
- Shows implementation example
- Technical details
- Visual guide
```

#### 8. **New: `WIDGET_README.md`**
```markdown
Location: apps/web/public/WIDGET_README.md

Content:
- Architecture explanation
- API documentation
- Testing guide
- Troubleshooting
- Production deployment guide
```

---

## 🔄 Flow hoạt động

### 1. User Embed Widget

```html
<!-- Customer website -->
<script 
    src="http://localhost:3000/api/v1/public/widget/BOT_ID/loader.js"
    data-bot-id="BOT_ID"
    data-api-url="http://localhost:3000/api/v1"
    async
></script>
```

### 2. Loader Execution

```javascript
// widget-loader.js
1. Create button (fast, ~3KB)
2. On click:
   a. Fetch bot config → get active version
   b. Load core script: /v/{version}/core.js
   c. Initialize widget with config
```

### 3. Version Loading

```
Request: GET /api/v1/public/bots/{botId}/config
Response: {
  botId: "xxx",
  version: "1.0.1",        ← Active version
  versionId: "uuid",
  name: "Support Bot",
  theme: { ... },
  messages: { ... }
}

Then load: GET /api/v1/public/widget/{botId}/v/1.0.1/core.js
```

### 4. Cache Strategy

```
Loader script:
- Cache-Control: public, max-age=300 (5 minutes)
- Always fresh enough to get new versions

Core script:
- Cache-Control: public, max-age=31536000, immutable (1 year)
- URL includes version → safe to cache forever
- New version = new URL = automatic cache bust
```

---

## 🚀 Deployment Workflow

### Scenario 1: Publish New Version

```typescript
// 1. Create draft
POST /api/v1/bots/{botId}/widget/versions
{
  "version": "1.0.2",
  "config": {
    "theme": { "primaryColor": "#FF5733" },
    "messages": { "welcome": "New welcome message!" }
  },
  "changelog": "Updated theme color and welcome message"
}

// 2. Test draft (optional)
// Access via version-specific URL

// 3. Publish (make active)
POST /api/v1/bots/{botId}/widget/versions/{versionId}/publish

// 4. Result:
// - Version 1.0.2 becomes active
// - Users get new version on next page load
// - Old version still cached but not loaded
```

### Scenario 2: Rollback

```typescript
// Problem: Version 1.0.2 has bug

// 1. Rollback to 1.0.1
POST /api/v1/bots/{botId}/widget/versions/{v1.0.1-id}/rollback
{
  "reason": "Critical bug in 1.0.2 - mobile responsive broken"
}

// 2. Result:
// - Version 1.0.1 becomes active again
// - Users get old version immediately
// - No code changes needed
// - Deployment recorded in history
```

---

## 🧪 Testing

### Local Test

1. **Start services:**
```bash
# Terminal 1: Backend
cd apps/backend
npm run start:dev

# Terminal 2: Frontend
cd apps/web
npm run dev
```

2. **Open test page:**
```
http://localhost:3000/widget-test.html
```

3. **Check console:**
```
[WataOmi Widget] Initializing version: 1.0.1
[WataOmi Widget] Loaded config for version: 1.0.1
[WataOmi Widget Core] Initializing with config: {...}
```

### Test Version Changes

1. **Create version 1.0.1:**
```bash
# Via dashboard or API
POST /api/v1/bots/{botId}/widget/versions
{
  "version": "1.0.1",
  "config": { "theme": { "primaryColor": "#667eea" } }
}
```

2. **Publish it:**
```bash
POST /api/v1/bots/{botId}/widget/versions/{versionId}/publish
```

3. **Reload test page → see version 1.0.1**

4. **Create version 1.0.2:**
```bash
POST /api/v1/bots/{botId}/widget/versions
{
  "version": "1.0.2",
  "config": { "theme": { "primaryColor": "#FF5733" } }
}
```

5. **Publish it:**
```bash
POST /api/v1/bots/{botId}/widget/versions/{versionId}/publish
```

6. **Reload test page → see version 1.0.2 with new color**

7. **Rollback to 1.0.1:**
```bash
POST /api/v1/bots/{botId}/widget/versions/{v1.0.1-id}/rollback
{ "reason": "Testing rollback" }
```

8. **Reload test page → back to version 1.0.1**

---

## 📊 Database Schema

### widget_version table

```sql
CREATE TABLE widget_version (
  id UUID PRIMARY KEY,
  bot_id UUID NOT NULL,
  version VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',  -- draft | published | archived
  is_active BOOLEAN DEFAULT false,
  config JSONB NOT NULL,
  published_at TIMESTAMP,
  published_by UUID,
  cdn_url VARCHAR(500),
  changelog TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(bot_id, version),
  INDEX(bot_id, is_active) WHERE is_active = true
);
```

### widget_deployment table

```sql
CREATE TABLE widget_deployment (
  id UUID PRIMARY KEY,
  bot_id UUID NOT NULL,
  widget_version_id UUID NOT NULL,
  deployment_type VARCHAR(20),  -- publish | rollback | canary
  previous_version_id UUID,
  rollback_reason TEXT,
  traffic_percentage INT DEFAULT 100,
  status VARCHAR(20),  -- deploying | deployed | failed | rolled_back
  deployed_at TIMESTAMP DEFAULT NOW(),
  deployed_by UUID,
  
  FOREIGN KEY (widget_version_id) REFERENCES widget_version(id),
  FOREIGN KEY (previous_version_id) REFERENCES widget_version(id)
);
```

---

## 🎨 Config Structure

```typescript
interface WidgetConfig {
  theme: {
    primaryColor: string;           // "#667eea"
    position: string;                // "bottom-right" | "bottom-left" | ...
    buttonSize: string;              // "small" | "medium" | "large"
    showAvatar: boolean;
    showTimestamp: boolean;
  };
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;           // seconds
    greetingDelay: number;           // milliseconds
  };
  messages: {
    welcome: string;
    placeholder: string;
    offline: string;
    errorMessage: string;
  };
  features: {
    fileUpload: boolean;
    voiceInput: boolean;
    markdown: boolean;
    quickReplies: boolean;
  };
  security: {
    allowedOrigins: string[];        // ["https://example.com", "*"]
    rateLimit?: {
      maxRequests: number;
      windowMs: number;
    };
  };
  branding: {
    showPoweredBy: boolean;
  };
}
```

---

## 🔒 Security

### CORS Validation

```typescript
// Per-version allowed origins
config.security.allowedOrigins = [
  "https://example.com",
  "https://*.example.com",  // Wildcard
  "*"                        // Allow all (not recommended)
];

// Validated in PublicBotService.getBotConfig()
```

### Rate Limiting

```typescript
// Per-version rate limits
config.security.rateLimit = {
  maxRequests: 100,
  windowMs: 60000  // 1 minute
};
```

---

## 📈 Monitoring

### Version Tracking

```typescript
// Conversation includes version info
{
  conversationId: "uuid",
  metadata: {
    version: "1.0.1",
    versionId: "uuid",
    url: "https://example.com",
    source: "widget"
  }
}
```

### Deployment History

```typescript
GET /api/v1/bots/{botId}/widget/deployments

Response: [
  {
    version: "1.0.2",
    deploymentType: "publish",
    deployedAt: "2024-01-15T10:00:00Z"
  },
  {
    version: "1.0.1",
    deploymentType: "rollback",
    rollbackReason: "Bug in 1.0.2",
    deployedAt: "2024-01-15T11:00:00Z"
  }
]
```

---

## 🎯 Benefits Summary

### For Developers

✅ **Version Control**
- Git-like versioning for widget
- Full deployment history
- Easy rollback

✅ **Cache Management**
- Automatic cache busting
- Immutable versioned URLs
- No manual cache clearing

✅ **Zero Downtime**
- Instant version switching
- No code deployment needed
- Gradual rollout possible (future: canary)

### For Customers

✅ **Always Up-to-Date**
- Automatic updates
- No manual intervention
- Latest features instantly

✅ **Reliable**
- Quick rollback if issues
- Version-specific configs
- Stable URLs

✅ **Simple Integration**
- One script tag
- No version management needed
- Works everywhere

---

## 🚀 Next Steps (Optional Enhancements)

### 1. CDN Integration
```typescript
// Upload versioned scripts to CDN
// Update cdnUrl in widget_version table
// Serve from CDN instead of backend
```

### 2. Canary Deployment
```typescript
// Gradual rollout
POST /api/v1/bots/{botId}/widget/versions/{versionId}/canary
{
  "trafficPercentage": 10  // 10% of users get new version
}
```

### 3. A/B Testing
```typescript
// Test multiple versions simultaneously
// Track metrics per version
// Auto-promote winner
```

### 4. Analytics
```typescript
// Track per-version metrics
// - Load time
// - Error rate
// - Conversation rate
// - User satisfaction
```

---

## 📞 Support

### Documentation
- [Widget README](../apps/web/public/WIDGET_README.md)
- [Embed Guide](./WIDGET_EMBED_GUIDE.md)
- [Quick Start](./quick-start-embed-widget.md)

### Testing
- Test page: `http://localhost:3000/widget-test.html`
- API docs: `http://localhost:3000/api/docs`

### Troubleshooting

**Widget not loading?**
1. Check browser console
2. Verify bot has active published version
3. Check CORS settings

**Version not updating?**
1. Clear browser cache
2. Check if version is published
3. Verify cache headers

**CORS errors?**
1. Add domain to allowed origins
2. Include protocol (https://)
3. Use wildcard for subdomains

---

## ✅ Implementation Checklist

- [x] Backend: PublicWidgetController
- [x] Backend: Update BotsModule
- [x] Backend: Fix WidgetVersionService
- [x] Frontend: Update widget-loader.js
- [x] Frontend: Create widget-core.js
- [x] Frontend: Update widget-embed-code.tsx
- [x] Frontend: Create widget-test.html
- [x] Documentation: WIDGET_README.md
- [x] Documentation: WIDGET_VERSIONING_COMPLETE.md

---

**Status: ✅ COMPLETE**

**Implementation Date:** December 3, 2024

**Made with ❤️ by WataOmi Team**
