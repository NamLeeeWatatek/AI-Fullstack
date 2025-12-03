# 🔴 Redis Cache Setup

## 📦 Installation

```bash
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store redis
```

## ⚙️ Configuration

### 1. Update app.module.ts

```typescript
// apps/backend/src/app.module.ts

import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    // Redis Cache Configuration
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
          password: process.env.REDIS_PASSWORD,
          ttl: 300, // Default TTL: 5 minutes
        }),
      }),
    }),
    
    // Other modules...
  ],
})
export class AppModule {}
```

### 2. Environment Variables

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here
```

### 3. Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    
volumes:
  redis_data:
```

## 🎯 Usage in Service

```typescript
// Service đã dùng đúng rồi
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class WidgetVersionService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getActiveVersion(botId: string) {
    // Get from cache
    const cached = await this.cacheManager.get(`widget:active:${botId}`);
    if (cached) return cached;
    
    // Get from DB
    const version = await this.versionRepo.findOne(...);
    
    // Set cache (TTL: 300s = 5 minutes)
    await this.cacheManager.set(`widget:active:${botId}`, version, 300);
    
    return version;
  }
  
  async invalidateCache(botId: string) {
    await this.cacheManager.del(`widget:active:${botId}`);
  }
}
```

## 🔑 Cache Keys Pattern

```
widget:active:{botId}           - Active version config
widget:config:{botId}           - Full bot config
widget:analytics:{versionId}    - Version analytics
```

## ✅ Benefits

- ✅ Fast: < 10ms response time
- ✅ Scalable: Shared cache across instances
- ✅ Persistent: Data survives restarts
- ✅ TTL: Auto-expire old data
- ✅ Invalidation: Manual clear when needed

## 🚀 Production Setup

### AWS ElastiCache
```bash
REDIS_HOST=your-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### Redis Cloud
```bash
REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your_password
```

Done! 🎉
