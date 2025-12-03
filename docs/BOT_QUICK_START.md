# Bot System - Quick Start Guide

## ✅ Vấn Đề Đã Giải Quyết

### Lỗi: `workspaceId must be a UUID`

**Nguyên nhân:** Khi tạo bot, backend yêu cầu `workspaceId` nhưng không tự động lấy từ user.

**Giải pháp:** Backend đã được cập nhật để tự động lấy workspace mặc định của user.

### Các Thay Đổi

1. **Backend - Bots Controller** (`apps/backend/src/bots/bots.controller.ts`)
   - Tự động lấy `workspaceId` từ user nếu không được cung cấp
   
2. **Backend - Bots Service** (`apps/backend/src/bots/bots.service.ts`)
   - Thêm method `getUserDefaultWorkspace()` để lấy workspace đầu tiên của user
   - Validate `workspaceId` trước khi tạo bot

3. **Backend - Bot Functions Service** (`apps/backend/src/bots/bot-functions.service.ts`)
   - Verify bot tồn tại trước khi tạo function
   - Tự động lấy `workspaceId` từ bot

4. **Backend - Create Bot DTO** (`apps/backend/src/bots/dto/create-bot.dto.ts`)
   - `workspaceId` giờ là optional (sẽ tự động lấy nếu không có)

5. **Frontend - UI Components**
   - `BotChatWidget`: Widget chat AI với UI đẹp
   - `AutoFillInput`: Input tự động điền với AI
   - Demo page: `/bots/demo`

---

## 🚀 Cách Sử Dụng

### 1. Tạo Bot (Không Cần workspaceId)

```bash
POST /api/v1/bots
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "My Support Bot",
  "description": "Bot hỗ trợ khách hàng",
  "systemPrompt": "Bạn là trợ lý AI thân thiện",
  "aiModel": "gemini-2.0-flash",
  "enableAutoLearn": true
}
```

**workspaceId sẽ tự động được lấy từ workspace đầu tiên của user!**

### 2. Liên Kết Knowledge Base

```bash
POST /api/v1/bots/{botId}/knowledge-bases
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "knowledgeBaseId": "your-kb-id",
  "priority": 1,
  "ragSettings": {
    "maxResults": 5,
    "minScore": 0.7
  }
}
```

### 3. Tạo Bot Function

```bash
POST /api/v1/bots/{botId}/functions
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "botId": "your-bot-id",
  "functionType": "ai_suggest",
  "name": "Smart Assistant",
  "description": "AI assistant function",
  "isEnabled": true,
  "config": {
    "model": "gemini-2.0-flash",
    "temperature": 0.7
  }
}
```

### 4. Sử Dụng Trong UI

```tsx
import { BotChatWidget } from '@/components/features/bots/bot-chat-widget'

export default function MyPage() {
  return (
    <BotChatWidget
      botId="your-bot-id"
      functionId="your-function-id"
      placeholder="Hỏi tôi bất cứ điều gì..."
    />
  )
}
```

---

## 🎨 UI Components

### Bot Chat Widget

```tsx
<BotChatWidget
  botId="bot-123"
  functionId="func-456"
  className="h-[600px]"
  placeholder="Nhập tin nhắn..."
/>
```

**Features:**
- ✅ Real-time chat interface
- ✅ Message history
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

### Auto Fill Input

```tsx
<AutoFillInput
  functionId="func-autofill"
  field="email"
  context="User is John Doe from Acme Corp"
  value={email}
  onChange={setEmail}
  label="Email"
  placeholder="email@example.com"
/>
```

**Features:**
- ✅ AI-powered suggestions
- ✅ One-click apply
- ✅ Context-aware
- ✅ Loading states

---

## 📋 Function Types

### 1. Document Access
Tìm kiếm trong Knowledge Base

```json
{
  "functionType": "document_access",
  "config": {
    "maxResults": 5,
    "minScore": 0.7
  }
}
```

### 2. Auto Fill
Tự động điền form

```json
{
  "functionType": "auto_fill",
  "config": {
    "targetFields": ["email", "phone"],
    "confidence": 0.8,
    "model": "gemini-2.0-flash"
  }
}
```

### 3. AI Suggest
Gợi ý thông minh

```json
{
  "functionType": "ai_suggest",
  "config": {
    "model": "gemini-2.0-flash",
    "temperature": 0.7,
    "maxSuggestions": 3
  }
}
```

### 4. Custom
Function tùy chỉnh

```json
{
  "functionType": "custom",
  "config": {
    // Your custom config
  }
}
```

---

## 🔧 Testing

### Test Bot Creation

```bash
# Không cần workspaceId!
curl -X POST http://localhost:3000/api/v1/bots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bot",
    "systemPrompt": "You are a helpful assistant"
  }'
```

### Test Function Execution

```bash
curl -X POST http://localhost:3000/api/v1/bots/functions/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "functionId": "func-123",
    "input": {
      "query": "How to reset password?"
    }
  }'
```

---

## 📚 Tài Liệu Đầy Đủ

Xem thêm tại: `docs/BOT_FEATURES_GUIDE.md`

---

## 🎯 Next Steps

1. ✅ Tạo bot (workspaceId tự động)
2. ✅ Liên kết Knowledge Base
3. ✅ Tạo functions
4. ✅ Test với UI components
5. 🚀 Deploy và sử dụng!

---

## 💡 Tips

- Bot cần được **activate** trước khi sử dụng: `POST /api/v1/bots/{id}/activate`
- Function phải **enabled**: `isEnabled: true`
- Knowledge Base phải có **documents** để search
- Sử dụng **gemini-2.0-flash** cho performance tốt nhất

---

## 🐛 Troubleshooting

### Lỗi: "Bot not found"
- Kiểm tra botId có đúng không
- Kiểm tra bot có thuộc workspace của user không

### Lỗi: "Function disabled"
- Set `isEnabled: true` khi tạo function
- Hoặc update: `PATCH /api/v1/bots/functions/{id}`

### Lỗi: "No results from Knowledge Base"
- Kiểm tra KB có documents không
- Giảm `minScore` trong `ragSettings`
- Kiểm tra query có phù hợp không

---

## ✨ Tính Năng Nổi Bật

- 🤖 **Tự động lấy workspace** - Không cần gửi workspaceId thủ công
- 📚 **Knowledge Base Integration** - Bot học từ tài liệu
- 🔄 **Flow-based Conversations** - Xây dựng luồng phức tạp
- ⚡ **Extensible Functions** - Thêm chức năng tùy chỉnh
- 🎨 **Ready-to-use UI Components** - Tích hợp nhanh chóng
- 🌐 **Multi-language Support** - Hỗ trợ tiếng Việt

---

**Chúc bạn xây dựng bot thành công! 🚀**
