# ⚡ Widget Quick Reference

## 🚀 1-Minute Setup

```html
<script 
    src="https://cdn.wataomi.com/widget-loader.js"
    data-bot-id="YOUR_BOT_ID"
></script>
```

---

## 📋 All Options

```html
<script 
    src="https://cdn.wataomi.com/widget-loader.js"
    data-bot-id="abc123"
    data-position="bottom-right"
    data-auto-open="false"
    data-auto-open-delay="0"
    data-api-url="https://api.wataomi.com/api/v1"
></script>
```

---

## 🎨 Customization

### Positions
- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

### Auto-open
```html
data-auto-open="true"
data-auto-open-delay="5"  <!-- seconds -->
```

---

## 💻 JavaScript API

```javascript
// Open widget
WataOmiWidget.open();

// Check if loaded
if (window.WataOmiWidget) {
    console.log('Widget ready!');
}

// Get config
console.log(WataOmiWidget.config);
```

---

## 🌐 Platform Integration

### WordPress
`Appearance → Theme Editor → footer.php`

### Shopify
`Online Store → Themes → Edit code → theme.liquid`

### Wix
`Settings → Custom Code → Body - end`

### Webflow
`Project Settings → Custom Code → Footer Code`

---

## 🔧 Troubleshooting

### Widget not showing?
1. Check Bot ID is correct
2. Check bot status = "active"
3. Check widget enabled = true
4. Check browser console for errors

### CORS error?
Add your domain to allowed origins in Dashboard

### Slow loading?
Widget uses lazy loading by default. Full load only happens on first click.

---

## 📊 Files

- `widget-loader.js` - 3KB, loads immediately
- `widget-core.js` - 15KB, loads on demand
- Total: ~18KB (gzipped: ~6KB)

---

## 🔗 Links

- 📚 Full Guide: `/embed-guide.html`
- 📖 Documentation: `/docs/WIDGET_EMBED_GUIDE.md`
- 💬 Support: support@wataomi.com
- 🐛 Issues: github.com/wataomi/widget/issues

---

**That's it! 🎉**
