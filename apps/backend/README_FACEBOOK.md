# 📘 Facebook Messenger Integration - Backend

## 🎯 Tóm Tắt Nhanh

Bạn đã có:
- ✅ Page Access Token
- ✅ App ID & Secret
- ✅ Backend code đã sẵn sàng

## 🚀 Quick Start (3 Bước)

### 1. Test Kết Nối

```bash
cd apps/backend
npm run test:facebook
```

**Kết quả mong đợi:**
```
✅ Page Info:
   - ID: 123456789
   - Name: Your Page Name
✅ Facebook Connection Test PASSED
```

### 2. Start Backend

```bash
npm run start:dev
```

Server chạy tại: `http://localhost:8000`

### 3. Setup Webhook (Chọn 1 trong 2)

#### Option A: Test Local với ngrok

```bash
# Terminal mới
ngrok http 8000

# Copy URL: https://abc123.ngrok.io
```

Webhook URL: `https://abc123.ngrok.io/api/v1/webhooks/facebook`

#### Option B: Deploy Production

Deploy backend lên server, webhook URL: `https://your-domain.com/api/v1/webhooks/facebook`

---

## 📝 Cấu Hình Facebook App

### 1. Truy cập Facebook Developers

https://developers.facebook.com/apps/YOUR_APP_ID/messenger/settings/

### 2. Setup Webhook

**Webhooks Section:**
- Click **Add Callback URL**
- **Callback URL**: `https://abc123.ngrok.io/api/v1/webhooks/facebook`
- **Verify Token**: `wataomi_verify_token_2025`
- Click **Verify and Save**

### 3. Subscribe to Events

Chọn các events:
- ✅ `messages`
- ✅ `messaging_postbacks`
- ✅ `messaging_optins`

### 4. Subscribe App to Page

- Chọn Facebook Page của bạn
- Click **Subscribe**

---

## 🧪 Testing

### Test 1: Verify Webhook

```bash
# Facebook sẽ gọi endpoint này
GET /api/v1/webhooks/facebook?hub.mode=subscribe&hub.verify_token=wataomi_verify_token_2025&hub.challenge=123

# Backend response: 123
```

### Test 2: Gửi Tin Nhắn Test

```bash
npm run send:facebook
```

Nhập:
- Recipient ID: (Facebook User ID)
- Message: "Hello from bot!"

### Test 3: Nhận Tin Nhắn

1. Mở Facebook Page
2. Gửi tin nhắn: "Hello bot!"
3. Kiểm tra logs:

```bash
# Backend logs
📩 Received Facebook message from 123456789: Hello bot!
🤖 Processing message...
✅ Sent response to 123456789
```

---

## 📊 Monitoring

### Backend Logs

```bash
# Watch logs
tail -f logs/app.log | grep "Facebook"
```

### Ngrok Dashboard

Truy cập: `http://localhost:4040`

Xem tất cả webhook requests

### Facebook Webhooks Dashboard

https://developers.facebook.com/apps/YOUR_APP_ID/webhooks/

Xem **Recent Deliveries**

---

## 🔧 Troubleshooting

### ❌ "Invalid webhook signature"

**Fix:**
```bash
# Check .env
FACEBOOK_APP_SECRET=your-correct-app-secret

# Restart server
npm run start:dev
```

### ❌ "Webhook verification failed"

**Fix:**
```bash
# Check .env
FACEBOOK_VERIFY_TOKEN=wataomi_verify_token_2025

# Make sure token matches in Facebook App
```

### ❌ "Token expired"

**Fix:**
```bash
# Get new long-lived token
curl "https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"

# Update .env
FACEBOOK_PAGE_ACCESS_TOKEN=new_token_here
```

### ❌ "No response from bot"

**Fix:**
1. Kiểm tra bot đã được tạo chưa
2. Kiểm tra bot-execution.service.ts
3. Xem logs để debug

---

## 📁 File Structure

```
apps/backend/
├── src/
│   ├── channels/
│   │   ├── providers/
│   │   │   └── facebook.provider.ts    # Facebook API integration
│   │   ├── webhooks.controller.ts      # Webhook endpoints
│   │   ├── channels.service.ts         # Channel management
│   │   └── channel.strategy.ts         # Multi-channel strategy
│   ├── bots/
│   │   └── bot-execution.service.ts    # Bot logic & AI
│   └── conversations/
│       └── conversations.service.ts    # Message storage
├── scripts/
│   ├── test-facebook.ts                # Test connection
│   └── send-facebook-message.ts        # Send test message
└── .env                                # Configuration
```

---

## 🎯 Next Steps

### 1. Tạo Bot

```bash
POST /api/v1/bots
{
  "name": "Facebook Support Bot",
  "systemPrompt": "Bạn là trợ lý hỗ trợ khách hàng chuyên nghiệp",
  "aiModel": "gemini-2.0-flash",
  "enableAutoLearn": true
}
```

### 2. Tạo Knowledge Base

```bash
POST /api/v1/knowledge-bases
{
  "name": "Product Docs",
  "description": "Tài liệu sản phẩm"
}
```

### 3. Upload Tài Liệu

```bash
POST /api/v1/knowledge-bases/documents/upload
Content-Type: multipart/form-data

file: your-document.pdf
```

### 4. Link Bot với KB

```bash
POST /api/v1/bots/{botId}/knowledge-bases
{
  "knowledgeBaseId": "kb-id",
  "priority": 1
}
```

---

## 📚 API Endpoints

### Webhooks

```
GET  /api/v1/webhooks/facebook          # Verify webhook
POST /api/v1/webhooks/facebook          # Receive messages
```

### Channels

```
GET    /api/v1/channels                 # List connections
POST   /api/v1/channels                 # Create connection
DELETE /api/v1/channels/:id             # Delete connection
```

### Conversations

```
GET /api/v1/conversations               # List conversations
GET /api/v1/conversations/:id           # Get conversation detail
```

---

## 🔐 Environment Variables

```bash
# Facebook
FACEBOOK_PAGE_ACCESS_TOKEN=EAAMHoYwFnBwBQ...
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_VERIFY_TOKEN=wataomi_verify_token_2025

# Server
APP_PORT=8000
BACKEND_DOMAIN=https://your-domain.com

# Database
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=wataomi

# AI
GOOGLE_API_KEY=your-google-api-key
```

---

## ✅ Checklist

- [ ] Token đã cấu hình trong `.env`
- [ ] Test connection thành công (`npm run test:facebook`)
- [ ] Backend đang chạy (`npm run start:dev`)
- [ ] Webhook URL đã verify
- [ ] Subscribed to events
- [ ] App subscribed to page
- [ ] Test gửi tin nhắn thành công
- [ ] Test nhận tin nhắn thành công
- [ ] Bot đã được tạo
- [ ] Knowledge Base đã setup (optional)

---

## 📖 Documentation

- [Full Omnichannel Guide](../../docs/OMNICHANNEL_GUIDE.md)
- [Code Examples](../../docs/OMNICHANNEL_EXAMPLES.md)
- [Facebook Quick Start](../../docs/FACEBOOK_QUICK_START.md)

---

## 🆘 Support

Nếu gặp vấn đề:
1. Check logs: `tail -f logs/app.log`
2. Check ngrok: `http://localhost:4040`
3. Check Facebook webhooks dashboard
4. Test với curl:

```bash
curl -X POST "http://localhost:8000/api/v1/webhooks/facebook" \
  -H "Content-Type: application/json" \
  -d '{"object":"page","entry":[{"messaging":[{"sender":{"id":"123"},"message":{"text":"test"}}]}]}'
```
