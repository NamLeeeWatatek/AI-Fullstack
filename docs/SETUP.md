# Wataomi Setup Guide

Hướng dẫn chi tiết để setup Wataomi từ đầu với Casdoor authentication.

## 📋 Yêu cầu

- Docker Desktop hoặc Docker Engine + Docker Compose
- Git
- Terminal/Command Line

## 🚀 Bước 1: Clone và Chuẩn bị

```bash
# Clone repository
git clone https://github.com/yourusername/wataomi.git
cd wataomi

# Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.local.example apps/web/.env.local
```

## 🐳 Bước 2: Khởi động Services

```bash
# Khởi động tất cả services
make start

# Hoặc dùng docker-compose trực tiếp
docker-compose up -d
```

Lệnh này sẽ khởi động:
- ✅ PostgreSQL (port 5432) - Database cho backend
- ✅ Redis (port 6379) - Cache
- ✅ MySQL (port 3306) - Database cho Casdoor
- ✅ Casdoor (port 8030) - Authentication service
- ✅ Backend (port 8000) - FastAPI
- ✅ Frontend (port 3000) - Next.js

Đợi khoảng 30 giây để tất cả services khởi động hoàn tất.

## 🔧 Bước 3: Khởi tạo Casdoor

```bash
# Chạy script khởi tạo
make init-casdoor
```

Script này sẽ tự động:
1. ✅ Tạo Organization: `wataomi`
2. ✅ Tạo Application: `wataomi-app`
3. ✅ Tạo Roles:
   - `admin` - Full system access
   - `manager` - Manage team and workspace
   - `editor` - Create and edit content
   - `viewer` - Read-only access
4. ✅ Tạo Permissions:
   - `bot-create`, `bot-edit`, `bot-delete`, `bot-view`
   - `user-manage`
   - `workspace-manage`

Sau khi chạy xong, bạn sẽ nhận được:
- Client ID
- Client Secret

## 🔑 Bước 4: Cập nhật Environment Variables

### Backend (.env)

Mở file `apps/backend/.env` và cập nhật:

```bash
CASDOOR_CLIENT_ID=abc123xyz456  # Client ID từ bước 3
CASDOOR_CLIENT_SECRET=secret789  # Client Secret từ bước 3
```

### Frontend (.env.local)

Mở file `apps/web/.env.local` và cập nhật:

```bash
CASDOOR_CLIENT_ID=abc123xyz456  # Client ID từ bước 3
CASDOOR_CLIENT_SECRET=secret789  # Client Secret từ bước 3
```

## 🔄 Bước 5: Restart Services

```bash
# Restart để áp dụng config mới
make restart
```

## 👥 Bước 6: Tạo Users trong Database

### Cách 1: Seed Sample Users (Recommended)

```bash
# Tạo 7 sample users với đầy đủ roles
make seed-users
```

Sample users được tạo:
- `admin@wataomi.com` - Admin User (admin)
- `manager@wataomi.com` - Manager User (manager)
- `editor1@wataomi.com` - John Editor (editor)
- `editor2@wataomi.com` - Jane Editor (editor)
- `viewer1@wataomi.com` - Bob Viewer (viewer)
- `viewer2@wataomi.com` - Alice Viewer (viewer)
- `inactive@wataomi.com` - Inactive User (inactive)

### Cách 2: Tạo user qua API

```bash
# Tạo custom user
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "custom@wataomi.com",
    "name": "Custom User",
    "role": "editor"
  }'
```

### Cách 3: Tạo user qua database

```bash
# Mở PostgreSQL shell
make db-shell

# Chạy SQL
INSERT INTO users (email, name, role, is_active, created_at, updated_at)
VALUES ('custom@wataomi.com', 'Custom User', 'editor', true, NOW(), NOW());
```

## 📤 Bước 7: Push Users lên Casdoor

```bash
# Push users từ database lên Casdoor
make push-casdoor
```

Script này sẽ:
- Đọc tất cả users từ database
- Tạo/update users tương ứng trong Casdoor
- Set default password: `ChangeMe123!`
- Link users với roles tương ứng

## ✅ Bước 8: Verify Setup

### 1. Kiểm tra Casdoor UI

Truy cập: http://localhost:8030

Login với:
- Username: `admin`
- Password: `123`

Kiểm tra:
- Organization `wataomi` đã được tạo
- Application `wataomi-app` đã được tạo
- Roles đã được tạo
- Permissions đã được tạo
- Users đã được sync

### 2. Kiểm tra Backend API

```bash
# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs
```

### 3. Kiểm tra Frontend

Truy cập: http://localhost:3000

Click "Login" và test authentication flow.

## 🎯 Bước 9: Login và Test

1. Mở Frontend: http://localhost:3000
2. Click "Login"
3. Sẽ redirect đến Casdoor login page
4. Login với user đã tạo:
   - Email: `admin@wataomi.com`
   - Password: `ChangeMe123!`
5. Sau khi login thành công, sẽ redirect về Frontend
6. Đổi password ngay lập tức!

## 🔄 Sync 2 chiều

### Database → Casdoor (Push)

```bash
# Push users, roles, permissions từ database lên Casdoor
make push-casdoor
```

Dùng khi:
- Bạn tạo users mới trong database
- Bạn muốn update thông tin users lên Casdoor
- Bạn thêm roles/permissions mới

### Casdoor → Database (Sync)

```bash
# Sync users từ Casdoor về database
make sync-casdoor
```

Dùng khi:
- Users tự đăng ký qua Casdoor
- Admin tạo users trực tiếp trong Casdoor UI
- Bạn muốn đồng bộ thông tin mới nhất

## 🛠️ Troubleshooting

### Casdoor không khởi động

```bash
# Xem logs
make logs-casdoor

# Restart
docker-compose restart casdoor

# Nếu vẫn lỗi, xóa volume và restart
docker-compose down -v
docker-compose up -d
```

### Init script báo lỗi

```bash
# Kiểm tra Casdoor đã sẵn sàng chưa
curl http://localhost:8030/api/get-global-providers

# Nếu chưa sẵn sàng, đợi thêm và retry
sleep 10
make init-casdoor
```

### Push users thất bại

```bash
# Kiểm tra database có users không
make db-shell
SELECT * FROM users;

# Kiểm tra Casdoor config
cat apps/backend/.env | grep CASDOOR

# Retry
make push-casdoor
```

### Frontend không redirect về sau login

Kiểm tra redirect URLs trong Casdoor:
1. Login Casdoor UI: http://localhost:8030
2. Vào Applications → wataomi-app
3. Kiểm tra Redirect URLs có:
   - `http://localhost:3000/api/auth/callback/casdoor`
   - `http://localhost:8000/api/v1/auth/callback`

### Token verification failed

```bash
# Kiểm tra certificate
# Vào Casdoor UI → Certs → cert-built-in
# Copy certificate và paste vào apps/backend/.env

CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END CERTIFICATE-----
```

## 📊 Monitoring

```bash
# Xem tất cả logs
make logs

# Xem logs từng service
make logs-backend
make logs-frontend
make logs-casdoor

# Kiểm tra health
make health

# Xem containers đang chạy
make ps
```

## 🔐 Security Best Practices

### 1. Đổi Default Passwords

```bash
# Casdoor admin password
# Login Casdoor UI → Users → admin → Change Password
```

### 2. Update Secret Keys

```bash
# Backend
SECRET_KEY=generate-strong-random-key-here

# Frontend
NEXTAUTH_SECRET=generate-strong-random-key-here
```

### 3. Đổi Database Passwords

```bash
# PostgreSQL
POSTGRES_PASSWORD=strong-password-here

# MySQL (Casdoor)
MYSQL_ROOT_PASSWORD=strong-password-here
```

### 4. Enable HTTPS (Production)

```bash
# Update URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
CASDOOR_ENDPOINT=https://auth.your-domain.com
```

## 🚀 Next Steps

1. ✅ Tạo thêm users
2. ✅ Assign roles cho users
3. ✅ Test permissions
4. ✅ Customize Casdoor UI (logo, colors)
5. ✅ Setup email provider trong Casdoor
6. ✅ Enable MFA (Multi-Factor Authentication)
7. ✅ Configure social login (Google, Facebook, etc.)

## 📚 Tài liệu thêm

- [Casdoor Documentation](https://casdoor.org/docs/overview)
- [Backend API Documentation](backend.md)
- [Frontend Documentation](frontend.md)
- [Architecture Overview](architecture.md)

## 🆘 Cần giúp đỡ?

- GitHub Issues: https://github.com/yourusername/wataomi/issues
- Email: support@wataomi.com
- Discord: https://discord.gg/wataomi
