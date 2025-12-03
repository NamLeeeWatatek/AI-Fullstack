# KẾ HOẠCH CLEANUP VÀ ĐỒNG BỘ FRONTEND-BACKEND

## TỔNG QUAN VẤN ĐỀ

Sau khi phân tích codebase, phát hiện các vấn đề chính:

### 1. **Trang dư thừa không cần thiết**
Frontend có nhiều trang không khớp với business requirements:

#### ❌ Các trang CẦN XÓA:
- `/analytics` - Chưa có trong requirements
- `/archives` - Không cần thiết, có thể filter trong danh sách
- `/files` - Đã có trong Knowledge Base documents
- `/inbox` - Không có trong requirements
- `/nodes` - Chỉ là internal config, không cần UI riêng
- `/settings/categories` - Không có trong requirements
- `/settings/icons` - Không cần thiết
- `/settings/tags` - Không có trong requirements
- `/team` - Chưa có trong requirements (có thể thêm sau)

#### ✅ Các trang CẦN GIỮ:
- `/dashboard` - Trang chủ
- `/bots` - Quản lý bot
- `/flows` - Quản lý workflow
- `/knowledge-base` - Quản lý KB
- `/channels` - Tích hợp kênh
- `/integrations` - OAuth integrations
- `/chat` - Test bot
- `/templates` - Template library
- `/settings` - Cài đặt chung

---

## 2. **API CALLS CHƯA ĐÚNG LOGIC BACKEND**

### 2.1. Knowledge Base API

#### ❌ VẤN ĐỀ:
Frontend đang gọi:
```typescript
// Frontend
GET /knowledge-bases?workspaceId=xxx
POST /knowledge-bases
GET /knowledge-bases/:id
PATCH /knowledge-bases/:id
DELETE /knowledge-bases/:id
```

Backend thực tế:
```typescript
// Backend - Tự động lấy userId từ JWT token
GET /knowledge-bases?workspaceId=xxx  // ✅ Đúng
POST /knowledge-bases                  // ✅ Đúng
GET /knowledge-bases/:id               // ✅ Đúng
PATCH /knowledge-bases/:id             // ✅ Đúng
DELETE /knowledge-bases/:id            // ✅ Đúng
```

**Kết luận**: Knowledge Base API đã đúng ✅

---

### 2.2. Bots API

#### ❌ VẤN ĐỀ:
Frontend THIẾU các API quan trọng:

```typescript
// Frontend CHƯA CÓ:
POST /bots/:id/versions              // Tạo flow version
POST /bots/versions/:versionId/publish  // Publish version
POST /bots/:id/functions             // Bot functions
GET /bots/:id/functions
```

Backend có đầy đủ:
```typescript
// Backend
POST /bots
GET /bots?workspaceId=xxx
GET /bots/:id
PATCH /bots/:id
DELETE /bots/:id
POST /bots/:id/versions              // ⚠️ Frontend thiếu
POST /bots/versions/:versionId/publish  // ⚠️ Frontend thiếu
POST /bots/:id/functions             // ⚠️ Frontend thiếu
GET /bots/:id/functions              // ⚠️ Frontend thiếu
POST /bots/functions/execute         // ⚠️ Frontend thiếu
```

**Giải pháp**: Cần tạo `apps/web/lib/api/bots.ts` với đầy đủ API

---

### 2.3. Flows API

#### ❌ VẤN ĐỀ:
Frontend đang gọi:
```typescript
// Frontend
GET /flows/
POST /flows/
GET /flows/:id
PATCH /flows/:id
DELETE /flows/:id
POST /flows/:id/duplicate  // ⚠️ Backend KHÔNG CÓ
POST /flows/:id/archive    // ⚠️ Backend KHÔNG CÓ
```

Backend thực tế:
```typescript
// Backend
GET /flows                    // ✅ Đúng
POST /flows                   // ✅ Đúng
POST /flows/from-template     // ⚠️ Frontend thiếu
GET /flows/:id                // ✅ Đúng
PATCH /flows/:id              // ✅ Đúng
DELETE /flows/:id             // ✅ Đúng
POST /flows/:id/execute       // ⚠️ Frontend thiếu
GET /flows/:id/executions     // ⚠️ Frontend thiếu
GET /flows/executions/:executionId  // ⚠️ Frontend thiếu
```

**Giải pháp**: 
- Xóa `duplicateFlow()` và `archiveFlow()` trong frontend
- Thêm `createFlowFromTemplate()`, `executeFlow()`, `getExecutions()`

---

### 2.4. Conversations API

#### ✅ ĐÚNG:
Frontend và Backend đã khớp:
```typescript
// Bot Conversations
GET /conversations?botId=xxx
GET /conversations/:id
POST /conversations
GET /conversations/:id/messages
POST /conversations/:id/messages

// AI Conversations (Internal chat)
GET /ai-conversations
GET /ai-conversations/:id
POST /ai-conversations
PATCH /ai-conversations/:id
DELETE /ai-conversations/:id
POST /ai-conversations/:id/messages
```

**Kết luận**: Conversations API đã đúng ✅

---

### 2.5. Channels API

#### ❌ VẤN ĐỀ:
Frontend đang gọi:
```typescript
// Frontend
GET /channels/types
GET /channels/types/categories
GET /channels/
DELETE /channels/:id
GET /integrations/
POST /integrations/
PATCH /integrations/:id
DELETE /integrations/:id
GET /oauth/login/:provider?configId=xxx
```

Cần kiểm tra backend có đầy đủ không.

---

## 3. **LOGIC NGHIỆP VỤ CHƯA ĐÚNG**

### 3.1. Bot Flow Versioning

#### ❌ VẤN ĐỀ:
Frontend CHƯA implement logic:
- Tạo phiên bản flow mới
- Publish phiên bản cụ thể
- Chỉ có 1 phiên bản published tại một thời điểm

#### ✅ GIẢI PHÁP:
Cần thêm UI trong `/bots/[id]`:
```typescript
// Tạo version mới
POST /bots/:id/versions
Body: { flow: {...} }

// Publish version
POST /bots/versions/:versionId/publish

// UI hiển thị:
- Danh sách versions
- Version nào đang published
- Nút "Create New Version"
- Nút "Publish" cho từng version
```

---

### 3.2. Knowledge Base Chunking

#### ❌ VẤN ĐỀ:
Frontend CHƯA có UI để cấu hình:
- Chunk size (mặc định: 1000 tokens)
- Chunk overlap (mặc định: 200 tokens)
- Embedding model

#### ✅ GIẢI PHÁP:
Thêm form trong `/knowledge-base/collections/[id]/settings`:
```typescript
interface KBSettings {
  chunkSize: number;      // 500-2000
  chunkOverlap: number;   // 0-500
  embeddingModel: string; // 'gemini-embedding', 'openai-embedding'
}
```

---

### 3.3. RAG Query & Answer

#### ❌ VẤN ĐỀ:
Frontend CHƯA có UI để:
- Test query knowledge base
- Xem similarity scores
- Hiển thị sources với citations

#### ✅ GIẢI PHÁP:
Tạo trang `/knowledge-base/collections/[id]/test`:
```typescript
// Query API
POST /knowledge-bases/query
Body: {
  query: "Câu hỏi",
  knowledgeBaseId: "kb-id",
  limit: 5,
  similarityThreshold: 0.7
}

// Answer API
POST /knowledge-bases/answer
Body: {
  question: "Câu hỏi",
  knowledgeBaseId: "kb-id",
  model: "gemini-1.5-flash"
}
```

---

### 3.4. Bot Functions

#### ❌ VẤN ĐỀ:
Frontend HOÀN TOÀN THIẾU tính năng Bot Functions:
- Tạo custom functions cho bot
- Execute functions
- Quản lý functions

#### ✅ GIẢI PHÁP:
Tạo trang `/bots/[id]/functions`:
```typescript
// API cần implement
POST /bots/:id/functions
GET /bots/:id/functions
PATCH /bots/functions/:functionId
DELETE /bots/functions/:functionId
POST /bots/functions/execute
```

---

## 4. **KẾ HOẠCH THỰC HIỆN**

### Phase 1: Cleanup (1-2 ngày)

#### Bước 1: Xóa các trang dư thừa
```bash
# Xóa các trang không cần thiết
rm -rf apps/web/app/(dashboard)/analytics
rm -rf apps/web/app/(dashboard)/archives
rm -rf apps/web/app/(dashboard)/files
rm -rf apps/web/app/(dashboard)/inbox
rm -rf apps/web/app/(dashboard)/nodes
rm -rf apps/web/app/(dashboard)/settings/categories
rm -rf apps/web/app/(dashboard)/settings/icons
rm -rf apps/web/app/(dashboard)/settings/tags
rm -rf apps/web/app/(dashboard)/team
```

#### Bước 2: Cập nhật navigation
Xóa các menu items không cần thiết trong:
- `apps/web/components/layout/sidebar.tsx`
- `apps/web/lib/constants/navigation.ts`

---

### Phase 2: Sửa API Calls (2-3 ngày)

#### Bước 1: Tạo Bots API
```typescript
// apps/web/lib/api/bots.ts
export async function createBot(data: CreateBotDto)
export async function getBots(workspaceId?: string)
export async function getBot(id: string)
export async function updateBot(id: string, data: UpdateBotDto)
export async function deleteBot(id: string)
export async function createBotVersion(id: string, flow: any)
export async function publishBotVersion(versionId: string)
export async function createBotFunction(data: CreateBotFunctionDto)
export async function getBotFunctions(botId: string)
export async function executeBotFunction(data: ExecuteBotFunctionDto)
```

#### Bước 2: Sửa Flows API
```typescript
// apps/web/lib/api/flows.ts
// XÓA:
- duplicateFlow()
- archiveFlow()

// THÊM:
+ createFlowFromTemplate()
+ executeFlow()
+ getFlowExecutions()
+ getExecutionDetails()
```

#### Bước 3: Kiểm tra Channels API
Verify backend có đầy đủ endpoints

---

### Phase 3: Implement Logic Nghiệp Vụ (3-5 ngày)

#### Bước 1: Bot Versioning UI
Tạo `/bots/[id]/versions`:
- Danh sách versions
- Create new version
- Publish version
- View version details

#### Bước 2: KB Settings UI
Tạo `/knowledge-base/collections/[id]/settings`:
- Chunk size slider
- Chunk overlap slider
- Embedding model selector

#### Bước 3: KB Test UI
Tạo `/knowledge-base/collections/[id]/test`:
- Query input
- Results với similarity scores
- Answer generation
- Sources display

#### Bước 4: Bot Functions UI
Tạo `/bots/[id]/functions`:
- Function list
- Create function form
- Edit function
- Execute function test

---

### Phase 4: Testing & Validation (2-3 ngày)

#### Checklist:
- [ ] Tất cả API calls đúng với backend
- [ ] Không còn trang dư thừa
- [ ] Bot versioning hoạt động
- [ ] KB chunking config hoạt động
- [ ] RAG query/answer hoạt động
- [ ] Bot functions hoạt động
- [ ] Navigation menu clean
- [ ] No console errors
- [ ] TypeScript no errors

---

## 5. **DANH SÁCH API CẦN TẠO/SỬA**

### Cần TẠO MỚI:
```typescript
// apps/web/lib/api/bots.ts - HOÀN TOÀN MỚI
export * from './bots'

// apps/web/lib/types/bot.ts - HOÀN TOÀN MỚI
export interface Bot { ... }
export interface BotVersion { ... }
export interface BotFunction { ... }
```

### Cần SỬA:
```typescript
// apps/web/lib/api/flows.ts
- Xóa duplicateFlow, archiveFlow
+ Thêm createFromTemplate, execute, getExecutions

// apps/web/lib/api/knowledge-base.ts
✅ Đã đúng, không cần sửa

// apps/web/lib/api/conversations.ts
✅ Đã đúng, không cần sửa

// apps/web/lib/api/channels.ts
⚠️ Cần verify với backend
```

---

## 6. **PRIORITY ORDER**

### 🔴 HIGH PRIORITY (Làm ngay):
1. Tạo `apps/web/lib/api/bots.ts` - Bot API đầy đủ
2. Sửa `apps/web/lib/api/flows.ts` - Xóa API không tồn tại
3. Xóa các trang dư thừa
4. Cập nhật navigation menu

### 🟡 MEDIUM PRIORITY (Tuần sau):
5. Implement Bot Versioning UI
6. Implement KB Settings UI
7. Implement KB Test/Query UI

### 🟢 LOW PRIORITY (Có thể làm sau):
8. Implement Bot Functions UI
9. Optimize performance
10. Add more tests

---

## 7. **NOTES**

### Backend đã đúng:
- ✅ Knowledge Base API
- ✅ Conversations API
- ✅ Flows API (có thêm features)
- ✅ Bots API (đầy đủ)

### Frontend cần sửa:
- ❌ Thiếu Bots API client
- ❌ Flows API có methods không tồn tại
- ❌ Nhiều trang dư thừa
- ❌ Thiếu UI cho versioning
- ❌ Thiếu UI cho KB settings
- ❌ Thiếu UI cho RAG testing
- ❌ Thiếu UI cho Bot Functions

---

## 8. **NEXT STEPS**

1. **Review document này với team**
2. **Approve plan**
3. **Bắt đầu Phase 1: Cleanup**
4. **Tiếp tục Phase 2-4 theo thứ tự**

---

**Tạo bởi**: Kiro AI Assistant  
**Ngày**: 2025-12-01  
**Status**: 📋 Draft - Chờ review
