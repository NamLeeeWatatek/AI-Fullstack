# 🤖 WataOmi Widget - Hướng dẫn Embed cho Khách hàng

## 📋 Tổng quan

Widget WataOmi cho phép khách hàng dễ dàng nhúng chatbot AI vào website của họ chỉ với 1 dòng code. Widget được tối ưu hóa cho:

- ⚡ **Performance**: Lazy loading, chỉ ~3KB initial load
- 📱 **Mobile-first**: Responsive, fullscreen trên mobile
- 🎨 **Customizable**: Tùy chỉnh màu sắc, vị trí, behavior
- 🔒 **Secure**: CORS validation, origin whitelist
- 🌍 **Universal**: Hoạt động trên mọi website (WordPress, Shopify, HTML, React, Vue...)

---

## 🚀 Quick Start

### Cách 1: Script Tag (Đơn giản nhất)

```html
<!-- Thêm vào cuối thẻ <body> -->
<script 
    src="https://cdn.wataomi.com/widget-loader.js"
    data-bot-id="YOUR_BOT_ID"
></script>
```

### Cách 2: NPM Package (Cho developers)

```bash
npm install @wataomi/widget
```

```javascript
import { WataOmiWidget } from '@wataomi/widget';

new WataOmiWidget({
  botId: 'YOUR_BOT_ID',
  position: 'bottom-right',
});
```

---

## ⚙️ Configuration Options

| Attribute | Description | Values | Default |
|-----------|-------------|--------|---------|
| `data-bot-id` | Bot ID (required) | string | - |
| `data-position` | Widget position | `bottom-right`, `bottom-left`, `top-right`, `top-left` | `bottom-right` |
| `data-auto-open` | Auto-open on load | `true`, `false` | `false` |
| `data-auto-open-delay` | Delay before auto-open (seconds) | number | `0` |
| `data-api-url` | Custom API URL | string | `https://api.wataomi.com/api/v1` |

---

## 💡 Examples

### Auto-open after 5 seconds

```html
<script 
    src="https://cdn.wataomi.com/widget-loader.js"
    data-bot-id="YOUR_BOT_ID"
    data-auto-open="true"
    data-auto-open-delay="5"
></script>
```

### Position at bottom-left

```html
<script 
    src="https://cdn.wataomi.com/widget-loader.js"
    data-bot-id="YOUR_BOT_ID"
    data-position="bottom-left"
></script>
```

### Custom trigger button

```html
<!-- Custom button -->
<button onclick="WataOmiWidget.open()">
    💬 Chat with us
</button>

<!-- Widget (hidden by default) -->
<script 
    src="https://cdn.wataomi.com/widget-loader.js"
    data-bot-id="YOUR_BOT_ID"
></script>
```

---

## 🌐 Platform Integration

### WordPress

1. Go to **Appearance → Theme Editor**
2. Select `footer.php`
3. Add code before `</body>`

### Shopify

1. Go to **Online Store → Themes → Actions → Edit code**
2. Select `theme.liquid`
3. Add code before `</body>`

### Wix

1. Go to **Settings → Custom Code**
2. Click **+ Add Custom Code**
3. Paste code and select **Body - end**

### Webflow

1. Go to **Project Settings → Custom Code**
2. Add code to **Footer Code**

### HTML/React/Vue/Angular

Add directly to your HTML or component.

---

## 🎨 Customization

### Theme Customization (via Dashboard)

Khách hàng có thể tùy chỉnh giao diện widget trong Dashboard:

1. Go to **Bots → [Your Bot] → Widget Settings**
2. Customize:
   - Primary color
   - Button size
   - Welcome message
   - Placeholder text
   - Avatar
   - Position

### Advanced Customization (CSS)

```html
<style>
    /* Override widget styles */
    #wataomi-widget-container .wataomi-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }
    
    #wataomi-widget-container .wataomi-window {
        border-radius: 24px !important;
    }
</style>
```

---

## 🔒 Security

### Origin Whitelist

Để bảo vệ bot, bạn có thể giới hạn domains được phép sử dụng widget:

1. Go to **Bots → [Your Bot] → Security**
2. Add allowed origins:
   - `https://example.com`
   - `https://*.example.com` (wildcard for subdomains)
   - `*` (allow all - not recommended)

### Rate Limiting

Widget tự động áp dụng rate limiting để tránh abuse:
- Max 100 requests/minute per domain
- Max 1000 messages/day per conversation

---

## 📊 Analytics

Widget tự động track các events:

- `widget_loaded`: Widget được load
- `widget_opened`: User mở widget
- `conversation_created`: Conversation mới được tạo
- `message_sent`: User gửi message
- `error_occurred`: Có lỗi xảy ra

Xem analytics trong Dashboard: **Bots → [Your Bot] → Analytics**

---

## 🐛 Troubleshooting

### Widget không hiển thị

1. ✅ Check Bot ID đúng chưa
2. ✅ Check bot status = "active"
3. ✅ Check widget enabled = true
4. ✅ Check origin trong whitelist
5. ✅ Check console có error không

### Widget load chậm

1. ✅ Check CDN có hoạt động không
2. ✅ Check network speed
3. ✅ Try clear cache

### CORS error

1. ✅ Add domain vào allowed origins
2. ✅ Check domain format (include https://)

---

## 📚 API Reference

### JavaScript API

```javascript
// Open widget programmatically
WataOmiWidget.open();

// Check if widget is loaded
if (window.WataOmiWidget) {
    console.log('Widget loaded!');
}

// Get widget config
console.log(WataOmiWidget.config);
```

### Events (Coming soon)

```javascript
WataOmiWidget.on('open', () => {
    console.log('Widget opened');
});

WataOmiWidget.on('message', (message) => {
    console.log('Message sent:', message);
});

WataOmiWidget.on('close', () => {
    console.log('Widget closed');
});
```

---

## 🚀 Performance

### Load Times

- **Initial load**: ~3KB (widget-loader.js)
- **Full widget**: ~15KB (loaded on demand)
- **Total load time**: < 500ms on 3G

### Optimization Tips

1. ✅ Use CDN URL (auto-cached)
2. ✅ Enable lazy loading (default)
3. ✅ Minimize custom CSS
4. ✅ Use auto-open sparingly

---

## 📞 Support

### Need Help?

- 📧 **Email**: support@wataomi.com
- 💬 **Live Chat**: [wataomi.com](https://wataomi.com)
- 📚 **Documentation**: [docs.wataomi.com](https://docs.wataomi.com)
- 🐛 **Bug Report**: [github.com/wataomi/widget/issues](https://github.com/wataomi/widget/issues)

### FAQ

**Q: Widget có hoạt động trên mobile không?**  
A: Có! Widget tự động fullscreen trên mobile để UX tốt hơn.

**Q: Có thể tùy chỉnh giao diện không?**  
A: Có! Tùy chỉnh trong Dashboard hoặc dùng custom CSS.

**Q: Widget có ảnh hưởng đến SEO không?**  
A: Không! Widget load async và không block page render.

**Q: Có giới hạn số lượng messages không?**  
A: Tùy vào plan của bạn. Check trong Dashboard → Billing.

**Q: Widget có support đa ngôn ngữ không?**  
A: Có! Bot tự động detect ngôn ngữ hoặc bạn có thể config trong Dashboard.

---

## 🎯 Best Practices

### 1. Placement

- ✅ **Bottom-right**: Standard, không che nội dung quan trọng
- ✅ **Bottom-left**: Nếu có chat/support button ở bên phải
- ❌ **Top positions**: Ít dùng, có thể che menu

### 2. Auto-open

- ✅ **Landing pages**: Auto-open sau 5-10s để engage
- ✅ **Product pages**: Auto-open để hỗ trợ mua hàng
- ❌ **Blog posts**: Không auto-open, để user tập trung đọc

### 3. Welcome Message

- ✅ **Personalized**: "Hi! Cần giúp gì về [product/service]?"
- ✅ **Action-oriented**: "Tôi có thể giúp bạn tìm sản phẩm phù hợp!"
- ❌ **Generic**: "Xin chào" (quá chung chung)

### 4. Response Time

- ✅ Keep bot response < 2s
- ✅ Show typing indicator
- ✅ Handle errors gracefully

---

## 📈 Roadmap

### Coming Soon

- [ ] Voice input support
- [ ] File upload
- [ ] Rich messages (cards, buttons, carousels)
- [ ] Multi-language auto-detect
- [ ] Conversation history persistence
- [ ] Proactive messages
- [ ] A/B testing
- [ ] Advanced analytics

---

## 📄 License

Widget is free to use for all WataOmi customers.

---

**Made with ❤️ by WataOmi Team**
