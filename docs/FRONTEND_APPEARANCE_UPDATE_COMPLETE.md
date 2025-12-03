# ✅ Frontend Appearance Settings Update - COMPLETE

## 🎯 Vấn đề đã giải quyết

**Trước:** Dashboard load appearance từ bot entity (cũ) → không sync với widget version

**Sau:** Dashboard load appearance từ active widget version → sync hoàn toàn!

---

## 📦 Files đã cập nhật

### Frontend Dashboard

#### 1. Widget Page
- ✅ `apps/web/app/(dashboard)/bots/[id]/widget/page.tsx`
  - **UPDATED:** `loadAppearanceSettings()` - Đổi từ `/bots/:id` sang `/bots/:id/widget/appearance`
  - **UPDATED:** `handleSaveAppearance()` - Đổi từ `PATCH /bots/:id` sang `PATCH /bots/:id/widget/appearance`
  - **ADDED:** Info banner hiển thị active version
  - **ADDED:** Auto refresh versions list sau khi save
  - **FIXED:** Field mapping (widgetPosition → position, widgetButtonSize → buttonSize)

#### 2. Widget Appearance Settings Component
- ✅ `apps/web/components/widget/widget-appearance-settings.tsx`
  - **ADDED:** `showAvatar` và `showTimestamp` fields
  - No other changes needed (component already works correctly)

---

## 🔄 Luồng hoạt động MỚI

### Old Flow (Broken)
```typescript
1. Load bot entity: GET /bots/:id
2. Get appearance from bot.primaryColor, bot.widgetPosition, etc.
3. Display in form
4. Save: PATCH /bots/:id { primaryColor, widgetPosition, ... }
5. Update bot entity directly
❌ Problem: Bot entity không được dùng nữa, widget đọc từ version!
```

### New Flow (Fixed)
```typescript
1. Load appearance: GET /bots/:id/widget/appearance
2. Get appearance from active widget version config
3. Display in form
4. Save: PATCH /bots/:id/widget/appearance { primaryColor, position, ... }
5. Backend:
   - Get active version (e.g., 1.0.0)
   - Create new version 1.0.1 with updated config
   - Publish version 1.0.1
   - Deactivate version 1.0.0
6. Frontend:
   - Refresh appearance settings
   - Refresh versions list (shows new version 1.0.1)
✅ Widget immediately uses new appearance!
```

---

## 🎨 UI Changes

### Before
```
┌─────────────────────────────────────────┐
│  Widget Settings                         │
├─────────────────────────────────────────┤
│  [Appearance] [Embed] [Versions]        │
│                                          │
│  Primary Color: #667eea                  │
│  Position: Bottom-right                  │
│  ...                                     │
│                                          │
│  [Save Appearance Settings]              │
└─────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────┐
│  Widget Settings                         │
├─────────────────────────────────────────┤
│  [Appearance] [Embed] [Versions]        │
│                                          │
│  ℹ️ Active Version: 1.0.0               │
│  Updating appearance will create a new   │
│  version automatically.                  │
│                                          │
│  Primary Color: #667eea                  │
│  Position: Bottom-right                  │
│  ...                                     │
│                                          │
│  [Save Appearance Settings]              │
└─────────────────────────────────────────┘

After save → New version 1.0.1 created!
```

---

## 🧪 Testing Guide

### 1. Test Load Appearance

```bash
# Open dashboard
http://localhost:3000/bots/<bot-id>/widget

# Click "Appearance" tab
# Should see:
# - Info banner with active version
# - Current appearance settings from active version
# - NOT from bot entity
```

### 2. Test Save Appearance

```bash
# Change primary color to red (#FF0000)
# Click "Save Appearance Settings"

# Expected:
# 1. Success toast
# 2. New version created (1.0.0 → 1.0.1)
# 3. Versions tab shows new version
# 4. Widget immediately uses red color
```

### 3. Test Version Sync

```bash
# Open widget in new tab
http://localhost:3000/public/bots/<bot-id>

# Should see red color immediately
# No need to refresh or clear cache
```

### 4. Test Rollback

```bash
# Go to Versions tab
# Click "Rollback to 1.0.0"

# Expected:
# 1. Version 1.0.0 becomes active
# 2. Go back to Appearance tab
# 3. Should see blue color (#667eea)
# 4. Widget also shows blue color
```

---

## 📊 API Calls Comparison

### Before (Wrong)
```typescript
// Load
GET /api/v1/bots/:botId
Response: {
  id: "...",
  name: "...",
  primaryColor: "#667eea",  // ❌ Not used by widget!
  widgetPosition: "bottom-right",
  ...
}

// Save
PATCH /api/v1/bots/:botId
Body: {
  primaryColor: "#FF0000",
  widgetPosition: "bottom-left"
}
// ❌ Updates bot entity, but widget doesn't read from it!
```

### After (Correct)
```typescript
// Load
GET /api/v1/bots/:botId/widget/appearance
Response: {
  primaryColor: "#667eea",  // ✅ From active version config
  position: "bottom-right",
  buttonSize: "medium",
  welcomeMessage: "...",
  placeholderText: "...",
  showAvatar: true,
  showTimestamp: true
}

// Save
PATCH /api/v1/bots/:botId/widget/appearance
Body: {
  primaryColor: "#FF0000",
  position: "bottom-left",
  buttonSize: "large",
  welcomeMessage: "Hello!",
  placeholderText: "Type..."
}
// ✅ Creates new version, widget immediately uses it!
```

---

## ✅ Benefits

### 1. Consistency
- Dashboard và widget đọc từ cùng 1 source (widget version)
- Không còn mismatch giữa dashboard và widget

### 2. Real-time Updates
- Save appearance → widget update ngay lập tức
- Không cần refresh hoặc clear cache

### 3. Version History
- Mỗi appearance change tạo version mới
- Có thể rollback appearance
- Track history đầy đủ

### 4. Better UX
- Info banner cho user biết version đang active
- Auto refresh versions list sau save
- Clear feedback về version changes

---

## 🔧 Field Mapping

Backend API sử dụng tên field khác với bot entity:

| Bot Entity (Old) | Appearance API (New) | Widget Version Config |
|------------------|----------------------|----------------------|
| `primaryColor` | `primaryColor` | `config.theme.primaryColor` |
| `widgetPosition` | `position` | `config.theme.position` |
| `widgetButtonSize` | `buttonSize` | `config.theme.buttonSize` |
| `welcomeMessage` | `welcomeMessage` | `config.messages.welcome` |
| `placeholderText` | `placeholderText` | `config.messages.placeholder` |
| `showAvatar` | `showAvatar` | `config.theme.showAvatar` |
| `showTimestamp` | `showTimestamp` | `config.theme.showTimestamp` |

Frontend đã được update để map đúng fields!

---

## 📝 Notes

### Backward Compatibility
- Bot entity appearance fields vẫn tồn tại (deprecated)
- Không breaking changes cho existing code
- Migration đã copy data từ bot → widget version

### Performance
- Appearance API cache 5 minutes
- No performance impact
- Same number of API calls

### Future Enhancements
- [ ] Add "Preview" button in appearance tab
- [ ] Show version diff when saving
- [ ] Add "Revert to previous version" quick action
- [ ] Show appearance history timeline

---

**Frontend update completed successfully! 🎉**

Dashboard now correctly loads and saves appearance settings from/to widget version, ensuring perfect sync with the widget.
