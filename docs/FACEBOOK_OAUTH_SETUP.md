# Facebook OAuth Setup - User Connect Pages

## 🎯 Flow Tổng Quan

```
User clicks "Connect Facebook"
         ↓
Redirect to Facebook OAuth
         ↓
User logs in & grants permissions
         ↓
Facebook redirects back with code
         ↓
Backend exchanges code for token
         ↓
Get user's Facebook Pages
         ↓
User selects which pages to connect
         ↓
Save page connections to database
         ↓
Subscribe to webhooks
         ↓
Done! Ready to receive messages
```

---

## 📋 Prerequisites

### 1. Facebook App Setup

1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo App mới (type: Business)
3. Thêm sản phẩm: **Messenger**

### 2. Configure OAuth Settings

**App Settings → Basic:**
- App ID: `852815350438940`
- App Secret: `your-app-secret`

**App Settings → Advanced:**
- Server IP Whitelist: (optional)

**Messenger → Settings:**
- Callback URL: `https://your-domain.com/api/v1/webhooks/facebook`
- Verify Token: `wataomi_verify_token_2025`

### 3. OAuth Redirect URIs

**Facebook Login → Settings:**

Add these Valid OAuth Redirect URIs:
```
http://localhost:3000/channels/facebook/callback
https://your-domain.com/channels/facebook/callback
```

### 4. Permissions

Request these permissions:
- ✅ `pages_show_list` - List user's pages
- ✅ `pages_messaging` - Send/receive messages
- ✅ `pages_manage_metadata` - Manage page settings
- ✅ `pages_read_engagement` - Read page engagement

---

## 🔧 Backend Configuration

### 1. Environment Variables

```bash
# apps/backend/.env

# Facebook App Credentials
FACEBOOK_APP_ID=852815350438940
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_VERIFY_TOKEN=wataomi_verify_token_2025

# Frontend Domain (for OAuth redirect)
FRONTEND_DOMAIN=http://localhost:3000
# or
FRONTEND_DOMAIN=https://your-domain.com
```

### 2. API Endpoints

Backend đã có sẵn các endpoints:

```typescript
// Get OAuth URL
GET /api/v1/channels/facebook/oauth/url
Response: { url: "https://facebook.com/oauth/...", redirectUri: "..." }

// Handle OAuth callback
GET /api/v1/channels/facebook/oauth/callback?code=xxx&state=xxx
Response: { success: true, pages: [...], tempToken: "..." }

// Connect a specific page
POST /api/v1/channels/facebook/connect
Body: { pageId, pageName, userAccessToken, category }
Response: { success: true, connection: {...}, webhookSubscribed: true }

// Get connected pages
GET /api/v1/channels/facebook/connections
Response: { success: true, connections: [...] }

// Disconnect page
DELETE /api/v1/channels/facebook/connections/:id
Response: { success: true }
```

---

## 🎨 Frontend Implementation

### 1. Main Page

File: `apps/web/app/(dashboard)/channels/facebook/page.tsx`

**Features:**
- Button "Connect Facebook Page"
- List connected pages
- Disconnect pages
- View messages per page

### 2. Callback Page

File: `apps/web/app/(dashboard)/channels/facebook/callback/page.tsx`

**Features:**
- Handle OAuth callback
- Show loading state
- Redirect back with pages data

### 3. User Flow

```typescript
// Step 1: User clicks "Connect Facebook"
const handleConnectFacebook = async () => {
  // Get OAuth URL from backend
  const response = await fetch('/api/v1/channels/facebook/oauth/url', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const { url } = await response.json();
  
  // Redirect to Facebook
  window.location.href = url;
};

// Step 2: Facebook redirects to callback page
// /channels/facebook/callback?code=xxx&state=xxx

// Step 3: Callback page exchanges code for pages
const response = await fetch(
  `/api/v1/channels/facebook/oauth/callback?code=${code}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const { pages, tempToken } = await response.json();

// Step 4: Redirect back to main page with pages
router.push(`/channels/facebook?pages=${pages}&token=${tempToken}`);

// Step 5: User selects page to connect
const handleConnectPage = async (page) => {
  await fetch('/api/v1/channels/facebook/connect', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      pageId: page.id,
      pageName: page.name,
      userAccessToken: tempToken
    })
  });
  
  // Done! Page connected
};
```

---

## 🧪 Testing

### 1. Test OAuth Flow

```bash
# Start backend
cd apps/backend
npm run start:dev

# Start frontend
cd apps/web
npm run dev
```

### 2. Test Steps

1. Navigate to: `http://localhost:3000/channels/facebook`
2. Click "Connect Facebook Page"
3. Login to Facebook
4. Grant permissions
5. Select pages to connect
6. Verify pages appear in "Connected Pages"

### 3. Test Webhook

```bash
# Send test message to your Facebook Page
# Check backend logs for incoming webhook

# Backend should log:
📩 Received Facebook message from 123456789: Hello!
🤖 Processing message...
✅ Sent response to 123456789
```

---

## 🔐 Security

### 1. Token Storage

**Backend:**
- Page Access Tokens are stored in database (should be encrypted)
- User Access Tokens are temporary (not stored)

**Frontend:**
- Temporary tokens only passed via URL params
- Never store tokens in localStorage

### 2. State Parameter

OAuth state parameter is used to prevent CSRF:
```typescript
const state = req.user.id; // User ID as state
```

Verify state on callback to ensure request is legitimate.

### 3. Webhook Signature

Always verify webhook signatures:
```typescript
const isValid = verifyWebhook(payload, signature);
if (!isValid) {
  return { success: false, error: 'Invalid signature' };
}
```

---

## 📊 Database Schema

### Channel Connection

```sql
CREATE TABLE channel_connection (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50), -- 'facebook'
  workspace_id UUID,
  access_token TEXT, -- Page Access Token (encrypted)
  status VARCHAR(50), -- 'active', 'expired', 'error'
  metadata JSONB, -- { pageId, pageName, category, tasks }
  connected_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example:**
```json
{
  "id": "conn-123",
  "name": "Demo đa kênh - Facebook",
  "type": "facebook",
  "workspaceId": "workspace-456",
  "accessToken": "EAAMHoYwFnBwBQ...",
  "status": "active",
  "metadata": {
    "pageId": "939014215956208",
    "pageName": "Demo đa kênh",
    "category": "Dịch vụ mua sắm",
    "tasks": ["MESSAGING", "MODERATE", "ANALYZE"]
  },
  "connectedAt": "2025-12-03T10:00:00Z"
}
```

---

## 🚀 Deployment

### 1. Update Environment Variables

```bash
# Production .env
FRONTEND_DOMAIN=https://your-domain.com
FACEBOOK_APP_ID=your-production-app-id
FACEBOOK_APP_SECRET=your-production-app-secret
```

### 2. Update Facebook App Settings

**Valid OAuth Redirect URIs:**
```
https://your-domain.com/channels/facebook/callback
```

**Webhook Callback URL:**
```
https://your-domain.com/api/v1/webhooks/facebook
```

### 3. Test Production

1. Navigate to: `https://your-domain.com/channels/facebook`
2. Connect Facebook Page
3. Send test message
4. Verify webhook receives message

---

## 🐛 Troubleshooting

### Issue: "Redirect URI mismatch"

**Solution:**
- Check Facebook App Settings → Facebook Login → Valid OAuth Redirect URIs
- Make sure URL matches exactly (including http/https)

### Issue: "Invalid OAuth code"

**Solution:**
- Code can only be used once
- Code expires after 10 minutes
- Make sure FRONTEND_DOMAIN is correct

### Issue: "No pages found"

**Solution:**
- User must be admin of at least one Facebook Page
- Check permissions: `pages_show_list`
- Try with a different Facebook account

### Issue: "Webhook not receiving messages"

**Solution:**
- Check webhook is subscribed: Facebook App → Webhooks
- Verify webhook URL is accessible
- Check webhook signature verification
- Test with Facebook's webhook tester

---

## ✅ Checklist

- [ ] Facebook App created
- [ ] OAuth redirect URIs configured
- [ ] Permissions requested (pages_show_list, pages_messaging, etc.)
- [ ] Backend environment variables set
- [ ] Frontend pages created
- [ ] Test OAuth flow works
- [ ] Test page connection works
- [ ] Test webhook receives messages
- [ ] Test bot responds to messages
- [ ] Deploy to production
- [ ] Update production URLs in Facebook App

---

## 📚 References

- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/guides/advanced/business-login)
- [Pages API](https://developers.facebook.com/docs/pages)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [Webhooks](https://developers.facebook.com/docs/messenger-platform/webhooks)

---

## 🎉 Done!

Bây giờ users có thể:
1. ✅ Login Facebook qua OAuth
2. ✅ Xem danh sách Pages của họ
3. ✅ Connect Pages vào hệ thống
4. ✅ Nhận tin nhắn từ Facebook
5. ✅ Bot tự động trả lời
6. ✅ Quản lý nhiều Pages trong 1 workspace
