# 🔄 Widget Versioning Architecture

## 🎯 Vấn đề cần giải quyết

### ❌ Kiến trúc cũ (Không tốt):
```
Bot → widget_config (JSONB)
```
**Vấn đề:**
- Không rollback được
- Không A/B testing được
- Update là overwrite, mất history
- Không biết version nào đang chạy

### ✅ Kiến trúc mới (Đúng):
```
Bot → Widget Versions (1:N)
  ├── Version 1.0.0 (published, active)
  ├── Version 1.0.1 (published, inactive)
  └── Version 2.0.0 (draft)
```
**Ưu điểm:**
- Rollback trong 1 click
- A/B testing giữa versions
- Keep full history
- Deploy từng phần (canary)

---

## 🗄️ Database Schema MỚI

### Table: `widget_versions`

```sql
CREATE TABLE widget_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot(id) ON DELETE CASCADE,
  
  -- Version info
  version VARCHAR(20) NOT NULL, -- "1.0.0", "1.0.1", "2.0.0"
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
  is_active BOOLEAN DEFAULT false, -- Chỉ 1 version active per bot
  
  -- Widget configuration (FULL CONFIG)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Deployment info
  published_at TIMESTAMP,
  published_by UUID REFERENCES "user"(id),
  
  -- CDN URLs (for caching)
  cdn_url VARCHAR(500), -- https://cdn.wataomi.com/widgets/bot-123/v1.0.0/widget.js
  
  -- Metadata
  changelog TEXT, -- "Fixed mobile responsive issue"
  notes TEXT, -- Internal notes
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(bot_id, version)
);

-- Indexes
CREATE INDEX idx_widget_versions_bot_id ON widget_versions(bot_id);
CREATE INDEX idx_widget_versions_status ON widget_versions(status);
CREATE INDEX idx_widget_versions_active ON widget_versions(bot_id, is_active) 
  WHERE is_active = true;
```

### Table: `widget_deployments` (History)

```sql
CREATE TABLE widget_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot(id) ON DELETE CASCADE,
  widget_version_id UUID NOT NULL REFERENCES widget_versions(id) ON DELETE CASCADE,
  
  -- Deployment info
  deployed_by UUID REFERENCES "user"(id),
  deployed_at TIMESTAMP DEFAULT NOW(),
  deployment_type VARCHAR(20) NOT NULL, -- publish, rollback, canary
  
  -- Rollback info
  previous_version_id UUID REFERENCES widget_versions(id),
  rollback_reason TEXT,
  
  -- Canary deployment
  traffic_percentage INT DEFAULT 100, -- 0-100%
  
  -- Status
  status VARCHAR(20) NOT NULL, -- deploying, deployed, failed, rolled_back
  
  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_widget_deployments_bot ON widget_deployments(bot_id);
CREATE INDEX idx_widget_deployments_version ON widget_deployments(widget_version_id);
CREATE INDEX idx_widget_deployments_deployed_at ON widget_deployments(deployed_at DESC);
```

### Table: `widget_analytics` (Per version)

```sql
CREATE TABLE widget_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot(id) ON DELETE CASCADE,
  widget_version_id UUID NOT NULL REFERENCES widget_versions(id) ON DELETE CASCADE,
  
  -- Event tracking
  event_type VARCHAR(50) NOT NULL, -- load, open, message, error, close
  
  -- Context
  domain VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),
  country_code VARCHAR(2),
  
  -- Performance
  load_time_ms INT, -- Widget load time
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_widget_analytics_bot ON widget_analytics(bot_id);
CREATE INDEX idx_widget_analytics_version ON widget_analytics(widget_version_id);
CREATE INDEX idx_widget_analytics_event ON widget_analytics(event_type);
CREATE INDEX idx_widget_analytics_created ON widget_analytics(created_at);
```

---

## 🔄 Luồng hoạt động MỚI

### 1️⃣ **Admin tạo Version mới**

```
Admin vào Dashboard
  ↓
Bots → [Bot ABC] → Widget → Versions
  ↓
Click "Create New Version"
  ↓
Nhập version: "1.0.1"
Nhập changelog: "Fixed mobile responsive"
  ↓
Config widget (theme, behavior, messages...)
  ↓
Click "Save Draft"
  ↓
POST /api/v1/bots/:botId/widget/versions
  {
    version: "1.0.1",
    config: { theme: {...}, behavior: {...} },
    changelog: "Fixed mobile responsive"
  }
  ↓
Backend tạo widget_version mới (status: draft)
  ↓
Admin có thể preview draft version
```

### 2️⃣ **Admin Publish Version**

```
Admin click "Publish Version 1.0.1"
  ↓
POST /api/v1/bots/:botId/widget/versions/:versionId/publish
  ↓
Backend:
  1. Deactivate current active version (1.0.0)
  2. Set version 1.0.1 as active
  3. Update status: draft → published
  4. Generate CDN URL
  5. Upload to CDN (optional)
  6. Record deployment history
  ↓
Widget trên customer website tự động dùng version mới
```

### 3️⃣ **Widget fetch Config (với version)**

```
Customer website load widget
  ↓
widget-loader.js load
  ↓
Parse botId từ script tag
  ↓
User click chat button
  ↓
widget-core.js load
  ↓
Gọi API: GET /api/v1/public/bots/:botId/widget/config
  (Không cần specify version, backend tự return active version)
  ↓
Backend:
  1. Query active widget_version for bot
  2. Validate origin
  3. Return config + version info
  ↓
Response:
  {
    botId: "abc-123",
    version: "1.0.1",  ← Version info
    versionId: "uuid",
    config: { theme: {...}, behavior: {...} }
  }
  ↓
Widget render với config
  ↓
Track analytics với versionId
```

### 4️⃣ **Admin Rollback Version**

```
Version 1.0.1 có bug!
  ↓
Admin vào Versions tab
  ↓
Click "Rollback to 1.0.0"
  ↓
POST /api/v1/bots/:botId/widget/versions/:versionId/rollback
  {
    reason: "Version 1.0.1 has mobile bug"
  }
  ↓
Backend:
  1. Deactivate version 1.0.1
  2. Activate version 1.0.0
  3. Record rollback in deployments table
  ↓
Widget tự động dùng version 1.0.0
  ↓
Done! Rollback trong < 1 phút
```

---

## 📊 Entity & DTOs

### WidgetVersionEntity

```typescript
// apps/backend/src/bots/infrastructure/persistence/relational/entities/widget-version.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { BotEntity } from './bot.entity';

@Entity({ name: 'widget_version' })
@Index(['botId', 'version'], { unique: true })
@Index(['botId', 'isActive'], { where: 'is_active = true' })
export class WidgetVersionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  @Index()
  botId: string;

  @Column({ type: 'varchar', length: 20 })
  version: string; // "1.0.0", "1.0.1"

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  config: {
    theme: {
      primaryColor: string;
      position: string;
      buttonSize: string;
      showAvatar: boolean;
      showTimestamp: boolean;
    };
    behavior: {
      autoOpen: boolean;
      autoOpenDelay: number;
      greetingDelay: number;
    };
    messages: {
      welcome: string;
      placeholder: string;
      offline: string;
      errorMessage: string;
    };
    features: {
      fileUpload: boolean;
      voiceInput: boolean;
      markdown: boolean;
      quickReplies: boolean;
    };
    branding: {
      showPoweredBy: boolean;
    };
    security: {
      allowedOrigins: string[];
      rateLimit?: {
        maxRequests: number;
        windowMs: number;
      };
    };
  };

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt?: Date | null;

  @Column({ name: 'published_by', type: 'uuid', nullable: true })
  publishedBy?: string | null;

  @Column({ name: 'cdn_url', type: 'varchar', length: 500, nullable: true })
  cdnUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  changelog?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ManyToOne(() => BotEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### WidgetDeploymentEntity

```typescript
// apps/backend/src/bots/infrastructure/persistence/relational/entities/widget-deployment.entity.ts

@Entity({ name: 'widget_deployment' })
export class WidgetDeploymentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  @Index()
  botId: string;

  @Column({ name: 'widget_version_id', type: 'uuid' })
  @Index()
  widgetVersionId: string;

  @Column({ name: 'deployed_by', type: 'uuid', nullable: true })
  deployedBy?: string | null;

  @Column({ name: 'deployed_at', type: 'timestamp', default: () => 'NOW()' })
  @Index()
  deployedAt: Date;

  @Column({ name: 'deployment_type', type: 'varchar', length: 20 })
  deploymentType: 'publish' | 'rollback' | 'canary';

  @Column({ name: 'previous_version_id', type: 'uuid', nullable: true })
  previousVersionId?: string | null;

  @Column({ name: 'rollback_reason', type: 'text', nullable: true })
  rollbackReason?: string | null;

  @Column({ name: 'traffic_percentage', type: 'int', default: 100 })
  trafficPercentage: number;

  @Column({ type: 'varchar', length: 20 })
  status: 'deploying' | 'deployed' | 'failed' | 'rolled_back';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @ManyToOne(() => BotEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;

  @ManyToOne(() => WidgetVersionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'widget_version_id' })
  widgetVersion?: WidgetVersionEntity;
}
```

---

## 🔌 API Endpoints MỚI

### Public API (Cho widget)

```typescript
// GET /api/v1/public/bots/:botId/widget/config
// Trả về ACTIVE version config

Response:
{
  botId: "abc-123",
  version: "1.0.1",
  versionId: "uuid-xxx",
  name: "Support Bot",
  description: "24/7 AI Support",
  config: {
    theme: { ... },
    behavior: { ... },
    messages: { ... },
    features: { ... },
    branding: { ... }
  }
}
```

### Admin API (Cho dashboard)

```typescript
// 1. List all versions
GET /api/v1/bots/:botId/widget/versions
Response: [
  {
    id: "uuid-1",
    version: "1.0.0",
    status: "published",
    isActive: false,
    publishedAt: "2024-01-01",
    changelog: "Initial release"
  },
  {
    id: "uuid-2",
    version: "1.0.1",
    status: "published",
    isActive: true,
    publishedAt: "2024-01-15",
    changelog: "Fixed mobile bug"
  }
]

// 2. Get version detail
GET /api/v1/bots/:botId/widget/versions/:versionId
Response: {
  id: "uuid-2",
  version: "1.0.1",
  status: "published",
  isActive: true,
  config: { ... },
  changelog: "Fixed mobile bug",
  publishedAt: "2024-01-15",
  publishedBy: "user-123"
}

// 3. Create new version
POST /api/v1/bots/:botId/widget/versions
Body: {
  version: "1.0.2",
  config: { ... },
  changelog: "Added dark mode"
}

// 4. Update version (chỉ draft)
PATCH /api/v1/bots/:botId/widget/versions/:versionId
Body: {
  config: { ... },
  changelog: "Updated changelog"
}

// 5. Publish version
POST /api/v1/bots/:botId/widget/versions/:versionId/publish
Response: {
  success: true,
  deploymentId: "uuid-xxx"
}

// 6. Rollback to version
POST /api/v1/bots/:botId/widget/versions/:versionId/rollback
Body: {
  reason: "Version 1.0.2 has bug"
}

// 7. Archive version
POST /api/v1/bots/:botId/widget/versions/:versionId/archive

// 8. Get deployment history
GET /api/v1/bots/:botId/widget/deployments
Response: [
  {
    id: "uuid-1",
    version: "1.0.1",
    deploymentType: "publish",
    deployedAt: "2024-01-15",
    deployedBy: "user-123",
    status: "deployed"
  },
  {
    id: "uuid-2",
    version: "1.0.0",
    deploymentType: "rollback",
    deployedAt: "2024-01-16",
    rollbackReason: "Bug in 1.0.1",
    status: "deployed"
  }
]

// 9. Get version analytics
GET /api/v1/bots/:botId/widget/versions/:versionId/analytics
Response: {
  totalLoads: 1234,
  totalMessages: 567,
  errorRate: 0.5,
  avgLoadTime: 450
}
```

---

## 🎨 Dashboard UI MỚI

### Widget Versions Page

```
┌─────────────────────────────────────────────────────────┐
│  Widget Versions                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Create New Version]                                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Version 1.0.1 (Active) ✅                          │ │
│  │ Published: 2024-01-15 by John                      │ │
│  │ Changelog: Fixed mobile responsive issue           │ │
│  │                                                     │ │
│  │ Stats: 1,234 loads | 567 messages | 0.5% errors   │ │
│  │                                                     │ │
│  │ [View Config] [Analytics] [Archive]                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Version 1.0.0                                       │ │
│  │ Published: 2024-01-01 by Admin                     │ │
│  │ Changelog: Initial release                         │ │
│  │                                                     │ │
│  │ [Rollback to this] [View Config] [Analytics]       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Version 2.0.0 (Draft) 📝                           │ │
│  │ Created: 2024-01-20 by John                        │ │
│  │ Changelog: Major redesign                          │ │
│  │                                                     │ │
│  │ [Edit] [Publish] [Delete]                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Deployment History

```
┌─────────────────────────────────────────────────────────┐
│  Deployment History                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Timeline:                                               │
│                                                          │
│  ● 2024-01-20 10:30 - Rollback to v1.0.0               │
│    Reason: Bug in v1.0.1 mobile view                    │
│    By: John                                              │
│                                                          │
│  ● 2024-01-15 14:20 - Published v1.0.1                 │
│    Changelog: Fixed mobile responsive                    │
│    By: John                                              │
│                                                          │
│  ● 2024-01-01 09:00 - Published v1.0.0                 │
│    Changelog: Initial release                            │
│    By: Admin                                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Ưu điểm của kiến trúc mới

### ✅ Version Control
- Mỗi version là 1 snapshot hoàn chỉnh
- Không mất history khi update
- Dễ compare giữa versions

### ✅ Rollback nhanh
- 1 click rollback về version cũ
- Không cần restore từ backup
- < 1 phút để rollback

### ✅ A/B Testing (Future)
- Deploy 2 versions cùng lúc
- 50% traffic dùng v1.0.0, 50% dùng v1.0.1
- So sánh metrics để chọn version tốt hơn

### ✅ Canary Deployment (Future)
- Deploy version mới cho 10% traffic trước
- Monitor metrics
- Nếu OK → tăng lên 100%
- Nếu có lỗi → rollback ngay

### ✅ Analytics per version
- Track performance của từng version
- So sánh error rate giữa versions
- Biết version nào tốt hơn

---

## 📊 Migration Strategy

### Bước 1: Tạo tables mới
```sql
-- Chạy migration tạo widget_versions, widget_deployments, widget_analytics
```

### Bước 2: Migrate data cũ
```sql
-- Migrate từ bot.widget_config sang widget_versions
INSERT INTO widget_versions (bot_id, version, status, is_active, config)
SELECT 
  id as bot_id,
  '1.0.0' as version,
  'published' as status,
  widget_enabled as is_active,
  widget_config as config
FROM bot
WHERE widget_enabled = true;
```

### Bước 3: Update code
- Update PublicBotService để query từ widget_versions
- Update BotService để CRUD widget_versions
- Update controllers

### Bước 4: Deploy
- Deploy backend mới
- Widget tự động dùng API mới
- Không cần customer update embed code

---

**Đây mới là kiến trúc đúng chuẩn production! 🚀**
