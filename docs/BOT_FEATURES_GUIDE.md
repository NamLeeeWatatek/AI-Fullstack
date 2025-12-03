# Hướng Dẫn Sử Dụng Bot - Tính Năng Đầy Đủ

## Tổng Quan

Bot trong hệ thống có thể:
- ✅ **Tự động lấy workspaceId** từ user (không cần gửi thủ công)
- 🤖 **Học từ Knowledge Base** - Truy cập và tìm kiếm tài liệu
- 🔄 **Sử dụng Flows** - Xây dựng luồng hội thoại phức tạp
- ⚡ **Functions** - Thực thi các chức năng tùy chỉnh
- 🎨 **UI/UX Design** - Tích hợp vào giao diện người dùng

---

## 1. Tạo Bot

### API Request

```bash
POST /api/v1/bots
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Customer Support Bot",
  "description": "Bot hỗ trợ khách hàng 24/7",
  "systemPrompt": "Bạn là trợ lý hỗ trợ khách hàng chuyên nghiệp, thân thiện và nhiệt tình.",
  "aiModel": "gemini-2.0-flash",
  "enableAutoLearn": true
}
```

**Lưu ý:** `workspaceId` sẽ tự động được lấy từ workspace đầu tiên của user.

### Response

```json
{
  "id": "bot-123",
  "workspaceId": "workspace-456",
  "name": "Customer Support Bot",
  "status": "draft",
  "createdAt": "2025-12-02T10:00:00Z"
}
```

---

## 2. Liên Kết Knowledge Base

Bot có thể học từ nhiều Knowledge Base với độ ưu tiên khác nhau.

### API Request

```bash
POST /api/v1/bots/bot-123/knowledge-bases
Authorization: Bearer <token>
Content-Type: application/json

{
  "knowledgeBaseId": "kb-789",
  "priority": 1,
  "ragSettings": {
    "maxResults": 5,
    "minScore": 0.7,
    "includeMetadata": true
  }
}
```

### Cấu Hình RAG Settings

```typescript
interface RagSettings {
  maxResults?: number      // Số lượng kết quả tối đa (mặc định: 5)
  minScore?: number        // Điểm tối thiểu (0-1, mặc định: 0.7)
  includeMetadata?: boolean // Bao gồm metadata (mặc định: true)
  searchMode?: 'semantic' | 'hybrid' | 'keyword'
}
```

---

## 3. Tạo Flow Version

Flow định nghĩa luồng hội thoại của bot.

### API Request

```bash
POST /api/v1/bots/bot-123/versions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Version 1.0 - Basic Support",
  "description": "Luồng hỗ trợ cơ bản",
  "flow": {
    "nodes": [
      {
        "id": "start",
        "type": "trigger",
        "data": {
          "trigger": "user_message"
        }
      },
      {
        "id": "search_kb",
        "type": "knowledge_base",
        "data": {
          "action": "search",
          "query": "{{user_message}}",
          "maxResults": 3
        }
      },
      {
        "id": "ai_response",
        "type": "ai_chat",
        "data": {
          "model": "gemini-2.0-flash",
          "prompt": "Dựa trên thông tin: {{search_kb.results}}\n\nTrả lời câu hỏi: {{user_message}}",
          "temperature": 0.7
        }
      },
      {
        "id": "send_message",
        "type": "send_message",
        "data": {
          "message": "{{ai_response.content}}"
        }
      }
    ],
    "edges": [
      { "source": "start", "target": "search_kb" },
      { "source": "search_kb", "target": "ai_response" },
      { "source": "ai_response", "target": "send_message" }
    ]
  }
}
```

### Publish Flow

```bash
POST /api/v1/bots/bot-123/versions/version-456/publish
Authorization: Bearer <token>
```

---

## 4. Bot Functions

Functions cho phép bot thực hiện các tác vụ đặc biệt.

### 4.1. Document Access Function

Tìm kiếm tài liệu trong Knowledge Base.

```bash
POST /api/v1/bots/bot-123/functions
Authorization: Bearer <token>
Content-Type: application/json

{
  "botId": "bot-123",
  "functionType": "document_access",
  "name": "Search Product Docs",
  "description": "Tìm kiếm tài liệu sản phẩm",
  "isEnabled": true,
  "config": {
    "maxResults": 5,
    "minScore": 0.75
  }
}
```

### 4.2. Auto Fill Function

Tự động điền form dựa trên context.

```bash
POST /api/v1/bots/bot-123/functions
Authorization: Bearer <token>
Content-Type: application/json

{
  "botId": "bot-123",
  "functionType": "auto_fill",
  "name": "Auto Fill Customer Info",
  "description": "Tự động điền thông tin khách hàng",
  "isEnabled": true,
  "config": {
    "targetFields": ["email", "phone", "address"],
    "confidence": 0.8,
    "model": "gemini-2.0-flash"
  }
}
```

### 4.3. AI Suggest Function

Gợi ý thông minh dựa trên AI.

```bash
POST /api/v1/bots/bot-123/functions
Authorization: Bearer <token>
Content-Type: application/json

{
  "botId": "bot-123",
  "functionType": "ai_suggest",
  "name": "Smart Reply Suggestions",
  "description": "Gợi ý câu trả lời thông minh",
  "isEnabled": true,
  "config": {
    "model": "gemini-2.0-flash",
    "temperature": 0.7,
    "maxSuggestions": 3
  }
}
```

### 4.4. Execute Function

```bash
POST /api/v1/bots/functions/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "functionId": "func-123",
  "input": {
    "query": "Làm thế nào để reset mật khẩu?",
    "maxResults": 5
  },
  "context": {
    "userId": "user-789",
    "conversationId": "conv-456"
  }
}
```

**Response:**

```json
{
  "success": true,
  "functionType": "document_access",
  "results": [
    {
      "content": "Để reset mật khẩu, bạn vào Settings > Security > Reset Password...",
      "score": 0.92,
      "metadata": {
        "documentId": "doc-123",
        "title": "Hướng dẫn bảo mật"
      }
    }
  ],
  "count": 3
}
```

---

## 5. UI/UX Integration

### 5.1. Chat Widget

```typescript
// apps/web/components/features/bots/bot-chat-widget.tsx
import { useState } from 'react'
import { executeBotFunction } from '@/lib/api/bots'

export function BotChatWidget({ botId }: { botId: string }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const sendMessage = async () => {
    // Thêm tin nhắn user
    setMessages(prev => [...prev, { role: 'user', content: input }])
    
    // Gọi bot function
    const response = await executeBotFunction({
      functionId: 'func-ai-suggest',
      input: { query: input },
      context: { botId }
    })
    
    // Thêm phản hồi bot
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: response.suggestion 
    }])
    
    setInput('')
  }

  return (
    <div className="bot-chat-widget">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
      />
    </div>
  )
}
```

### 5.2. Auto Fill Component

```typescript
// apps/web/components/features/bots/auto-fill-input.tsx
import { useState, useEffect } from 'react'
import { executeBotFunction } from '@/lib/api/bots'

export function AutoFillInput({ 
  functionId, 
  field, 
  context,
  value,
  onChange 
}: AutoFillInputProps) {
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading] = useState(false)

  const getSuggestion = async () => {
    setLoading(true)
    try {
      const response = await executeBotFunction({
        functionId,
        input: { field, context, currentValue: value }
      })
      setSuggestion(response.suggestion)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auto-fill-input">
      <input 
        value={value} 
        onChange={e => onChange(e.target.value)}
      />
      <button onClick={getSuggestion} disabled={loading}>
        {loading ? 'Đang gợi ý...' : '✨ Gợi ý AI'}
      </button>
      {suggestion && (
        <div className="suggestion">
          <span>{suggestion}</span>
          <button onClick={() => onChange(suggestion)}>
            Áp dụng
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## 6. Kịch Bản Sử Dụng Thực Tế

### 6.1. Bot Hỗ Trợ Khách Hàng

```typescript
// 1. Tạo bot
const bot = await createBot({
  name: "Support Bot",
  systemPrompt: "Bạn là trợ lý hỗ trợ khách hàng chuyên nghiệp",
  aiModel: "gemini-2.0-flash",
  enableAutoLearn: true
})

// 2. Liên kết Knowledge Base
await linkKnowledgeBase(bot.id, {
  knowledgeBaseId: "kb-product-docs",
  priority: 1,
  ragSettings: { maxResults: 5, minScore: 0.7 }
})

// 3. Tạo function tìm kiếm
const searchFunc = await createBotFunction({
  botId: bot.id,
  functionType: "document_access",
  name: "Search Docs",
  config: { maxResults: 5 }
})

// 4. Tạo flow
await createBotFlowVersion(bot.id, {
  name: "Support Flow v1",
  flow: {
    nodes: [
      { id: "start", type: "trigger" },
      { id: "search", type: "knowledge_base" },
      { id: "ai_response", type: "ai_chat" },
      { id: "send", type: "send_message" }
    ],
    edges: [
      { source: "start", target: "search" },
      { source: "search", target: "ai_response" },
      { source: "ai_response", target: "send" }
    ]
  }
})

// 5. Activate bot
await activateBot(bot.id)
```

### 6.2. Bot Điền Form Tự Động

```typescript
// 1. Tạo bot với auto-fill
const bot = await createBot({
  name: "Form Assistant",
  systemPrompt: "Bạn giúp người dùng điền form nhanh chóng và chính xác"
})

// 2. Tạo auto-fill function
const autoFillFunc = await createBotFunction({
  botId: bot.id,
  functionType: "auto_fill",
  name: "Smart Form Fill",
  config: {
    targetFields: ["email", "phone", "address", "company"],
    confidence: 0.8
  }
})

// 3. Sử dụng trong UI
<AutoFillInput
  functionId={autoFillFunc.id}
  field="email"
  context="User is John Doe from Acme Corp"
  value={email}
  onChange={setEmail}
/>
```

---

## 7. Best Practices

### 7.1. Tối Ưu Knowledge Base

```typescript
// Cấu hình RAG tốt nhất
const ragSettings = {
  maxResults: 5,           // Không quá nhiều để tránh nhiễu
  minScore: 0.7,           // Đủ cao để đảm bảo chất lượng
  searchMode: 'hybrid',    // Kết hợp semantic + keyword
  includeMetadata: true    // Để hiển thị nguồn
}
```

### 7.2. System Prompt Hiệu Quả

```typescript
const systemPrompt = `
Bạn là trợ lý AI chuyên nghiệp với các đặc điểm:
- Thân thiện, nhiệt tình
- Trả lời ngắn gọn, súc tích
- Luôn dựa trên tài liệu được cung cấp
- Nếu không biết, thừa nhận và đề xuất liên hệ support
- Sử dụng tiếng Việt tự nhiên
`
```

### 7.3. Error Handling

```typescript
try {
  const response = await executeBotFunction({
    functionId: 'func-123',
    input: { query: userMessage }
  })
  
  if (!response.success) {
    // Fallback to default response
    return "Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại."
  }
  
  return response.result
} catch (error) {
  console.error('Bot function error:', error)
  return "Đã xảy ra lỗi. Vui lòng liên hệ support."
}
```

---

## 8. API Reference

### Bot Management
- `POST /api/v1/bots` - Tạo bot
- `GET /api/v1/bots?workspaceId=xxx` - Lấy danh sách bot
- `GET /api/v1/bots/:id` - Lấy chi tiết bot
- `PATCH /api/v1/bots/:id` - Cập nhật bot
- `DELETE /api/v1/bots/:id` - Xóa bot
- `POST /api/v1/bots/:id/activate` - Kích hoạt bot
- `POST /api/v1/bots/:id/pause` - Tạm dừng bot

### Knowledge Base
- `POST /api/v1/bots/:id/knowledge-bases` - Liên kết KB
- `GET /api/v1/bots/:id/knowledge-bases` - Lấy danh sách KB
- `DELETE /api/v1/bots/:id/knowledge-bases/:kbId` - Hủy liên kết
- `PATCH /api/v1/bots/:id/knowledge-bases/:kbId/toggle` - Bật/tắt KB

### Flow Versions
- `POST /api/v1/bots/:id/versions` - Tạo version
- `GET /api/v1/bots/:id/versions` - Lấy danh sách version
- `POST /api/v1/bots/:id/versions/:versionId/publish` - Publish version

### Functions
- `POST /api/v1/bots/:id/functions` - Tạo function
- `GET /api/v1/bots/:id/functions` - Lấy danh sách function
- `PATCH /api/v1/bots/functions/:functionId` - Cập nhật function
- `DELETE /api/v1/bots/functions/:functionId` - Xóa function
- `POST /api/v1/bots/functions/execute` - Thực thi function

---

## Kết Luận

Bot system hiện tại đã hỗ trợ đầy đủ:
- ✅ Tự động lấy workspace
- ✅ Tích hợp Knowledge Base với RAG
- ✅ Flow-based conversation
- ✅ Extensible functions
- ✅ UI components sẵn sàng

Bạn có thể xây dựng bot phức tạp với khả năng học từ tài liệu, thực thi logic tùy chỉnh, và tích hợp vào UI một cách linh hoạt.
