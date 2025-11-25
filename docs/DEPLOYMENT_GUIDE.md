# WataOmi - Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Casdoor                       │
│         (Admin/Quota Management)                │
│         http://localhost:8030                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Core Infrastructure                │
│  ┌──────────────┐      ┌──────────────┐        │
│  │  PostgreSQL  │      │    Redis     │        │
│  │  Port: 5432  │      │  Port: 6379  │        │
│  └──────────────┘      └──────────────┘        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            Application Layer                    │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   Backend    │      │   Frontend   │        │
│  │  Port: 8002  │←────→│  Port: 3003  │        │
│  └──────────────┘      └──────────────┘        │
└─────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start Core Infrastructure (Required First)
```bash
cd core
docker-compose up -d
```

This starts:
- PostgreSQL (database)
- Redis (cache)

### 2. Start Backend
```bash
cd apps/backend
python run.py
# Or with Docker:
# docker-compose up -d
```

### 3. Start Frontend
```bash
cd apps/web
npm run dev
# Or with Docker:
# docker-compose up -d
```

## Access Points

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:8002
- **API Docs**: http://localhost:8002/docs
- **Casdoor**: http://localhost:8030 (if running separately)

## Environment Variables

### Core (`core/.env`)
```env
POSTGRES_USER=wataomi
POSTGRES_PASSWORD=wataomi
POSTGRES_DB=wataomi
POSTGRES_PORT=5432
REDIS_PORT=6379
```

### Backend (`apps/backend/.env`)
```env
DATABASE_URL=postgresql+asyncpg://wataomi:wataomi@localhost:5432/wataomi
REDIS_URL=redis://localhost:6379/0
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_APP_NAME=app-built-in
CASDOOR_ORG_NAME=built-in
```

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030
NEXT_PUBLIC_CASDOOR_CLIENT_ID=your_client_id
NEXT_PUBLIC_CASDOOR_APP_NAME=app-built-in
NEXT_PUBLIC_CASDOOR_ORG_NAME=built-in
NEXT_PUBLIC_CASDOOR_REDIRECT_URI=http://localhost:3003/callback
```

## Casdoor Integration

Casdoor acts as the **central authentication and quota management** system:

1. **Admin Access**: Admins log in via Casdoor to get quota/permissions
2. **Token Flow**: Casdoor issues JWT tokens
3. **Backend Verification**: Backend verifies tokens from Casdoor
4. **No Local User DB**: User data comes from Casdoor, not local DB

### What Needs Local DB?
- ✅ Flows (workflow definitions)
- ✅ Bots (bot configurations)
- ✅ Conversations (chat history)
- ✅ Channels (integration configs)
- ❌ Users (managed by Casdoor)
- ❌ Auth (managed by Casdoor)

## Troubleshooting

### Backend can't connect to PostgreSQL
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
cd core
docker-compose logs postgres
```

### Frontend can't connect to Backend
```bash
# Check if backend is running
curl http://localhost:8002/health

# Check backend logs
cd apps/backend
# (check terminal output)
```

### Casdoor auth fails
1. Verify `CASDOOR_CLIENT_ID` matches in both frontend and backend
2. Verify redirect URI in Casdoor matches `http://localhost:3003/callback`
3. Check Casdoor is running on port 8030

## Production Deployment

For production, update:
1. Change all passwords in `core/.env`
2. Use proper domain names instead of localhost
3. Enable HTTPS
4. Set `DEBUG=false` in backend
5. Build frontend with `npm run build`
