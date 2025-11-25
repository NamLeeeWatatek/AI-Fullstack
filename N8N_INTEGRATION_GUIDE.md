# N8N Integration Guide

## ✅ Đã Implement:

### Backend:
1. **N8N Executor Service** (`n8n_executor.py`)
   - Execute N8N webhook nodes
   - Support multiple endpoints (video-generator, seo-writer, omnipost)
   - Test/Production environment switching
   - Async HTTP calls với timeout 5 phút

2. **Flow Executor Integration**
   - Detect `n8n-*` node types
   - Route to N8N executor
   - Return results với video_url, facebook_post_id, etc.

### Frontend:
3. **N8N Node Types** (`n8nNodeTypes.ts`)
   - `n8n-video-generator` - Tạo video ads
   - `n8n-seo-writer` - Viết bài SEO
   - `n8n-omnipost` - Post đa nền tảng
   - `n8n-webhook` - Custom webhook

4. **Node Properties Component**
   - Video Generator form:
     - Prompt textarea
     - Multiple image URLs
     - Platform checkboxes (Facebook, Instagram, TikTok, YouTube)
     - Environment selector (Test/Production)
   - Custom Webhook form:
     - Webhook URL input
     - JSON body textarea

## 📋 Cần Làm Tiếp:

### 1. Update NodePalette
```typescript
// apps/web/components/workflow/NodePalette.tsx
import { N8N_NODE_TYPES } from '@/lib/n8nNodeTypes'

// Add N8N category
const categories = [
  ...NODE_CATEGORIES,
  {
    id: 'n8n',
    label: 'N8N Integration',
    icon: FiZap,
    color: '#FF6D5A'
  }
]

// Merge node types
const allNodes = [...NODE_TYPES, ...N8N_NODE_TYPES]
```

### 2. Install aiohttp
```bash
cd apps/backend
pip install aiohttp
```

### 3. Test Flow
1. Tạo workflow mới
2. Kéo node "N8N Video Generator" vào canvas
3. Configure:
   - Prompt: "Tạo video 15s giới thiệu sản phẩm"
   - Images: ["https://example.com/img1.jpg"]
   - Platforms: ["facebook"]
   - Environment: "test"
4. Click "Test Run"
5. Xem kết quả trong Execution Results panel

## 🔄 Flow Execution:

```
[Trigger Node]
    ↓
[N8N Video Generator Node]
    ↓ (POST to n8n webhook)
[N8N Workflow]
    ↓ (Generate video, post to Facebook)
[Response]
    ↓
{
  "status": "posted",
  "video_url": "https://...",
  "facebook_post_id": "123456"
}
```

## 📝 Payload Format:

### Video Generator:
```json
{
  "prompt": "Tạo video 15 giây...",
  "images": [
    "https://cdn.example.com/img1.jpg",
    "https://cdn.example.com/img2.jpg"
  ],
  "platforms": ["facebook", "instagram"]
}
```

### Response:
```json
{
  "executed": true,
  "status": "posted",
  "message": "Hoàn thành đăng lên mạng xã hội",
  "video_url": "https://...",
  "facebook_post_id": "123456",
  "job_id": "job_1234567890"
}
```

## 🎨 UI Features:

1. **Node Properties Panel**:
   - Dynamic form based on node type
   - Image URL management (add/remove)
   - Platform multi-select
   - Environment toggle

2. **Execution Results**:
   - Show video URL (clickable)
   - Show Facebook post ID
   - Show status and timing
   - Error handling

3. **Node Display**:
   - Custom icon và color
   - Show configured status
   - Preview trong canvas

## 🔐 Security:

- API keys được mã hóa (đã có encryption service)
- Webhook URLs có thể config per-node
- Test environment để tránh tốn phí

## 📚 Docs Reference:

Theo docs bạn cung cấp:
- Production: `https://n8n.srv1078465.hstgr.cloud/webhook/wh-generate-video-ugc-ads-autopost-social`
- Test: `https://watacorp.app.n8n.cloud/webhook/video-ads`

Payload format đã match với docs!
