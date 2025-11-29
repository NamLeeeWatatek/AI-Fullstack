# Database Migrations

## Tổng quan

Wataomi sử dụng **Alembic** để quản lý database migrations. Alembic cho phép version control cho database schema và dễ dàng migrate giữa các versions.

## Cấu trúc

```
apps/backend/
├── alembic/                    # Alembic configuration
│   ├── versions/               # Migration files
│   ├── env.py                  # Alembic environment config
│   ├── script.py.mako          # Migration template
│   └── README                  # Alembic README
├── alembic.ini                 # Alembic configuration file
└── app/
    └── scripts/                # Migration helper scripts
        ├── init_migration.py   # Initialize database
        ├── migrate.py          # Migration CLI helper
        └── sync_casdoor.py     # Sync users from Casdoor
```

## Cài đặt

Alembic đã được thêm vào `requirements.txt`:

```bash
pip install -r requirements.txt
```

## Migration Helper CLI

Wataomi cung cấp một CLI helper để đơn giản hóa các tác vụ migration:

```bash
python -m app.scripts.migrate <command> [args]
```

### Commands

#### 1. Initialize Database

Tạo tất cả tables dựa trên SQLModel models:

```bash
python -m app.scripts.migrate init
```

#### 2. Create Migration

Tạo migration mới (auto-detect changes):

```bash
python -m app.scripts.migrate create "add user avatar field"
```

Migration file sẽ được tạo trong `alembic/versions/` với format:
```
YYYYMMDD_HHMM-<revision>_<message>.py
```

#### 3. Upgrade Database

Apply migrations lên database:

```bash
# Upgrade to latest
python -m app.scripts.migrate upgrade

# Upgrade to specific revision
python -m app.scripts.migrate upgrade abc123
```

#### 4. Downgrade Database

Rollback migrations:

```bash
# Downgrade one revision
python -m app.scripts.migrate downgrade -1

# Downgrade to specific revision
python -m app.scripts.migrate downgrade abc123

# Downgrade to base (empty database)
python -m app.scripts.migrate downgrade base
```

#### 5. Show Current Revision

Xem current database revision:

```bash
python -m app.scripts.migrate current
```

#### 6. Show History

Xem migration history:

```bash
python -m app.scripts.migrate history
```

#### 7. Sync from Casdoor

Sync users và applications từ Casdoor:

```bash
python -m app.scripts.migrate sync
```

#### 8. Reset Database

Drop tất cả tables, recreate, và sync:

```bash
python -m app.scripts.migrate reset
```

⚠️ **Warning**: Command này sẽ xóa toàn bộ data!

## Workflow

### Initial Setup (First Time)

```bash
# 1. Initialize database (create tables)
python -m app.scripts.migrate init

# 2. Create initial migration
python -m app.scripts.migrate create "Initial migration"

# 3. Apply migration
python -m app.scripts.migrate upgrade

# 4. Sync users from Casdoor
python -m app.scripts.migrate sync
```

### Adding New Features

```bash
# 1. Update models in app/models/
# Example: Add new field to User model

# 2. Create migration
python -m app.scripts.migrate create "add user bio field"

# 3. Review generated migration in alembic/versions/

# 4. Apply migration
python -m app.scripts.migrate upgrade

# 5. Test changes
```

### Rollback Changes

```bash
# Rollback last migration
python -m app.scripts.migrate downgrade -1

# Check current state
python -m app.scripts.migrate current
```

## Casdoor Synchronization

### Sync Users

Script `sync_casdoor.py` đồng bộ users từ Casdoor authentication service:

```bash
python -m app.scripts.migrate sync
```

**Chức năng**:
- Fetch users từ Casdoor API
- Tạo/update users trong local database
- Sync user profiles (email, name, avatar)
- Assign users to default workspace

### Sync Applications

Script cũng sync applications từ Casdoor và map chúng thành workspaces:

- Fetch applications từ Casdoor
- Tạo workspaces tương ứng
- Ensure default workspace exists

### Configuration

Cần config Casdoor trong `.env`:

```bash
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_APP_NAME=wataomi-app
CASDOOR_ORG_NAME=wataomi
CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----
```

## Direct Alembic Commands

Nếu cần sử dụng Alembic trực tiếp:

```bash
# Create migration
alembic revision --autogenerate -m "message"

# Upgrade
alembic upgrade head
alembic upgrade +1
alembic upgrade abc123

# Downgrade
alembic downgrade -1
alembic downgrade abc123
alembic downgrade base

# Show current
alembic current

# Show history
alembic history

# Show SQL without executing
alembic upgrade head --sql
```

## Migration File Structure

Migration file example:

```python
"""add user bio field

Revision ID: abc123def456
Revises: previous_revision
Create Date: 2025-11-29 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers
revision = 'abc123def456'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add column
    op.add_column('user', sa.Column('bio', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove column
    op.drop_column('user', 'bio')
```

## Best Practices

### 1. Always Review Generated Migrations

```bash
# After creating migration
cat alembic/versions/YYYYMMDD_HHMM-*_message.py
```

Kiểm tra:
- Correct table/column names
- Proper data types
- Nullable constraints
- Default values
- Indexes

### 2. Test Migrations

```bash
# Test upgrade
python -m app.scripts.migrate upgrade

# Test downgrade
python -m app.scripts.migrate downgrade -1

# Re-upgrade
python -m app.scripts.migrate upgrade
```

### 3. Backup Before Production Migration

```bash
# PostgreSQL backup
pg_dump -U wataomi -d wataomi > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
python -m app.scripts.migrate upgrade

# If issues, restore
psql -U wataomi -d wataomi < backup_YYYYMMDD_HHMMSS.sql
```

### 4. Use Descriptive Messages

```bash
# ❌ Bad
python -m app.scripts.migrate create "update"

# ✅ Good
python -m app.scripts.migrate create "add user bio and social links"
```

### 5. One Logical Change Per Migration

```bash
# ❌ Bad: Multiple unrelated changes
python -m app.scripts.migrate create "add user bio and refactor channels"

# ✅ Good: Separate migrations
python -m app.scripts.migrate create "add user bio field"
python -m app.scripts.migrate create "refactor channel structure"
```

### 6. Handle Data Migration

Nếu cần migrate data, thêm logic trong migration:

```python
def upgrade() -> None:
    # Add new column
    op.add_column('user', sa.Column('full_name', sa.String(), nullable=True))
    
    # Migrate data
    connection = op.get_bind()
    connection.execute(
        sa.text("UPDATE user SET full_name = first_name || ' ' || last_name")
    )
    
    # Make non-nullable after data migration
    op.alter_column('user', 'full_name', nullable=False)
```

## Troubleshooting

### Migration Conflicts

```bash
# If multiple branches
alembic merge -m "merge branches" head1 head2

# Then upgrade
python -m app.scripts.migrate upgrade
```

### Reset Migration History

```bash
# Drop alembic_version table
psql -U wataomi -d wataomi -c "DROP TABLE alembic_version;"

# Recreate with current revision
alembic stamp head
```

### Manual Schema Fixes

```bash
# Generate SQL without executing
alembic upgrade head --sql > migration.sql

# Review and edit SQL
vim migration.sql

# Execute manually
psql -U wataomi -d wataomi < migration.sql

# Mark as applied
alembic stamp head
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Database Migration

on:
  push:
    branches: [main, develop]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: |
          cd apps/backend
          pip install -r requirements.txt
      
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd apps/backend
          python -m app.scripts.migrate upgrade
```

## Docker Integration

### Dockerfile

```dockerfile
# Run migrations on container start
CMD ["sh", "-c", "python -m app.scripts.migrate upgrade && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

### Docker Compose

```yaml
services:
  backend:
    build: ./apps/backend
    command: >
      sh -c "python -m app.scripts.migrate upgrade &&
             python -m app.scripts.migrate sync &&
             uvicorn app.main:app --host 0.0.0.0 --port 8000"
    depends_on:
      - postgres
```

## Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Casdoor Python SDK](https://github.com/casdoor/casdoor-python-sdk)
