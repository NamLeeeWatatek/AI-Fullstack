# WataOmi Backend (NestJS)

AI-powered omnichannel customer engagement platform backend built with NestJS, TypeORM, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16
- PostgreSQL >= 13
- npm >= 8

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

Create `.env` file (already created, update values as needed):

```bash
# Database
DATABASE_URL=postgresql://wataomi:wataomi@localhost:5432/wataomi

# JWT
AUTH_JWT_SECRET=your-secret-key

# App
APP_PORT=8000
```

3. **Setup database**

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/InitialMigration

# Run migrations
npm run migration:run
```

4. **Start server**

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Server runs at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

## 📁 Project Structure

```
src/
├── auth/                # Authentication & authorization
├── users/               # User management
├── workspaces/          # Workspace management
├── bots/                # Bot management
├── flows/               # Flow management
├── conversations/       # Conversations & messages
├── config/              # Configuration
├── database/            # Database config & migrations
└── utils/               # Utilities
```

## 🔑 API Endpoints

### Authentication

- `POST /api/v1/auth/email/login` - Login
- `POST /api/v1/auth/email/register` - Register
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Workspaces

- `POST /api/v1/workspaces` - Create workspace
- `GET /api/v1/workspaces` - List workspaces
- `GET /api/v1/workspaces/:id` - Get workspace
- `PATCH /api/v1/workspaces/:id` - Update workspace
- `DELETE /api/v1/workspaces/:id` - Delete workspace

### Bots

- `POST /api/v1/bots` - Create bot
- `GET /api/v1/bots` - List bots
- `GET /api/v1/bots/:id` - Get bot
- `PATCH /api/v1/bots/:id` - Update bot
- `DELETE /api/v1/bots/:id` - Delete bot

### Flows

- `POST /api/v1/flows` - Create flow
- `GET /api/v1/flows` - List flows
- `GET /api/v1/flows/:id` - Get flow
- `PATCH /api/v1/flows/:id` - Update flow
- `DELETE /api/v1/flows/:id` - Delete flow

### Conversations

- `POST /api/v1/conversations` - Create conversation
- `GET /api/v1/conversations` - List conversations
- `GET /api/v1/conversations/:id` - Get conversation
- `POST /api/v1/conversations/:id/messages` - Add message
- `GET /api/v1/conversations/:id/messages` - Get messages

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🗄️ Database

### Migrations

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Drop schema
npm run schema:drop
```

### Seeding

```bash
# Run seeds
npm run seed:run:relational
```

## 🐳 Docker

```bash
# Build image
docker build -t wataomi-backend .

# Run container
docker run -p 8000:8000 --env-file .env wataomi-backend

# Using docker-compose
docker-compose up -d
```

## 📝 Development

### Code Generation

```bash
# Generate new resource (CRUD)
npm run generate:resource:relational

# Add property to existing resource
npm run add:property:to-relational
```

### Linting & Formatting

```bash
# Lint
npm run lint

# Format
npm run format
```

## 🔐 Environment Variables

See `.env` file for all available variables:

- `APP_PORT` - Server port (default: 8000)
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_JWT_SECRET` - JWT secret key
- `CASDOOR_ENDPOINT` - Casdoor auth server
- `CLOUDINARY_*` - Cloudinary config for file uploads
- `REDIS_URL` - Redis connection string

## 📚 Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - Python to NestJS migration
- [API Documentation](http://localhost:8000/docs) - Swagger UI
- [Architecture](../../docs/architecture.md) - System architecture

## 🛠️ Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL + TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## 🤝 Contributing

1. Follow [coding standards](../../.kiro/steering/coding-standards.md)
2. Use conventional commits
3. Write tests for new features
4. Update documentation

## 📄 License

MIT

## 🆘 Support

For issues and questions, check:
- [Troubleshooting](./MIGRATION_GUIDE.md#troubleshooting)
- [Documentation](../../docs/)
- Project issues

---

Built with ❤️ by WataOmi Team
