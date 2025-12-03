# 🎨 Widget Dashboard UI - Spec

## 📍 Location
`/dashboard/bots/[botId]/widget`

---

## 🎯 Features

### 1. **Embed Code Generator**
- Copy-paste ready code
- Live preview
- Multiple integration options (Script tag, NPM, WordPress, Shopify...)

### 2. **Widget Customization**
- Visual editor
- Real-time preview
- Theme presets

### 3. **Security Settings**
- Allowed origins management
- Rate limiting config
- API key (optional)

### 4. **Analytics Dashboard**
- Widget loads
- Conversations created
- Messages sent
- Error tracking

---

## 🖼️ UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Widget Settings                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │                 │  │                              │ │
│  │  Live Preview   │  │  Configuration               │ │
│  │                 │  │                              │ │
│  │  [Widget UI]    │  │  • Appearance                │ │
│  │                 │  │  • Behavior                  │ │
│  │                 │  │  • Messages                  │ │
│  │                 │  │  • Security                  │ │
│  │                 │  │                              │ │
│  └─────────────────┘  └──────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Embed Code                                        │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ <script src="..." data-bot-id="..."></script>│ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  [Copy Code]  [View Guide]                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Analytics (Last 7 days)                          │ │
│  │  • Widget Loads: 1,234                            │ │
│  │  • Conversations: 456                             │ │
│  │  • Messages: 2,890                                │ │
│  │  • Error Rate: 0.5%                               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Component Structure

### Page Component
```typescript
// apps/web/src/app/dashboard/bots/[botId]/widget/page.tsx

export default function BotWidgetPage({ params }: { params: { botId: string } }) {
  return (
    <div className="container mx-auto p-6">
      <PageHeader 
        title="Widget Settings"
        description="Customize and embed your chatbot"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left: Preview */}
        <WidgetPreview botId={params.botId} />
        
        {/* Right: Configuration */}
        <WidgetConfiguration botId={params.botId} />
      </div>
      
      {/* Embed Code */}
      <EmbedCodeSection botId={params.botId} />
      
      {/* Analytics */}
      <WidgetAnalytics botId={params.botId} />
    </div>
  );
}
```

### WidgetPreview Component
```typescript
// apps/web/src/components/widget/WidgetPreview.tsx

export function WidgetPreview({ botId }: { botId: string }) {
  const { data: config } = useWidgetConfig(botId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
        <CardDescription>See how your widget looks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gray-100 rounded-lg h-[600px] overflow-hidden">
          {/* Simulated website */}
          <div className="p-8">
            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          
          {/* Widget iframe */}
          <iframe
            src={`/widget-preview?botId=${botId}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

### WidgetConfiguration Component
```typescript
// apps/web/src/components/widget/WidgetConfiguration.tsx

export function WidgetConfiguration({ botId }: { botId: string }) {
  const { data: config, update } = useWidgetConfig(botId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="appearance">
          <TabsList>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <AppearanceSettings config={config} onChange={update} />
          </TabsContent>
          
          <TabsContent value="behavior">
            <BehaviorSettings config={config} onChange={update} />
          </TabsContent>
          
          <TabsContent value="messages">
            <MessagesSettings config={config} onChange={update} />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettings config={config} onChange={update} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

### EmbedCodeSection Component
```typescript
// apps/web/src/components/widget/EmbedCodeSection.tsx

export function EmbedCodeSection({ botId }: { botId: string }) {
  const [copied, setCopied] = useState(false);
  const embedCode = generateEmbedCode(botId);
  
  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Embed Code</CardTitle>
        <CardDescription>
          Copy and paste this code into your website
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="script">
          <TabsList>
            <TabsTrigger value="script">Script Tag</TabsTrigger>
            <TabsTrigger value="npm">NPM</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            <TabsTrigger value="shopify">Shopify</TabsTrigger>
          </TabsList>
          
          <TabsContent value="script">
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={copyCode}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </Button>
            </div>
          </TabsContent>
          
          {/* Other tabs... */}
        </Tabs>
        
        <div className="mt-4 flex gap-2">
          <Button variant="outline" asChild>
            <a href="/embed-guide.html" target="_blank">
              📚 View Full Guide
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/widget-preview?botId=${botId}`} target="_blank">
              👁️ Test Widget
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### AppearanceSettings Component
```typescript
// apps/web/src/components/widget/settings/AppearanceSettings.tsx

export function AppearanceSettings({ config, onChange }) {
  return (
    <div className="space-y-4">
      {/* Primary Color */}
      <div>
        <Label>Primary Color</Label>
        <div className="flex gap-2 mt-2">
          <Input
            type="color"
            value={config.theme.primaryColor}
            onChange={(e) => onChange({ 
              theme: { ...config.theme, primaryColor: e.target.value }
            })}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={config.theme.primaryColor}
            onChange={(e) => onChange({ 
              theme: { ...config.theme, primaryColor: e.target.value }
            })}
            placeholder="#667eea"
          />
        </div>
      </div>
      
      {/* Position */}
      <div>
        <Label>Position</Label>
        <Select
          value={config.theme.position}
          onValueChange={(value) => onChange({
            theme: { ...config.theme, position: value }
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bottom-right">Bottom Right</SelectItem>
            <SelectItem value="bottom-left">Bottom Left</SelectItem>
            <SelectItem value="top-right">Top Right</SelectItem>
            <SelectItem value="top-left">Top Left</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Button Size */}
      <div>
        <Label>Button Size</Label>
        <RadioGroup
          value={config.theme.buttonSize}
          onValueChange={(value) => onChange({
            theme: { ...config.theme, buttonSize: value }
          })}
        >
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="small" id="small" />
              <Label htmlFor="small">Small</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="large" />
              <Label htmlFor="large">Large</Label>
            </div>
          </div>
        </RadioGroup>
      </div>
      
      {/* Show Avatar */}
      <div className="flex items-center justify-between">
        <Label>Show Avatar</Label>
        <Switch
          checked={config.theme.showAvatar}
          onCheckedChange={(checked) => onChange({
            theme: { ...config.theme, showAvatar: checked }
          })}
        />
      </div>
      
      {/* Show Timestamp */}
      <div className="flex items-center justify-between">
        <Label>Show Timestamp</Label>
        <Switch
          checked={config.theme.showTimestamp}
          onCheckedChange={(checked) => onChange({
            theme: { ...config.theme, showTimestamp: checked }
          })}
        />
      </div>
    </div>
  );
}
```

### SecuritySettings Component
```typescript
// apps/web/src/components/widget/settings/SecuritySettings.tsx

export function SecuritySettings({ config, onChange }) {
  const [newOrigin, setNewOrigin] = useState('');
  
  const addOrigin = () => {
    if (newOrigin && !config.security.allowedOrigins.includes(newOrigin)) {
      onChange({
        security: {
          ...config.security,
          allowedOrigins: [...config.security.allowedOrigins, newOrigin]
        }
      });
      setNewOrigin('');
    }
  };
  
  const removeOrigin = (origin: string) => {
    onChange({
      security: {
        ...config.security,
        allowedOrigins: config.security.allowedOrigins.filter(o => o !== origin)
      }
    });
  };
  
  return (
    <div className="space-y-4">
      {/* Allowed Origins */}
      <div>
        <Label>Allowed Origins</Label>
        <p className="text-sm text-gray-500 mb-2">
          Restrict which domains can use your widget
        </p>
        
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="https://example.com"
            value={newOrigin}
            onChange={(e) => setNewOrigin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addOrigin()}
          />
          <Button onClick={addOrigin}>Add</Button>
        </div>
        
        <div className="space-y-2">
          {config.security.allowedOrigins.map((origin) => (
            <div key={origin} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm">{origin}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeOrigin(origin)}
              >
                ✕
              </Button>
            </div>
          ))}
          
          {config.security.allowedOrigins.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              No restrictions (widget can be used on any domain)
            </div>
          )}
        </div>
      </div>
      
      {/* Rate Limiting */}
      <div>
        <Label>Rate Limiting</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label className="text-sm">Max Requests</Label>
            <Input
              type="number"
              value={config.security.rateLimit?.maxRequests || 100}
              onChange={(e) => onChange({
                security: {
                  ...config.security,
                  rateLimit: {
                    ...config.security.rateLimit,
                    maxRequests: parseInt(e.target.value)
                  }
                }
              })}
            />
          </div>
          <div>
            <Label className="text-sm">Window (ms)</Label>
            <Input
              type="number"
              value={config.security.rateLimit?.windowMs || 60000}
              onChange={(e) => onChange({
                security: {
                  ...config.security,
                  rateLimit: {
                    ...config.security.rateLimit,
                    windowMs: parseInt(e.target.value)
                  }
                }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔌 API Endpoints

### Get Widget Config
```typescript
GET /api/v1/bots/:botId/widget/config

Response:
{
  theme: {
    primaryColor: "#667eea",
    position: "bottom-right",
    buttonSize: "medium",
    showAvatar: true,
    showTimestamp: true
  },
  behavior: {
    autoOpen: false,
    autoOpenDelay: 0,
    showOnPages: [],
    hideOnPages: []
  },
  messages: {
    welcome: "Hi! How can I help?",
    placeholder: "Type a message...",
    offline: "We're offline",
    errorMessage: "Something went wrong"
  },
  security: {
    allowedOrigins: ["https://example.com"],
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000
    }
  }
}
```

### Update Widget Config
```typescript
PATCH /api/v1/bots/:botId/widget/config

Body: {
  theme: { ... },
  behavior: { ... },
  messages: { ... },
  security: { ... }
}
```

### Get Widget Analytics
```typescript
GET /api/v1/bots/:botId/widget/analytics?startDate=...&endDate=...

Response:
{
  totalLoads: 1234,
  totalConversations: 456,
  totalMessages: 2890,
  totalErrors: 12,
  errorRate: 0.5,
  uniqueDomains: 5,
  topDomains: [
    { domain: "example.com", count: 800 },
    { domain: "app.example.com", count: 434 }
  ]
}
```

---

## ✅ Implementation Checklist

### Backend
- [ ] Widget config CRUD endpoints
- [ ] Widget analytics endpoints
- [ ] Origin validation middleware
- [ ] Rate limiting middleware

### Frontend
- [ ] Widget settings page
- [ ] Live preview component
- [ ] Configuration forms
- [ ] Embed code generator
- [ ] Analytics dashboard

### Widget
- [ ] Optimize widget-loader.js
- [ ] Lazy load widget-core.js
- [ ] Mobile responsive
- [ ] Error handling
- [ ] Analytics tracking

### Documentation
- [ ] Embed guide HTML page
- [ ] API documentation
- [ ] Integration guides (WordPress, Shopify, etc.)
- [ ] Troubleshooting guide

---

**Ready to implement! 🚀**
