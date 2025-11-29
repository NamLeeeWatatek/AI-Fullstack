# Architecture Documentation

## System Overview

Wataomi là hệ thống monorepo với kiến trúc microservices, bao gồm frontend (Next.js), backend (FastAPI), và các services hỗ trợ (Casdoor, MinIO, Grafana).

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web App - Next.js]
        Mobile[Mobile App - Future]
    end
    
    subgraph "API Gateway"
        Gateway[Next.js API Routes]
    end
    
    subgraph "Backend Services"
        API[FastAPI Backend]
        Auth[Casdoor - Auth Service]
        Storage[MinIO - Object Storage]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Cache[(Redis)]
    end
    
    subgraph "Monitoring"
        Grafana[Grafana Dashboard]
        Prometheus[Prometheus Metrics]
    end
    
    Web --> Gateway
    Mobile --> Gateway
    Gateway --> API
    API --> Auth
    API --> Storage
    API --> DB
    API --> Cache
    API --> Prometheus
    Prometheus --> Grafana
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (React 18+)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Forms**: React Hook Form + Zod

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic V2
- **Task Queue**: Celery (optional)

### Infrastructure
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Storage**: MinIO (S3-compatible)
- **Auth**: Casdoor
- **Monitoring**: Grafana + Prometheus
- **Container**: Docker + Docker Compose

## System Components

### 1. Web Application (Next.js)

**Responsibilities**:
- User interface rendering
- Client-side routing
- Form validation
- API communication
- Authentication flow

**Key Features**:
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes for BFF pattern
- Middleware for auth protection

### 2. Backend API (FastAPI)

**Responsibilities**:
- Business logic processing
- Database operations
- File upload/download
- User authentication
- API endpoint management

**Key Features**:
- Auto-generated OpenAPI docs
- Async request handling
- Dependency injection
- Background tasks

### 3. Authentication Service (Casdoor)

**Responsibilities**:
- User authentication
- OAuth2 provider
- SSO integration
- User management

**Protocols**:
- OAuth 2.0
- OpenID Connect
- SAML 2.0

### 4. Object Storage (MinIO)

**Responsibilities**:
- File storage
- Image hosting
- Document management
- Backup storage

**Features**:
- S3-compatible API
- Bucket policies
- Versioning
- Encryption at rest

### 5. Monitoring (Grafana + Prometheus)

**Metrics Collected**:
- Request latency
- Error rates
- Database connections
- Cache hit rates
- System resources (CPU, Memory)

## Data Flow

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant API
    participant Casdoor
    participant DB

    User->>Web: Click Login
    Web->>Casdoor: Redirect to OAuth
    Casdoor->>User: Show login form
    User->>Casdoor: Submit credentials
    Casdoor->>Casdoor: Validate user
    Casdoor->>Web: Redirect with code
    Web->>Casdoor: Exchange code for token
    Casdoor->>Web: Return access token
    Web->>API: Request with token
    API->>Casdoor: Validate token
    Casdoor->>API: Token valid
    API->>DB: Fetch user data
    DB->>API: User data
    API->>Web: Protected resource
    Web->>User: Show dashboard
```

### File Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant API
    participant MinIO
    participant DB

    User->>Web: Select file
    Web->>API: POST /upload (multipart)
    API->>API: Validate file
    API->>MinIO: Upload to bucket
    MinIO->>API: Return file URL
    API->>DB: Save metadata
    DB->>API: Confirm save
    API->>Web: Return file info
    Web->>User: Show success
```

## Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    POSTS ||--o{ COMMENTS : has
    USERS ||--o{ FILES : uploads
    
    USERS {
        uuid id PK
        string email UK
        string username UK
        string hashed_password
        boolean is_active
        boolean is_superuser
        timestamp created_at
        timestamp updated_at
    }
    
    POSTS {
        uuid id PK
        uuid user_id FK
        string title
        text content
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    COMMENTS {
        uuid id PK
        uuid user_id FK
        uuid post_id FK
        text content
        timestamp created_at
    }
    
    FILES {
        uuid id PK
        uuid user_id FK
        string filename
        string file_path
        integer file_size
        string mime_type
        timestamp created_at
    }
```

## Security Architecture

### Authentication & Authorization

1. **OAuth 2.0 Flow**: Casdoor handles authentication
2. **JWT Tokens**: Stateless authentication
3. **Role-Based Access Control (RBAC)**: User roles and permissions
4. **API Key**: For service-to-service communication

### Security Measures

```yaml
Security Layers:
  - Network:
      - HTTPS/TLS 1.3
      - CORS policies
      - Rate limiting
  
  - Application:
      - Input validation (Pydantic/Zod)
      - SQL injection prevention (ORM)
      - XSS protection (React escaping)
      - CSRF tokens
  
  - Data:
      - Password hashing (bcrypt)
      - Encryption at rest (MinIO)
      - Encryption in transit (TLS)
      - Database encryption
  
  - Infrastructure:
      - Docker isolation
      - Secrets management
      - Regular updates
      - Security scanning
```

## Deployment Architecture

### Development Environment

```yaml
Services:
  - web: localhost:3000
  - backend: localhost:8000
  - casdoor: localhost:8001
  - minio: localhost:9000
  - grafana: localhost:3001
  - postgres: localhost:5432
  - redis: localhost:6379
```

### Production Environment

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/Traefik]
    end
    
    subgraph "Application Tier"
        Web1[Next.js Instance 1]
        Web2[Next.js Instance 2]
        API1[FastAPI Instance 1]
        API2[FastAPI Instance 2]
    end
    
    subgraph "Service Tier"
        Auth[Casdoor Cluster]
        Storage[MinIO Cluster]
    end
    
    subgraph "Data Tier"
        DBMaster[(PostgreSQL Master)]
        DBReplica[(PostgreSQL Replica)]
        RedisCluster[(Redis Cluster)]
    end
    
    LB --> Web1
    LB --> Web2
    Web1 --> API1
    Web2 --> API2
    API1 --> Auth
    API2 --> Auth
    API1 --> Storage
    API2 --> Storage
    API1 --> DBMaster
    API2 --> DBMaster
    DBMaster --> DBReplica
    API1 --> RedisCluster
    API2 --> RedisCluster
```

### Docker Compose Structure

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on: [backend]

  backend:
    build: ./apps/backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/wataomi
    depends_on: [postgres, redis, casdoor, minio]

  postgres:
    image: postgres:15-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      - POSTGRES_DB=wataomi
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

  casdoor:
    image: casbin/casdoor:latest
    ports: ["8001:8000"]
    volumes: [casdoor_data:/data]

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio_data:/data]

  grafana:
    image: grafana/grafana:latest
    ports: ["3001:3000"]
    volumes: [grafana_data:/var/lib/grafana]

volumes:
  postgres_data:
  redis_data:
  casdoor_data:
  minio_data:
  grafana_data:
```

## Scalability Strategy

### Horizontal Scaling

1. **Web Tier**: Multiple Next.js instances behind load balancer
2. **API Tier**: Multiple FastAPI instances with shared Redis cache
3. **Database**: Read replicas for query distribution
4. **Storage**: MinIO distributed mode

### Caching Strategy

```
Level 1: Browser Cache (Static assets)
Level 2: CDN Cache (Images, CSS, JS)
Level 3: Redis Cache (API responses, sessions)
Level 4: Database Query Cache
```

### Performance Optimization

- **Database**: Indexes, connection pooling, query optimization
- **API**: Response compression, pagination, field selection
- **Frontend**: Code splitting, lazy loading, image optimization
- **CDN**: Static asset distribution

## Monitoring & Observability

### Metrics Dashboard (Grafana)

```yaml
Dashboards:
  - System Health:
      - CPU usage
      - Memory usage
      - Disk I/O
      - Network traffic
  
  - Application Metrics:
      - Request rate (req/s)
      - Response time (p50, p95, p99)
      - Error rate (%)
      - Active users
  
  - Database Metrics:
      - Query performance
      - Connection pool
      - Slow queries
      - Replication lag
  
  - Business Metrics:
      - User signups
      - Active sessions
      - File uploads
      - API usage
```

### Logging Strategy

```yaml
Log Levels:
  - ERROR: Application errors, exceptions
  - WARN: Deprecated features, potential issues
  - INFO: Important events, state changes
  - DEBUG: Detailed debugging information

Log Aggregation:
  - Centralized logging (ELK/Loki)
  - Structured JSON logs
  - Request tracing (correlation IDs)
  - Log retention: 30 days
```

### Alerting Rules

```yaml
Critical Alerts:
  - API error rate > 5%
  - Response time p95 > 2s
  - Database connection pool exhausted
  - Disk usage > 90%

Warning Alerts:
  - API error rate > 1%
  - Response time p95 > 1s
  - Memory usage > 80%
  - Cache hit rate < 70%
```

## Disaster Recovery

### Backup Strategy

```yaml
Database Backups:
  - Full backup: Daily at 2 AM
  - Incremental: Every 6 hours
  - Retention: 30 days
  - Storage: S3/MinIO encrypted

File Storage Backups:
  - Replication: Real-time to secondary region
  - Snapshots: Daily
  - Retention: 90 days

Configuration Backups:
  - Git repository
  - Secrets in vault
  - Infrastructure as Code
```

### Recovery Procedures

1. **Database Failure**: Promote replica to master
2. **Service Failure**: Auto-restart with health checks
3. **Data Corruption**: Restore from latest backup
4. **Complete Outage**: Failover to DR site

## CI/CD Pipeline

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions]
    B --> C[Run Tests]
    C --> D[Build Docker Images]
    D --> E[Push to Registry]
    E --> F{Environment}
    F -->|Dev| G[Deploy to Dev]
    F -->|Staging| H[Deploy to Staging]
    F -->|Prod| I[Manual Approval]
    I --> J[Deploy to Production]
    J --> K[Health Check]
    K -->|Failed| L[Rollback]
    K -->|Success| M[Complete]
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL status
docker ps | grep postgres
docker logs wataomi-postgres

# Test connection
psql -h localhost -U user -d wataomi
```

#### API Not Responding
```bash
# Check backend logs
docker logs wataomi-backend

# Check health endpoint
curl http://localhost:8000/health
```

#### Authentication Failures
```bash
# Check Casdoor status
docker logs wataomi-casdoor

# Verify environment variables
echo $CASDOOR_CLIENT_ID
```

#### File Upload Issues
```bash
# Check MinIO status
docker logs wataomi-minio

# Test MinIO connection
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local
```

### Performance Debugging

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/users

# Monitor database queries
docker exec -it wataomi-postgres psql -U user -d wataomi
SELECT * FROM pg_stat_activity;

# Check Redis cache
docker exec -it wataomi-redis redis-cli
INFO stats
```

## Future Enhancements

### Phase 2 (Q1 2026)
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)

### Phase 3 (Q2 2026)
- [ ] AI/ML features
- [ ] Advanced search (Elasticsearch)
- [ ] Video processing
- [ ] Third-party integrations

### Phase 4 (Q3 2026)
- [ ] Multi-tenancy support
- [ ] White-label solution
- [ ] Advanced RBAC
- [ ] Audit logging
