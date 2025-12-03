# API Client Documentation

## Tổng quan

Thư mục này chứa tất cả API client functions để giao tiếp với backend WataOmi.

**Nguyên tắc**:
- Tất cả API đã được đồng bộ 100% với backend
- Sử dụng TypeScript types đầy đủ
- Error handling tập trung
- Authentication tự động qua JWT

---

## Cấu trúc

```
lib/api/
├── index.ts              # Central exports
├── bots.ts              # Bot management API
├── flows.ts             # Flow/Workflow API
├── knowledge-base.ts    # Knowledge Base & RAG API
├── conversations.ts     # Conversations API
├── channels.ts          # Channels & Integrations API
├── ai-models.ts         # AI Models API
├── nodeTypes.ts         # Node Types API
├── nodes.ts             # Nodes API
└── permissions.ts       # Permissions API
```

---

## Import

### Recommended (từ index):
```typescript
import { 
  getBots, 
  getFlows, 
  getKnowledgeBases 
} from '@/lib/api'
```

### Direct import (nếu cần):
```typescript
import { getBots } from '@/lib/api/bots'
import { getFlows } from '@/lib/api/flows'
```

---

## API Modules

### 1. Bots API (`bots.ts`)

**Quản lý Bot**:
```typescript
getBots(workspaceId?: string): Promise<Bot[]>
getBot(id: string): Promise<Bot>
createBot(data: CreateBotDto): Promise<Bot>
updateBot(id: string, data: UpdateBotDto): Promise<Bot>
deleteBot(id: string): Promise<DeleteBotResponse>
```

**Flow Versioning**:
```typescript
createBotFlowVersion(botId: string, data: CreateFlowVersionDto): Promise<FlowVersion>
publishFlowVersion(versionId: string): Promise<FlowVersion>
getBotFlowVersions(botId: string): Promise<FlowVersion[]>
```

**Bot Functions**:
```typescript
createBotFunction(data: CreateBotFunctionDto): Promise<BotFunction>
getBotFunctions(botId: string): Promise<BotFunction[]>
getBotFunction(functionId: string): Promise<BotFunction>
updateBotFunction(functionId: string, data: UpdateBotFunctionDto): Promise<BotFunction>
deleteBotFunction(functionId: string): Promise<DeleteBotFunctionResponse>
executeBotFunction(data: ExecuteBotFunctionDto): Promise<ExecuteBotFunctionResponse>
```

**Backend Endpoints**:
```
GET    /api/v1/bots
POST   /api/v1/bots
GET    /api/v1/bots/:id
PATCH  /api/v1/bots/:id
DELETE /api/v1/bots/:id
POST   /api/v1/bots/:id/versions
POST   /api/v1/bots/versions/:versionId/publish
POST   /api/v1/bots/:id/functions
GET    /api/v1/bots/:id/functions
GET    /api/v1/bots/functions/:functionId
PATCH  /api/v1/bots/functions/:functionId
DELETE /api/v1/bots/functions/:functionId
POST   /api/v1/bots/functions/execute
```

---

### 2. Flows API (`flows.ts`)

**Flow Management**:
```typescript
getFlows(): Promise<Flow[]>
getFlow(id: string): Promise<Flow>
createFlow(data: CreateFlowDto): Promise<Flow>
createFlowFromTemplate(data: CreateFlowFromTemplateDto): Promise<Flow>
updateFlow(id: string, data: UpdateFlowDto): Promise<Flow>
deleteFlow(id: string): Promise<void>
```

**Flow Execution**:
```typescript
executeFlow(id: string, data?: ExecuteFlowDto): Promise<ExecuteFlowResponse>
getFlowExecutions(flowId: string): Promise<FlowExecution[]>
getFlowExecution(executionId: string): Promise<FlowExecution>
```

**Backend Endpoints**:
```
GET    /api/v1/flows
POST   /api/v1/flows
POST   /api/v1/flows/from-template
GET    /api/v1/flows/:id
PATCH  /api/v1/flows/:id
DELETE /api/v1/flows/:id
POST   /api/v1/flows/:id/execute
GET    /api/v1/flows/:id/executions
GET    /api/v1/flows/executions/:executionId
```

---

### 3. Knowledge Base API (`knowledge-base.ts`)

**KB Management**:
```typescript
getKnowledgeBases(workspaceId?: string): Promise<GetKnowledgeBasesResponse>
getKnowledgeBase(id: string): Promise<GetKnowledgeBaseResponse>
createKnowledgeBase(data: CreateKnowledgeBaseDto): Promise<CreateKnowledgeBaseResponse>
updateKnowledgeBase(id: string, data: UpdateKnowledgeBaseDto): Promise<UpdateKnowledgeBaseResponse>
deleteKnowledgeBase(id: string): Promise<DeleteKnowledgeBaseResponse>
getKnowledgeBaseStats(id: string): Promise<GetKnowledgeBaseStatsResponse>
```

**Folders**:
```typescript
createKBFolder(data: CreateFolderDto): Promise<CreateFolderResponse>
getKBFolders(kbId: string): Promise<GetFoldersResponse>
getKBFolderTree(kbId: string): Promise<GetFolderTreeResponse>
updateKBFolder(folderId: string, data: UpdateFolderDto): Promise<UpdateFolderResponse>
deleteKBFolder(folderId: string): Promise<DeleteFolderResponse>
```

**Documents**:
```typescript
createKBDocument(data: CreateDocumentDto): Promise<CreateDocumentResponse>
getKBDocuments(kbId: string, folderId?: string): Promise<GetDocumentsResponse>
getKBDocument(documentId: string): Promise<GetDocumentResponse>
updateKBDocument(documentId: string, data: UpdateDocumentDto): Promise<UpdateDocumentResponse>
deleteKBDocument(documentId: string): Promise<DeleteDocumentResponse>
moveKBDocument(documentId: string, folderId: string | null): Promise<MoveDocumentResponse>
uploadKBDocument(file: File, kbId: string, folderId?: string): Promise<CreateDocumentResponse>
```

**Query & RAG**:
```typescript
queryKnowledgeBase(data: QueryKnowledgeBaseDto): Promise<QueryResponse>
generateKBAnswer(data: GenerateAnswerDto): Promise<GenerateAnswerResponse>
```

**Agent Assignment**:
```typescript
assignAgentToKB(kbId: string, data: AssignAgentDto): Promise<AssignAgentResponse>
unassignAgentFromKB(kbId: string, agentId: string): Promise<UnassignAgentResponse>
getKBAgentAssignments(kbId: string): Promise<GetAgentAssignmentsResponse>
```

**Backend Endpoints**:
```
GET    /api/v1/knowledge-bases
POST   /api/v1/knowledge-bases
GET    /api/v1/knowledge-bases/:id
PATCH  /api/v1/knowledge-bases/:id
DELETE /api/v1/knowledge-bases/:id
GET    /api/v1/knowledge-bases/:id/stats
POST   /api/v1/knowledge-bases/folders
GET    /api/v1/knowledge-bases/:id/folders
GET    /api/v1/knowledge-bases/:id/folders/tree
PATCH  /api/v1/knowledge-bases/folders/:folderId
DELETE /api/v1/knowledge-bases/folders/:folderId
POST   /api/v1/knowledge-bases/documents
GET    /api/v1/knowledge-bases/:id/documents
GET    /api/v1/knowledge-bases/documents/:documentId
PATCH  /api/v1/knowledge-bases/documents/:documentId
DELETE /api/v1/knowledge-bases/documents/:documentId
PATCH  /api/v1/knowledge-bases/documents/:documentId/move
POST   /api/v1/knowledge-bases/documents/upload
POST   /api/v1/knowledge-bases/query
POST   /api/v1/knowledge-bases/answer
POST   /api/v1/knowledge-bases/:id/agents
DELETE /api/v1/knowledge-bases/:id/agents/:agentId
GET    /api/v1/knowledge-bases/:id/agents
```

---

### 4. Conversations API (`conversations.ts`)

**Bot Conversations** (External users):
```typescript
getBotConversations(botId?: string): Promise<GetConversationsResponse>
getBotConversation(id: string): Promise<GetConversationResponse>
createBotConversation(data: CreateConversationDto): Promise<CreateConversationResponse>
getBotConversationMessages(conversationId: string): Promise<GetMessagesResponse>
addBotConversationMessage(conversationId: string, data: CreateMessageDto): Promise<AddMessageResponse>
```

**AI Conversations** (Internal users):
```typescript
getAIConversations(): Promise<GetAiConversationsResponse>
getAIConversation(id: string): Promise<GetAiConversationResponse>
createAIConversation(data: CreateAiConversationDto): Promise<CreateAiConversationResponse>
updateAIConversation(id: string, data: UpdateAiConversationDto): Promise<UpdateAiConversationResponse>
deleteAIConversation(id: string): Promise<DeleteAiConversationResponse>
addAIConversationMessage(id: string, data: AddAiMessageDto): Promise<AddAiMessageResponse>
```

**Backend Endpoints**:
```
GET    /api/v1/conversations
GET    /api/v1/conversations/:id
POST   /api/v1/conversations
GET    /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/messages
GET    /api/v1/ai-conversations
GET    /api/v1/ai-conversations/:id
POST   /api/v1/ai-conversations
PATCH  /api/v1/ai-conversations/:id
DELETE /api/v1/ai-conversations/:id
POST   /api/v1/ai-conversations/:id/messages
```

---

### 5. Channels API (`channels.ts`)

**Channels**:
```typescript
getChannelTypes(): Promise<ChannelType[]>
getChannelCategories(): Promise<string[]>
getChannels(): Promise<Channel[]>
disconnectChannel(id: number): Promise<void>
```

**Integrations**:
```typescript
getIntegrations(): Promise<IntegrationConfig[]>
createIntegration(data: CreateIntegrationDto): Promise<IntegrationConfig>
updateIntegration(id: number, data: UpdateIntegrationDto): Promise<IntegrationConfig>
deleteIntegration(id: number): Promise<void>
```

**OAuth**:
```typescript
getOAuthUrl(provider: string, configId?: number): Promise<{ url: string }>
```

**Backend Endpoints**:
```
GET    /api/v1/channels/types
GET    /api/v1/channels/types/categories
GET    /api/v1/channels
DELETE /api/v1/channels/:id
GET    /api/v1/integrations
POST   /api/v1/integrations
PATCH  /api/v1/integrations/:id
DELETE /api/v1/integrations/:id
GET    /api/v1/oauth/login/:provider
```

---

## Error Handling

Tất cả API functions sử dụng `fetchAPI` helper với error handling tập trung:

```typescript
try {
  const bots = await getBots()
} catch (error) {
  // Error đã được log trong fetchAPI
  console.error('Failed to fetch bots:', error)
  toast.error('Failed to load bots')
}
```

---

## Authentication

JWT token tự động được thêm vào headers qua `fetchAPI`:

```typescript
// Tự động lấy token từ NextAuth session
const session = await getSession()
const token = session?.accessToken

headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## Best Practices

### 1. Luôn dùng TypeScript types:
```typescript
import type { Bot, CreateBotDto } from '@/lib/types/bots'

const createNewBot = async (data: CreateBotDto): Promise<Bot> => {
  return await createBot(data)
}
```

### 2. Handle errors properly:
```typescript
try {
  const bot = await createBot(data)
  toast.success('Bot created successfully')
  return bot
} catch (error) {
  toast.error('Failed to create bot')
  throw error
}
```

### 3. Use loading states:
```typescript
const [loading, setLoading] = useState(false)

const loadBots = async () => {
  setLoading(true)
  try {
    const bots = await getBots()
    setBots(bots)
  } catch (error) {
    toast.error('Failed to load bots')
  } finally {
    setLoading(false)
  }
}
```

### 4. Invalidate cache after mutations:
```typescript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const handleCreate = async (data: CreateBotDto) => {
  await createBot(data)
  queryClient.invalidateQueries(['bots'])
}
```

---

## Testing

### Unit Tests:
```typescript
import { getBots } from '@/lib/api/bots'

describe('Bots API', () => {
  it('should fetch bots', async () => {
    const bots = await getBots()
    expect(Array.isArray(bots)).toBe(true)
  })
})
```

### Integration Tests:
```typescript
it('should create and delete bot', async () => {
  const bot = await createBot({ name: 'Test Bot' })
  expect(bot.id).toBeDefined()
  
  await deleteBot(bot.id)
  await expect(getBot(bot.id)).rejects.toThrow()
})
```

---

## Changelog

### v1.0.0 (2025-12-01)
- ✅ Tạo Bot API hoàn chỉnh
- ✅ Cập nhật Flow API (xóa duplicate/archive)
- ✅ Đồng bộ 100% với backend
- ✅ Thêm TypeScript types đầy đủ
- ✅ Tạo central exports

---

**Maintained by**: WataOmi Team  
**Last Updated**: 2025-12-01
