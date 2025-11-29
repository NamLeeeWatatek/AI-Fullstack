# User Management với Casdoor

Hướng dẫn quản lý users, roles, và permissions trong Wataomi sử dụng Casdoor.

## 📋 Tổng quan

Wataomi sử dụng Casdoor làm central authentication và authorization service. Tất cả users, roles, và permissions được quản lý tập trung trên Casdoor và đồng bộ với database local.

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                      Casdoor                             │
│  (Central Auth & User Management)                        │
│                                                          │
│  - Organizations                                         │
│  - Applications                                          │
│  - Users                                                 │
│  - Roles                                                 │
│  - Permissions                                           │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
             │ Sync                       │ Verify Token
             ▼                            ▼
┌────────────────────────┐    ┌──────────────────────────┐
│   Backend Database     │    │   Backend API            │
│   (PostgreSQL)         │◄───┤   (FastAPI)              │
│                        │    │                          │
│   - users              │    │   - Authentication       │
│   - workspaces         │    │   - Authorization        │
│   - workspace_members  │    │   - Business Logic       │
└────────────────────────┘    └──────────────────────────┘
```

## 👥 User Management

### Tạo User

#### Cách 1: Tạo trong Database → Push lên Casdoor

```bash
# 1. Tạo user trong database
docker-compose exec backend python -c "
from app.db.session import get_session_context
from app.models.user import User
import asyncio

async def create_user():
    async with get_session_context() as session:
        user = User(
            email='user@example.com',
            name='John Doe',
            role='editor',
            is_active=True
        )
        session.add(user)
        await session.commit()
        print(f'Created user: {user.email}')

asyncio.run(create_user())
"

# 2. Push lên Casdoor
make push-casdoor
```

#### Cách 2: Tạo trong Casdoor → Sync về Database

```bash
# 1. Login Casdoor UI: http://localhost:8030
# 2. Vào Users → Add User
# 3. Điền thông tin:
#    - Organization: wataomi
#    - Name: johndoe
#    - Display Name: John Doe
#    - Email: user@example.com
#    - Password: ChangeMe123!
#    - Type: normal-user
# 4. Save

# 5. Sync về database
make sync-casdoor
```

#### Cách 3: Self-Registration (Users tự đăng ký)

```bash
# 1. Enable signup trong Casdoor Application
# Login Casdoor UI → Applications → wataomi-app
# Set: enableSignUp = true

# 2. Users truy cập Frontend và click "Sign Up"
# 3. Điền form đăng ký
# 4. User được tạo trong Casdoor
# 5. Auto sync về database khi user login lần đầu
```

### Update User

```bash
# Update trong database
docker-compose exec backend python -c "
from app.db.session import get_session_context
from app.models.user import User
from sqlmodel import select
import asyncio

async def update_user():
    async with get_session_context() as session:
        result = await session.execute(
            select(User).where(User.email == 'user@example.com')
        )
        user = result.scalar_one_or_none()
        if user:
            user.name = 'John Updated'
            user.role = 'manager'
            session.add(user)
            await session.commit()
            print(f'Updated user: {user.email}')

asyncio.run(update_user())
"

# Push changes lên Casdoor
make push-casdoor
```

### Delete User

```bash
# Soft delete (recommended)
docker-compose exec backend python -c "
from app.db.session import get_session_context
from app.models.user import User
from sqlmodel import select
import asyncio

async def deactivate_user():
    async with get_session_context() as session:
        result = await session.execute(
            select(User).where(User.email == 'user@example.com')
        )
        user = result.scalar_one_or_none()
        if user:
            user.is_active = False
            session.add(user)
            await session.commit()
            print(f'Deactivated user: {user.email}')

asyncio.run(deactivate_user())
"

# Push changes lên Casdoor (user sẽ bị forbidden)
make push-casdoor
```

### List Users

```bash
# List users trong database
docker-compose exec backend python -c "
from app.db.session import get_session_context
from app.models.user import User
from sqlmodel import select
import asyncio

async def list_users():
    async with get_session_context() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for user in users:
            print(f'{user.email} - {user.name} - {user.role} - Active: {user.is_active}')

asyncio.run(list_users())
"

# Hoặc qua database
make db-shell
SELECT email, name, role, is_active FROM users;
```

## 🎭 Role Management

### Default Roles

Wataomi có 4 roles mặc định:

1. **admin** - Administrator
   - Full system access
   - Manage users, roles, permissions
   - Manage all workspaces
   - All permissions

2. **manager** - Manager
   - Manage team members
   - Manage workspace settings
   - View all content
   - Limited admin permissions

3. **editor** - Editor
   - Create and edit content
   - Create and edit bots
   - Create workflows
   - Cannot manage users

4. **viewer** - Viewer
   - Read-only access
   - View content and reports
   - Cannot create or edit

### Assign Role to User

```bash
# Update user role trong database
docker-compose exec backend python -c "
from app.db.session import get_session_context
from app.models.user import User
from sqlmodel import select
import asyncio

async def assign_role():
    async with get_session_context() as session:
        result = await session.execute(
            select(User).where(User.email == 'user@example.com')
        )
        user = result.scalar_one_or_none()
        if user:
            user.role = 'manager'  # admin, manager, editor, viewer
            session.add(user)
            await session.commit()
            print(f'Assigned role manager to {user.email}')

asyncio.run(assign_role())
"

# Push lên Casdoor
make push-casdoor
```

### Create Custom Role

```bash
# Tạo role mới trong Casdoor
# 1. Login Casdoor UI: http://localhost:8030
# 2. Vào Roles → Add Role
# 3. Điền thông tin:
#    - Organization: wataomi
#    - Name: support
#    - Display Name: Support Agent
#    - Description: Customer support role
# 4. Save

# 5. Update backend code để support role mới
# Thêm vào app/models/user.py:
# role: str = Field(default="viewer")  # admin, manager, editor, viewer, support
```

## 🔐 Permission Management

### Default Permissions

#### Bot Permissions
- `bot-create` - Create new bots
  - Roles: admin, editor
- `bot-edit` - Edit existing bots
  - Roles: admin, editor
- `bot-delete` - Delete bots
  - Roles: admin
- `bot-view` - View bots
  - Roles: admin, manager, editor, viewer

#### User Permissions
- `user-manage` - Manage users
  - Roles: admin, manager

#### Workspace Permissions
- `workspace-manage` - Manage workspace settings
  - Roles: admin, manager

### Check Permission

```python
# app/api/deps.py
from fastapi import Depends, HTTPException
from app.models.user import User

def require_permission(permission: str):
    """Dependency to check if user has permission."""
    async def check_permission(current_user: User = Depends(get_current_user)):
        # Check if user's role has the permission
        role_permissions = {
            "admin": ["*"],  # All permissions
            "manager": ["bot-view", "user-manage", "workspace-manage"],
            "editor": ["bot-create", "bot-edit", "bot-view"],
            "viewer": ["bot-view"],
        }
        
        user_permissions = role_permissions.get(current_user.role, [])
        
        if "*" in user_permissions or permission in user_permissions:
            return current_user
        
        raise HTTPException(
            status_code=403,
            detail=f"Permission denied: {permission}"
        )
    
    return check_permission

# Usage in endpoint
@router.post("/bots")
async def create_bot(
    bot_data: BotCreate,
    current_user: User = Depends(require_permission("bot-create"))
):
    # Only users with bot-create permission can access
    pass
```

### Add Custom Permission

```bash
# 1. Tạo permission trong Casdoor
# Login Casdoor UI → Permissions → Add Permission

# 2. Điền thông tin:
#    - Organization: wataomi
#    - Name: workflow-create
#    - Display Name: Create Workflows
#    - Description: Permission to create workflows
#    - Resource Type: Workflow
#    - Actions: Create
#    - Effect: Allow
#    - Roles: wataomi/admin, wataomi/editor

# 3. Update backend code
# Thêm vào role_permissions trong deps.py
```

## 🔄 Sync Strategies

### Strategy 1: Casdoor as Source of Truth

Tất cả thay đổi users/roles/permissions được thực hiện trong Casdoor UI, sau đó sync về database.

**Ưu điểm:**
- Centralized management
- UI-friendly
- Audit trail trong Casdoor

**Nhược điểm:**
- Phải login Casdoor UI để quản lý
- Sync delay

**Khi nào dùng:**
- Production environment
- Non-technical admins
- Need audit trail

```bash
# Workflow
# 1. Thay đổi trong Casdoor UI
# 2. Sync về database
make sync-casdoor

# Hoặc auto-sync khi user login
# Backend tự động sync user info từ token
```

### Strategy 2: Database as Source of Truth

Tất cả thay đổi được thực hiện trong database, sau đó push lên Casdoor.

**Ưu điểm:**
- Programmatic control
- Faster updates
- Can use API/scripts

**Nhược điểm:**
- Need to push manually
- Potential sync conflicts

**Khi nào dùng:**
- Development environment
- Automated user provisioning
- Bulk operations

```bash
# Workflow
# 1. Thay đổi trong database (API, script, SQL)
# 2. Push lên Casdoor
make push-casdoor
```

### Strategy 3: Hybrid (Recommended)

- Users tự đăng ký qua Casdoor (self-registration)
- Admins quản lý roles/permissions trong Casdoor UI
- Backend auto-sync user info khi login
- Bulk operations qua scripts

```bash
# Auto-sync on login (already implemented)
# Backend tự động sync user từ Casdoor token

# Manual sync khi cần
make sync-casdoor

# Bulk operations
make push-casdoor
```

## 🔍 Monitoring & Audit

### View User Activity

```bash
# Casdoor logs
make logs-casdoor | grep "user@example.com"

# Backend logs
make logs-backend | grep "user@example.com"
```

### User Statistics

```bash
# Count users by role
make db-shell
SELECT role, COUNT(*) FROM users GROUP BY role;

# Active vs inactive users
SELECT is_active, COUNT(*) FROM users GROUP BY is_active;

# Recent users
SELECT email, name, created_at FROM users ORDER BY created_at DESC LIMIT 10;
```

## 🛠️ Troubleshooting

### User không sync được

```bash
# Check Casdoor connection
curl http://localhost:8030/api/get-users?owner=wataomi

# Check database
make db-shell
SELECT * FROM users WHERE email = 'user@example.com';

# Force sync
make sync-casdoor
```

### Permission denied

```bash
# Check user role
make db-shell
SELECT email, role FROM users WHERE email = 'user@example.com';

# Check role permissions trong Casdoor UI
# Roles → [role_name] → Permissions
```

### User không login được

```bash
# Check user active status
make db-shell
SELECT email, is_active FROM users WHERE email = 'user@example.com';

# Check trong Casdoor
# Users → [user] → isForbidden should be false

# Reset password trong Casdoor UI
# Users → [user] → Change Password
```

## 📚 Best Practices

### 1. Principle of Least Privilege

Assign minimum permissions cần thiết:
- Default role: `viewer`
- Promote to `editor` khi cần create/edit
- `manager` chỉ cho team leads
- `admin` chỉ cho system admins

### 2. Regular Audits

```bash
# Review users monthly
make db-shell
SELECT email, role, is_active, created_at FROM users;

# Deactivate inactive users
UPDATE users SET is_active = false WHERE last_login < NOW() - INTERVAL '90 days';
```

### 3. Password Policy

Configure trong Casdoor:
- Minimum 8 characters
- Require uppercase, lowercase, number
- Password expiry: 90 days
- Enable MFA for admins

### 4. Backup

```bash
# Backup database
pg_dump -U wataomi -d wataomi > backup_$(date +%Y%m%d).sql

# Backup Casdoor
# Export users/roles/permissions từ Casdoor UI
```

## 🔗 Related Documentation

- [Casdoor Integration](casdoor-integration.md)
- [Setup Guide](SETUP.md)
- [API Documentation](backend.md)
- [Security Best Practices](SECURITY.md)
