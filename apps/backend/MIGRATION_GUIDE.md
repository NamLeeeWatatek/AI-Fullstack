# Migration Guide: Python FastAPI → NestJS

## Overview

Backend đã được migrate từ Python/FastAPI sang NestJS với TypeORM và PostgreSQL.

## Cấu trúc mới

```
src/
├── workspaces/          # Workspace management
├── bots/                # Bot management
├── flows/               # Flow management
├── conversations/       # Conversation & messages
├── users/               # User management (enhanced)
├── auth/                # Authentication
└── ...                  # Other modules
```

## Setup

### 1. Install dependencies

```bash
cd apps/backend_nestjs/nestjs-boilerplate
npm install
```

### 2. Configure environment

Copy `.env` và cập nhật các giá trị:

```bash
# Database
DATABASE_URL=postgresql://wataomi:wataomi@localhost:5432/wataomi

# JWT
AUTH_JWT_SECRET=your-secret-key

# Casdoor (optional)
CASDOOR_ENDPOINT=http://localhost:8001
CASDOOR_CLIENT_ID=your-client-id
CASDOOR_CLIENT_SECRET=your-client-secret
```

### 3. Run migrations

```bash
# Generate migration from entities
npm run migration:generate -- src/database/migrations/InitialMigration

# Run migrations
npm run migration:run
```

### 4. Start server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server sẽ chạy tại: `http://localhost:8000`

API docs: `http://localhost:8000/docs`

## API Endpoints

### Workspaces

- `POST /api/v1/workspaces` - Create workspace
- `GET /api/v1/workspaces` - List user workspaces
- `GET /api/v1/workspaces/:id` - Get workspace
- `PATCH /api/v1/workspaces/:id` - Update workspace
- `DELETE /api/v1/workspaces/:id` - Delete workspace
- `POST /api/v1/workspaces/:id/members` - Add member
- `DELETE /api/v1/workspaces/:id/members/:userId` - Remove member

### Bots

- `POST /api/v1/bots` - Create bot
- `GET /api/v1/bots?workspaceId=1` - List bots
- `GET /api/v1/bots/:id` - Get bot
- `PATCH /api/v1/bots/:id` - Update bot
- `DELETE /api/v1/bots/:id` - Delete bot
- `POST /api/v1/bots/:id/versions` - Create flow version
- `POST /api/v1/bots/versions/:versionId/publish` - Publish version

### Flows

- `POST /api/v1/flows` - Create flow
- `GET /api/v1/flows` - List flows
- `GET /api/v1/flows/:id` - Get flow
- `PATCH /api/v1/flows/:id` - Update flow
- `DELETE /api/v1/flows/:id` - Delete flow

### Conversations

- `POST /api/v1/conversations` - Create conversation
- `GET /api/v1/conversations?botId=1` - List conversations
- `GET /api/v1/conversations/:id` - Get conversation
- `POST /api/v1/conversations/:id/messages` - Add message
- `GET /api/v1/conversations/:id/messages` - Get messages

### Auth (từ boilerplate)

- `POST /api/v1/auth/email/login` - Login
- `POST /api/v1/auth/email/register` - Register
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user
- `PATCH /api/v1/auth/me` - Update profile

## Migration từ Python

### Models → Entities

Python SQLModel → TypeORM Entities:

```python
# Python
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True)
```

```typescript
// NestJS
@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;
}
```

### Services

Python services → NestJS services với dependency injection:

```python
# Python
async def get_user(user_id: int):
    return db.query(User).filter(User.id == user_id).first()
```

```typescript
// NestJS
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }
}
```

### API Routes

FastAPI → NestJS Controllers:

```python
# Python
@router.get("/users/{id}")
async def get_user(id: int):
    return await user_service.get_user(id)
```

```typescript
// NestJS
@Controller({ path: 'users', version: '1' })
export class UsersController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
}
```

## Features Migrated

✅ User management với RBAC
✅ Workspace management
✅ Bot management
✅ Flow management
✅ Conversation & messaging
✅ JWT authentication
✅ Database migrations
✅ API documentation (Swagger)

## Features Cần Thêm

- [ ] Casdoor integration
- [ ] WebSocket support
- [ ] File upload (Cloudinary)
- [ ] n8n integration
- [ ] Qdrant vector DB
- [ ] Google AI integration
- [ ] OAuth channels (Facebook, Instagram)
- [ ] Execution engine
- [ ] Templates & metadata

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Docker

```bash
# Build
docker build -t wataomi-backend .

# Run
docker run -p 8000:8000 wataomi-backend
```

## Troubleshooting

### Database connection error

Kiểm tra DATABASE_URL trong `.env` và đảm bảo PostgreSQL đang chạy.

### Migration errors

```bash
# Drop schema và chạy lại
npm run schema:drop
npm run migration:run
```

### Port already in use

Thay đổi `APP_PORT` trong `.env` hoặc kill process đang dùng port 8000.

## Next Steps

1. Test các API endpoints với Swagger UI
2. Migrate thêm các features còn lại
3. Setup CI/CD pipeline
4. Deploy lên production

## Support

Xem thêm docs tại `docs/` folder hoặc liên hệ team.
