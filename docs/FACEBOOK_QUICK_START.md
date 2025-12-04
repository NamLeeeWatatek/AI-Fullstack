# Facebook Messenger - Quick Start Guide

## ✅ Bạn Đã Có

- ✅ Page Access Token: `EAAMHoYwFnBwBQ...`
- ✅ App ID
- ✅ App Secret

## 🚀 Các Bước Setup

### Bước 1: Cấu Hình Backend (✅ ĐÃ XONG)

File `.env` đã được cập nhật với:
```bash
FACEBOOK_PAGE_ACCESS_TOKEN=EAAMHoYwFnBwBQ...
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_VERIFY_TOKEN=wataomi_verify_token_2025
```

### Bước 2: Test Kết Nối

```bash
cd apps/backend

# Install dependencies nếu chưa có
npm install

# Compile TypeScript
npm run build

# Run test script
npx ts-node scripts/test-facebook.ts
```

**Kết quả mong đợi:**
```
✅ Page Info:
   - ID: 123456789
   - Name: Your Page Name
   - Category: Business
```

### Bước 3: Start Backend Server

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Server sẽ chạy tại: `http://localhost:8000`

### Bước 4: Expose Backend với ngrok (Để Test Local)

```bash
# Install ngrok
npm install -g ngrok

# Expose port 8000
ngrok http 8000
```

**Kết quả:**
```
Forwarding: https://abc123.ngrok.io -> http://localhost:8000
```

Copy URL này: `https://abc123.ngrok.io`

### Bước 5: Cấu Hình Webhook trong Facebook App

1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Chọn App của bạn
3. Vào **Messenger** → **Settings** → **Webhooks**
4. Click **Add Callback URL**

**Nhập thông tin:**
- **Callback URL**: `https://abc123.ngrok.io/api/v1/webhooks/facebook`
- **Verify Token**: `wataomi_verify_token_2025`

5. Click **Verify and Save**

**Nếu thành công:**
```
✅ Webhook verified successfully
```

### Bước 6: Subscribe to Webhook Events

Trong phần **Webhooks**, subscribe to:
- ✅ `messages`
- ✅ `messaging_postbacks`
- ✅ `messaging_optins`
- ✅ `message_deliveries`
- ✅ `message_reads`

Click **Save**

### Bước 7: Subscribe App to Page

1. Vẫn trong **Webhooks** section
2. Tìm phần **Select a page to subscribe your webhook**
3. Chọn Facebook Page của bạn
4. Click **Subscribe**

### Bước 8: Test Nhận Tin Nhắn

1. Mở Facebook Page của bạn
2. Gửi tin nhắn từ tài khoản cá nhân: "Hello bot!"
3. Kiểm tra logs backend:

```bash
# Terminal backend
📩 Received Facebook message from 123456789: Hello bot!
✅ Sent response to 123456789
```

4. Kiểm tra ngrok logs:

```bash
# Terminal ngrok
POST /api/v1/webhooks/facebook 200 OK
```

---

## 🧪 Testing Scripts

### Test 1: Kiểm Tra Kết Nối

```bash
npx ts-node scripts/test-facebook.ts
```

### Test 2: Gửi Tin Nhắn

```bash
npx ts-node scripts/send-facebook-message.ts
```

**Nhập:**
- Recipient ID: (Facebook User ID của người nhận)
- Message: "Hello from bot!"

---

## 📊 Kiểm Tra Webhook Logs

### Backend Logs

```bash
# Check logs
tail -f logs/app.log | grep "Facebook"
```

### Ngrok Logs

Truy cập: `http://localhost:4040`

Xem tất cả requests đến webhook

---

## 🔍 Debug Common Issues

### Issue 1: "Invalid webhook signature"

**Nguyên nhân:** App Secret không đúng

**Giải pháp:**
1. Kiểm tra `FACEBOOK_APP_SECRET` trong `.env`
2. Lấy App Secret từ Facebook App Dashboard
3. Restart backend server

### Issue 2: "Webhook verification failed"

**Nguyên nhân:** Verify Token không khớp

**Giải pháp:**
1. Kiểm tra `FACEBOOK_VERIFY_TOKEN` trong `.env`
2. Đảm bảo token trong Facebook App Settings khớp
3. Restart backend server

### Issue 3: "No response from bot"

**Nguyên nhân:** Bot chưa được cấu hình

**Giải pháp:**
1. Tạo bot trong hệ thống:

```bash
POST /api/v1/bots
{
  "name": "Facebook Support Bot",
  "systemPrompt": "Bạn là trợ lý hỗ trợ khách hàng",
  "aiModel": "gemini-2.0-flash",
  "enableAutoLearn": true
}
```

2. Gán bot cho channel Facebook

### Issue 4: "Token expired"

**Nguyên nhân:** Page Access Token hết hạn

**Giải pháp:**
1. Tạo Long-lived Page Access Token:

```bash
# Get long-lived token
curl -X GET "https://graph.facebook.com/v24.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

2. Cập nhật token mới vào `.env`

---

## 📝 Webhook Payload Example

### Incoming Message

```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1234567890,
      "messaging": [
        {
          "sender": {
            "id": "USER_ID"
          },
          "recipient": {
            "id": "PAGE_ID"
          },
          "timestamp": 1234567890,
          "message": {
            "mid": "MESSAGE_ID",
            "text": "Hello bot!"
          }
        }
      ]
    }
  ]
}
```

### Backend Response

```json
{
  "success": true
}
```

---

## 🎯 Next Steps

### 1. Tạo Bot với Knowledge Base

```bash
# 1. Tạo Knowledge Base
POST /api/v1/knowledge-bases
{
  "name": "Product Documentation",
  "description": "Tài liệu sản phẩm"
}

# 2. Upload tài liệu
POST /api/v1/knowledge-bases/documents/upload
(multipart/form-data with file)

# 3. Tạo bot
POST /api/v1/bots
{
  "name": "Support Bot",
  "enableAutoLearn": true
}

# 4. Link KB với bot
POST /api/v1/bots/{botId}/knowledge-bases
{
  "knowledgeBaseId": "kb-id",
  "priority": 1
}
```

### 2. Customize Bot Response

Chỉnh sửa `bot-execution.service.ts` để:
- Thêm custom logic
- Tích hợp với hệ thống khác
- Thêm analytics

### 3. Deploy to Production

```bash
# 1. Deploy backend lên server (VPS, AWS, etc.)
# 2. Cấu hình domain: https://api.yourdomain.com
# 3. Update webhook URL trong Facebook App
# 4. Test với production URL
```

---

## 📚 Tài Liệu Tham Khảo

- [Facebook Messenger Platform Docs](https://developers.facebook.com/docs/messenger-platform)
- [Webhook Reference](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Send API Reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api)

---

## ✅ Checklist

- [ ] Backend đã chạy
- [ ] Token đã cấu hình trong `.env`
- [ ] Webhook URL đã verify thành công
- [ ] Subscribed to webhook events
- [ ] App đã subscribe to page
- [ ] Test gửi tin nhắn thành công
- [ ] Bot đã được tạo và cấu hình
- [ ] Nhận được response từ bot

---

## 🆘 Cần Hỗ Trợ?

Nếu gặp vấn đề, kiểm tra:
1. Backend logs: `tail -f logs/app.log`
2. Ngrok logs: `http://localhost:4040`
3. Facebook App Dashboard → Webhooks → Recent Deliveries
4. Test webhook với curl:

```bash
curl -X POST "http://localhost:8000/api/v1/webhooks/facebook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "page-id",
      "messaging": [{
        "sender": {"id": "user-123"},
        "message": {"text": "test"}
      }]
    }]
  }'
```
