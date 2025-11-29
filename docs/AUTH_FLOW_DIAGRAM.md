# WataOmi Authentication Flow

## Overview

WataOmi sử dụng **OAuth2 Authorization Code Flow** với Casdoor làm Identity Provider (IdP).

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │         │   Backend   │         │   Casdoor   │
│  (Next.js)  │         │  (NestJS)   │         │    (IdP)    │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  1. Click Login       │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │  2. Redirect to Casdoor                       │
       ├───────────────────────────────────────────────>│
       │                       │                       │
       │  3. User enters credentials on Casdoor UI     │
       │                       │                       │
       │  4. Redirect back with code                   │
       │<───────────────────────────────────────────────┤
       │                       │                       │
       │  5. Send code to Backend                      │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │  6. Exchange code     │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │  7. Return token      │
       │                       │<──────────────────────┤
       │                       │                       │
       │                       │  8. Get user info     │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │  9. Return user data  │
       │                       │<──────────────────────┤
       │                       │                       │
       │                       │ 10. Create/update user│
       │                       │     in database       │
       │                       │                       │
       │                       │ 11. Create session    │
       │                       │     & JWT tokens      │
       │                       │                       │
       │  12. Return JWT       │                       │
       │<──────────────────────┤                       │
       │                       │                       │
       │  13. Store in NextAuth session                │
       │                       │                       │
       │  14. Redirect to /dashboard                   │
       │                       │                       │
```

## Detailed Flow

### Step 1-2: Initiate Login

**File:** `apps/web/app/login/page.tsx`

```typescript
const handleLogin = () => {
  const casdoorLoginUrl = casdoorSdk.getSigninUrl()
  // URL: http://localhost:8030/login/oauth/authorize?
  //      client_id=xxx&
  //      redirect_uri=http://localhost:3000/callback&
  //      response_type=code&
  //      scope=read&
  //      state=random
  window.location.href = casdoorLoginUrl
}
```

### Step 3: User Authentication on Casdoor

- User sees **Casdoor's login page** (NOT our frontend)
- User enters **username/password on Casdoor**
- Casdoor validates credentials
- Casdoor generates authorization code

### Step 4: Callback with Code

**URL:** `http://localhost:3000/callback?code=xxx&state=xxx`

**File:** `apps/web/app/callback/page.tsx`

```typescript
const code = searchParams.get('code')
const state = searchParams.get('state')
```

### Step 5-12: Backend Authentication

**File:** `apps/web/auth.ts` (NextAuth)

```typescript
const result = await signIn('credentials', {
  code,
  state,
  redirect: false,
})
```

**File:** `apps/backend/src/auth-casdoor/auth-casdoor.service.ts`

```typescript
// 1. Exchange code for token
const tokenResponse = await this.exchangeCodeForToken(code)

// 2. Get user info
const casdoorUser = await this.getCasdoorUserInfo(tokenResponse.access_token)

// 3. Sync user to database
const user = await this.syncUser(casdoorUser)

// 4. Create session & JWT
const session = await this.sessionService.create({ user, hash })
const token = await this.jwtService.signAsync({ id: user.id, ... })

// 5. Return tokens
return { token, refreshToken, user }
```

### Step 13-14: Session Storage & Redirect

**File:** `apps/web/auth.ts` (NextAuth callbacks)

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.accessToken = user.accessToken
      token.refreshToken = user.refreshToken
    }
    return token
  },
  async session({ session, token }) {
    session.accessToken = token.accessToken
    return session
  }
}
```

## Security Features

### 1. OAuth2 Authorization Code Flow
- ✅ User credentials NEVER touch our frontend
- ✅ Authorization code is single-use
- ✅ Code exchange requires client_secret (backend only)

### 2. JWT Tokens
- ✅ Access token (30 minutes)
- ✅ Refresh token (7 days)
- ✅ Signed with secret keys

### 3. Session Management
- ✅ Server-side session storage
- ✅ Session hash for validation
- ✅ 30-day session expiry

## API Endpoints

### Frontend → Backend

```
POST /api/v1/auth/casdoor/callback
Content-Type: application/json

{
  "code": "authorization_code_here",
  "state": "random_state"
}

Response:
{
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "tokenExpires": 1234567890,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Backend → Casdoor

```
POST http://localhost:8030/api/login/oauth/access_token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=xxx&
client_secret=xxx&
code=xxx

Response:
{
  "access_token": "casdoor_token",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

```
GET http://localhost:8030/api/userinfo
Authorization: Bearer casdoor_token

Response:
{
  "id": "user_id",
  "name": "username",
  "displayName": "Display Name",
  "email": "user@example.com"
}
```

## Environment Variables

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030
NEXT_PUBLIC_CASDOOR_CLIENT_ID=xxx
NEXT_PUBLIC_CASDOOR_APP_NAME=wataomi-app
NEXT_PUBLIC_CASDOOR_ORG_NAME=wataomi
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxx
```

### Backend (.env)

```bash
API_PREFIX=api
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_CLIENT_ID=xxx
CASDOOR_CLIENT_SECRET=xxx
CASDOOR_APP_NAME=wataomi-app
CASDOOR_ORG_NAME=wataomi
AUTH_JWT_SECRET=xxx
AUTH_REFRESH_SECRET=xxx
```

## Common Issues & Solutions

### Issue 1: 404 Not Found on callback

**Problem:** Backend route not found

**Solution:** 
- Check `API_PREFIX=api` (not `api/v1`)
- Check controller has `version: '1'`
- Restart backend

### Issue 2: CORS Error

**Problem:** Frontend can't call backend

**Solution:**
- Backend CORS enabled in `main.ts`
- Check `FRONTEND_DOMAIN` in backend `.env`

### Issue 3: Invalid Code

**Problem:** Code already used or expired

**Solution:**
- Codes are single-use
- Don't refresh callback page
- Check Casdoor logs

### Issue 4: User Not Created

**Problem:** User not synced to database

**Solution:**
- Check database connection
- Check `UsersService.create()` method
- Check Casdoor user data structure

## Testing

### 1. Test Casdoor Connection

```bash
curl http://localhost:8030/.well-known/openid-configuration
```

### 2. Test Backend Endpoint

```bash
curl -X POST http://localhost:8000/api/v1/auth/casdoor/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"test","state":"test"}'
```

### 3. Check Swagger

```
http://localhost:8000/docs
```

## References

- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [Casdoor Documentation](https://casdoor.org/docs/overview)
- [NextAuth.js Documentation](https://next-auth.js.org/)
