# ✅ Widget Version Preview & FOUC Fix - COMPLETE

## 🎯 Vấn đề đã giải quyết

### 1. FOUC (Flash of Unstyled Content)
**Trước:** Widget button hiện với màu mặc định → fetch config → đổi màu → User thấy "nhấp nháy"

**Sau:** Button ẩn → fetch config → apply config → fade in smooth → Không có flash!

### 2. Version-Specific Preview
**Trước:** Chỉ xem được active version

**Sau:** Có thể xem, test, và lấy embed code cho từng version riêng biệt

---

## 📦 Files đã cập nhật

### Backend

#### 1. Widget Version Controller
- ✅ `apps/backend/src/bots/controllers/widget-version.controller.ts`
  - **NEW:** `GET /api/v1/bots/:botId/widget/versions/:versionId/embed-code`
    - Trả về script tag và iframe tag cho version cụ thể
    - Có version parameter trong URL
  - **NEW:** `GET /api/v1/bots/:botId/widget/versions/:versionId/preview-url`
    - Trả về preview URL để test version
    - Có config preview

#### 2. Widget Version Service
- ✅ `apps/backend/src/bots/services/widget-version.service.ts`
  - **NEW:** `getEmbedCode()` - Generate embed code với version parameter
  - **NEW:** `getPreviewUrl()` - Generate preview URL với version parameter

#### 3. Public Bot Controller
- ✅ `apps/backend/src/bots/controllers/public-bot.controller.ts`
  - **UPDATED:** `GET /api/v1/public/bots/:botId/config`
    - Support `?version=1.0.0` parameter
    - Support `?versionId=uuid` parameter
    - Mặc định trả về active version

#### 4. Public Bot Service
- ✅ `apps/backend/src/bots/services/public-bot.service.ts`
  - **UPDATED:** `getBotConfig()` - Support version/versionId parameters
  - Inject `WidgetVersionEntity` repository
  - Query specific version nếu có parameter

### Frontend (Widget)

#### 1. Widget Loader
- ✅ `apps/backend/public/widget-loader.js`
  - **UPDATED:** Button ẩn ban đầu (`opacity: 0`)
  - **NEW:** `loadConfigAndShowButton()` - Load config trước khi show button
  - Apply theme từ config trước khi show
  - Smooth fade-in transition (0.3s)
  - No more FOUC!

#### 2. Widget Core
- ✅ `apps/backend/public/widget-core.js`
  - **UPDATED:** Container ẩn ban đầu
  - Fade-in sau khi render xong
  - Smooth transition

---

## 🔄 Luồng hoạt động MỚI

### 1. Widget Load (No FOUC)

```javascript
// Old flow (có FOUC):
1. Create button với default color
2. Show button (user thấy màu mặc định)
3. Fetch config
4. Update button color (user thấy đổi màu - FLASH!)

// New flow (no FOUC):
1. Create button với opacity: 0 (ẩn)
2. Fetch config
3. Apply config (color, position, size)
4. Fade in button (opacity: 0 → 1)
5. User chỉ thấy button đúng màu ngay từ đầu!
```

### 2. Version-Specific Preview

```typescript
// Get embed code cho version cụ thể
GET /api/v1/bots/:botId/widget/versions/:versionId/embed-code

Response:
{
  "scriptTag": "<script>...</script>",
  "iframeTag": "<iframe src='...?version=1.0.0&versionId=xxx'></iframe>",
  "testUrl": "http://localhost:3000/public/bots/:botId?version=1.0.0&versionId=xxx"
}
```

### 3. Test Specific Version

```typescript
// Preview version 1.0.0
GET /api/v1/public/bots/:botId/config?version=1.0.0

// Preview version by ID
GET /api/v1/public/bots/:botId/config?versionId=xxx

// Default (active version)
GET /api/v1/public/bots/:botId/config
```

---

## 🎨 UI Flow (Dashboard)

### Version List Page

```
┌─────────────────────────────────────────────────────────┐
│  Widget Versions                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Version 1.0.1 (Active) ✅                          │ │
│  │ Published: 2024-01-15                              │ │
│  │ Changelog: Updated primary color to red            │ │
│  │                                                     │ │
│  │ Theme: 🔴 Red | Bottom-right | Medium              │ │
│  │                                                     │ │
│  │ [Preview] [Get Embed Code] [Rollback]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Version 1.0.0                                       │ │
│  │ Published: 2024-01-01                              │ │
│  │ Changelog: Initial release                         │ │
│  │                                                     │ │
│  │ Theme: 🔵 Blue | Bottom-right | Medium             │ │
│  │                                                     │ │
│  │ [Preview] [Get Embed Code] [Activate]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Preview Modal

```
┌─────────────────────────────────────────────────────────┐
│  Preview Version 1.0.0                            [✕]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Configuration:                                          │
│  • Primary Color: #667eea (Blue)                        │
│  • Position: Bottom-right                               │
│  • Button Size: Medium                                  │
│  • Welcome: "Hello! How can I help?"                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  [Live Preview]                                     │ │
│  │                                                     │ │
│  │  <iframe src="...?version=1.0.0">                  │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Test URL:                                               │
│  http://localhost:3000/public/bots/xxx?version=1.0.0   │
│  [Copy URL]                                              │
│                                                          │
│  [Get Embed Code]                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Embed Code Modal

```
┌─────────────────────────────────────────────────────────┐
│  Embed Code - Version 1.0.0                       [✕]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Script Tag (Recommended):                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ <script>                                           │ │
│  │   wataomi('init', {                                │ │
│  │     botId: 'xxx',                                  │ │
│  │     version: '1.0.0',                              │ │
│  │     versionId: 'yyy'                               │ │
│  │   });                                              │ │
│  │ </script>                                          │ │
│  └────────────────────────────────────────────────────┘ │
│  [Copy Code]                                             │
│                                                          │
│  iFrame Tag:                                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │ <iframe                                            │ │
│  │   src="...?version=1.0.0&versionId=yyy"           │ │
│  │   width="400" height="600"                         │ │
│  │ ></iframe>                                         │ │
│  └────────────────────────────────────────────────────┘ │
│  [Copy Code]                                             │
│                                                          │
│  ⚠️ Note: This embeds a specific version.              │
│  For auto-updates, use embed code without version.      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Guide

### 1. Test FOUC Fix

```bash
# Open browser DevTools → Network tab
# Set throttling to "Slow 3G"
# Load page with widget

# Expected:
# - Button không hiện ngay lập tức
# - Sau ~1-2s button fade in với đúng màu
# - KHÔNG thấy button đổi màu
```

### 2. Test Version Preview

```bash
# Get embed code for version 1.0.0
curl http://localhost:8000/api/v1/bots/<bot-id>/widget/versions/<version-id>/embed-code \
  -H "Authorization: Bearer <token>"

# Response includes:
# - scriptTag with version parameter
# - iframeTag with version parameter
# - testUrl to preview
```

### 3. Test Version-Specific Config

```bash
# Get config for version 1.0.0
curl "http://localhost:8000/api/v1/public/bots/<bot-id>/config?version=1.0.0"

# Get config for version by ID
curl "http://localhost:8000/api/v1/public/bots/<bot-id>/config?versionId=<version-id>"

# Get active version (default)
curl "http://localhost:8000/api/v1/public/bots/<bot-id>/config"
```

### 4. Test Widget with Specific Version

```html
<!-- Test page -->
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test - Version 1.0.0</title>
</head>
<body>
    <h1>Testing Version 1.0.0</h1>
    
    <!-- Embed with specific version -->
    <script>
      (function(w,d,s,o,f,js,fjs){
        w['WataomiWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
        js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
        js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
      }(window,document,'script','wataomi','http://localhost:8000/widget-core.js'));
      wataomi('init', {
        botId: '<bot-id>',
        version: '1.0.0',
        versionId: '<version-id>'
      });
    </script>
</body>
</html>
```

---

## ✅ Benefits

### 1. No FOUC
- Button không "nhấp nháy" khi load
- Smooth fade-in transition
- Professional user experience

### 2. Version Preview
- Test version trước khi publish
- So sánh appearance giữa versions
- Debug version-specific issues

### 3. Version-Specific Embed
- Embed specific version cho testing
- Lock version cho stability
- A/B test different versions

### 4. Better Developer Experience
- Clear API endpoints
- Easy to get embed code
- Preview URL for testing

---

## 📊 API Summary

### New Endpoints

```typescript
// Get embed code for version
GET /api/v1/bots/:botId/widget/versions/:versionId/embed-code
Response: {
  scriptTag: string;
  iframeTag: string;
  testUrl: string;
}

// Get preview URL for version
GET /api/v1/bots/:botId/widget/versions/:versionId/preview-url
Response: {
  previewUrl: string;
  version: string;
  config: object;
}

// Get config for specific version (public)
GET /api/v1/public/bots/:botId/config?version=1.0.0
GET /api/v1/public/bots/:botId/config?versionId=xxx
Response: BotConfigResponseDto
```

---

## 🚀 Next Steps (Frontend TODO)

### Dashboard UI
- [ ] Add "Preview" button to version list
- [ ] Create preview modal with live iframe
- [ ] Add "Get Embed Code" button
- [ ] Create embed code modal with copy buttons
- [ ] Show version config in preview
- [ ] Add "Test URL" copy button

### Widget Page
- [ ] Update appearance settings to show current version
- [ ] Add version selector dropdown
- [ ] Show version history in sidebar
- [ ] Add "Preview Changes" before save

---

## 📝 Notes

### Performance
- Config loads in parallel with button creation
- Button shows ~100-300ms after page load (depending on network)
- Smooth transition prevents jarring experience

### Backward Compatibility
- Widget without version parameter still works (uses active version)
- Old embed codes continue to work
- No breaking changes

### Caching
- Config cached for 5 minutes
- Version-specific URLs enable cache busting
- CDN-ready architecture

---

**Implementation completed successfully! 🎉**

Widget now loads smoothly without FOUC, and each version can be previewed and embedded independently.
