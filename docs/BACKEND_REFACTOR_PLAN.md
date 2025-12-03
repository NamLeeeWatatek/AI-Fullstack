# Backend Refactor Plan - WataOmi

## ✅ Tiến độ thực hiện

| Phase | Trạng thái | Ghi chú |
|-------|------------|---------|
| Phase 1: Core Entities | ✅ Hoàn thành | Users, Workspaces, AI Providers |
| Phase 2: Bots & Flows | ✅ Hoàn thành | Bots, FlowVersions, BotKnowledgeBases |
| Phase 3: Conversations | ✅ Hoàn thành | Conversations, Messages, MessageFeedback |
| Phase 4: Knowledge Base | ✅ Hoàn thành | KB, Folders, Documents, Versions, RagFeedback |
| Phase 5: Channels & Webhooks | ✅ Hoàn thành | Channels, WebhookEvents |
| Phase 6: Subscriptions | ✅ Hoàn thành | Plans, Subscriptions, UsageQuotas, Invoices |
| Phase 7: Additional Features | ✅ Hoàn thành | Audit, Notifications |

### Modules đã tạo mới:
- `ai-providers/` - Quản lý AI providers (user & workspace level)
- `webhooks/` - Webhook events processing
- `subscriptions/` - Plans, subscriptions, quotas, invoices
- `audit/` - Audit logs & data access logs
- `notifications/` - User notifications

---

## 📊 Phân tích so sánh Schema mới vs Cấu trúc hiện tại

### ✅ Modules ĐÃ CÓ (cần nâng cấp)

| # | Table Schema | Module hiện tại | Trạng thái | Cần làm |
|---|--------------|-----------------|------------|---------|
| 1 | `users` | ✅ users | Có nhưng thiếu fields | Thêm: `name`, `avatar_url`, `email_verified_at` |
| 2 | `workspaces` | ✅ workspaces | Có nhưng thiếu fields | Thêm: `avatar_url`, `plan`, `deleted_at` |
| 3 | `workspace_members` | ✅ workspaces | Có | Thêm: `joined_at` (đổi từ `createdAt`) |
| 10 | `bots` | ✅ bots | Có nhưng thiếu fields | Thêm: `avatar_url`, `default_language`, `timezone`, `status`, `created_by`, `deleted_at` |
| 11 | `flow_versions` | ✅ bots | Có | Thêm: `name`, `description`, `status`, `published_at`, `created_by` |
| 12 | `node_types` | ✅ node-types | Có | Thêm: `input_schema`, `output_schema`, `default_config`, `is_builtin`, `version` |
| 16 | `flow_executions` | ✅ flows | Có | Refactor theo schema mới |
| 17 | `flow_execution_steps` | ✅ flows | Có (node-execution) | Rename và cập nhật fields |
| 21 | `channels` | ✅ channels/integrations | Có | Refactor theo schema mới |
| 23 | `conversations` | ✅ conversations | Có nhưng thiếu fields | Thêm nhiều fields mới |
| 24 | `messages` | ✅ conversations | Có nhưng thiếu fields | Thêm: `role`, `attachments`, `sources`, `tool_calls`, `feedback` |
| 25 | `knowledge_bases` | ✅ knowledge-base | Có | Thêm: `similarity_threshold`, `top_k`, `live_version_id` |
| 26 | `kb_folders` | ✅ knowledge-base | Có | Thêm: `path` |
| 27 | `kb_documents` | ✅ knowledge-base | Có | Thêm: `slug`, `source_url`, `current_version_id`, `tags` |
| 32 | `daily_stats` | ✅ stats | Có | Cần entity mới |
| 41 | `message_templates` | ✅ templates | Có | Refactor theo schema mới |

### ❌ Modules CẦN TẠO MỚI

| # | Table Schema | Module cần tạo | Mô tả |
|---|--------------|----------------|-------|
| 4 | `user_ai_providers` | ai-providers | Quản lý AI providers của user |
| 5 | `workspace_ai_providers` | ai-providers | Quản lý AI providers của workspace |
| 6 | `ai_usage_logs` | ai-providers | Log sử dụng AI |
| 7 | `plans` | subscriptions | Quản lý gói dịch vụ |
| 8 | `subscriptions` | subscriptions | Quản lý đăng ký |
| 9 | `usage_quotas` | subscriptions | Quota sử dụng |
| 13 | `flow_nodes` | flows | Nodes trong flow |
| 14 | `flow_edges` | flows | Edges trong flow |
| 15 | `node_credentials` | flows | Credentials cho nodes |
| 18 | `flow_execution_variables` | flows | Variables trong execution |
| 19 | `flow_goals` | flows | Goals tracking |
| 20 | `goal_events` | flows | Goal events |
| 22 | `webhook_events` | webhooks | Webhook events |
| 28 | `kb_document_versions` | knowledge-base | Document versioning |
| 29 | `bot_knowledge_bases` | bots | Bot-KB mapping |
| 30 | `tools` | tools | Custom tools |
| 31 | `handover_tickets` | handover | Human handover |
| 33 | `audit_logs` | audit | Audit logging |
| 34 | `custom_domains` | branding | Custom domains |
| 35 | `branding_settings` | branding | Branding settings |
| 36 | `broadcasts` | broadcasts | Broadcast messages |
| 37 | `scheduled_messages` | broadcasts | Scheduled messages |
| 38 | `notifications` | notifications | User notifications |
| 39 | `voice_calls` | voice | Voice calls |
| 40 | `call_transcripts` | voice | Call transcripts |
| 42 | `approval_requests` | approvals | Approval workflow |
| 43 | `approval_logs` | approvals | Approval logs |
| 44 | `feature_flags` | feature-flags | Feature flags |
| 45 | `rag_feedback` | knowledge-base | RAG feedback |
| 46 | `invoices` | subscriptions | Invoices |
| 47 | `data_access_logs` | audit | Data access logs |
| 48 | `message_feedback` | conversations | Message feedback |

### 🗑️ Modules CẦN XÓA/MERGE

| Module hiện tại | Lý do | Hành động |
|-----------------|-------|-----------|
| `roles` | Không có trong schema mới | Merge vào users (role field) |
| `statuses` | Không có trong schema mới | Merge vào users (is_active field) |
| `social` | Không rõ mục đích | Xóa |
| `home` | Chỉ là landing page | Giữ lại |
| `permissions` | Không có trong schema mới | Merge vào workspace_members |
| `auth-apple`, `auth-facebook`, `auth-google`, `auth-casdoor` | Có thể merge | Merge vào auth module |

---

## 🏗️ Kế hoạch Refactor theo Phase

### Phase 1: Core Entities (Ưu tiên cao)

#### 1.1 Users Module
```
- Thêm fields: name, avatar_url, email_verified_at, is_active
- Xóa: firstName, lastName (merge thành name)
- Xóa dependency: roles, statuses tables
```

#### 1.2 Workspaces Module
```
- Thêm fields: avatar_url, plan, deleted_at
- Cập nhật workspace_members: joined_at
```

#### 1.3 AI Providers Module (MỚI)
```
- user_ai_providers entity
- workspace_ai_providers entity
- ai_usage_logs entity
- Service: quản lý API keys, quota, usage tracking
```

### Phase 2: Bots & Flows

#### 2.1 Bots Module
```
- Thêm fields: avatar_url, default_language, timezone, status, created_by, deleted_at
- Cập nhật flow_versions: name, description, status, published_at, created_by
- Thêm bot_knowledge_bases entity
```

#### 2.2 Flows Module
```
- Thêm entities: flow_nodes, flow_edges, node_credentials
- Thêm entities: flow_execution_variables, flow_goals, goal_events
- Refactor flow_executions theo schema mới
```

### Phase 3: Conversations & Messages

#### 3.1 Conversations Module
```
- Thêm fields: channel_type, contact_name, contact_avatar, last_message_at, handover_ticket_id
- Cập nhật messages: role, attachments, sources, tool_calls, feedback
- Thêm message_feedback entity
```

#### 3.2 Handover Module (MỚI)
```
- handover_tickets entity
- Service: human handover workflow
```

### Phase 4: Knowledge Base

#### 4.1 Knowledge Base Module
```
- Thêm fields: similarity_threshold, top_k, live_version_id
- Thêm kb_document_versions entity
- Thêm rag_feedback entity
- Cập nhật kb_folders: path
- Cập nhật kb_documents: slug, source_url, current_version_id
```

### Phase 5: Channels & Webhooks

#### 5.1 Channels Module
```
- Refactor theo schema: type, name, config, is_active, connected_at
- Merge integrations vào channels
```

#### 5.2 Webhooks Module (MỚI)
```
- webhook_events entity
- Service: webhook processing
```

### Phase 6: Subscriptions & Billing

#### 6.1 Subscriptions Module (MỚI)
```
- plans entity
- subscriptions entity
- usage_quotas entity
- invoices entity
- Service: Stripe integration
```

### Phase 7: Additional Features

#### 7.1 Broadcasts Module (MỚI)
```
- broadcasts entity
- scheduled_messages entity
```

#### 7.2 Notifications Module (MỚI)
```
- notifications entity
```

#### 7.3 Voice Module (MỚI)
```
- voice_calls entity
- call_transcripts entity
```

#### 7.4 Approvals Module (MỚI)
```
- approval_requests entity
- approval_logs entity
```

#### 7.5 Audit Module (MỚI)
```
- audit_logs entity
- data_access_logs entity
```

#### 7.6 Branding Module (MỚI)
```
- custom_domains entity
- branding_settings entity
```

#### 7.7 Feature Flags Module (MỚI)
```
- feature_flags entity
```

#### 7.8 Tools Module (MỚI)
```
- tools entity
```

---

## 📁 Cấu trúc thư mục đề xuất

```
apps/backend/src/
├── ai-providers/           # MỚI: AI providers management
│   ├── domain/
│   ├── dto/
│   ├── infrastructure/
│   ├── ai-providers.controller.ts
│   ├── ai-providers.module.ts
│   └── ai-providers.service.ts
├── approvals/              # MỚI: Approval workflow
├── audit/                  # MỚI: Audit logging
├── auth/                   # GIỮ: Merge các auth-* vào đây
├── bots/                   # CẬP NHẬT
├── branding/               # MỚI: Custom domains & branding
├── broadcasts/             # MỚI: Broadcasts & scheduled messages
├── channels/               # CẬP NHẬT: Merge integrations
├── conversations/          # CẬP NHẬT
├── feature-flags/          # MỚI
├── files/                  # GIỮ
├── flows/                  # CẬP NHẬT
├── handover/               # MỚI: Human handover
├── knowledge-base/         # CẬP NHẬT
├── node-types/             # CẬP NHẬT
├── notifications/          # MỚI
├── stats/                  # CẬP NHẬT
├── subscriptions/          # MỚI: Plans, subscriptions, invoices
├── tools/                  # MỚI: Custom tools
├── users/                  # CẬP NHẬT
├── voice/                  # MỚI: Voice calls
├── webhooks/               # MỚI: Webhook events
└── workspaces/             # CẬP NHẬT
```

---

## 🗑️ Modules cần xóa

```
- auth-apple/       → Merge vào auth/
- auth-facebook/    → Merge vào auth/
- auth-google/      → Merge vào auth/
- auth-casdoor/     → Merge vào auth/
- roles/            → Xóa (dùng enum trong users)
- statuses/         → Xóa (dùng is_active trong users)
- social/           → Xóa
- permissions/      → Merge vào workspaces
- integrations/     → Merge vào channels
- templates/        → Rename thành message-templates
- mailer/           → Merge vào mail
```

---

## ⏱️ Ước tính thời gian

| Phase | Công việc | Thời gian |
|-------|-----------|-----------|
| 1 | Core Entities | 2-3 ngày |
| 2 | Bots & Flows | 3-4 ngày |
| 3 | Conversations | 2-3 ngày |
| 4 | Knowledge Base | 2-3 ngày |
| 5 | Channels & Webhooks | 2 ngày |
| 6 | Subscriptions | 3-4 ngày |
| 7 | Additional Features | 5-7 ngày |
| - | Testing & Migration | 3-5 ngày |
| **Total** | | **22-31 ngày** |

---

## 🚀 Bắt đầu từ đâu?

Tôi đề xuất bắt đầu với **Phase 1: Core Entities** vì:
1. Users và Workspaces là foundation cho tất cả modules khác
2. AI Providers là tính năng quan trọng cho chatbot platform
3. Các thay đổi này ít ảnh hưởng đến code hiện tại

Bạn muốn tôi bắt đầu implement phase nào trước?
