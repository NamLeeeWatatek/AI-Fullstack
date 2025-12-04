# Omnichannel Inbox Guide

## Tổng quan

Omnichannel Inbox là nơi tập trung quản lý tất cả các cuộc hội thoại từ nhiều kênh khác nhau (Facebook, Instagram, WhatsApp, Telegram, Email, Web Chat, v.v.) trong một giao diện duy nhất.

## Tính năng chính

### 1. Danh sách Conversations
- **Tìm kiếm**: Tìm kiếm theo tên khách hàng hoặc nội dung tin nhắn
- **Lọc theo trạng thái**: All, Open, Pending, Closed
- **Lọc theo kênh**: Facebook, Instagram, WhatsApp, Telegram, Email, Web Chat
- **Hiển thị thông tin**:
  - Avatar khách hàng
  - Tên khách hàng
  - Icon kênh (Facebook, Instagram, WhatsApp, v.v.)
  - Tin nhắn cuối cùng
  - Thời gian tin nhắn cuối
  - Số tin nhắn chưa đọc
  - Trạng thái (Open/Pending/Closed)

### 2. Chat Interface
- **Header**:
  - Avatar và tên khách hàng
  - Icon kênh
  - Tên kênh
  - Trạng thái conversation
  - Menu actions (Archive, Mark as Resolved, Delete)
  
- **Chat Area**:
  - Hiển thị lịch sử tin nhắn
  - Phân biệt tin nhắn từ khách hàng và agent
  - Infinite scroll để load tin nhắn cũ hơn
  - Auto scroll xuống khi có tin nhắn mới
  
- **Input Area**:
  - Textarea để nhập tin nhắn
  - Nút gửi
  - Hỗ trợ Enter để gửi, Shift+Enter để xuống dòng

### 3. Real-time Updates
- WebSocket để nhận tin nhắn mới real-time
- Cập nhật danh sách conversations khi có tin nhắn mới
- Hiển thị typing indicator (đang phát triển)

## Cấu trúc Routes

```
/conversations              → Inbox page (list + chat)
/conversations/[id]         → Standalone conversation page (deprecated, dùng cho deep link)
```

## API Endpoints

### Conversations
```
GET    /api/v1/conversations                    → Lấy danh sách conversations
GET    /api/v1/conversations/:id                → Lấy chi tiết conversation
POST   /api/v1/conversations                    → Tạo conversation mới
PATCH  /api/v1/conversations/:id                → Cập nhật conversation
DELETE /api/v1/conversations/:id                → Xóa conversation
```

### Messages
```
GET    /api/v1/conversations/:id/messages       → Lấy tin nhắn của conversation
POST   /api/v1/conversations/:id/messages       → Gửi tin nhắn mới
```

Query params:
- `limit`: Số lượng tin nhắn (default: 50)
- `before`: Message ID để load tin nhắn cũ hơn (pagination)
- `status`: Lọc theo trạng thái (open, pending, closed)
- `channel`: Lọc theo kênh (facebook, instagram, whatsapp, v.v.)

## Data Models

### Conversation
```typescript
interface Conversation {
  id: string;
  externalId: string;          // ID từ platform (Facebook PSID, Instagram ID, v.v.)
  channelId: string;            // ID của channel đã kết nối
  channelType: string;          // facebook, instagram, whatsapp, v.v.
  channelName: string;          // Tên channel
  customerName: string;         // Tên khách hàng
  customerAvatar?: string;      // Avatar khách hàng
  lastMessage: string;          // Tin nhắn cuối cùng
  lastMessageAt: string;        // Thời gian tin nhắn cuối
  unreadCount: number;          // Số tin nhắn chưa đọc
  status: 'open' | 'pending' | 'closed';
  assignedTo?: string;          // Agent được assign
  metadata?: any;               // Metadata bổ sung
}
```

### Message
```typescript
interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: 'user' | 'agent' | 'bot';
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  metadata?: any;
}
```

## Tích hợp Channels

### Facebook Messenger
1. Kết nối Facebook Page tại `/channels`
2. Webhook sẽ tự động tạo conversation khi có tin nhắn mới
3. Tin nhắn được đồng bộ real-time qua webhook

### Instagram
1. Kết nối Instagram Business Account (qua Facebook)
2. Webhook nhận tin nhắn từ Instagram Direct
3. Hiển thị trong inbox với icon Instagram

### WhatsApp Business
1. Cấu hình WhatsApp Business API
2. Webhook nhận tin nhắn
3. Gửi tin nhắn qua WhatsApp API

### Telegram
1. Tạo Telegram Bot
2. Webhook nhận tin nhắn
3. Gửi tin nhắn qua Telegram Bot API

### Email
1. Cấu hình SMTP/IMAP
2. Nhận email qua IMAP
3. Gửi email qua SMTP

### Web Chat Widget
1. Embed widget vào website
2. Tin nhắn được gửi qua WebSocket
3. Hiển thị trong inbox như các kênh khác

## Components

### Main Components
- `apps/web/app/(dashboard)/conversations/page.tsx` - Inbox page
- `apps/web/components/chat/chat-interface.tsx` - Chat interface component

### UI Components (Shadcn)
- `Button` - Nút bấm
- `Input` - Input field
- `Textarea` - Text area
- `Avatar` - Avatar component
- `Badge` - Badge/tag
- `ScrollArea` - Scroll container
- `Tabs` - Tab navigation
- `DropdownMenu` - Dropdown menu
- `Spinner` - Loading spinner

## Styling

Sử dụng Tailwind CSS với các utility classes:
- `bg-background` - Background color
- `text-foreground` - Text color
- `text-muted-foreground` - Muted text
- `border` - Border
- `rounded-lg` - Rounded corners
- `shadow-lg` - Shadow

## WebSocket Events

```typescript
// Client → Server
{
  type: 'join_conversation',
  conversationId: string
}

{
  type: 'send_message',
  conversationId: string,
  content: string
}

// Server → Client
{
  type: 'new_message',
  conversationId: string,
  message: Message
}

{
  type: 'conversation_updated',
  conversation: Conversation
}

{
  type: 'typing',
  conversationId: string,
  isTyping: boolean
}
```

## Best Practices

1. **Performance**
   - Sử dụng pagination cho danh sách conversations
   - Lazy load tin nhắn cũ khi scroll lên
   - Debounce search input

2. **UX**
   - Auto scroll xuống khi có tin nhắn mới
   - Hiển thị typing indicator
   - Show loading state khi đang gửi tin nhắn
   - Highlight conversation đang được chọn

3. **Error Handling**
   - Hiển thị toast notification khi có lỗi
   - Retry mechanism cho failed messages
   - Fallback UI khi không load được data

4. **Security**
   - Validate user permissions
   - Sanitize message content
   - Rate limiting cho API calls

## Roadmap

- [ ] Typing indicator
- [ ] File attachments (images, documents)
- [ ] Quick replies
- [ ] Canned responses
- [ ] Assignment to agents
- [ ] Tags and labels
- [ ] Search in messages
- [ ] Export conversations
- [ ] Analytics dashboard
- [ ] Mobile responsive
- [ ] Dark mode support
