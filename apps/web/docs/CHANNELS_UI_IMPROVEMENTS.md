# Channels & Integrations UI Improvements

## 🎯 Mục Tiêu

Cải thiện UI/UX cho trang Channels & Integrations với:
1. **Tree Structure** - Hiển thị config → connected channels theo dạng cây
2. **Centralized Styles** - Tất cả màu sắc platform được quản lý tập trung
3. **Better Organization** - Gom nhóm channels theo config

## 📁 Files Mới

### 1. Tree Table Component
**File**: `apps/web/components/ui/tree-table.tsx`

Component mới để hiển thị dữ liệu dạng cây với expand/collapse:

```tsx
<TreeTable data={treeData} />
```

**Features**:
- Expand/collapse nodes
- Icon, label, badge, actions cho mỗi node
- Nested children với indentation
- Hover effects

### 2. New Channels Page
**File**: `apps/web/app/(dashboard)/channels/page-new.tsx`

Phiên bản mới với tree structure:

**Cấu trúc**:
```
📦 Config (Facebook)
  ├── 🟢 Account 1 (Connected)
  ├── 🟢 Account 2 (Connected)
  └── [Add Another] [Edit Config]

📦 Config (WhatsApp)
  ├── 🟢 Business Account (Connected)
  └── [Add Another] [Edit Config]

📦 Config (Instagram)
  └── [Connect] [Edit Config]
```

**Benefits**:
- Dễ thấy config nào có bao nhiêu channels connected
- Edit config và connect ngay cạnh nhau
- Expand/collapse để xem chi tiết
- Gom nhóm logic hơn

## 🎨 Centralized Platform Colors

### globals.css
Tất cả màu platform được định nghĩa tập trung:

```css
.platform-facebook {
  @apply text-[#1877F2] bg-[#1877F2]/10 border-[#1877F2]/20;
}

.platform-whatsapp {
  @apply text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20;
}

/* ... 25+ platforms */
```

### Usage
```tsx
<div className={cn('p-2 rounded-lg border', 'platform-facebook')}>
  <FiFacebook />
</div>
```

**Lợi ích**:
- Không hard-code màu trong components
- Dễ maintain và update
- Consistent across app
- Có thể override nếu cần

## 🔧 Tailwind Config Updates

Thêm success, warning, info colors:

```ts
colors: {
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  info: 'hsl(var(--info))',
}
```

Usage:
```tsx
<Badge className="bg-success/10 text-success">Active</Badge>
<Badge className="bg-warning/10 text-warning">Pending</Badge>
<Badge className="bg-info/10 text-info">Info</Badge>
```

## 📊 Data Structure

### Tree Node
```ts
interface TreeNode {
  id: string
  label: React.ReactNode
  children?: TreeNode[]
  actions?: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
}
```

### Platform Metadata
```ts
const PLATFORM_META: Record<string, {
  name: string
  description: string
  category: 'messaging' | 'social' | 'ecommerce' | ...
  icon: JSX.Element
  colorClass: string  // 'platform-facebook'
  multiAccount: boolean
}>
```

## 🎯 View Modes

### Tree View (Default)
- Hiển thị config → channels theo cây
- Expand/collapse để xem chi tiết
- Actions ngay cạnh mỗi item

### Grid View
- Card-based layout
- Tương tự page cũ
- Dễ scan nhanh

Toggle:
```tsx
<Button onClick={() => setViewMode(viewMode === 'tree' ? 'grid' : 'tree')}>
  {viewMode === 'tree' ? 'Grid View' : 'Tree View'}
</Button>
```

## 🚀 Migration Plan

### Phase 1: Testing
1. Test page-new.tsx với data thật
2. Verify tree structure hoạt động tốt
3. Check responsive design

### Phase 2: Replace
```bash
# Backup old page
mv page.tsx page-old.tsx

# Use new page
mv page-new.tsx page.tsx
```

### Phase 3: Cleanup
- Remove old page sau khi stable
- Update documentation
- Train team

## 📝 Component Examples

### Config Node (Parent)
```tsx
{
  id: 'config-facebook',
  icon: <div className="platform-facebook p-2 rounded-lg border">
    <FiFacebook />
  </div>,
  label: <div>
    <div className="font-semibold">Facebook Page</div>
    <div className="text-xs text-muted-foreground">Manage posts and comments</div>
  </div>,
  badge: <Badge className="bg-success/10 text-success">
    3 connected
  </Badge>,
  actions: <>
    <Button size="sm" onClick={handleConnect}>Add Another</Button>
    <Button size="sm" variant="ghost" onClick={openConfig}>
      <FiEdit2 />
    </Button>
  </>,
  children: [/* connected channels */]
}
```

### Channel Node (Child)
```tsx
{
  id: 'channel-123',
  icon: <div className="w-2 h-2 bg-success rounded-full animate-pulse" />,
  label: <div>
    <div className="font-medium">My Page Name</div>
    <div className="text-xs text-muted-foreground">
      Connected 2024-01-15
    </div>
  </div>,
  badge: <Badge className="bg-success/10 text-success">Active</Badge>,
  actions: <Button size="sm" variant="ghost" onClick={handleDisconnect}>
    <FiTrash2 />
  </Button>
}
```

## 🎨 Styling Guidelines

### Cards
```tsx
// Landing page
<div className="landing-card">

// Dashboard
<div className="dashboard-card">
```

### Platform Icons
```tsx
<div className={cn('p-2 rounded-lg border', PLATFORM_META[provider].colorClass)}>
  {PLATFORM_META[provider].icon}
</div>
```

### Status Badges
```tsx
<Badge className="bg-success/10 text-success">Active</Badge>
<Badge className="bg-warning/10 text-warning">Pending</Badge>
<Badge className="bg-destructive/10 text-destructive">Error</Badge>
```

## ✅ Checklist

- [x] Create TreeTable component
- [x] Create new channels page with tree structure
- [x] Centralize platform colors in globals.css
- [x] Add success/warning/info to tailwind config
- [x] Document all changes
- [ ] Test with real data
- [ ] Get user feedback
- [ ] Replace old page
- [ ] Update team documentation

## 🔗 Related Files

- `apps/web/components/ui/tree-table.tsx` - Tree component
- `apps/web/app/(dashboard)/channels/page-new.tsx` - New page
- `apps/web/app/globals.css` - Platform colors
- `apps/web/tailwind.config.ts` - Color config
- `apps/web/docs/COLOR_SYSTEM.md` - Color system docs
