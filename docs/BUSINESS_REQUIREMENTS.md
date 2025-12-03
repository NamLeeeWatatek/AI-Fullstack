# TÀI LIỆU NGHIỆP VỤ HỆ THỐNG WATAOMI

## TỔNG QUAN

**WataOmi** là một nền tảng xây dựng và quản lý chatbot AI tích hợp với hệ thống quản lý kiến thức (Knowledge Base) và RAG (Retrieval Augmented Generation). Hệ thống cho phép doanh nghiệp xây dựng chatbot thông minh có khả năng trả lời dựa trên kho tài liệu nội bộ của họ.

---

## CÁC MODULE NGHIỆP VỤ CHÍNH

### 1. QUẢN LÝ BOT (Bots)

**Mục đích**: Tạo và quản lý các chatbot AI với khả năng tùy chỉnh cao

**Chức năng**:
- **Tạo và quản lý bot**: Người dùng có thể tạo nhiều bot khác nhau cho các mục đích khác nhau
- **Phân quyền workspace**: Bot có thể thuộc về workspace cụ thể hoặc là bot toàn cục (global)
- **Quản lý phiên bản flow**: Mỗi bot có thể có nhiều phiên bản workflow:
  - Tạo phiên bản mới
  - Xuất bản phiên bản cụ thể
  - Chỉ có 1 phiên bản được xuất bản tại một thời điểm
- **Thực thi bot**: Xử lý tin nhắn từ người dùng và trả lời tự động

---

### 2. QUẢN LÝ HỘI THOẠI (Conversations)

**Mục đích**: Lưu trữ và quản lý toàn bộ lịch sử hội thoại

**Chức năng**:
- **Tạo cuộc hội thoại**: Mỗi bot có thể có nhiều cuộc hội thoại với người dùng
- **Lưu trữ tin nhắn**: Hệ thống lưu toàn bộ lịch sử tin nhắn theo thứ tự thời gian
- **Trạng thái hội thoại**: Theo dõi trạng thái (active, closed, etc.)
- **Metadata linh hoạt**: Lưu thông tin bổ sung cho mỗi cuộc hội thoại và tin nhắn
- **Đa kênh**: Hỗ trợ hội thoại từ nhiều kênh khác nhau (Facebook, Telegram, Web, etc.)

---

### 3. QUẢN LÝ FLOW (Workflows)

**Mục đích**: Thiết kế luồng xử lý và logic cho bot

**Chức năng**:
- **Tạo flow tùy chỉnh**: Người dùng có thể thiết kế luồng xử lý cho bot bằng giao diện kéo thả
- **Sử dụng template**: Tạo flow nhanh từ các template có sẵn
- **Theo dõi sử dụng template**: Đếm số lần template được sử dụng
- **Cấu trúc flow**: 
  - **Nodes**: Các bước xử lý (AI Chat, Condition, Action, etc.)
  - **Edges**: Kết nối giữa các bước
- **Trạng thái**: Draft, published, archived
- **Thực thi flow**: Chạy workflow theo logic đã thiết kế

---

### 4. TÍCH HỢP KÊNH (Channels & Integrations)

**Mục đích**: Kết nối bot với nhiều kênh giao tiếp khác nhau

**Chức năng**:
- **Kết nối đa kênh**: Tích hợp bot với:
  - Facebook Messenger
  - Instagram Direct
  - Telegram
  - Web Widget (Chatbox nhúng)
  - Omi (Custom channel)
- **Quản lý credentials**: Lưu trữ thông tin xác thực cho từng kênh
- **OAuth**: Hỗ trợ xác thực OAuth cho các tích hợp
- **Trạng thái kết nối**: Theo dõi trạng thái active/inactive của từng kênh
- **Webhook endpoints**: Nhận tin nhắn từ các kênh thông qua webhook

**API Webhooks**:
```
POST /api/v1/webhooks/facebook     - Nhận tin nhắn từ Facebook
POST /api/v1/webhooks/instagram    - Nhận tin nhắn từ Instagram  
POST /api/v1/webhooks/telegram     - Nhận tin nhắn từ Telegram
POST /api/v1/webhooks/:channel     - Webhook chung cho các kênh khác
GET  /api/v1/webhooks/facebook     - Xác thực webhook Facebook
```

---

### 5. HỆ THỐNG KIẾN THỨC (Knowledge Base)

**Mục đích**: Quản lý kho tài liệu và kiến thức cho bot

#### 5.1. Quản lý Knowledge Base

**Chức năng**:
- **Tạo kho kiến thức**: Mỗi người dùng/workspace có thể tạo nhiều knowledge base
- **Cấu hình chunking**: 
  - **Chunk size**: Kích thước mỗi đoạn văn bản (mặc định: 1000 tokens)
  - **Chunk overlap**: Độ chồng lấp giữa các chunk (mặc định: 200 tokens)
- **Chọn mô hình embedding**: Cấu hình mô hình AI để tạo vector embedding
- **Thống kê**: Theo dõi tổng số tài liệu, dung lượng, số chunk

**API Endpoints**:
```
GET    /api/v1/knowledge-bases              - Lấy danh sách KB
POST   /api/v1/knowledge-bases              - Tạo KB mới
GET    /api/v1/knowledge-bases/:id          - Lấy chi tiết KB
PATCH  /api/v1/knowledge-bases/:id          - Cập nhật KB
DELETE /api/v1/knowledge-bases/:id          - Xóa KB
GET    /api/v1/knowledge-bases/:id/stats    - Thống kê KB
```

#### 5.2. Quản lý Tài liệu

**Chức năng**:
- **Upload tài liệu**: Hỗ trợ nhiều loại file (text, PDF, DOCX, etc.)
- **Tổ chức thư mục**: Phân loại tài liệu theo folder
- **Xử lý tự động**:
  1. Chia tài liệu thành các chunk nhỏ
  2. Tạo embedding vector cho mỗi chunk
  3. Lưu vào vector database (Qdrant)
- **Trạng thái xử lý**: 
  - `pending`: Chờ xử lý
  - `processing`: Đang xử lý
  - `completed`: Hoàn thành
  - `failed`: Lỗi
- **Cập nhật tài liệu**: Tự động xử lý lại khi nội dung thay đổi

**API Endpoints**:
```
POST   /api/v1/knowledge-bases/documents              - Tạo tài liệu
POST   /api/v1/knowledge-bases/documents/upload       - Upload file
GET    /api/v1/knowledge-bases/:id/documents          - Lấy danh sách tài liệu
GET    /api/v1/knowledge-bases/documents/:documentId  - Lấy chi tiết tài liệu
PATCH  /api/v1/knowledge-bases/documents/:documentId  - Cập nhật tài liệu
DELETE /api/v1/knowledge-bases/documents/:documentId  - Xóa tài liệu
```

#### 5.3. Gán Bot với Knowledge Base

**Chức năng**:
- **Liên kết bot với KB**: Một bot có thể sử dụng nhiều knowledge base
- **Ưu tiên**: Thiết lập độ ưu tiên khi bot sử dụng nhiều KB
- **Cấu hình RAG**: Tùy chỉnh cách bot truy xuất thông tin

**API Endpoints**:
```
POST   /api/v1/knowledge-bases/:id/agents        - Gán agent cho KB
DELETE /api/v1/knowledge-bases/:id/agents/:agentId - Hủy gán agent
GET    /api/v1/knowledge-bases/:id/agents        - Lấy danh sách agent
```

---

### 6. HỆ THỐNG RAG (Retrieval Augmented Generation)

**Mục đích**: Tạo câu trả lời thông minh dựa trên kiến thức

#### 6.1. Truy vấn Kiến thức (Vector Search)

**Chức năng**:
- **Semantic search**: Tìm kiếm dựa trên ý nghĩa, không chỉ từ khóa
- **Similarity threshold**: Lọc kết quả theo độ tương đồng (0.0 - 1.0)
- **Giới hạn kết quả**: Chỉ lấy top N kết quả liên quan nhất
- **Filter theo KB**: Tìm kiếm trong KB cụ thể hoặc tất cả KB

**API Endpoint**:
```
POST /api/v1/knowledge-bases/query
Body: {
  "query": "Câu hỏi của người dùng",
  "knowledgeBaseId": "kb-id (optional)",
  "limit": 5,
  "similarityThreshold": 0.7
}

Response: {
  "success": true,
  "query": "...",
  "results": [
    {
      "content": "Nội dung đoạn văn bản",
      "score": 0.85,
      "metadata": {...},
      "documentId": "doc-id",
      "chunkIndex": 0
    }
  ]
}
```

#### 6.2. Tạo Câu trả lời Thông minh (RAG)

**Chức năng**:
- **Truy xuất ngữ cảnh**: Tìm các đoạn văn bản liên quan từ KB
- **Tạo câu trả lời**: Sử dụng AI model kết hợp với ngữ cảnh để trả lời
- **Trích dẫn nguồn**: Hiển thị nguồn thông tin (sources) kèm độ tin cậy
- **Xử lý lịch sử hội thoại**: Tích hợp lịch sử chat để câu trả lời mạch lạc

**API Endpoint**:
```
POST /api/v1/knowledge-bases/answer
Body: {
  "question": "Câu hỏi của người dùng",
  "knowledgeBaseId": "kb-id (optional)",
  "model": "gemini-1.5-flash (optional)"
}

Response: {
  "success": true,
  "question": "...",
  "answer": "Câu trả lời từ AI",
  "sources": [
    {
      "content": "Nội dung nguồn",
      "score": 0.85,
      "metadata": {...}
    }
  ]
}
```

---

### 7. TÍCH HỢP AI MODELS

**Mục đích**: Quản lý và sử dụng các mô hình AI

**Chức năng**:
- **Đa nhà cung cấp**: 
  - Google AI (Gemini 1.5 Flash, Gemini 1.5 Pro)
  - OpenAI (GPT-4, GPT-3.5 Turbo)
- **Quản lý models**: Liệt kê và chọn model phù hợp
- **Model mặc định**: Tự động chọn model khả dụng
- **Chat API**: Giao tiếp với AI model
- **Embedding API**: Tạo vector embedding cho văn bản
- **Kiểm tra khả dụng**: Hiển thị model nào đã cấu hình API key

**API Endpoints**:
```
GET /api/v1/ai-models              - Lấy danh sách models
GET /api/v1/ai-models/providers    - Lấy models theo provider
```

---

### 8. CHATBOX WIDGET (Nhúng vào Website)

**Mục đích**: Cho phép nhúng chatbot vào bất kỳ website nào

#### 8.1. Script Nhúng

**Cách sử dụng**:
```html
<!-- Thêm vào cuối thẻ <body> của website -->
<script src="https://wataomi.com/watabubble.js"></script>
<script>
  WataBubble.init({
    botId: 'your-bot-id',
    color: '#8B5CF6',        // Màu chủ đạo (optional)
    position: 'right',       // 'left' hoặc 'right' (optional)
    apiUrl: 'https://api.wataomi.com'  // API endpoint (optional)
  });
</script>
```

#### 8.2. Tính năng Widget

**Giao diện**:
- **Bubble button**: Nút chat nổi ở góc màn hình
- **Chat window**: Cửa sổ chat 380x600px
- **Responsive**: Tự động điều chỉnh trên mobile
- **Tùy chỉnh màu sắc**: Thay đổi màu chủ đạo
- **Vị trí linh hoạt**: Đặt ở góc trái hoặc phải

**Chức năng**:
- Gửi/nhận tin nhắn real-time
- Lưu lịch sử hội thoại
- Hiển thị trạng thái typing
- Hỗ trợ media (hình ảnh, file)
- Tích hợp với bot backend

---

### 9. XÁC THỰC & PHÂN QUYỀN

**Mục đích**: Bảo mật và quản lý truy cập

**Chức năng**:
- **Đa phương thức đăng nhập**:
  - Email/Password
  - Google OAuth
  - Facebook OAuth
  - Apple Sign In
  - Casdoor (SSO)
- **Quản lý session**: Theo dõi phiên đăng nhập
- **Token refresh**: Làm mới token tự động
- **Roles & Permissions**: Phân quyền chi tiết theo vai trò
- **JWT Authentication**: Bảo mật API endpoints

---

### 10. WORKSPACE

**Mục đích**: Tổ chức làm việc nhóm

**Chức năng**:
- **Môi trường làm việc**: Tổ chức theo workspace/team
- **Chia sẻ tài nguyên**: Bot, KB, integrations trong workspace
- **Phân quyền workspace**: Kiểm soát truy cập theo workspace
- **Cô lập dữ liệu**: Dữ liệu giữa các workspace độc lập

---

### 11. TEMPLATES

**Mục đích**: Tăng tốc độ tạo bot

**Chức năng**:
- **Thư viện mẫu**: Các flow template có sẵn
- **Sử dụng nhanh**: Tạo bot từ template
- **Theo dõi phổ biến**: Đếm số lần sử dụng
- **Tùy chỉnh**: Chỉnh sửa template sau khi tạo

---

### 12. THỐNG KÊ (Stats)

**Mục đích**: Theo dõi hiệu suất hệ thống

**Chức năng**:
- Số lượng bot, conversations, messages
- Thống kê sử dụng Knowledge Base
- Hiệu suất RAG (độ chính xác, thời gian phản hồi)
- Báo cáo theo workspace

---

## LUỒNG NGHIỆP VỤ CHÍNH

### Luồng 1: Tạo Bot với Kiến thức

1. **Tạo Knowledge Base**
   - Đặt tên, mô tả
   - Cấu hình chunk size, overlap
   - Chọn embedding model

2. **Upload Tài liệu**
   - Upload file hoặc nhập text
   - Hệ thống tự động:
     - Chia thành chunks
     - Tạo embeddings
     - Lưu vào vector DB

3. **Tạo Bot**
   - Đặt tên, mô tả bot
   - Chọn workspace

4. **Gán Knowledge Base cho Bot**
   - Liên kết KB với bot
   - Thiết lập độ ưu tiên

5. **Thiết kế Flow**
   - Tạo flow mới hoặc dùng template
   - Thêm nodes: AI Chat, Condition, Action
   - Kết nối các nodes
   - Xuất bản flow

6. **Kết nối Kênh**
   - Chọn kênh (Facebook, Telegram, Web)
   - Cấu hình credentials
   - Thiết lập webhook

7. **Nhúng Widget** (nếu dùng Web)
   - Copy script code
   - Paste vào website
   - Tùy chỉnh màu sắc, vị trí

8. **Xuất bản và Sử dụng**

---

### Luồng 2: Người dùng Chat với Bot

1. **Người dùng gửi tin nhắn**
   - Qua kênh (Facebook, Web widget, etc.)

2. **Webhook nhận tin nhắn**
   - Hệ thống nhận tin nhắn qua webhook
   - Xác thực signature

3. **Tạo/Tiếp tục Conversation**
   - Tìm hoặc tạo conversation mới
   - Lưu tin nhắn vào DB

4. **Bot xử lý tin nhắn**
   - Thực thi flow đã thiết lập
   - Nếu có AI Chat node:

5. **Truy vấn Knowledge Base (RAG)**
   - Tạo embedding cho câu hỏi
   - Tìm kiếm vector tương đồng
   - Lấy top N chunks liên quan

6. **Tạo câu trả lời**
   - Kết hợp context từ KB
   - Gọi AI model (Gemini/GPT)
   - Tạo câu trả lời tự nhiên

7. **Trả lời người dùng**
   - Gửi tin nhắn qua kênh
   - Kèm nguồn tham khảo (nếu có)

8. **Lưu lịch sử**
   - Lưu câu trả lời vào conversation

---

### Luồng 3: Sử dụng API để Truy vấn Knowledge Base

1. **Lấy API credentials**
   - Đăng nhập hệ thống
   - Lấy JWT token

2. **Gọi API Query**
```bash
curl -X POST https://api.wataomi.com/api/v1/knowledge-bases/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Chính sách bảo hành là gì?",
    "knowledgeBaseId": "kb-123",
    "limit": 5,
    "similarityThreshold": 0.7
  }'
```

3. **Nhận kết quả**
   - Danh sách chunks liên quan
   - Score độ tương đồng
   - Metadata

4. **Gọi API Answer** (nếu cần câu trả lời hoàn chỉnh)
```bash
curl -X POST https://api.wataomi.com/api/v1/knowledge-bases/answer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Chính sách bảo hành là gì?",
    "knowledgeBaseId": "kb-123",
    "model": "gemini-1.5-flash"
  }'
```

5. **Nhận câu trả lời**
   - Câu trả lời từ AI
   - Sources với score

---

## TÍCH HỢP VÀ MỞ RỘNG

### API Public Endpoints

**Không cần authentication**:
- `GET /api/v1/webhooks/facebook` - Xác thực webhook Facebook
- `POST /api/v1/webhooks/*` - Nhận webhook từ các kênh

**Cần authentication (JWT)**:
- Tất cả endpoints khác yêu cầu Bearer token

### Cấu hình API Keys

**Backend (.env)**:
```bash
# AI Models
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-key

# Channels
FACEBOOK_VERIFY_TOKEN=your-verify-token
OMI_API_KEY=your-omi-key
```

---

## KẾT LUẬN

**WataOmi** là một nền tảng **No-code/Low-code Chatbot Builder** toàn diện với:

✅ **Quản lý Bot thông minh** với workflow tùy chỉnh  
✅ **Knowledge Base & RAG** cho câu trả lời chính xác  
✅ **Tích hợp đa kênh** (Facebook, Telegram, Web, etc.)  
✅ **API mở** để truy vấn kiến thức  
✅ **Widget nhúng** dễ dàng cho website  
✅ **Hỗ trợ đa AI model** (Google Gemini, OpenAI GPT)  

Hệ thống phù hợp cho:
- Doanh nghiệp muốn tự động hóa customer support
- Tổ chức cần chatbot dựa trên tài liệu nội bộ
- Developer muốn tích hợp RAG vào ứng dụng
- Website cần chatbot hỗ trợ khách hàng 24/7
