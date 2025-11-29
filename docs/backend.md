# Backend Documentation

## Tổng quan

Backend sử dụng **FastAPI** (Python 3.11+) với kiến trúc modular, clean architecture pattern.

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15+ (via SQLAlchemy)
- **Authentication**: Casdoor OAuth2
- **Storage**: MinIO S3-compatible
- **Caching**: Redis
- **Task Queue**: Celery (optional)

## Project Structure

```
apps/backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── v1/           # API version 1
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   └── ...
│   │   └── deps.py       # Dependencies
│   ├── core/             # Core functionality
│   │   ├── config.py     # Settings
│   │   ├── security.py   # Auth logic
│   │   └── database.py   # DB connection
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   └── utils/            # Utilities
├── tests/                # Test suite
├── requirements.txt      # Dependencies
├── pyproject.toml        # Project config
└── run.py                # Entry point
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

## API Reference

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://api.wataomi.com`

### Authentication

#### POST /api/v1/auth/login
Login với email/password hoặc OAuth.

**Request**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### POST /api/v1/auth/register
Đăng ký user mới.

**Request**
```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "securepassword"
}
```

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "newuser",
  "created_at": "2025-11-29T00:00:00Z"
}
```

### Users

#### GET /api/v1/users/me
Lấy thông tin user hiện tại (requires authentication).

**Headers**
```
Authorization: Bearer <access_token>
```

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "currentuser",
  "is_active": true
}
```

#### PUT /api/v1/users/me
Cập nhật thông tin user.

**Request**
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/wataomi

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Casdoor
CASDOOR_ENDPOINT=http://localhost:8001
CASDOOR_CLIENT_ID=your-client-id
CASDOOR_CLIENT_SECRET=your-client-secret

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=wataomi

# Redis
REDIS_URL=redis://localhost:6379/0
```

## Development

### Setup
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run Development Server
```bash
python run.py
# hoặc
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run Tests
```bash
pytest
pytest --cov=app tests/  # With coverage
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Code Style

### Formatting
- **Formatter**: Black (line length: 88)
- **Import sorting**: isort
- **Linting**: Ruff

```bash
black app/
isort app/
ruff check app/
```

### Type Hints
Bắt buộc sử dụng type hints cho tất cả functions.

```python
from typing import Optional
from pydantic import BaseModel

def get_user(user_id: str) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()
```

### Docstrings
Sử dụng Google style docstrings.

```python
def create_user(email: str, password: str) -> User:
    """
    Create a new user.

    Args:
        email: User email address
        password: Plain text password

    Returns:
        Created user object

    Raises:
        ValueError: If email already exists
    """
    pass
```

## Security Best Practices

1. **Password Hashing**: Sử dụng bcrypt với salt
2. **SQL Injection**: Dùng SQLAlchemy ORM, không raw queries
3. **CORS**: Whitelist origins cụ thể
4. **Rate Limiting**: Implement cho sensitive endpoints
5. **Input Validation**: Pydantic schemas cho tất cả inputs

## Performance

### Caching Strategy
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_settings():
    return Settings()
```

### Database Optimization
- Sử dụng indexes cho frequent queries
- Eager loading với `joinedload()` để tránh N+1
- Connection pooling (SQLAlchemy default)

## Monitoring

### Health Check
```bash
GET /health
```

### Metrics
- Request latency
- Error rates
- Database connection pool
- Cache hit rates

Export to Grafana via Prometheus.

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U user -d wataomi
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## API Versioning

Sử dụng URL versioning: `/api/v1/`, `/api/v2/`

Khi breaking changes:
1. Tạo version mới (v2)
2. Maintain v1 ít nhất 6 tháng
3. Deprecation warnings trong response headers
