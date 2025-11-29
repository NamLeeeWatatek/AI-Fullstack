# Workflow System - WataOmi

Hệ thống workflow giống n8n đã được implement với đầy đủ tính năng.

## 📦 Modules

### 1. Node Types (`/api/v1/node-types`)
Các loại node có thể sử dụng trong workflow:

**Endpoints:**
- `GET /node-types` - Lấy tất cả node types
- `GET /node-types?category=ai` - Lọc theo category
- `GET /node-types/categories` - Lấy danh sách categories
- `GET /node-types/:id` - Lấy chi tiết node type

**Categories:**
- **Triggers**: webhook, schedule, manual
- **Messaging**: send-message, receive-message
- **AI**: ai-chat, ai-image (premium)
- **Data**: http-request, database-query
- **Logic**: condition, loop, delay
- **Transform**: code, json-transform

**Node Types có sẵn:**
1. Webhook - Trigger từ HTTP request
2. Schedule - Trigger theo lịch (cron/interval)
3. Manual Trigger - Trigger thủ công
4. Send Message - Gửi tin nhắn
5. Receive Message - Nhận tin nhắn
6. AI Chat - Chat với AI (GPT-4, Claude, Gemini)
7. AI Image - Tạo ảnh với AI (DALL-E, Stable Diffusion)
8. HTTP Request - Gọi API
9. Database Query - Query database
10. Condition - Rẽ nhánh theo điều kiện
11. Loop - Lặp qua items
12. Delay - Chờ một khoảng thời gian
13. Code - Chạy JavaScript code
14. JSON Transform - Transform dữ liệu JSON

### 2. Templates (`/api/v1/templates`)
Workflow templates có sẵn để user sử dụng:

**Endpoints:**
- `GET /templates` - Lấy tất cả templates
- `GET /templates?category=ai` - Lọc theo category
- `GET /templates?search=customer` - Tìm kiếm template
- `GET /templates/categories` - Lấy danh sách categories
- `GET /templates/:id` - Lấy chi tiết template

**Templates có sẵn:**
1. **Welcome Message Automation** - Tự động gửi tin nhắn chào mừng
2. **AI Customer Support Bot** - Chatbot hỗ trợ khách hàng (Premium)
3. **Daily Analytics Report** - Báo cáo phân tích hàng ngày
4. **AI Content Moderation** - Kiểm duyệt nội dung tự động (Premium)
5. **Lead Enrichment Pipeline** - Làm giàu dữ liệu lead
6. **Social Media Post Scheduler** - Lên lịch đăng bài social media

**Template Categories:**
- Messaging - Tự động hóa tin nhắn
- AI & ML - Workflows sử dụng AI
- Analytics - Phân tích và báo cáo
- Data Processing - Xử lý và tích hợp dữ liệu
- Social Media - Quản lý mạng xã hội

### 3. Flows (`/api/v1/flows`)
Quản lý workflows của user:

**Endpoints:**
- `GET /flows` - Lấy tất cả flows của user
- `POST /flows` - Tạo flow mới
- `GET /flows/:id` - Lấy chi tiết flow
- `PATCH /flows/:id` - Cập nhật flow
- `DELETE /flows/:id` - Xóa flow

### 4. Permissions (`/api/v1/permissions`)
Quản lý quyền và capabilities:

**Endpoints:**
- `GET /permissions/me/capabilities` - Lấy quyền của user hiện tại
- `POST /permissions/check` - Kiểm tra quyền cụ thể

## 🎨 Frontend Integration

Frontend đã có đầy đủ:
- ✅ Flow Builder với React Flow
- ✅ Node Types Store (Redux)
- ✅ Templates Store (Redux)
- ✅ Workflow Editor
- ✅ Permissions System

## 🚀 Usage Examples

### Tạo Flow từ Template:
```typescript
// 1. Lấy template
const template = await fetch('/api/v1/templates/welcome-message')

// 2. Tạo flow từ template
const flow = await fetch('/api/v1/flows', {
  method: 'POST',
  body: JSON.stringify({
    name: 'My Welcome Flow',
    templateId: template.id,
    data: {
      nodes: template.nodes,
      edges: template.edges
    }
  })
})
```

### Lấy Node Types theo Category:
```typescript
// Lấy tất cả AI nodes
const aiNodes = await fetch('/api/v1/node-types?category=ai')

// Lấy chi tiết một node
const webhookNode = await fetch('/api/v1/node-types/webhook')
```

## 📝 Next Steps

1. **Execution Engine** - Implement workflow execution
2. **Node Credentials** - Quản lý credentials cho nodes
3. **Workflow Versioning** - Version control cho workflows
4. **Workflow Testing** - Test workflows trước khi deploy
5. **Workflow Analytics** - Theo dõi execution metrics
6. **Custom Nodes** - Cho phép user tạo custom nodes
7. **Marketplace** - Template marketplace

## 🔐 Authentication

Tất cả endpoints (trừ public templates) yêu cầu JWT token:
```
Authorization: Bearer <token>
```

## 🎯 Features

- ✅ Node Types với properties động
- ✅ Template system với categories
- ✅ Flow management
- ✅ Permission-based access
- ✅ Premium nodes/templates
- ✅ Search và filter
- ✅ Usage tracking
- ⏳ Workflow execution (coming soon)
- ⏳ Real-time collaboration (coming soon)
