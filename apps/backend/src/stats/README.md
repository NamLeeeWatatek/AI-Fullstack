# Stats Module - Dashboard Statistics API

## Tổng quan

Module Stats cung cấp API thống kê toàn diện cho dashboard, được thiết kế theo kiến trúc module hóa, dễ mở rộng và bảo trì.

## Kiến trúc

```
stats/
├── dto/
│   ├── dashboard-stats.dto.ts    # Response DTOs
│   ├── stats-query.dto.ts        # Query/Filter DTOs
│   └── index.ts                  # Exports
├── stats.controller.ts           # API endpoints
├── stats.service.ts              # Business logic
├── stats.module.ts               # Module definition
└── README.md                     # Documentation
```

## API Endpoint

### GET `/api/v1/stats/dashboard`

Lấy thống kê tổng quan cho dashboard.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `workspaceId` | string | No | - | Filter theo workspace cụ thể |
| `period` | enum | No | `last_30_days` | Khoảng thời gian thống kê |
| `startDate` | ISO 8601 | No | - | Ngày bắt đầu (cho custom period) |
| `endDate` | ISO 8601 | No | - | Ngày kết thúc (cho custom period) |
| `includeTrend` | boolean | No | `true` | Bao gồm dữ liệu xu hướng |

#### Period Values

- `today` - Hôm nay
- `yesterday` - Hôm qua
- `last_7_days` - 7 ngày qua
- `last_30_days` - 30 ngày qua (mặc định)
- `last_90_days` - 90 ngày qua
- `this_month` - Tháng này
- `last_month` - Tháng trước
- `this_year` - Năm nay
- `custom` - Tùy chỉnh (cần startDate & endDate)

#### Example Requests

```bash
# Thống kê 30 ngày qua
GET /api/v1/stats/dashboard

# Thống kê cho workspace cụ thể
GET /api/v1/stats/dashboard?workspaceId=workspace-123

# Thống kê 7 ngày qua
GET /api/v1/stats/dashboard?period=last_7_days

# Thống kê theo khoảng thời gian tùy chỉnh
GET /api/v1/stats/dashboard?period=custom&startDate=2025-11-01T00:00:00.000Z&endDate=2025-11-30T23:59:59.999Z

# Không bao gồm trend data
GET /api/v1/stats/dashboard?includeTrend=false
```

#### Response Structure

```typescript
{
  "users": {
    "total": 1250,
    "current": 45,
    "previous": 38,
    "growthRate": 18.42,
    "active": 450,
    "newUsers": 120,
    "trend": [
      { "date": "2025-11-01", "value": 150 },
      // ...
    ]
  },
  "bots": {
    "total": 35,
    "current": 5,
    "previous": 3,
    "growthRate": 66.67,
    "active": 25,
    "inactive": 10,
    "avgSuccessRate": 89.5,
    "trend": [...]
  },
  "conversations": {
    "total": 8500,
    "current": 1250,
    "previous": 1100,
    "growthRate": 13.64,
    "active": 850,
    "completed": 400,
    "avgMessagesPerConversation": 4.5,
    "trend": [...]
  },
  "flows": {
    "total": 5420,
    "current": 1200,
    "previous": 1050,
    "growthRate": 14.29,
    "totalExecutions": 5420,
    "successfulExecutions": 4850,
    "failedExecutions": 570,
    "successRate": 89.48,
    "avgExecutionTime": 2.3,
    "trend": [...]
  },
  "workspaces": {
    "total": 95,
    "current": 10,
    "previous": 8,
    "growthRate": 25.0,
    "active": 85,
    "trend": [...]
  },
  "topBots": [
    {
      "id": "bot-1",
      "name": "Customer Support Bot",
      "count": 1250,
      "metric": 95.5
    },
    // Top 5 bots
  ],
  "topFlows": [
    {
      "id": "flow-1",
      "name": "Welcome Flow",
      "count": 2150,
      "metric": 96.2
    },
    // Top 5 flows
  ],
  "activityTrend": [
    { "date": "2025-11-01", "value": 150 },
    // ...
  ],
  "generatedAt": "2025-11-30T16:29:20.000Z"
}
```

## Cách triển khai Database Queries

Hiện tại service đang sử dụng mock data. Để triển khai với database thực:

### 1. Inject Repository/Service

```typescript
// stats.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { BotsService } from '../bots/bots.service';
// ... other services

@Injectable()
export class StatsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly botsService: BotsService,
    private readonly conversationsService: ConversationsService,
    private readonly flowsService: FlowsService,
    private readonly workspacesService: WorkspacesService,
  ) {}
  
  // ...
}
```

### 2. Implement Real Queries

Ví dụ cho User Stats:

```typescript
private async getUserStats(
  query: StatsQueryDto,
  startDate: Date,
  endDate: Date,
): Promise<UserStatsDto> {
  // Query total users
  const total = await this.usersService.count({
    ...(query.workspaceId && { workspaceId: query.workspaceId }),
  });

  // Query users in current period
  const current = await this.usersService.count({
    createdAt: { $gte: startDate, $lte: endDate },
    ...(query.workspaceId && { workspaceId: query.workspaceId }),
  });

  // Query users in previous period
  const periodLength = endDate.getTime() - startDate.getTime();
  const previousStartDate = new Date(startDate.getTime() - periodLength);
  const previous = await this.usersService.count({
    createdAt: { $gte: previousStartDate, $lt: startDate },
    ...(query.workspaceId && { workspaceId: query.workspaceId }),
  });

  // Query active users
  const active = await this.usersService.count({
    lastActiveAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    ...(query.workspaceId && { workspaceId: query.workspaceId }),
  });

  // Query trend data
  const trend = query.includeTrend !== false
    ? await this.getUserTrend(query, startDate, endDate)
    : undefined;

  return {
    total,
    current,
    previous,
    growthRate: this.calculateGrowthRate(current, previous),
    active,
    newUsers: current,
    trend,
  };
}
```

### 3. Implement Trend Queries

```typescript
private async getUserTrend(
  query: StatsQueryDto,
  startDate: Date,
  endDate: Date,
): Promise<TimeSeriesDataPoint[]> {
  // Aggregate users by day
  const aggregation = await this.usersService.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        ...(query.workspaceId && { workspaceId: query.workspaceId }),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return aggregation.map((item) => ({
    date: item._id,
    value: item.count,
  }));
}
```

## Mở rộng Module

### Thêm Endpoint mới

1. **Thêm DTO** trong `dto/`:

```typescript
// dto/bot-performance.dto.ts
export class BotPerformanceDto {
  @ApiProperty()
  botId: string;
  
  @ApiProperty()
  successRate: number;
  
  @ApiProperty()
  avgResponseTime: number;
}
```

2. **Thêm method trong Service**:

```typescript
// stats.service.ts
async getBotPerformance(botId: string): Promise<BotPerformanceDto> {
  // Implementation
}
```

3. **Thêm endpoint trong Controller**:

```typescript
// stats.controller.ts
@Get('bots/:id/performance')
@ApiOperation({ summary: 'Get bot performance metrics' })
async getBotPerformance(@Param('id') id: string) {
  return this.statsService.getBotPerformance(id);
}
```

### Thêm Filter mới

Cập nhật `StatsQueryDto`:

```typescript
export class StatsQueryDto {
  // ... existing fields
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  botId?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ChannelType)
  channelType?: ChannelType;
}
```

### Thêm Caching

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class StatsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // ... other dependencies
  ) {}

  async getDashboardStats(query: StatsQueryDto): Promise<DashboardStatsDto> {
    const cacheKey = `dashboard-stats:${JSON.stringify(query)}`;
    
    // Check cache
    const cached = await this.cacheManager.get<DashboardStatsDto>(cacheKey);
    if (cached) return cached;
    
    // Generate stats
    const stats = await this.generateStats(query);
    
    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300000);
    
    return stats;
  }
}
```

## Best Practices

1. **Performance**:
   - Sử dụng parallel queries với `Promise.all()`
   - Implement caching cho các queries phức tạp
   - Sử dụng database indexes cho các trường thường query

2. **Scalability**:
   - Tách logic thống kê theo domain (users, bots, etc.)
   - Sử dụng aggregation pipelines cho queries phức tạp
   - Consider background jobs cho heavy computations

3. **Maintainability**:
   - Giữ DTOs rõ ràng và well-documented
   - Tách biệt business logic khỏi data access
   - Viết unit tests cho các calculations

4. **Security**:
   - Validate query parameters
   - Implement rate limiting
   - Check user permissions cho workspace access

## Testing

```typescript
// stats.service.spec.ts
describe('StatsService', () => {
  it('should calculate growth rate correctly', () => {
    const service = new StatsService();
    expect(service['calculateGrowthRate'](50, 40)).toBe(25);
  });

  it('should handle zero previous value', () => {
    const service = new StatsService();
    expect(service['calculateGrowthRate'](50, 0)).toBe(100);
  });
});
```

## Migration Guide

Để migrate từ mock data sang real data:

1. Uncomment các TODO comments trong service
2. Inject các services cần thiết
3. Implement queries theo ví dụ trên
4. Test với small dataset trước
5. Add indexes cho performance
6. Deploy và monitor

## Support

Nếu có câu hỏi hoặc cần hỗ trợ, vui lòng tạo issue hoặc liên hệ team.
