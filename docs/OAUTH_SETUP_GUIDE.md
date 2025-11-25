# OAuth Setup Guide - Cấu hình Facebook, Instagram, Google

Hướng dẫn chi tiết để lấy App ID và App Secret cho các platform.

---

## 🔵 Facebook Messenger

### Bước 1: Tạo Facebook App

1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Chọn **"Business"** type
4. Điền thông tin:
   - **App Name**: WataOmi (hoặc tên bạn muốn)
   - **App Contact Email**: email của bạn
   - Click **"Create App"**

### Bước 2: Thêm Messenger Product

1. Trong dashboard app, tìm **"Messenger"** trong danh sách Products
2. Click **"Set Up"**
3. Scroll xuống **"Access Tokens"**

### Bước 3: Lấy Credentials

1. **App ID**: Ở góc trên cùng dashboard (Settings → Basic)
2. **App Secret**: Ở Settings → Basic → App Secret (click "Show")

### Bước 4: Configure Webhook (sau khi deploy)

1. Trong Messenger Settings → Webhooks
2. Click **"Add Callback URL"**
3. Nhập:
   - **Callback URL**: `https://your-domain.com/api/v1/webhooks/facebook`
   - **Verify Token**: Tạo một string random (lưu lại để config backend)
4. Subscribe to events:
   - `messages`
   - `messaging_postbacks`
   - `messaging_optins`

### Bước 5: Thêm vào .env

```bash
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_VERIFY_TOKEN=your_random_verify_token
```

---

## 📷 Instagram

### Bước 1: Sử dụng cùng Facebook App

Instagram sử dụng cùng Facebook App (không cần tạo riêng)

### Bước 2: Thêm Instagram Product

1. Trong Facebook App dashboard
2. Tìm **"Instagram"** trong Products
3. Click **"Set Up"**

### Bước 3: Connect Instagram Business Account

1. Cần có **Instagram Business Account** (không phải Personal)
2. Link Instagram với Facebook Page
3. Trong Instagram Settings → Basic Display
4. Lấy **Instagram App ID** và **Instagram App Secret**

### Bước 4: Configure Webhook

1. Trong Instagram Settings → Webhooks
2. Callback URL: `https://your-domain.com/api/v1/webhooks/instagram`
3. Subscribe to:
   - `messages`
   - `messaging_postbacks`
   - `messaging_seen`

### Bước 5: Thêm vào .env

```bash
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

---

## 🔴 Google (Gmail, Google Business Messages)

### Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Điền:
   - **Project Name**: WataOmi
   - Click **"Create"**

### Bước 2: Enable APIs

1. Trong project, vào **"APIs & Services"** → **"Library"**
2. Tìm và enable:
   - **Gmail API** (nếu dùng Gmail)
   - **Business Messages API** (nếu dùng Google Business Messages)

### Bước 3: Tạo OAuth Credentials

1. Vào **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Chọn **"Web application"**
4. Điền:
   - **Name**: WataOmi Web Client
   - **Authorized redirect URIs**: 
     - `http://localhost:3003/oauth/callback/google` (dev)
     - `https://your-domain.com/oauth/callback/google` (production)
5. Click **"Create"**

### Bước 4: Lấy Credentials

1. **Client ID**: Hiển thị sau khi tạo
2. **Client Secret**: Hiển thị sau khi tạo
3. Download JSON file để backup

### Bước 5: Thêm vào .env

```bash
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## 💬 WhatsApp Business

### Bước 1: Sử dụng Facebook App

WhatsApp Business API sử dụng cùng Facebook App

### Bước 2: Thêm WhatsApp Product

1. Trong Facebook App dashboard
2. Tìm **"WhatsApp"** trong Products
3. Click **"Set Up"**

### Bước 3: Tạo WhatsApp Business Account

1. Follow wizard để tạo WhatsApp Business Account
2. Verify business information
3. Add phone number

### Bước 4: Lấy Credentials

1. **Phone Number ID**: Trong WhatsApp → API Setup
2. **WhatsApp Business Account ID**: Trong WhatsApp → Settings
3. **Access Token**: Generate trong WhatsApp → API Setup

### Bước 5: Configure Webhook

1. Trong WhatsApp → Configuration → Webhook
2. Callback URL: `https://your-domain.com/api/v1/webhooks/whatsapp`
3. Verify Token: Tạo random string
4. Subscribe to:
   - `messages`
   - `message_status`

### Bước 6: Thêm vào .env

```bash
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

---

## 📱 Telegram

### Bước 1: Tạo Bot với BotFather

1. Mở Telegram, tìm **@BotFather**
2. Gửi `/newbot`
3. Điền:
   - **Bot name**: WataOmi Bot
   - **Bot username**: wataomi_bot (phải unique và kết thúc bằng _bot)

### Bước 2: Lấy Bot Token

1. BotFather sẽ gửi **Bot Token** (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
2. Lưu token này

### Bước 3: Set Webhook

Sau khi deploy backend, chạy:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/v1/webhooks/telegram"}'
```

### Bước 4: Thêm vào .env

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

## 🔐 Complete .env Example

```bash
# ===== OAUTH PROVIDERS =====

# Facebook Messenger
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
FACEBOOK_VERIFY_TOKEN=my_random_verify_token_12345

# Instagram
INSTAGRAM_APP_ID=234567890123456
INSTAGRAM_APP_SECRET=bcdefg2345678901bcdefg2345678901

# Google
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=234567890123456
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO...
WHATSAPP_VERIFY_TOKEN=my_whatsapp_verify_token

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# ===== FRONTEND URL =====
FRONTEND_URL=http://localhost:3003  # Dev
# FRONTEND_URL=https://wataomi.com  # Production
```

---

## 🧪 Testing OAuth Flow

### 1. Start Backend
```bash
cd apps/backend
uvicorn app.main:app --reload --port 8000
```

### 2. Start Frontend
```bash
cd apps/web
npm run dev
```

### 3. Test Connection

1. Mở `http://localhost:3003/channels`
2. Click **"Configure"** trên platform bạn muốn test
3. Nhập App ID và App Secret
4. Click **"Save Configuration"**
5. Click **"Connect"**
6. Popup sẽ mở để authorize
7. Sau khi authorize, channel sẽ hiện trong danh sách

---

## 🚨 Common Issues

### Facebook/Instagram

**Issue**: "Invalid OAuth redirect URI"
- **Fix**: Thêm redirect URI vào Facebook App Settings → Basic → App Domains

**Issue**: "App not approved for public use"
- **Fix**: Trong App Review, submit app để review (hoặc add test users)

### Google

**Issue**: "redirect_uri_mismatch"
- **Fix**: Đảm bảo redirect URI trong Google Console khớp chính xác với frontend URL

**Issue**: "Access blocked: This app's request is invalid"
- **Fix**: Enable APIs trong Google Cloud Console

### WhatsApp

**Issue**: "Phone number not verified"
- **Fix**: Complete business verification trong Facebook Business Manager

**Issue**: "Webhook verification failed"
- **Fix**: Đảm bảo verify token trong webhook config khớp với .env

### Telegram

**Issue**: "Webhook not working"
- **Fix**: Kiểm tra webhook URL có HTTPS và accessible từ internet

---

## 📚 Useful Links

- [Facebook Developers](https://developers.facebook.com/)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 💡 Tips

1. **Development**: Sử dụng ngrok để expose localhost cho webhook testing
   ```bash
   ngrok http 8000
   # Sử dụng ngrok URL làm webhook URL
   ```

2. **Security**: Không commit credentials vào git
   - Thêm `.env` vào `.gitignore`
   - Sử dụng environment variables trong production

3. **Testing**: Tạo test accounts/pages cho mỗi platform để test mà không ảnh hưởng production

4. **Rate Limits**: Mỗi platform có rate limits khác nhau, implement retry logic

5. **Monitoring**: Log tất cả webhook events để debug issues

---

## ✅ Checklist

- [ ] Tạo Facebook App và lấy credentials
- [ ] Configure Instagram trong cùng Facebook App
- [ ] Tạo Google Cloud Project và OAuth credentials
- [ ] Setup WhatsApp Business Account
- [ ] Tạo Telegram Bot với BotFather
- [ ] Thêm tất cả credentials vào `.env`
- [ ] Test OAuth flow cho mỗi platform
- [ ] Configure webhooks sau khi deploy
- [ ] Verify webhook delivery
- [ ] Test sending/receiving messages

---

Sau khi có credentials, bạn có thể connect channels trong WataOmi dashboard! 🚀
