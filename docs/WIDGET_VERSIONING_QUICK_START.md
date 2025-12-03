# 🚀 Widget Versioning - Quick Start Guide

## 5 phút để hiểu và test widget versioning

---

## 📝 Tóm tắt ngắn gọn

**Trước:**
- Widget không có version
- Update phải thay code
- Browser cache gây vấn đề

**Bây giờ:**
- Mỗi version có config riêng
- Update chỉ cần publish version mới
- Browser tự động load version mới

---

## 🎯 Test ngay (3 bước)

### Bước 1: Start services

```bash
# Terminal 1: Backend
cd apps/backend
npm run start:dev

# Terminal 2: Frontend  
cd apps/web
npm run dev
```

### Bước 2: Tạo version đầu tiên

**Option A: Qua Dashboard**
1. Vào `http://localhost:3000/bots/{botId}/widget`
2. Click "Create Version"
3. Nhập version: `1.0.0`
4. Config theme color: `#667eea`
5. Click "Create" → "Publish"

**Option B: Qua API**
```bash
# 1. Create version
curl -X POST http://localhost:3000/api/v1/bots/{botId}/widget/versions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0.0",
    "config": {
      "theme": {
        "primaryColor": "#667eea",
        "position": "bottom-right",
        "buttonSize": "medium"
      },
      "messages": {
        "welcome": "Xin chào! Tôi có thể giúp gì cho bạn?",
        "placeholder": "Nhập tin nhắn..."
      }
    },
    "changelog": "Initial version"
  }'

# 2. Publish version
curl -X POST http://localhost:3000/api/v1/bots/{botId}/widget/versions/{versionId}/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bước 3: Test widget

**Option A: Test page có sẵn**
```
http://localhost:3000/widget-test.html
```

**Option B: Tạo file HTML riêng**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Widget</title>
</head>
<body>
    <h1>My Website</h1>
    
    <!-- Widget -->
    <script 
        src="http://localhost:3000/api/v1/public/widget/YOUR_BOT_ID/loader.js"
        data-bot-id="YOUR_BOT_ID"
        data-api-url="http://localhost:3000/api/v1"
        async
    ></script>
</body>
</html>
```

**Kết quả:**
- Widget button xuất hiện góc phải dưới
- Click vào → chat window mở ra
- Màu theme: `#667eea` (tím)
- Welcome message hiển thị
- Console log: `[WataOmi Widget] Initializing version: 1.0.0`

---

## 🔄 Test version update

### 1. Tạo version mới

```bash
curl -X POST http://localhost:3000/api/v1/bots/{botId}/widget/versions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0.1",
    "config": {
      "theme": {
        "primaryColor": "#FF5733",
        "position": "bottom-right",
        "buttonSize": "large"
      },
      "messages": {
        "welcome": "Chào bạn! Có gì tôi có thể giúp?",
        "placeholder": "Gõ tin nhắn tại đây..."
      }
    },
    "changelog": "Updated theme color to orange, larger button"
  }'
```

### 2. Publish version mới

```bash
curl -X POST http://localhost:3000/api/v1/bots/{botId}/widget/versions/{newVersionId}/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Reload test page

**Kết quả:**
- Màu theme đổi thành `#FF5733` (cam)
- Button size lớn hơn
- Welcome message mới
- Console log: `[WataOmi Widget] Initializing version: 1.0.1`

**Không cần:**
- ❌ Thay đổi embed code
- ❌ Clear browser cache
- ❌ Deploy code mới

---

## ⏮️ Test rollback

### 1. Rollback về version cũ

```bash
curl -X POST http://localhost:3000/api/v1/bots/{botId}/widget/versions/{oldVersionId}/rollback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Version 1.0.1 has bug"
  }'
```

### 2. Reload test page

**Kết quả:**
- Màu theme quay lại `#667eea` (tím)
- Button size medium
- Welcome message cũ
- Console log: `[WataOmi Widget] Initializing version: 1.0.0`

**Instant rollback - không downtime!**

---

## 🔍 Kiểm tra version đang active

### Via API

```bash
curl http://localhost:3000/api/v1/public/bots/{botId}/config

Response:
{
  "botId": "xxx",
  "version": "1.0.0",        ← Active version
  "versionId": "uuid",
  "name": "Support Bot",
  "theme": {
    "primaryColor": "#667eea",
    ...
  }
}
```

### Via Dashboard

```
http://localhost:3000/bots/{botId}/widget
```

Tìm version có badge "Active" màu xanh.

---

## 📊 Xem deployment history

### Via API

```bash
curl http://localhost:3000/api/v1/bots/{botId}/widget/deployments \
  -H "Authorization: Bearer YOUR_TOKEN"

Response:
[
  {
    "version": "1.0.1",
    "deploymentType": "publish",
    "deployedAt": "2024-01-15T10:00:00Z"
  },
  {
    "version": "1.0.0",
    "deploymentType": "rollback",
    "rollbackReason": "Version 1.0.1 has bug",
    "deployedAt": "2024-01-15T11:00:00Z"
  }
]
```

### Via Dashboard

```
http://localhost:3000/bots/{botId}/widget
→ Tab "Deployment History"
```

---

## 🎨 Config options

### Theme

```json
{
  "theme": {
    "primaryColor": "#667eea",           // Hex color
    "position": "bottom-right",          // bottom-right | bottom-left | top-right | top-left
    "buttonSize": "medium",              // small | medium | large
    "showAvatar": true,
    "showTimestamp": true
  }
}
```

### Messages

```json
{
  "messages": {
    "welcome": "Xin chào! Tôi có thể giúp gì?",
    "placeholder": "Nhập tin nhắn...",
    "offline": "Chúng tôi đang offline",
    "errorMessage": "Đã có lỗi xảy ra"
  }
}
```

### Behavior

```json
{
  "behavior": {
    "autoOpen": false,                   // Auto-open on page load
    "autoOpenDelay": 0,                  // Delay in seconds
    "greetingDelay": 1000                // Delay before showing welcome (ms)
  }
}
```

### Security

```json
{
  "security": {
    "allowedOrigins": [
      "https://example.com",
      "https://*.example.com",           // Wildcard subdomain
      "*"                                 // Allow all (not recommended)
    ],
    "rateLimit": {
      "maxRequests": 100,
      "windowMs": 60000                  // 1 minute
    }
  }
}
```

---

## 🐛 Troubleshooting

### Widget không hiển thị

**Check 1: Bot có active version chưa?**
```bash
curl http://localhost:3000/api/v1/public/bots/{botId}/config
```

Nếu lỗi "No active widget version found" → Publish một version.

**Check 2: Bot ID đúng chưa?**
```html
<script 
    src="http://localhost:3000/api/v1/public/widget/WRONG_ID/loader.js"
    data-bot-id="WRONG_ID"  ← Check this
></script>
```

**Check 3: Console có lỗi không?**
```
F12 → Console tab
```

### Version không update

**Check 1: Version đã publish chưa?**
```bash
curl http://localhost:3000/api/v1/bots/{botId}/widget/versions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Tìm version có `"isActive": true`.

**Check 2: Clear cache**
```
Ctrl + Shift + R (hard reload)
```

**Check 3: Loader cache**
```
Loader script cache 5 minutes.
Đợi 5 phút hoặc clear cache.
```

### CORS error

**Check allowed origins:**
```json
{
  "security": {
    "allowedOrigins": ["https://example.com"]
  }
}
```

**Add your domain:**
```bash
curl -X PATCH http://localhost:3000/api/v1/bots/{botId}/widget/versions/{versionId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "security": {
        "allowedOrigins": ["http://localhost:3000", "https://example.com"]
      }
    }
  }'
```

---

## 📚 Tài liệu đầy đủ

- [Complete Implementation Guide](./WIDGET_VERSIONING_COMPLETE.md)
- [Widget README](../apps/web/public/WIDGET_README.md)
- [Embed Guide](./WIDGET_EMBED_GUIDE.md)

---

## ✅ Checklist

- [ ] Backend running (`npm run start:dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Created first version (1.0.0)
- [ ] Published version
- [ ] Tested widget on test page
- [ ] Created second version (1.0.1)
- [ ] Published new version
- [ ] Verified version update
- [ ] Tested rollback
- [ ] Checked deployment history

---

**Thời gian: ~5 phút**

**Kết quả: Hiểu rõ widget versioning hoạt động như thế nào!**

🎉 **Chúc mừng! Bạn đã master widget versioning!**
