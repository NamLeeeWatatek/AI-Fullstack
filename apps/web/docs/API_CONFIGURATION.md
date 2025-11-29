# API Configuration Guide

## Environment Variables

### NEXT_PUBLIC_API_URL

**Value:** `http://localhost:8000/api/v1` (includes `/api/v1` prefix)

**Usage:** All API calls should use this variable directly without adding `/api/v1` again.

```typescript
// ✅ Correct
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const response = await fetch(`${apiUrl}/auth/casdoor/callback`);
// Result: http://localhost:8000/api/v1/auth/casdoor/callback

// ❌ Wrong - Double /api/v1
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const response = await fetch(`${apiUrl}/api/v1/auth/casdoor/callback`);
```

## Files Using API_URL

All these files follow the same pattern:

- `lib/api.ts` - Base API client
- `lib/axios-client.ts` - Axios client for browser
- `lib/axios-server.ts` - Axios client for server
- `auth.ts` - NextAuth configuration
- `lib/hooks/use-execution-stream.ts` - WebSocket execution stream
- `lib/services/websocket-service.ts` - WebSocket service
- `components/features/**/*.tsx` - Feature components

## Backend API Prefix

Backend uses `/api/v1` as global prefix (configured in `apps/backend/.env`):

```bash
API_PREFIX=api/v1
```

This means all NestJS controllers are automatically prefixed with `/api/v1`.

Example:
- Controller: `@Controller('auth/casdoor')`
- Full URL: `http://localhost:8000/api/v1/auth/casdoor`

## Consistency Rules

1. **Always include `/api/v1` in `NEXT_PUBLIC_API_URL`**
2. **Never add `/api/v1` in code when using `NEXT_PUBLIC_API_URL`**
3. **Use the same fallback value everywhere:** `'http://localhost:8000/api/v1'`

## Production Configuration

For production, update `.env.local` or `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://api.wataomi.com/api/v1
```

## Testing

To verify API configuration:

```bash
# Check environment variable
echo $NEXT_PUBLIC_API_URL

# Test endpoint
curl http://localhost:8000/api/v1/auth/casdoor/callback
```
