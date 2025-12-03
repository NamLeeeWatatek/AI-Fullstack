# MIGRATION GUIDE - Frontend API Updates

## Tổng quan

Document này hướng dẫn cách migrate code từ API cũ sang API mới đã được đồng bộ với backend.

---

## 1. BOT API - MỚI HOÀN TOÀN

### Import mới:
```typescript
// Trước (KHÔNG CÓ)
// Không có Bot API

// Sau (MỚI)
import { 
  getBots, 
  getBot, 
  createBot, 
  updateBot, 
  deleteBot,
  createBotFlowVersion,
  publishFlowVersion,
  getBotFunctions,
  createBotFunction,
  executeBotFunction
} from '@/lib/api/bots'
```

### Sử dụng:

#### Quản lý Bot:
```typescript
// Lấy danh sách bots
const bots = await getBots()
const workspaceBots = await getBots('workspace-id')

// Tạo bot mới
const newBot = await createBot({
  name: 'Customer Support Bot',
  description: 'Handles customer inquiries',
  workspaceId: 'workspace-id',
  systemPrompt: 'You are a helpful assistant',
  aiModel: 'gemini-1.5-flash',
  knowledgeBaseIds: ['kb-1', 'kb-2']
})

// Cập nhật bot
const updated = await updateBot('bot-id', {
  name: 'Updated Name',
  isActive: true
})

// Xóa bot
await deleteBot('bot-id')
```

#### Flow Versioning:
```typescript
// Tạo version mới
const version = await createBotFlowVersion('bot-id', {
  flow: { nodes: [...], edges: [...] }
})

// Publish version (chỉ 1 version được publish tại 1 thời điểm)
const published = await publishFlowVersion('version-id')
```

#### Bot Functions:
```typescript
// Lấy functions của bot
const functions = await getBotFunctions('bot-id')

// Tạo function mới
const func = await createBotFunction({
  botId: 'bot-id',
  functionType: 'ai_suggest',
  name: 'Auto Fill Email',
  config: { confidence: 0.8 }
})

// Execute function
const result = await executeBotFunction({
  functionId: 'func-id',
  input: { field: 'email', context: 'registration' }
})
```

---

## 2. FLOWS API - CẬP NHẬT

### Thay đổi:

#### ❌ XÓA (Không tồn tại trong backend):
```typescript
// XÓA - Backend không có
await duplicateFlow(id)
await archiveFlow(id)
```

#### ✅ THÊM MỚI:
```typescript
// Tạo flow từ template
const flow = await createFlowFromTemplate({
  templateId: 'welcome-template',
  name: 'My Welcome Flow',
  description: 'Custom welcome flow'
})

// Execute flow
const execution = await executeFlow('flow-id', {
  input: { userId: '123', message: 'Hello' }
})

// Lấy executions
const executions = await getFlowExecutions('flow-id')
const execution = await getFlowExecution('execution-id')
```

### Migration:

```typescript
// Trước
import { duplicateFlow, archiveFlow } from '@/lib/api/flows'

// Sau - Xóa hoàn toàn
// Nếu cần duplicate, tạo flow mới với data copy
const original = await getFlow(id)
const duplicated = await createFlow({
  name: `${original.name} (Copy)`,
  description: original.description,
  data: original.data
})

// Nếu cần archive, update status
await updateFlow(id, { status: 'archived' })
```

---

## 3. KNOWLEDGE BASE API - ĐÃ ĐÚNG ✅

Không cần thay đổi, API đã khớp với backend:

```typescript
import {
  getKnowledgeBases,
  createKnowledgeBase,
  getKBDocuments,
  uploadKBDocument,
  queryKnowledgeBase,
  generateKBAnswer
} from '@/lib/api/knowledge-base'
```

---

## 4. CONVERSATIONS API - ĐÃ ĐÚNG ✅

Không cần thay đổi:

```typescript
import {
  getBotConversations,
  createBotConversation,
  getAIConversations,
  createAIConversation
} from '@/lib/api/conversations'
```

---

## 5. CHANNELS API - ĐÃ ĐÚNG ✅

Không cần thay đổi:

```typescript
import {
  getChannels,
  disconnectChannel,
  getIntegrations,
  createIntegration,
  getOAuthUrl
} from '@/lib/api/channels'
```

---

## 6. TYPES - CẬP NHẬT

### Bot Types (MỚI):
```typescript
import type {
  Bot,
  CreateBotDto,
  UpdateBotDto,
  FlowVersion,
  BotFunction,
  BotFunctionType,
  CreateBotFunctionDto,
  ExecuteBotFunctionDto
} from '@/lib/types/bots'
```

### Flow Types (CẬP NHẬT):
```typescript
import type {
  Flow,
  CreateFlowDto,
  UpdateFlowDto,
  CreateFlowFromTemplateDto,
  FlowExecution,
  ExecuteFlowDto
} from '@/lib/types/flow'
```

---

## 7. NAVIGATION - ĐÃ CLEANUP

### Các trang đã XÓA:
- `/analytics` - Chưa có trong requirements
- `/archives` - Không cần, dùng filter
- `/files` - Đã có trong KB documents
- `/inbox` - Không có trong requirements
- `/nodes` - Internal config
- `/team` - Chưa có trong requirements
- `/settings/categories` - Không cần
- `/settings/icons` - Không cần
- `/settings/tags` - Không cần

### Navigation mới:
```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Bots', href: '/bots' },
  { name: 'Workflows', href: '/flows' },
  { name: 'Templates', href: '/templates' },
  { name: 'Knowledge Base', href: '/knowledge-base' },
  { name: 'Channels', href: '/channels' },
  { name: 'Integrations', href: '/integrations' },
  { name: 'Chat Test', href: '/chat' },
  { name: 'Settings', href: '/settings' }
]
```

---

## 8. CHECKLIST MIGRATION

### Bước 1: Update Imports
- [ ] Thay `duplicateFlow` → `createFlow` với data copy
- [ ] Thay `archiveFlow` → `updateFlow` với status archived
- [ ] Thêm import Bot API nếu cần

### Bước 2: Update Components
- [ ] Xóa references đến `/analytics`
- [ ] Xóa references đến `/archives`
- [ ] Xóa references đến `/inbox`
- [ ] Xóa references đến `/nodes`
- [ ] Xóa references đến `/team`
- [ ] Xóa references đến `/files`

### Bước 3: Update Types
- [ ] Import Bot types từ `@/lib/types/bots`
- [ ] Import Flow types mới từ `@/lib/types/flow`

### Bước 4: Test
- [ ] Test Bot CRUD operations
- [ ] Test Flow versioning
- [ ] Test Bot Functions
- [ ] Test Flow execution
- [ ] Test KB operations
- [ ] Test Conversations
- [ ] Test Channels

---

## 9. BREAKING CHANGES

### ⚠️ CRITICAL:

1. **`duplicateFlow()` đã bị XÓA**
   - Thay bằng: `createFlow()` với data từ flow gốc

2. **`archiveFlow()` đã bị XÓA**
   - Thay bằng: `updateFlow(id, { status: 'archived' })`

3. **Flow ID type đổi từ `number` → `string`**
   - Backend dùng UUID string
   - Update tất cả `id: number` → `id: string`

4. **Bot API hoàn toàn mới**
   - Cần implement UI cho Bot management
   - Cần implement UI cho Flow versioning
   - Cần implement UI cho Bot Functions

---

## 10. NEXT STEPS

### Phase 1: ✅ HOÀN THÀNH
- [x] Tạo Bot API client
- [x] Cập nhật Flow API
- [x] Cập nhật Types
- [x] Xóa trang dư thừa
- [x] Cập nhật Navigation

### Phase 2: 🚧 CẦN LÀM
- [ ] Implement Bot Management UI
- [ ] Implement Flow Versioning UI
- [ ] Implement Bot Functions UI
- [ ] Implement KB Settings UI
- [ ] Implement RAG Test UI

### Phase 3: 📋 KẾ HOẠCH
- [ ] Add tests
- [ ] Update documentation
- [ ] Performance optimization

---

**Tạo bởi**: Kiro AI Assistant  
**Ngày**: 2025-12-01  
**Version**: 1.0
