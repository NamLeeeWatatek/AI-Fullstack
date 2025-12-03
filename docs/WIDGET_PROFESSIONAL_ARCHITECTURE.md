# Widget Embed System - Kiến trúc Chuyên nghiệp

## 🎯 Yêu cầu Nghiệp vụ

### 1. Versioning & Rollback
- Mỗi widget có nhiều versions
- Có thể publish/unpublish version
- Rollback về version trước khi có vấn đề
- Semantic versioning (1.0.0, 1.0.1, 1.1.0)

### 2. Widget Management
- Tạo/sửa/xóa widget versions
- Preview trước khi publish
- A/B testing giữa các versions
- Scheduled deployment

### 3. Analytics & Monitoring
- Track widget loads
- Track conversations created
- Track messages sent
- Error tracking & logging
- Performance metrics

### 4. Security
- Rate limiting per domain
- API key authentication (optional)
- CORS whitelist
- XSS protection
- CSP headers

### 5. Distribution
- CDN hosting (CloudFront/Cloudflare)
- Version-specific URLs
- Latest version alias
- Fallback mechanism

---

## 📊 Database Schema

### Table: `widget_versions`
```sql
CREATE TABLE widget_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot(id) ON DELETE CASCADE,
  
  -- Version info
  version VARCHAR(20) NOT NULL, -- "1.0.0", "1.0.1"
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
  is_active BOOLEAN DEFAULT false, -- Only 1 active version per bot
  
  -- Widget configuration
  config JSONB NOT NULL, -- Full widget config
  
  -- Deployment
  published_at TIMESTAMP,
  published_by UUID REFERENCES "user"(id),
  cdn_url VARCHAR(500),
  
  -- Metadata
  changelog TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(bot_id, version)
);

CREATE INDEX idx_widget_versions_bot_id ON widget_versions(bot_id);
CREATE INDEX idx_widget_versions_status ON widget_versions(status);
CREATE INDEX idx_widget_versions_active ON widget_versions(bot_id, is_active) WHERE is_active = true;
```

### Table: `widget_analytics`
```sql
CREATE TABLE widget_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_version_id UUID NOT NULL REFERENCES widget_versions(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES bot(id) ON DELETE CASCADE,
  
  -- Event tracking
  event_type VARCHAR(50) NOT NULL, -- load, conversation_created, message_sent, error
  
  -- Context
  domain VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),
  country_code VARCHAR(2),
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_widget_analytics_version ON widget_analytics(widget_version_id);
CREATE INDEX idx_widget_analytics_bot ON widget_analytics(bot_id);
CREATE INDEX idx_widget_analytics_event ON widget_analytics(event_type);
CREATE INDEX idx_widget_analytics_created ON widget_analytics(created_at);
```

### Table: `widget_deployments`
```sql
CREATE TABLE widget_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_version_id UUID NOT NULL REFERENCES widget_versions(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES bot(id) ON DELETE CASCADE,
  
  -- Deployment info
  deployed_by UUID REFERENCES "user"(id),
  deployed_at TIMESTAMP DEFAULT NOW(),
  
  -- Rollback info
  previous_version_id UUID REFERENCES widget_versions(id),
  rollback_reason TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL, -- deploying, deployed, failed, rolled_back
  
  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_widget_deployments_version ON widget_deployments(widget_version_id);
CREATE INDEX idx_widget_deployments_bot ON widget_deployments(bot_id);
```

---

## 🏗️ Backend Architecture

### 1. Widget Version Management

#### WidgetVersionEntity
```typescript
@Entity('widget_versions')
export class WidgetVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id' })
  botId: string;

  @ManyToOne(() => BotEntity)
  @JoinColumn({ name: 'bot_id' })
  bot: BotEntity;

  @Column({ type: 'varchar', length: 20 })
  version: string; // "1.0.0"

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  config: WidgetConfig;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'published_by', nullable: true })
  publishedBy: string | null;

  @Column({ name: 'cdn_url', type: 'varchar', length: 500, nullable: true })
  cdnUrl: string | null;

  @Column({ type: 'text', nullable: true })
  changelog: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

interface WidgetConfig {
  // Appearance
  theme: {
    primaryColor: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    buttonSize: 'small' | 'medium' | 'large';
    showAvatar: boolean;
    showTimestamp: boolean;
    customCSS?: string;
  };
  
  // Content
  messages: {
    welcome: string;
    placeholder: string;
    offline: string;
    errorMessage: string;
  };
  
  // Behavior
  behavior: {
    autoOpen: boolean;
    autoOpenDelay?: number; // seconds
    showOnPages?: string[]; // URL patterns
    hideOnPages?: string[]; // URL patterns
  };
  
  // Security
  security: {
    allowedOrigins: string[];
    rateLimit?: {
      maxRequests: number;
      windowMs: number;
    };
  };
  
  // Advanced
  advanced: {
    customJS?: string;
    webhooks?: {
      onLoad?: string;
      onMessage?: string;
    };
  };
}
```

#### WidgetVersionService
```typescript
@Injectable()
export class WidgetVersionService {
  constructor(
    @InjectRepository(WidgetVersionEntity)
    private readonly versionRepo: Repository<WidgetVersionEntity>,
    @InjectRepository(WidgetDeploymentEntity)
    private readonly deploymentRepo: Repository<WidgetDeploymentEntity>,
    private readonly cdnService: CDNService,
  ) {}

  /**
   * Create new widget version
   */
  async createVersion(
    botId: string,
    userId: string,
    dto: CreateWidgetVersionDto,
  ): Promise<WidgetVersionEntity> {
    // Validate version format
    if (!this.isValidVersion(dto.version)) {
      throw new BadRequestException('Invalid version format. Use semantic versioning (e.g., 1.0.0)');
    }

    // Check if version already exists
    const existing = await this.versionRepo.findOne({
      where: { botId, version: dto.version },
    });

    if (existing) {
      throw new ConflictException(`Version ${dto.version} already exists`);
    }

    const version = this.versionRepo.create({
      botId,
      version: dto.version,
      config: dto.config,
      status: 'draft',
      changelog: dto.changelog,
    });

    return this.versionRepo.save(version);
  }

  /**
   * Publish version (make it active)
   */
  async publishVersion(
    versionId: string,
    userId: string,
  ): Promise<WidgetVersionEntity> {
    const version = await this.versionRepo.findOne({
      where: { id: versionId },
      relations: ['bot'],
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status === 'published' && version.isActive) {
      throw new BadRequestException('Version is already published and active');
    }

    // Deactivate current active version
    await this.versionRepo.update(
      { botId: version.botId, isActive: true },
      { isActive: false },
    );

    // Build and upload to CDN
    const cdnUrl = await this.buildAndUploadToCDN(version);

    // Activate new version
    version.status = 'published';
    version.isActive = true;
    version.publishedAt = new Date();
    version.publishedBy = userId;
    version.cdnUrl = cdnUrl;

    await this.versionRepo.save(version);

    // Record deployment
    await this.deploymentRepo.save({
      widgetVersionId: versionId,
      botId: version.botId,
      deployedBy: userId,
      status: 'deployed',
    });

    return version;
  }

  /**
   * Rollback to previous version
   */
  async rollbackVersion(
    botId: string,
    targetVersionId: string,
    userId: string,
    reason: string,
  ): Promise<WidgetVersionEntity> {
    const currentVersion = await this.versionRepo.findOne({
      where: { botId, isActive: true },
    });

    const targetVersion = await this.versionRepo.findOne({
      where: { id: targetVersionId, botId },
    });

    if (!targetVersion) {
      throw new NotFoundException('Target version not found');
    }

    if (targetVersion.status !== 'published') {
      throw new BadRequestException('Can only rollback to published versions');
    }

    // Deactivate current version
    if (currentVersion) {
      currentVersion.isActive = false;
      await this.versionRepo.save(currentVersion);
    }

    // Activate target version
    targetVersion.isActive = true;
    await this.versionRepo.save(targetVersion);

    // Record rollback
    await this.deploymentRepo.save({
      widgetVersionId: targetVersionId,
      botId,
      deployedBy: userId,
      previousVersionId: currentVersion?.id,
      rollbackReason: reason,
      status: 'deployed',
    });

    return targetVersion;
  }

  /**
   * Get active version for bot
   */
  async getActiveVersion(botId: string): Promise<WidgetVersionEntity | null> {
    return this.versionRepo.findOne({
      where: { botId, isActive: true, status: 'published' },
    });
  }

  /**
   * List all versions for bot
   */
  async listVersions(botId: string): Promise<WidgetVersionEntity[]> {
    return this.versionRepo.find({
      where: { botId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Build widget and upload to CDN
   */
  private async buildAndUploadToCDN(
    version: WidgetVersionEntity,
  ): Promise<string> {
    // Generate widget JavaScript with config embedded
    const widgetJS = this.generateWidgetScript(version);

    // Upload to CDN
    const cdnUrl = await this.cdnService.upload(
      `widgets/${version.botId}/${version.version}/widget.js`,
      widgetJS,
      {
        contentType: 'application/javascript',
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    );

    // Also upload as "latest" for convenience
    if (version.isActive) {
      await this.cdnService.upload(
        `widgets/${version.botId}/latest/widget.js`,
        widgetJS,
        {
          contentType: 'application/javascript',
          cacheControl: 'public, max-age=300', // 5 minutes
        },
      );
    }

    return cdnUrl;
  }

  /**
   * Generate widget script with embedded config
   */
  private generateWidgetScript(version: WidgetVersionEntity): string {
    const template = fs.readFileSync(
      path.join(__dirname, '../../../templates/widget-template.js'),
      'utf-8',
    );

    // Inject config into template
    return template.replace(
      '/* __CONFIG__ */',
      `const WIDGET_CONFIG = ${JSON.stringify(version.config, null, 2)};`,
    );
  }

  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }
}
```

### 2. Widget Analytics Service

```typescript
@Injectable()
export class WidgetAnalyticsService {
  constructor(
    @InjectRepository(WidgetAnalyticsEntity)
    private readonly analyticsRepo: Repository<WidgetAnalyticsEntity>,
  ) {}

  /**
   * Track widget event
   */
  async trackEvent(dto: TrackWidgetEventDto): Promise<void> {
    await this.analyticsRepo.save({
      widgetVersionId: dto.widgetVersionId,
      botId: dto.botId,
      eventType: dto.eventType,
      domain: dto.domain,
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
      metadata: dto.metadata,
    });
  }

  /**
   * Get analytics for widget version
   */
  async getAnalytics(
    widgetVersionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<WidgetAnalytics> {
    const events = await this.analyticsRepo
      .createQueryBuilder('analytics')
      .where('analytics.widgetVersionId = :widgetVersionId', { widgetVersionId })
      .andWhere('analytics.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    return {
      totalLoads: events.filter(e => e.eventType === 'load').length,
      totalConversations: events.filter(e => e.eventType === 'conversation_created').length,
      totalMessages: events.filter(e => e.eventType === 'message_sent').length,
      totalErrors: events.filter(e => e.eventType === 'error').length,
      uniqueDomains: [...new Set(events.map(e => e.domain))].length,
      topDomains: this.getTopDomains(events),
      errorRate: this.calculateErrorRate(events),
    };
  }

  private getTopDomains(events: WidgetAnalyticsEntity[]): Array<{ domain: string; count: number }> {
    const domainCounts = events.reduce((acc, event) => {
      acc[event.domain] = (acc[event.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateErrorRate(events: WidgetAnalyticsEntity[]): number {
    const totalEvents = events.length;
    const errorEvents = events.filter(e => e.eventType === 'error').length;
    return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
  }
}
```

### 3. Public Widget API

```typescript
@Controller('api/v1/public/widgets')
export class PublicWidgetController {
  constructor(
    private readonly versionService: WidgetVersionService,
    private readonly analyticsService: WidgetAnalyticsService,
  ) {}

  /**
   * Get widget script (versioned or latest)
   */
  @Get(':botId/:version/widget.js')
  @Header('Content-Type', 'application/javascript')
  @Header('Cache-Control', 'public, max-age=31536000')
  async getWidgetScript(
    @Param('botId') botId: string,
    @Param('version') version: string,
    @Req() req: Request,
  ): Promise<string> {
    // Track load event
    await this.analyticsService.trackEvent({
      botId,
      eventType: 'load',
      domain: req.headers.origin || req.headers.referer,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // Get version (or latest)
    const widgetVersion = version === 'latest'
      ? await this.versionService.getActiveVersion(botId)
      : await this.versionService.getVersionByNumber(botId, version);

    if (!widgetVersion) {
      throw new NotFoundException('Widget version not found');
    }

    // Return CDN URL or generate script
    if (widgetVersion.cdnUrl) {
      // Redirect to CDN
      throw new HttpException('', HttpStatus.MOVED_PERMANENTLY, {
        headers: { Location: widgetVersion.cdnUrl },
      });
    }

    // Generate script on-the-fly (fallback)
    return this.generateWidgetScript(widgetVersion);
  }

  /**
   * Track widget event
   */
  @Post('track')
  async trackEvent(@Body() dto: TrackWidgetEventDto): Promise<void> {
    await this.analyticsService.trackEvent(dto);
  }
}
```

---

## 🎨 Frontend - Widget Management Dashboard

### Page: `/bots/[id]/widget`

#### Features:
1. **Version List**
   - Show all versions with status
   - Quick actions: Publish, Archive, Rollback
   - Version comparison

2. **Version Editor**
   - Visual config editor
   - Live preview
   - Code editor for advanced users

3. **Analytics Dashboard**
   - Loads, conversations, messages
   - Error tracking
   - Domain breakdown
   - Performance metrics

4. **Deployment History**
   - Timeline of deployments
   - Rollback history
   - Change logs

5. **Embed Code Generator**
   - Copy embed code
   - Version selector
   - Installation instructions

---

## 📦 Widget Distribution

### CDN Structure
```
cdn.wataomi.com/
├── widgets/
│   ├── {botId}/
│   │   ├── 1.0.0/
│   │   │   └── widget.js
│   │   ├── 1.0.1/
│   │   │   └── widget.js
│   │   └── latest/
│   │       └── widget.js (symlink to active version)
```

### Embed Code Options

#### Option 1: Latest Version (Auto-update)
```html
<script src="https://cdn.wataomi.com/widgets/{botId}/latest/widget.js"></script>
```

#### Option 2: Specific Version (Stable)
```html
<script src="https://cdn.wataomi.com/widgets/{botId}/1.0.0/widget.js"></script>
```

#### Option 3: NPM Package (Advanced)
```bash
npm install @wataomi/widget
```

```javascript
import { WataomiWidget } from '@wataomi/widget';

new WataomiWidget({
  botId: 'your-bot-id',
  version: '1.0.0',
});
```

---

## 🔒 Security & Rate Limiting

### Rate Limiting Strategy
```typescript
@Injectable()
export class WidgetRateLimitGuard implements CanActivate {
  constructor(private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const botId = request.params.botId;
    const domain = request.headers.origin || request.headers.referer;

    // Get rate limit config from widget version
    const version = await this.getActiveVersion(botId);
    const rateLimit = version.config.security.rateLimit || {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    };

    // Check rate limit
    const key = `widget:ratelimit:${botId}:${domain}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.pexpire(key, rateLimit.windowMs);
    }

    if (current > rateLimit.maxRequests) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
```

---

## 📊 Implementation Priority

### Phase 1: Core Versioning (Week 1)
- [ ] Database migrations
- [ ] WidgetVersion entity & service
- [ ] Create/Update/Delete versions
- [ ] Publish/Unpublish versions

### Phase 2: Deployment & CDN (Week 2)
- [ ] CDN service integration
- [ ] Build & upload pipeline
- [ ] Version-specific URLs
- [ ] Latest version alias

### Phase 3: Rollback & History (Week 3)
- [ ] Deployment tracking
- [ ] Rollback functionality
- [ ] Deployment history
- [ ] Change logs

### Phase 4: Analytics (Week 4)
- [ ] Event tracking
- [ ] Analytics dashboard
- [ ] Error monitoring
- [ ] Performance metrics

### Phase 5: Management UI (Week 5-6)
- [ ] Version list page
- [ ] Version editor
- [ ] Live preview
- [ ] Embed code generator

---

## 🎯 Success Metrics

- ✅ Có thể tạo và quản lý nhiều versions
- ✅ Rollback trong < 1 phút
- ✅ Zero downtime deployment
- ✅ Track 100% widget events
- ✅ < 1% error rate
- ✅ < 100ms widget load time

---

**Đây mới là hệ thống widget chuyên nghiệp!** 🚀
