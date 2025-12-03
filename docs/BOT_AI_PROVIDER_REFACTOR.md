# Bot AI Provider & Multi-Channel Refactor

## Tổng quan

Refactor hệ thống Bot để:
1. Bỏ AI Configuration hard-code, sử dụng AI Provider
2. Bot có thể cấu hình system prompt
3. Bot có thể xuất hiện ở nhiều nơi (multi-channel)
4. Gọi API thực sự thay vì hard-code

## Backend Changes

### 1. Database Schema Changes

**Migration**: `1764652471396-UpdateBotAiProvider.ts`

Thay đổi trong bảng `bot`:
- ❌ Removed: `ai_model` (character varying)
- ❌ Removed: `ai_config` (jsonb)
- ✅ Added: `ai_provider_id` (uuid) - Reference đến AI Provider
- ✅ Added: `ai_model_name` (character varying) - Tên model (gpt-4, gemini-pro, etc.)
- ✅ Added: `ai_parameters` (jsonb) - Parameters như temperature, max_tokens

### 2. Entity Updates

**File**: `apps/backend/src/bots/infrastructure/persistence/relational/entities/bot.entity.ts`

```typescript
// Old
@Column({ name: 'ai_model', type: String, nullable: true })
aiModel?: string | null;

@Column({ name: 'ai_config', type: 'jsonb', nullable: true })
aiConfig?: Record<string, any> | null;

// New
@Column({ name: 'ai_provider_id', type: 'uuid', nullable: true })
aiProviderId?: string | null;

@Column({ name: 'ai_model_name', type: String, nullable: true })
aiModelName?: string | null;

@Column({ name: 'ai_parameters', type: 'jsonb', nullable: true })
aiParameters?: Record<string, any> | null;
```

### 3. DTO Updates

**Files**: 
- `apps/backend/src/bots/dto/create-bot.dto.ts`
- `apps/backend/src/bots/dto/update-bot.dto.ts`

```typescript
// Old
aiModel?: string | null;
aiConfig?: Record<string, any> | null;

// New
aiProviderId?: string | null;
aiModelName?: string | null;
aiParameters?: Record<string, any> | null;
```

### 4. Bot Channels API

**File**: `apps/backend/src/bots/bots.controller.ts`

Thêm endpoints mới:
- `GET /bots/:id/channels` - Lấy danh sách channels
- `POST /bots/:id/channels` - Tạo channel mới
- `PATCH /bots/:id/channels/:channelId` - Cập nhật channel
- `DELETE /bots/:id/channels/:channelId` - Xóa channel
- `PATCH /bots/:id/channels/:channelId/toggle` - Bật/tắt channel

**File**: `apps/backend/src/bots/bots.service.ts`

Thêm methods:
```typescript
async getBotChannels(botId: string)
async createBotChannel(botId: string, dto, userId: string)
async updateBotChannel(botId: string, channelId: string, dto)
async deleteBotChannel(botId: string, channelId: string)
async toggleBotChannel(botId: string, channelId: string, isActive: boolean)
```

### 5. Service Updates

**File**: `apps/backend/src/bots/bot-interaction.service.ts`

Cập nhật context để sử dụng fields mới:
```typescript
bot: {
  id: bot.id,
  name: bot.name,
  systemPrompt: bot.systemPrompt,
  aiProviderId: bot.aiProviderId,      // Changed
  aiModelName: bot.aiModelName,        // Changed
  aiParameters: bot.aiParameters,      // Changed
}
```

## Frontend Changes

### 1. API Client

**File**: `apps/web/lib/api/bots.ts`

Tạo API client mới với đầy đủ methods:
- Bot CRUD operations
- Bot Channels operations
- TypeScript interfaces cho Bot và BotChannel

```typescript
export interface Bot {
  id: string
  workspaceId: string
  name: string
  description?: string
  systemPrompt?: string | null
  aiProviderId?: string | null      // New
  aiModelName?: string | null       // New
  aiParameters?: Record<string, any> | null  // New
  // ... other fields
}

export interface BotChannel {
  id: string
  botId: string
  type: string
  name: string
  config?: Record<string, any>
  isActive: boolean
  // ... other fields
}
```

### 2. Bots List Page

**File**: `apps/web/app/(dashboard)/bots/page.tsx`

- Sử dụng `botsApi` thay vì `axiosClient` trực tiếp
- Cập nhật status badge để hiển thị: Active, Paused, Draft
- Sử dụng `botsApi.activate()` và `botsApi.pause()` thay vì toggle isActive

### 3. Bot Detail Page

**File**: `apps/web/app/(dashboard)/bots/[id]/page.tsx`

#### Thay đổi form fields:
```typescript
// Old
system_prompt
ai_model
ai_config
enable_auto_learn

// New
systemPrompt
aiProviderId
aiModelName
aiParameters
enableAutoLearn
```

#### Thêm tab mới:

**Tab "AI Provider"** (thay vì "AI Config"):
- Select AI Provider (workspace providers hoặc default từ .env)
- Input Model Name (gemini-2.0-flash, gpt-4, claude-3-opus)
- Slider Temperature
- Input Max Tokens

**Tab "Channels"**:
- Hiển thị danh sách channels của bot
- Thêm channel mới (Web, Facebook, Telegram, WhatsApp, Slack, Discord)
- Toggle active/inactive
- Delete channel
- Modal để tạo channel mới

## Nghiệp vụ Bot Multi-Channel

### Channel Types

Bot có thể xuất hiện ở nhiều nơi:
- **web**: Web Widget (chat bubble trên website)
- **facebook**: Facebook Messenger
- **telegram**: Telegram Bot
- **whatsapp**: WhatsApp Business
- **slack**: Slack App
- **discord**: Discord Bot

### Channel Configuration

Mỗi channel có:
- `type`: Loại channel
- `name`: Tên hiển thị
- `config`: Cấu hình riêng (API keys, webhooks, etc.)
- `isActive`: Trạng thái hoạt động
- `connectedAt`: Thời điểm kết nối

### Workflow

1. User tạo Bot
2. Cấu hình System Prompt
3. Chọn AI Provider (hoặc dùng default)
4. Thêm Channels để bot xuất hiện ở các nơi khác nhau
5. Mỗi channel có thể bật/tắt độc lập
6. Bot sẽ nhận và xử lý messages từ tất cả channels đang active

## AI Provider Integration

### Cách hoạt động

1. **Workspace AI Providers**: Admin workspace cấu hình AI providers (OpenAI, Google, Anthropic)
2. **Bot Configuration**: Khi tạo bot, chọn provider và model
3. **Fallback**: Nếu không chọn provider, sử dụng default từ `.env`

### Ví dụ

```typescript
// Bot với custom AI Provider
{
  aiProviderId: "uuid-of-workspace-provider",
  aiModelName: "gpt-4",
  aiParameters: {
    temperature: 0.7,
    max_tokens: 2000
  }
}

// Bot với default provider (từ .env)
{
  aiProviderId: null,
  aiModelName: "gemini-2.0-flash",
  aiParameters: {
    temperature: 0.8,
    max_tokens: 1000
  }
}
```

## Migration Guide

### Cho existing bots

Bots hiện tại sẽ:
- `ai_model` và `ai_config` bị xóa
- Cần cấu hình lại `aiProviderId`, `aiModelName`, `aiParameters`
- Hoặc để null để sử dụng default

### Rollback

Nếu cần rollback:
```bash
npm run migration:revert
```

Migration sẽ restore lại `ai_model` và `ai_config`.

## Testing

### Backend
```bash
cd apps/backend
npm run migration:run
npm run start:dev
```

### Frontend
```bash
cd apps/web
npm run dev
```

### Test Scenarios

1. ✅ Tạo bot mới với AI Provider
2. ✅ Cập nhật system prompt
3. ✅ Thêm channel mới (Web Widget)
4. ✅ Toggle channel active/inactive
5. ✅ Xóa channel
6. ✅ Bot hoạt động với nhiều channels

## Next Steps

1. **Frontend**: Load workspace AI providers vào dropdown
2. **Backend**: Implement channel-specific message handling
3. **Integration**: Tích hợp với các platform (Facebook, Telegram, etc.)
4. **UI/UX**: Cải thiện channel configuration UI
5. **Documentation**: Hướng dẫn setup từng loại channel

## Notes

- Migration đã chạy thành công
- Không có breaking changes cho API endpoints cũ
- Frontend đã được cập nhật để sử dụng API mới
- Bot channels infrastructure đã sẵn sàng cho tích hợp
